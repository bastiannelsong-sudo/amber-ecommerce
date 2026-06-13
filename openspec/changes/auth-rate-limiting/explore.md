# Exploration: auth-rate-limiting (Slice 4 of BFF Security)

## Current State

Three target auth routes post-slice-1 (all have validateBody + zod):
- `app/api/auth/login/route.ts` — POST, uses `backendFetch`, 47 lines
- `app/api/auth/forgot-password/route.ts` — POST, uses `proxyToBackend`, 11 lines
- `app/api/auth/reset-password/route.ts` — POST, uses `proxyToBackend`, 11 lines

All three follow identical pattern:
```
const v = await validateBody(req, schema);
if (!v.ok) return v.response;
// ... backend call with v.data
```

Rate limit gate MUST run BEFORE `validateBody` — first statement in handler body — to reject before JSON parse + zod compute.

Response shape used: `NextResponse.json(payload, { status })`. 429 must match: `NextResponse.json({ error: 'rate_limited', message: string }, { status: 429 })` with `Retry-After` header.

No existing rate-limit code anywhere. No `@upstash/ratelimit` or `@upstash/redis` in package.json. Zod is `^4.4.3`.

## Library API — @upstash/ratelimit + @upstash/redis

**Versions**: `@upstash/ratelimit@2.0.8` (Jan 2026), `@upstash/redis` (current stable, no breaking changes).

**Init pattern**:
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '60 s'),
  analytics: false, // skip for simplicity; no waitUntil in App Router route handlers
  prefix: 'rl:auth',
});
```

**`Redis.fromEnv()`** reads: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.

**`.limit(key)` return shape**:
```typescript
{ success: boolean, limit: number, remaining: number, reset: number, pending: Promise<void> }
```
`success: false` = blocked. `pending` = analytics flush (no waitUntil available in App Router route handlers — skip analytics or fire-and-forget with `void`).

**Algorithm**: `slidingWindow` recommended over `fixedWindow` — no 2× burst at window boundary, critical for brute-force prevention.

**Connectionless**: HTTP-based, no persistent TCP. Works correctly across ECS multi-instance (all tasks share Upstash state).

## IP Extraction — Next.js 16

`NextRequest.ip` was removed in Next.js 15 (not restored in 16). Confirmed correct approach:
```typescript
const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
```
AWS ALB sets `X-Forwarded-For` with the original client IP first. Taking `[0].trim()` is correct for ALB topology.

## Fail-Open Design

**Detection**: Check env vars at module init time.
```typescript
const isConfigured = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
```

**Singleton factory** (proposed location: `app/lib/rate-limit/auth-limiter.ts`):
```typescript
let limiterInstance: Ratelimit | null = null;

export const getAuthLimiter = (): Ratelimit | null => {
  if (!isConfigured) {
    console.warn('[rate-limit] Upstash not configured — rate limiting disabled');
    return null;
  }
  if (!limiterInstance) {
    limiterInstance = new Ratelimit({ redis: Redis.fromEnv(), ... });
  }
  return limiterInstance;
};
```

In handler (before validateBody):
```typescript
const limiter = getAuthLimiter();
if (limiter) {
  const { success, reset } = await limiter.limit(key);
  if (!success) {
    return NextResponse.json(
      { error: 'rate_limited', message: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) } }
    );
  }
}
const v = await validateBody(req, schema);
```

## Rate Limit Key Design

| Endpoint | Recommended Key | Rationale |
|---|---|---|
| `login` | `login:${ip}` | IP-primary. Email-based risks enumeration (attacker detects account existence via limit differences). |
| `forgot-password` | `forgot:${ip}` | IP-primary. Email-based would enable account enumeration. |
| `reset-password` | `reset:${ip}` | IP-primary. Tokens are time-limited; IP rate-limit prevents rapid guessing. |

**Open Question**: Should `login` add a secondary per-email limiter? Counter-argument: email keying reveals account existence. Deferred to design.

## Suggested Limits (OPEN — for design/product to finalize)

- `login`: 5 attempts / 60s per IP
- `forgot-password`: 3 attempts / 60s per IP
- `reset-password`: 5 attempts / 60s per IP

## Env Vars

New vars to add to `.env.example`:
- `UPSTASH_REDIS_REST_URL=` (leave blank to disable rate limiting in dev)
- `UPSTASH_REDIS_REST_TOKEN=` (leave blank to disable rate limiting in dev)

## Testing Strategy

Mock the rate-limit module (not Upstash internals). In route test files:
```typescript
vi.mock('../../../lib/rate-limit/auth-limiter', () => ({
  getAuthLimiter: vi.fn(),
}));
```
Return `{ limit: vi.fn().mockResolvedValue({ success: true, ... }) }` for allowed, `success: false` for blocked, `null` for fail-open.

Required test scenarios per route:
1. `success: true` → handler proceeds (validateBody + backend called normally)
2. `success: false` → 429 returned, validateBody NOT called, backend NOT called
3. `null` (fail-open) → handler proceeds as normal
4. Limiter throws → fail-open (caught, warn logged, proceed)

Vitest setup already aliases `server-only` to a mock — safe to use in auth-limiter.ts.

## Affected Areas

- `app/api/auth/login/route.ts` — rate-limit gate as first statement
- `app/api/auth/forgot-password/route.ts` — rate-limit gate as first statement
- `app/api/auth/reset-password/route.ts` — rate-limit gate as first statement
- `app/lib/rate-limit/auth-limiter.ts` — NEW: singleton factory, fail-open
- `app/api/auth/login/route.test.ts` — extend with 4 rate-limit scenarios
- `app/api/auth/forgot-password/route.test.ts` — extend with 4 rate-limit scenarios
- `app/api/auth/reset-password/route.test.ts` — extend with 4 rate-limit scenarios
- `package.json` — add `@upstash/ratelimit@^2.0.8` + `@upstash/redis` as dependencies
- `.env.example` — add two Upstash env var stubs
- `openspec/changes/auth-rate-limiting/waf-recommendation.md` — NEW: WAF doc for infra handoff

## WAF Recommendation Doc Location

`openspec/changes/auth-rate-limiting/waf-recommendation.md`

Content outline:
- Rule type: Rate-based rule (AWS WAF)
- Scope: URI path match `/api/auth/*`
- Suggested limit: 100 requests / 5 minutes per IP (coarse — WAF is outer defense)
- Aggregation key: IP address
- Action: Block (or CAPTCHA)
- Note: WAF applies before ECS; Upstash is the fine-grained per-account/endpoint layer
- Deployment: CloudFormation/Terraform snippet or console instructions
- Owner: Infrastructure/DevOps

## Approaches

| Approach | Pros | Cons | Effort |
|---|---|---|---|
| Module singleton `getAuthLimiter()` returning `Ratelimit\|null` | Mockable, DRY, fail-open as null check, singleton avoids re-init per request | Module-level state (negligible concern) | Low |
| Per-handler inline `new Ratelimit(...)` | No abstraction | Duplicated init, not mockable without constructor mocking, re-creates on every request | Low (bad maintenance) |
| Rate limit in `proxy.ts` (formerly middleware) | Centralized | proxy.ts is Node runtime in Next 16 (edge dropped), body not available for email keying, harder per-route limits | Medium |

## Recommendation

**Module singleton** (Approach 1). Place in `app/lib/rate-limit/auth-limiter.ts`. Inject `import 'server-only'` to prevent client bundle inclusion (vitest alias already handles this). Inject before `validateBody` call in each of the 3 handlers.

## Open Questions for Design Phase

1. Per-email secondary limiter for login? (IP-primary recommended; email risks enumeration)
2. `analytics: true` vs false? (skip for simplicity — no waitUntil in App Router route handlers)
3. Retry-After: static string or computed from `reset`?
4. Exact limit values (need product sign-off)
5. Fail-closed vs fail-open on Upstash runtime error? (recommend fail-open)
6. Should reset-password also key on token hash prefix?

## Risks

- Upstash free tier: 10,000 commands/day. 3 routes = ~3 ops/auth request = cap at ~3,333 auth requests/day. Monitor before launch; upgrade to paid if needed.
- `Redis.fromEnv()` throw on bad credentials: limiter factory must catch and fail-open.
- X-Forwarded-For spoofing: ALB should strip/override in correct config — infra concern, not code.
- pnpm lockfile update needed (two new deps).

## Ready for Proposal

Yes — all facts gathered. Decision context locked (two-layer WAF + Upstash). No blocking questions. Design resolves the 6 open questions above.
