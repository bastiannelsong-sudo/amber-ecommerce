# Design: Auth Rate Limiting (Slice 4 — BFF Security)

## Technical Approach

Add a fail-open, per-IP sliding-window rate-limit gate in front of `validateBody` on the three auth routes (login, forgot-password, reset-password). Two collaborating modules: a memoized limiter factory (`auth-limiter.ts`) and a reusable gate helper (`enforce.ts`). Handlers call one line that returns either a ready 429 `NextResponse` (short-circuit) or `null` (proceed). Reads from `@upstash/ratelimit` over connectionless HTTP so state is shared across ECS tasks. The gate touches ONLY request headers — it never consumes the one-shot body stream, so `validateBody` still reads it.

## Architecture Decisions

### ADR-1: Limiter module shape — factory by route key, memoized

**Status**: Accepted.
**Context**: `Ratelimit.slidingWindow(n, '60 s')` bakes the limit into the instance. login=5, forgot=3, reset=5 differ, so a single instance cannot serve all three. The proposal also fixes a per-route key prefix.
**Choice**: `getAuthLimiter(route: AuthRoute): Ratelimit | null` where `AuthRoute = 'login' | 'forgot' | 'reset'`. Internally a `Record<AuthRoute, Ratelimit>` cache built lazily on first request, each entry created with that route's window. One shared `Redis.fromEnv()` instance reused across all three limiters.

| Option | Tradeoff | Decision |
|---|---|---|
| (a) 3 exported instances | Module-eval-time `new Ratelimit` defeats lazy init + try/catch fail-open; not test-friendly | Rejected |
| (b) one limiter per route created inline in handler | Re-creates per request, duplicated config, not DRY | Rejected |
| (c) factory `getAuthLimiter(route)` memoized | Lazy, single try/catch boundary, one mock point, DRY | **Chosen** |

**Consequences**: One mock target for all tests. Adding a route = one map entry. Module-level state is negligible (idempotent singletons).
**Signatures** (`import 'server-only'` at top; `analytics: false`):
```typescript
export type AuthRoute = 'login' | 'forgot' | 'reset';
export const getAuthLimiter: (route: AuthRoute) => Ratelimit | null;
```
Fail-open: returns `null` when env vars missing, OR when `Redis.fromEnv()` / `new Ratelimit` throws (whole build wrapped in try/catch → `console.warn` → `null`). A `failed` flag prevents retrying a broken init every request.

### ADR-2: Gate helper — `enforceRateLimit` returning `NextResponse | null`

**Status**: Accepted. **Location**: `app/lib/rate-limit/enforce.ts` (separate file: keeps `auth-limiter.ts` pure provider; `enforce.ts` owns HTTP concern — separation of concerns).
**Choice**: `enforceRateLimit(req: NextRequest, route: AuthRoute): Promise<NextResponse | null>`.
**Behavior** (early-return style):
1. `const limiter = getAuthLimiter(route); if (!limiter) return null;` (fail-open, disabled)
2. `const ip = getClientIp(req);`
3. `try { const { success, reset } = await limiter.limit(\`${route}:${ip}\`); }` `catch { console.warn(...); return null; }` (fail-open on runtime error)
4. `if (success) return null;` else build and return the 429.

**429 contract** (matches `validation.ts` idiom — `{ error, message }`, `NextResponse.json(payload, { status, headers })`):
```typescript
NextResponse.json(
  { error: 'rate_limited', message: 'Demasiados intentos. Intentá de nuevo más tarde.' },
  { status: 429, headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) } },
);
```
**Alternatives**: fold gate into `auth-limiter.ts` (mixes provider + transport, rejected); throw-and-catch in handler (verbose at call sites, rejected).
**Consequences**: Call site is two lines; the helper is independently unit-testable with a mocked limiter.

### ADR-3: Handler integration — first statement, before validateBody

**Status**: Accepted.
**Choice**: Identical two lines as the FIRST statements in each `POST`:
```typescript
const limited = await enforceRateLimit(req, 'login'); // 'forgot' | 'reset'
if (limited) return limited;
const v = await validateBody(req, schema); // unchanged
```
**Body-consumption proof**: `NextRequest` body is a one-shot stream. The gate reads only `req.headers.get('x-forwarded-for')`; it never calls `req.json()`/`req.text()`. So `validateBody`'s single `await request.json()` still succeeds. CONFIRMED against `validation.ts:32` ("Reads the body ONCE").
**Conceptual diffs**: login (route key `'login'`), forgot (`'forgot'`), reset (`'reset'`) — three insertions, same shape; imports add `enforceRateLimit` from `../../../lib/rate-limit/enforce`.

### ADR-4: IP extraction helper — `getClientIp`

**Status**: Accepted. **Location**: `app/lib/rate-limit/get-client-ip.ts` (domain-named, not `utils`).
**Choice**: `export const getClientIp = (req: NextRequest): string => req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';`
**Fallback**: `'127.0.0.1'`.

| Option | Tradeoff | Decision |
|---|---|---|
| `'127.0.0.1'` | All unknown-IP clients share one bucket; matches proposal; loopback is self-documenting | **Chosen** |
| `'unknown'` | Same shared-bucket effect, less conventional | Rejected |

**Consequences**: ALB always sets XFF in prod, so the fallback only triggers in dev/misconfig; the shared bucket is acceptable (a single attacker cannot evade by stripping XFF — they'd land in the shared loopback bucket). Note the `||` (not `??`) so an empty-string first entry also falls back.

### ADR-5: Testing seam

**Status**: Accepted.
**Choice**: Mock the limiter module by path (matches existing `vi.mock('../../../lib/bff-proxy', ...)` + `vi.resetModules()` + dynamic `import('./route')` pattern in the route tests). Two test surfaces:
- **`enforce.test.ts`**: `vi.mock('./auth-limiter')`; provide `{ limit }` returning `success:true|false`, or `getAuthLimiter` returning `null`, or `limit` rejecting → assert returned `NextResponse|null` and Retry-After header value.
- **Each route test**: `vi.mock('../../../lib/rate-limit/enforce', () => ({ enforceRateLimit: vi.fn() }))`. Per route, 4 scenarios: (1) resolves `null` → proceeds, `validateBody`/proxy called; (2) resolves a 429 `NextResponse` → status 429, **assert `proxyToBackend`/`backendFetch`/`setSession` NOT called** (they are already spied via the existing `vi.mock('../../../lib/bff-proxy')`); (3) limiter `null` fail-open via enforce returning `null` → proceeds; (4) enforce returning `null` after internal throw → proceeds.
**server-only**: Vitest setup already aliases `server-only` to a no-op mock (confirmed in explore), so `auth-limiter.ts`'s `import 'server-only'` is safe under test. `enforce.ts` and `get-client-ip.ts` do NOT import `server-only` (they hold no secrets) so they stay trivially importable.

### ADR-6: Retry-After computation

**Status**: Accepted (locks explore open-question #3).
**Choice**: `reset` is a UNIX timestamp in **milliseconds** (per explore). `Retry-After: String(Math.ceil((reset - Date.now()) / 1000))` → integer seconds, HTTP-compliant. Never static.
**Consequences**: Value is always ≥1s while blocked; computed once at response build.

## Data Flow

```
POST /api/auth/{route}
   │
   ▼
enforceRateLimit(req, route) ──► getAuthLimiter(route) ──► null? ──► return null (fail-open)
   │                                   │
   │                                   ▼ Ratelimit
   │            getClientIp(req)──► limit(`${route}:${ip}`) ──► Upstash Redis (HTTP, shared across ECS)
   │                                   │
   │            success ─► return null │ !success ─► 429 {error,message} + Retry-After
   ▼
limited? ── yes ─► return limited (validateBody + backend NEVER reached)
   │ no
   ▼
validateBody(req, schema) ─► backendFetch / proxyToBackend
```

## File Changes

| File | Action | Description |
|---|---|---|
| `app/lib/rate-limit/auth-limiter.ts` | Create | `server-only` factory `getAuthLimiter(route)`, memoized, fail-open |
| `app/lib/rate-limit/enforce.ts` | Create | `enforceRateLimit(req, route)` → `NextResponse \| null`, builds 429 |
| `app/lib/rate-limit/get-client-ip.ts` | Create | `getClientIp(req)` XFF-first, `127.0.0.1` fallback |
| `app/lib/rate-limit/enforce.test.ts` | Create | Gate unit tests (mock auth-limiter) |
| `app/api/auth/login/route.ts` | Modify | Add gate (route `'login'`) before validateBody |
| `app/api/auth/forgot-password/route.ts` | Modify | Add gate (route `'forgot'`) |
| `app/api/auth/reset-password/route.ts` | Modify | Add gate (route `'reset'`) |
| `app/api/auth/login/route.test.ts` | Modify | +4 rate-limit scenarios |
| `app/api/auth/forgot-password/route.test.ts` | Modify | +4 rate-limit scenarios |
| `app/api/auth/reset-password/route.test.ts` | Modify | +4 rate-limit scenarios |
| `package.json` | Modify | Add `@upstash/ratelimit@^2.0.8`, `@upstash/redis` |
| `.env.example` | Modify | `UPSTASH_REDIS_REST_URL=`, `UPSTASH_REDIS_REST_TOKEN=` |
| `openspec/changes/auth-rate-limiting/waf-recommendation.md` | Create | Infra handoff doc (no code) |

## Interfaces / Contracts

```typescript
// auth-limiter.ts
export type AuthRoute = 'login' | 'forgot' | 'reset';
export const getAuthLimiter: (route: AuthRoute) => Ratelimit | null;
// enforce.ts
export const enforceRateLimit: (req: NextRequest, route: AuthRoute) => Promise<NextResponse | null>;
// get-client-ip.ts
export const getClientIp: (req: NextRequest) => string;
```
Limits: login 5/60s, forgot 3/60s, reset 5/60s. Keys: `${route}:${ip}`. Prefix `rl:auth`.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | `getAuthLimiter` null branch (env missing) and configured branch | env stub + module reload; assert `null` vs instance |
| Unit | `enforceRateLimit` success/block/null/throw → return + Retry-After | `vi.mock('./auth-limiter')` |
| Integration | Each route: allow / block-no-backend / fail-open(null) / fail-open(throw) | `vi.mock(enforce)`, spy bff-proxy + session |

## Migration / Rollout

No data migration. Env-flag controlled: blank Upstash vars = disabled (fail-open), so it ships dark and activates by setting prod env vars — no code redeploy needed to toggle. Rollback = revert 3 gate insertions + remove 2 deps + delete `app/lib/rate-limit/`.

## Contradictions vs proposal/explore

None blocking. Two refinements: (1) The proposal/explore sketch a single `getAuthLimiter(): Ratelimit | null`; that signature cannot encode three different limits in one instance (slidingWindow bakes the limit), so this design adopts the explore's own option-(c) "factory memoized" with an explicit `route` parameter — same intent, corrected signature. (2) Explore's inline handler snippet builds the 429 in the route; this design extracts it into `enforceRateLimit` for DRY + single 429 contract — handler integration semantics are unchanged.

## Open Questions

- [ ] Per-email secondary limiter for login — REJECTED (enumeration risk), confirmed deferred. No action.
- [ ] reset-password token-hash keying — out of scope; IP-only this slice.
