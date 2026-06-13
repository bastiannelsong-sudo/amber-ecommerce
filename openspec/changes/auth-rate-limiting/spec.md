# Auth Rate Limiting — Specification

Change: `auth-rate-limiting`
Domain: **auth-rate-limiting** (new capability)
Requirement prefix: `BFF-RL-*`
Slice: 4 of BFF Security effort

---

## Purpose

Define what MUST be true after applying this change. This is a NEW capability spec (no prior spec for this domain). The scope is limited to the three BFF auth routes: login, forgot-password, and reset-password. Availability (fail-open) takes precedence over enforcement strictness; the WAF layer provides the outer coarse defense.

---

## Out of Scope

The following MUST NOT be changed by this change:

| Item | Reason |
|---|---|
| Non-auth routes (orders, coupons, contact, addresses) | Different abuse profile — future slice |
| Per-email rate-limit keying | Enables account enumeration — explicitly rejected |
| The AWS WAF rule itself | Infra-owned; deliverable is `waf-recommendation.md` (doc only) |
| AWS ElastiCache | Cost trap — rejected in prior decision |
| Slice-1 validateBody behavior | Additive change only; existing validation behavior is unchanged |

---

## Domain: Auth Rate Limiting

### BFF-RL-01 — Auth Limiter Singleton Factory

The system MUST provide a module `app/lib/rate-limit/auth-limiter.ts` that exports `getAuthLimiter(): Ratelimit | null`.

- The module MUST include `import 'server-only'` as its first import to prevent client bundle inclusion.
- `getAuthLimiter()` MUST return a `Ratelimit` instance (singleton) when both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are present in the environment.
- `getAuthLimiter()` MUST return `null` when either env var is absent.
- `getAuthLimiter()` MUST return `null` if the `Ratelimit` constructor throws during initialization, and MUST emit a `console.warn` in that case.
- The `Ratelimit` instance MUST use `Ratelimit.slidingWindow` algorithm and `Redis.fromEnv()` for the connection. `analytics` MUST be set to `false`.
- The singleton MUST be constructed at most once per process (lazy init, cached after first successful call).

#### Scenario: Returns Ratelimit when both env vars are set

- GIVEN `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are both non-empty
- WHEN `getAuthLimiter()` is called
- THEN a `Ratelimit` instance is returned
- AND subsequent calls return the same instance (singleton)

#### Scenario: Returns null when URL env var is absent

- GIVEN `UPSTASH_REDIS_REST_URL` is undefined or empty
- WHEN `getAuthLimiter()` is called
- THEN `null` is returned

#### Scenario: Returns null when TOKEN env var is absent

- GIVEN `UPSTASH_REDIS_REST_TOKEN` is undefined or empty
- WHEN `getAuthLimiter()` is called
- THEN `null` is returned

#### Scenario: Returns null on init error

- GIVEN both env vars are set but the `Ratelimit` constructor throws an error
- WHEN `getAuthLimiter()` is called
- THEN `null` is returned
- AND a `console.warn` is emitted

---

### BFF-RL-02 — Rate-Limit Gate Ordering

The rate-limit gate MUST execute as the FIRST statement in each target handler body, before `validateBody` is called and before the request body is read.

Affected handlers:
- `app/api/auth/login/route.ts`
- `app/api/auth/forgot-password/route.ts`
- `app/api/auth/reset-password/route.ts`

#### Scenario: Gate runs before validateBody on any request

- GIVEN a POST to any of the three target routes
- WHEN the handler executes
- THEN the rate-limit gate is evaluated before `validateBody` is called
- AND the request body is not parsed before the gate check

---

### BFF-RL-03 — IP Extraction

The rate-limit key MUST be derived from the client IP using the `x-forwarded-for` request header. The FIRST entry (split by comma, trimmed) MUST be used. If the header is absent, the key MUST fall back to `127.0.0.1`.

Per-email keying MUST NOT be used (enumeration risk — see Out of Scope).

#### Scenario: IP extracted from x-forwarded-for first entry

- GIVEN a request with header `x-forwarded-for: 203.0.113.5, 10.0.0.1`
- WHEN the rate-limit key is constructed
- THEN the key uses `203.0.113.5` as the IP component

#### Scenario: Fallback IP when header is absent

- GIVEN a request with no `x-forwarded-for` header
- WHEN the rate-limit key is constructed
- THEN the key uses `127.0.0.1` as the IP component

---

### BFF-RL-04 — Per-Route Limits and Keys

Each target route MUST enforce a distinct sliding-window limit using an IP-based key.

| Route | Limit | Window | Key format |
|---|---|---|---|
| `POST /api/auth/login` | 5 requests | 60 seconds | `login:${ip}` |
| `POST /api/auth/forgot-password` | 3 requests | 60 seconds | `forgot:${ip}` |
| `POST /api/auth/reset-password` | 5 requests | 60 seconds | `reset:${ip}` |

#### Scenario: Distinct key per route ensures independent windows

- GIVEN the same IP sends requests to both login and forgot-password
- WHEN limits are evaluated
- THEN the login counter and the forgot-password counter are independent (different keys)

---

### BFF-RL-05 — Under-Limit Behavior (Pass-Through)

When `limiter.limit(key)` returns `{ success: true }`, the handler MUST proceed to `validateBody` and the backend call as normal. No additional headers or modifications are applied.

#### Scenario: Under-limit request proceeds normally

- GIVEN the rate limiter returns `success: true` for the current IP
- WHEN the handler executes
- THEN `validateBody` is called
- AND the backend is called if validation passes
- AND no 429 response is returned

---

### BFF-RL-06 — Over-Limit Response (429)

When `limiter.limit(key)` returns `{ success: false }`, the handler MUST return HTTP 429 immediately.

Response requirements:
- Status: `429`
- Body: `{ "error": "rate_limited", "message": "Demasiados intentos. Intentá de nuevo más tarde." }`
- Header: `Retry-After` set to `Math.ceil((reset - Date.now()) / 1000)` as a string (seconds until window resets)
- `validateBody` MUST NOT be called
- The backend MUST NOT be called

#### Scenario: Over-limit request returns 429 with Retry-After

- GIVEN the rate limiter returns `success: false` with a `reset` timestamp
- WHEN the handler executes
- THEN the response status is 429
- AND the response body is `{ "error": "rate_limited", "message": "Demasiados intentos. Intentá de nuevo más tarde." }`
- AND the `Retry-After` header is set to the computed seconds-until-reset as a string

#### Scenario: validateBody is not called when over limit

- GIVEN the rate limiter returns `success: false`
- WHEN the handler executes
- THEN `validateBody` is NOT called

#### Scenario: Backend is not called when over limit

- GIVEN the rate limiter returns `success: false`
- WHEN the handler executes
- THEN the backend proxy (backendFetch or proxyToBackend) is NOT called

---

### BFF-RL-07 — Fail-Open: Limiter Not Configured

When `getAuthLimiter()` returns `null` (env vars absent or init error), the handler MUST skip the rate-limit gate entirely and proceed as if no limiting is in place. The handler MUST NOT return an error or 429 in this case.

#### Scenario: Null limiter — handler proceeds without rate limiting

- GIVEN `getAuthLimiter()` returns `null`
- WHEN the handler executes
- THEN the rate-limit gate is skipped
- AND `validateBody` is called normally
- AND the backend is called if validation passes

---

### BFF-RL-08 — Fail-Open: Runtime Error from Limiter

If `limiter.limit()` throws at runtime, the handler MUST catch the error, emit a `console.warn`, and proceed as if `success: true` (fail-open). The handler MUST NOT propagate the error or return a 5xx response due to a rate-limiter failure.

#### Scenario: limiter.limit() throws — handler proceeds (fail-open)

- GIVEN `getAuthLimiter()` returns a non-null limiter
- AND `limiter.limit()` throws a runtime error
- WHEN the handler executes
- THEN the error is caught
- AND a `console.warn` is emitted
- AND the handler proceeds to `validateBody`
- AND no 429 or 5xx is returned due to the limiter error

---

### BFF-RL-09 — Fail-Open Invariant

The rate-limiting system MUST be designed with availability as the primary constraint. A Redis outage, misconfiguration, or cold-start error MUST NEVER prevent a legitimate user from authenticating. The WAF layer (see `waf-recommendation.md`) is the backstop for volumetric attacks during limiter outages.

This is an absolute invariant: under no failure mode of the rate-limiting subsystem may the system return a non-4xx-rate-limit error to a client who would otherwise be allowed through.

---

### BFF-RL-10 — WAF Documentation Deliverable

A file `openspec/changes/auth-rate-limiting/waf-recommendation.md` MUST exist as part of this change's deliverables. It MUST describe the recommended AWS WAF rule for infra handoff, including: rule type (rate-based), path scope (`/api/auth/*`), suggested limit (100 requests / 5 minutes per IP), aggregation key (IP address), action (Block), and deployment owner (Infrastructure/DevOps).

This is a documentation deliverable only. No WAF code or infrastructure configuration is within the code scope of this change.

#### Scenario: WAF recommendation doc exists and covers required fields

- GIVEN the change is applied
- WHEN `openspec/changes/auth-rate-limiting/waf-recommendation.md` is inspected
- THEN it contains: rule type, path scope, rate limit value, aggregation key, action, and deployment owner

---

### BFF-RL-11 — Environment Variable Stubs in .env.example

`.env.example` MUST include both Upstash environment variable stubs with blank values. Blank values MUST disable rate limiting (fail-open) without requiring code changes or a redeploy.

| Variable | Value in .env.example |
|---|---|
| `UPSTASH_REDIS_REST_URL` | `` (empty) |
| `UPSTASH_REDIS_REST_TOKEN` | `` (empty) |

#### Scenario: Blank env vars disable rate limiting

- GIVEN `.env.example` is copied to `.env.local` with blank Upstash vars
- WHEN the application starts
- THEN `getAuthLimiter()` returns `null`
- AND all auth handlers proceed without rate limiting (fail-open)

---

## Testing Contract

### BFF-RL-T1 — Test Runner and Mock Strategy

All tests MUST run under `pnpm test:run` (Vitest). The `auth-limiter` module MUST be mocked at the module level (`vi.mock`) in route test files — Upstash internals MUST NOT be contacted in tests. The `server-only` import is safe in tests via the existing Vitest alias.

### BFF-RL-T2 — Auth Limiter Unit Test (app/lib/rate-limit/auth-limiter.test.ts)

The `getAuthLimiter` factory MUST have a dedicated unit test covering:

| Branch | Expected behavior |
|---|---|
| Both env vars set, no error | Returns a `Ratelimit` instance |
| `UPSTASH_REDIS_REST_URL` absent | Returns `null` |
| `UPSTASH_REDIS_REST_TOKEN` absent | Returns `null` |
| Both set but constructor throws | Returns `null`; `console.warn` called |
| Called twice when configured | Returns the same instance (singleton) |

### BFF-RL-T3 — Required Scenarios Per Target Route

Each of the three target route test files MUST cover all four scenarios:

| # | Scenario | Key assertion |
|---|---|---|
| 1 | Under-limit (`success: true`) | `validateBody` called; backend called; no 429 |
| 2 | Over-limit (`success: false`) | 429 returned; `validateBody` NOT called; backend NOT called; `Retry-After` header present |
| 3 | Null limiter (fail-open) | Handler proceeds; `validateBody` called; backend called |
| 4 | `limiter.limit()` throws (fail-open) | Handler proceeds; `console.warn` emitted; no 429 or 5xx from limiter |

### BFF-RL-T4 — Test Pattern Consistency

Route tests MUST follow the existing Vitest pattern: hoisted `vi.mock`, `vi.resetModules()` + dynamic `import()` in `beforeEach`, `NextRequest` construction. This pattern is established in slice-1 tests (`bff-security-hardening`).

---

## Invariants

- The rate-limit gate MUST always run before `validateBody` in the three target handlers. Re-ordering is a breaking violation.
- `getAuthLimiter()` MUST NEVER throw — it MUST catch all init errors and return `null`.
- Per-email keying MUST NOT be introduced (enumeration risk).
- A Redis outage MUST result in fail-open, never in user lockout.
- The `Retry-After` header MUST be computed from the `reset` timestamp returned by the limiter, not a static value.
- `analytics: false` MUST be set on the `Ratelimit` instance (no `waitUntil` available in Next.js App Router route handlers).
