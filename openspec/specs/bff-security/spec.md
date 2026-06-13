# BFF Security Hardening — Slice 1 Specification

Change: `bff-security-hardening`
Domains: **auth-validation** (new), **security-headers** (new)
Requirement prefix: `BFF-SEC-*`

---

## Purpose

Define what MUST be true after applying this change. This is a NEW capability spec (no prior spec for these domains).

---

## Domain 1: Auth Route Handler Input Validation

### BFF-SEC-01 — Zod Schema Parity Contract

All zod schemas for auth routes MUST mirror the verified amber-back DTO contracts from `amber-back/src/ecommerce-auth/dto/`. The schemas MUST NOT impose stricter constraints than the backend (doing so would reject backend-valid requests). Any divergence MUST be treated as a breaking contract violation.

| Schema | Required Fields | Optional Fields | Rules |
|---|---|---|---|
| `loginSchema` | `email`, `password` | — | email format; password non-empty string |
| `registerSchema` | `first_name`, `last_name`, `email`, `password` | `phone` | email format; password min(6) |
| `forgotPasswordSchema` | `email` | — | email format |
| `resetPasswordSchema` | `token`, `new_password` | — | `new_password` min(6) — NOT `password` |
| `changePasswordSchema` | `current_password`, `new_password` | — | `new_password` min(6) |
| `createPasswordSchema` | `password` | — | password min(6) |
| `googleAuthSchema` | `credential` | — | non-empty string — NOT `id_token` |
| `linkGoogleSchema` | `credential` | — | non-empty string — NOT `id_token` |
| `updateProfileSchema` | — | `first_name`, `last_name`, `email`, `phone`, `avatar_url` | email format when present; all fields optional |

#### Scenario: Valid login body is accepted

- GIVEN a POST to `/api/auth/login` with `{ email: "a@b.com", password: "secret" }`
- WHEN the handler validates the body
- THEN validation passes and the parsed object is forwarded to the backend
- AND the backend proxy is called exactly once

#### Scenario: Invalid login email is rejected

- GIVEN a POST to `/api/auth/login` with `{ email: "not-an-email", password: "secret" }`
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400
- AND the backend proxy is NOT called

#### Scenario: Missing required field returns 400

- GIVEN a POST to `/api/auth/register` with `{ first_name: "Ana", email: "a@b.com", password: "123456" }` (missing `last_name`)
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400
- AND the backend proxy is NOT called

#### Scenario: Wrong type on required field returns 400

- GIVEN a POST to `/api/auth/login` with `{ email: 12345, password: "secret" }`
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400

#### Scenario: Unknown field is stripped before forwarding

- GIVEN a POST to `/api/auth/login` with `{ email: "a@b.com", password: "secret", __proto__: "evil" }`
- WHEN the handler validates and strips the body
- THEN the backend proxy is called with an object that does NOT contain `__proto__`

---

### BFF-SEC-02 — Validation Error Response Shape

On validation failure, the handler MUST return HTTP 400 with a JSON body having a stable, structured shape. The shape MUST NOT include internal stack traces or raw zod error objects.

#### Scenario: 400 response has structured error body

- GIVEN any auth route receives an invalid body
- WHEN the handler returns 400
- THEN the response body is valid JSON containing at minimum `{ error: string, issues: array }`
- AND the response Content-Type is `application/json`

---

### BFF-SEC-03 — No Forward on Failure

The BFF MUST NOT call the backend if body validation fails. This is an absolute prohibition.

#### Scenario: Backend is never called on invalid input

- GIVEN any auth route receives a body that fails zod validation
- WHEN the handler executes
- THEN the backend proxy function is called zero times

---

### BFF-SEC-04 — Google / link-google Field Reconciliation

The `google` and `link-google` route handlers MUST use `credential` (not `id_token`) to match the verified `GoogleAuthDto`. The existing handler code that references `id_token` MUST be reconciled to `credential` as part of this change.

#### Scenario: google auth with credential field forwards correctly

- GIVEN a POST to `/api/auth/google` with `{ credential: "google-jwt-token" }`
- WHEN the handler validates the body
- THEN validation passes and the backend is called with `{ credential: "google-jwt-token" }`

#### Scenario: google auth with id_token field is rejected

- GIVEN a POST to `/api/auth/google` with `{ id_token: "google-jwt-token" }` (wrong field name)
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400
- AND the backend proxy is NOT called

---

### BFF-SEC-05 — Profile PUT Accepts All-Optional Body

The `profile` PUT route MUST accept an empty body `{}` as valid (all fields optional). It MUST also accept a body with any subset of the optional fields.

#### Scenario: Empty body is valid for profile PUT

- GIVEN a PUT to `/api/auth/profile` with body `{}`
- WHEN the handler validates the body
- THEN validation passes and the backend is called with `{}`

#### Scenario: Partial update with one field forwards only that field

- GIVEN a PUT to `/api/auth/profile` with body `{ first_name: "Marco" }`
- WHEN the handler validates and strips the body
- THEN the backend is called with exactly `{ first_name: "Marco" }` (no extra keys)

#### Scenario: Invalid email in profile PUT returns 400

- GIVEN a PUT to `/api/auth/profile` with body `{ email: "not-email" }`
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400

---

### BFF-SEC-06 — Password MinLength Parity

Password fields MUST enforce min(6) to mirror the backend. The BFF MUST NOT enforce a stricter minimum (e.g. min(8)) unless the backend is updated first and this spec is revised accordingly.

#### Scenario: 6-character password is accepted

- GIVEN any password-bearing route receives a body with a 6-character password
- WHEN the handler validates the body
- THEN validation passes

#### Scenario: 5-character password is rejected

- GIVEN any password-bearing route receives a body with a 5-character password
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400

---

### BFF-SEC-07 — reset-password Uses new_password Field

The reset-password route schema MUST use field name `new_password`, NOT `password`. A body with `password` (wrong name) MUST be treated as a missing required field and rejected.

#### Scenario: reset-password with new_password is accepted

- GIVEN a POST to `/api/auth/reset-password` with `{ token: "tok", new_password: "abc123" }`
- WHEN the handler validates the body
- THEN validation passes

#### Scenario: reset-password with password (wrong name) is rejected

- GIVEN a POST to `/api/auth/reset-password` with `{ token: "tok", password: "abc123" }`
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400

---

## Domain 2: Security Header Cleanup

### BFF-SEC-08 — Single Referrer-Policy Header on Page Responses

Page responses MUST carry exactly ONE `Referrer-Policy` header with value `strict-origin-when-cross-origin`. The conflicting weaker value (`origin-when-cross-origin`) previously set in `next.config.ts` MUST be replaced. The duplicate set in `proxy.ts` (lines ~154-155) MUST be removed. The net result: one authoritative source per response type.

#### Scenario: Page response carries a single Referrer-Policy header

- GIVEN a page response from the Next.js application
- WHEN response headers are inspected
- THEN exactly one `Referrer-Policy` header is present
- AND its value is `strict-origin-when-cross-origin`

---

### BFF-SEC-09 — Single X-Content-Type-Options Header

Page responses MUST carry exactly ONE `X-Content-Type-Options: nosniff` header. The duplicate currently present in `proxy.ts` (~L154-155) MUST be removed. The value set in `next.config.ts` remains authoritative.

#### Scenario: Page response carries a single X-Content-Type-Options header

- GIVEN a page response from the Next.js application
- WHEN response headers are inspected
- THEN exactly one `X-Content-Type-Options` header is present
- AND its value is `nosniff`

---

### BFF-SEC-10 — CSP Nonce Stays in proxy.ts Only

The Content Security Policy (CSP) header with per-request nonce generation MUST remain in `proxy.ts` exclusively. It MUST NOT be added to `next.config.ts` as a static header (that would break nonce rotation). This requirement is a preservation invariant — no change is needed, but apply MUST NOT inadvertently move it.

#### Scenario: CSP is not present in next.config.ts static headers

- GIVEN the `next.config.ts` headers configuration
- WHEN it is inspected
- THEN no `Content-Security-Policy` header is defined there

---

## Testing Contract

### BFF-SEC-T1 — Test Pattern

Each auth route handler under `app/api/auth/*/route.ts` MUST have a co-located or sibling test file following the existing Vitest pattern from `app/api/orders/[orderNumber]/route.test.ts`: hoisted `vi.mock`, `vi.resetModules()` + dynamic `import()` in `beforeEach`, `NextRequest` construction.

### BFF-SEC-T2 — Required Scenarios Per Route

Every validated route test MUST cover:
1. Valid body → backend proxy called once with the parsed (stripped) object.
2. Each required field missing individually → HTTP 400, proxy not called.
3. Wrong type on at least one field → HTTP 400.
4. Unknown field in body → proxy called with object that does NOT contain the unknown field.

### BFF-SEC-T3 — Parity Contract Invariant

The zod schemas MUST be documented (inline comment) with the source amber-back DTO file and class name (e.g. `// Source: amber-back/src/ecommerce-auth/dto/login.dto.ts — LoginDto`). This comment is the parity anchor: if the backend DTO changes, the comment signals the schema needs review.

---

## Invariants (Slice 1)

- `BFF-SEC-01` field names are locked to the verified DTO shapes. No field name may be changed without updating the corresponding backend DTO first.
- `BFF-SEC-06` min(6) MUST NOT be raised to any higher value in this change.
- `BFF-SEC-04` `id_token` MUST NOT appear in any schema or handler after this change is applied.
- All HTTP 400 responses from validation failures MUST have `Content-Type: application/json`.

---

# Domain 3: Non-Auth Route Input Validation (Slice 2)

Extends the validate-then-forward contract to non-auth POST/PATCH routes (orders, coupons, contact, addresses).

## Parity Contract

### BFF-NAV-01 — Schema-DTO Byte Compatibility

Every zod schema introduced by this change MUST mirror the corresponding amber-back DTO exactly. The BFF MUST NOT impose stricter constraints than the backend. Each schema file MUST carry an inline `// Source:` comment naming the DTO file and class.

| Schema | DTO source | Required fields | Optional fields | Key rules |
|---|---|---|---|---|
| `createOrderSchema` | `ecommerce/dto/create-order.dto.ts` — `CreateOrderDto` | `customer_email`, `customer_name`, `shipping_address`, `shipping_city`, `shipping_region`, `items` | `customer_phone`, `shipping_postal_code`, `coupon_code` | `customer_email` email format; `items` array min(1) |
| `createOrderSchema.items` | `ecommerce/dto/create-order.dto.ts` — `OrderItemDto` | `product_id`, `name`, `internal_sku`, `quantity`, `unit_price` | `image_url` | `product_id` number; `quantity` integer min(1); `unit_price` number |
| `validateCouponSchema` | `ecommerce/dto/create-coupon.dto.ts` — `ValidateCouponDto` | `code`, `cart_total` | — | `cart_total` number |
| `createContactMessageSchema` | `contact/dto/create-contact-message.dto.ts` — `CreateContactMessageDto` | `name`, `email`, `subject`, `message` | `phone` | `name` maxLength(100); `email` email; `phone` maxLength(20); `subject` maxLength(50); `message` maxLength(2000) |
| `createAddressSchema` | `ecommerce-auth/dto/address.dto.ts` — `CreateAddressDto` | `street`, `city`, `region` | `apartment`, `zip_code`, `is_default` | `street` length(5,255); `city` length(2,100); `region` length(2,100); `apartment` maxLength(100); `zip_code` maxLength(20); `is_default` boolean |
| `updateAddressSchema` | `ecommerce-auth/dto/address.dto.ts` — `UpdateAddressDto` | — | all fields of createAddressSchema | same per-field constraints; empty `{}` MUST be valid |

#### Scenario: Divergence from DTO is a blocking violation

- GIVEN a zod schema defines a constraint not present in the corresponding DTO
- WHEN the spec is audited
- THEN the constraint MUST be removed before merge

---

## Route Validation Requirements

### BFF-NAV-02 — POST /api/orders Validates Body Before Forward

The orders POST handler MUST call `validateBody` before any backend call. On success it MUST forward `v.data` via `backendFetch` (never re-read `req.json()`). The `setOrderAccessCookie` call on success MUST be preserved unchanged.

#### Scenario: Valid order body is accepted and cookie is set

- GIVEN a POST to `/api/orders` with a fully valid order body (valid customer fields + items array with one valid item)
- WHEN the handler validates and forwards the body
- THEN `backendFetch` is called once with `v.data`
- AND `setOrderAccessCookie` is called on the success response

#### Scenario: Invalid nested item — wrong type on quantity returns 400

- GIVEN a POST to `/api/orders` with `items: [{ product_id: 1, name: "X", internal_sku: "SKU", quantity: "two", unit_price: 10 }]`
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400
- AND `backendFetch` is NOT called

#### Scenario: Invalid nested item — missing internal_sku returns 400

- GIVEN a POST to `/api/orders` with an item missing `internal_sku`
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400
- AND `backendFetch` is NOT called

#### Scenario: Empty items array returns 400

- GIVEN a POST to `/api/orders` with `items: []`
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400
- AND `backendFetch` is NOT called

#### Scenario: Unknown top-level field stripped before forward

- GIVEN a POST to `/api/orders` with a valid body plus `__proto__: "evil"`
- WHEN the handler validates and forwards the body
- THEN `backendFetch` is called with an object that does NOT contain `__proto__`

---

### BFF-NAV-03 — POST /api/coupons/validate Validates Body Before Forward

The coupons/validate POST handler MUST call `validateBody` with `validateCouponSchema`. On failure it MUST return HTTP 400. On success it MUST forward `v.data` via `proxyToBackend body?`.

#### Scenario: Valid coupon body is accepted

- GIVEN a POST to `/api/coupons/validate` with `{ code: "SAVE10", cart_total: 99.9 }`
- WHEN the handler validates the body
- THEN validation passes and the backend is called once with `v.data`

#### Scenario: Non-numeric cart_total returns 400

- GIVEN a POST to `/api/coupons/validate` with `{ code: "SAVE10", cart_total: "ninety" }`
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400
- AND the backend is NOT called

#### Scenario: Missing code returns 400

- GIVEN a POST to `/api/coupons/validate` with `{ cart_total: 50 }` (missing `code`)
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400

---

### BFF-NAV-04 — POST /api/contact Validates Body Before Forward

The contact POST handler MUST validate with `createContactMessageSchema` before calling the backend. Validation MUST reject before the backend's `@Throttle 3/60s` budget is consumed.

#### Scenario: Valid contact body is accepted

- GIVEN a POST to `/api/contact` with `{ name: "Ana", email: "ana@x.com", subject: "Hello", message: "World" }`
- WHEN the handler validates the body
- THEN validation passes and the backend is called once

#### Scenario: Invalid email returns 400 without consuming throttle budget

- GIVEN a POST to `/api/contact` with `{ name: "Ana", email: "not-email", subject: "Hi", message: "Msg" }`
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400
- AND the backend is NOT called

#### Scenario: Message exceeding 2000 chars returns 400

- GIVEN a POST to `/api/contact` with a `message` field of 2001 characters
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400

#### Scenario: Subject exceeding 50 chars returns 400

- GIVEN a POST to `/api/contact` with a `subject` field of 51 characters
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400

---

### BFF-NAV-05 — POST /api/addresses Validates Body Before Forward (Authenticated)

The addresses POST handler MUST validate with `createAddressSchema`. Because the route is authenticated, test setup MUST mock `getSession`. On failure HTTP 400; on success forward `v.data`.

#### Scenario: Valid address body is accepted

- GIVEN an authenticated POST to `/api/addresses` with `{ street: "Main St 123", city: "Lima", region: "Lima" }`
- WHEN the handler validates the body
- THEN validation passes and the backend is called once with `v.data`

#### Scenario: Street below minimum length returns 400

- GIVEN a POST to `/api/addresses` with `{ street: "Hi", city: "Lima", region: "Lima" }` (`street` has 2 chars, below min 5)
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400

#### Scenario: City below minimum length returns 400

- GIVEN a POST to `/api/addresses` with `{ street: "Main St 123", city: "X", region: "Lima" }` (`city` has 1 char, below min 2)
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400

#### Scenario: Unknown field stripped before forward

- GIVEN a POST to `/api/addresses` with a valid body plus `injected: true`
- WHEN the handler validates and forwards
- THEN the backend is called with an object that does NOT contain `injected`

---

### BFF-NAV-06 — PATCH /api/addresses/[id] Validates Body Before Forward (Authenticated)

The addresses PATCH handler MUST validate with `updateAddressSchema`. All fields are optional; an empty body `{}` MUST be valid and forwarded. Test setup MUST mock `getSession`.

#### Scenario: Empty body is valid for PATCH

- GIVEN an authenticated PATCH to `/api/addresses/42` with body `{}`
- WHEN the handler validates the body
- THEN validation passes and the backend is called with `{}`

#### Scenario: Partial update with one field is valid

- GIVEN an authenticated PATCH to `/api/addresses/42` with `{ city: "Arequipa" }`
- WHEN the handler validates and forwards
- THEN validation passes and the backend is called with `{ city: "Arequipa" }`

#### Scenario: Invalid field value in partial update returns 400

- GIVEN an authenticated PATCH to `/api/addresses/42` with `{ street: "Hi" }` (below min length 5)
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400
- AND the backend is NOT called

---

## Shared Behavioral Invariants

### BFF-NAV-07 — No Forward on Failure (All Five Routes)

All five routes MUST NOT call the backend if body validation fails. This is an absolute prohibition mirroring BFF-SEC-03 from slice 1.

#### Scenario: Backend is never called on invalid input (any of the five routes)

- GIVEN any of the five in-scope routes receives a body that fails schema validation
- WHEN the handler executes
- THEN the backend proxy (backendFetch or proxyToBackend) is called zero times

---

### BFF-NAV-08 — Structured 400 Error Response

On validation failure all five routes MUST return HTTP 400 with a JSON body matching the shape established by slice 1 (`{ error: string, issues: array }`). No stack traces or raw zod objects.

#### Scenario: 400 response has structured error body

- GIVEN any of the five routes receives an invalid body
- WHEN the handler returns 400
- THEN the response body is valid JSON containing at minimum `{ error: string, issues: array }`
- AND the response `Content-Type` is `application/json`

---

### BFF-NAV-09 — Unknown Fields Stripped on All Five Routes

All five handlers MUST strip unknown fields before forwarding. Stripped output is `v.data` from the zod `strip` mode (inherited from `validateBody`).

---

## Testing Contract

### BFF-NAV-T1 — Test Runner and Pattern

All new route tests MUST run under `pnpm test:run` (Vitest). Tests MUST follow the slice-1 pattern: hoisted `vi.mock`, `vi.resetModules()` + dynamic `import()` in `beforeEach`, `NextRequest` construction.

### BFF-NAV-T2 — Authenticated Route Test Setup

Tests for POST /api/addresses and PATCH /api/addresses/[id] MUST mock `getSession` to simulate an authenticated session. An unauthenticated mock is NOT required unless testing auth-guard behavior separately.

### BFF-NAV-T3 — Orders Nested Validation Coverage (Mandatory)

The POST /api/orders test suite MUST include all four of:
1. Wrong-type `quantity` (e.g. string) → HTTP 400, `backendFetch` not called.
2. Missing `internal_sku` → HTTP 400, `backendFetch` not called.
3. Empty `items` array → HTTP 400, `backendFetch` not called.
4. Valid full order → `backendFetch` called once AND `setOrderAccessCookie` called.

### BFF-NAV-T4 — Minimum Coverage Per Route

Every validated route test MUST cover:
1. Valid body → backend called once with the parsed (stripped) object.
2. At least one missing required field → HTTP 400, backend not called.
3. Wrong type on at least one field → HTTP 400.
4. Unknown field → backend called with object that does NOT contain the unknown key.

### BFF-NAV-T5 — Parity Comment Presence

Each schema file MUST carry a `// Source:` comment per schema (mirroring BFF-SEC-T3). A test or linter check SHOULD verify this comment is not accidentally removed.

---

## Out of Scope / Deferred

The following routes MUST NOT be modified in this change. No TODO comments or placeholder code shall be added to their files:

| Route | Reason deferred |
|---|---|
| POST /api/orders/card-payment | Backend endpoint does not exist; no DTO to mirror |
| POST /api/reviews | Backend route stubbed / returns 404 |
| PATCH /api/reviews/[id]/helpful | Sends no body; nothing to validate |
| Rate limiting | Separate future slice; out of scope here |

---

## Invariants (Slice 2)

- BFF-NAV-01 field shapes are locked to verified DTO shapes. No field name may be changed without updating the backend DTO first.
- `setOrderAccessCookie` in the orders handler MUST NOT be removed or moved by this change.
- `updateAddressSchema` MUST accept empty `{}` — marking all fields `.optional()` is required.
- All HTTP 400 responses MUST have `Content-Type: application/json`.
- Body MUST be read exactly once per request (one `req.json()` call via `validateBody`). After `v.data` is obtained, `req.json()` MUST NOT be called again.

---

# Domain 4: Auth Rate Limiting (Slice 4)

Deploys per-IP sliding-window rate limiting on the three auth routes (login, forgot-password, reset-password) using distributed Upstash Redis. Availability (fail-open) takes precedence over enforcement strictness; the WAF layer provides the outer coarse defense.

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

The system MUST provide a module `app/lib/rate-limit/auth-limiter.ts` that exports `getAuthLimiter(route: AuthRoute): Ratelimit | null`.

- The module MUST include `import 'server-only'` as its first import to prevent client bundle inclusion.
- `getAuthLimiter(route)` MUST return a `Ratelimit` instance (singleton per route) when both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are present in the environment.
- `getAuthLimiter(route)` MUST return `null` when either env var is absent.
- `getAuthLimiter(route)` MUST return `null` if the `Ratelimit` constructor throws during initialization, and MUST emit a `console.warn` in that case.
- The `Ratelimit` instance MUST use `Ratelimit.slidingWindow` algorithm and `Redis.fromEnv()` for the connection. `analytics` MUST be set to `false`.
- Instances MUST be memoized (constructed at most once per `AuthRoute` per process). Lazy init on first call.

#### Scenario: Returns Ratelimit when both env vars are set

- GIVEN `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are both non-empty
- WHEN `getAuthLimiter(route)` is called
- THEN a `Ratelimit` instance is returned
- AND subsequent calls for the same route return the same instance (singleton)

#### Scenario: Returns null when URL env var is absent

- GIVEN `UPSTASH_REDIS_REST_URL` is undefined or empty
- WHEN `getAuthLimiter(route)` is called
- THEN `null` is returned

#### Scenario: Returns null when TOKEN env var is absent

- GIVEN `UPSTASH_REDIS_REST_TOKEN` is undefined or empty
- WHEN `getAuthLimiter(route)` is called
- THEN `null` is returned

#### Scenario: Returns null on init error

- GIVEN both env vars are set but the `Ratelimit` constructor throws an error
- WHEN `getAuthLimiter(route)` is called
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
| Called twice for same route | Returns the same instance (singleton) |

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

## Invariants (Slice 4)

- The rate-limit gate MUST always run before `validateBody` in the three target handlers. Re-ordering is a breaking violation.
- `getAuthLimiter()` MUST NEVER throw — it MUST catch all init errors and return `null`.
- Per-email keying MUST NOT be introduced (enumeration risk).
- A Redis outage MUST result in fail-open, never in user lockout.
- The `Retry-After` header MUST be computed from the `reset` timestamp returned by the limiter, not a static value.
- `analytics: false` MUST be set on the `Ratelimit` instance (no `waitUntil` available in Next.js App Router route handlers).
