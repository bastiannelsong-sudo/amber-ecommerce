# Proposal: Auth Rate Limiting (Slice 4 — BFF Security)

## Intent

Auth endpoints (`login`, `forgot-password`, `reset-password`) accept unlimited requests, enabling credential brute force and password-reset abuse. Deploy is AWS ECS multi-instance, so in-memory limiting is useless. Slice 1 closed input validation; rate limiting was explicitly deferred to this slice. Success = brute-force volume capped per IP with a correct `429 + Retry-After`, while a Redis outage never locks users out (fail-open).

## Scope

### In Scope
- `app/lib/rate-limit/auth-limiter.ts` — singleton factory `getAuthLimiter(): Ratelimit | null`, fail-open
- Rate-limit gate applied to `login`, `forgot-password`, `reset-password` (first statement, before `validateBody`)
- New deps: `@upstash/ratelimit@^2` + `@upstash/redis`
- `.env.example`: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (blank = disabled)
- `waf-recommendation.md` — documentation-only handoff for infra (no code)

### Out of Scope
- Non-auth routes (orders, coupons — different abuse profile, future slice)
- Per-email keying (enables account enumeration — rejected)
- AWS ElastiCache (cost trap, rejected in decision #911)
- The WAF rule itself — infra owns deployment

## Capabilities

### New Capabilities
- `auth-rate-limiting`: per-IP sliding-window limits on the three auth routes, fail-open, with WAF as documented outer layer

### Modified Capabilities
- None (gate is additive; slice-1 validation behavior unchanged)

## Approach

Two complementary layers (defense in depth):

- **Layer A — AWS WAF (doc only)**: rate-based rule on `/api/auth/*`, ~100 req / 5 min per IP, coarse volumetric defense. Infra-owned, billed to AWS credits.
- **Layer B — Upstash app-level (the code)**: fine-grained per-route limits via `@upstash/ratelimit` sliding window, connectionless HTTP (correct across ECS tasks), $0 free tier.

Module singleton lazily builds one `Ratelimit` via `Redis.fromEnv()`. Returns `null` when env vars absent or init throws (`console.warn`, FAIL-OPEN). Handlers skip the gate when `null`. On block → `429` with `Retry-After` computed from `reset`.

| Route | Window | Key |
|---|---|---|
| login | 5 / 60s | `login:${ip}` |
| forgot-password | 3 / 60s | `forgot:${ip}` |
| reset-password | 5 / 60s | `reset:${ip}` |

IP = `x-forwarded-for` first entry (ALB sets it); `analytics: false` (no `waitUntil` in route handlers).

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Upstash free tier 10k cmd/day cap | Med | Monitor; upgrade to paid if needed |
| Bad credentials throw on init | Low | Factory catches → fail-open |
| X-Forwarded-For spoofing | Low | ALB strips/overrides (infra) |

## Rollback Plan

Revert the gate lines in the 3 handlers and remove the two deps. The module is isolated; deleting `auth-limiter.ts` plus reverting `package.json`/`.env.example` fully reverts. Setting env vars blank disables limiting without a redeploy.

## Dependencies

- Upstash Redis instance provisioned (URL + token) for production; dev runs fail-open with blanks.

## Success Criteria

- [ ] Over-limit requests return `429` with `Retry-After`; `validateBody` and backend NOT called
- [ ] Under-limit requests proceed normally
- [ ] Limiter `null` or throwing → handler proceeds (fail-open)
- [ ] `pnpm test:run` green; auth-limiter unit test covers null/configured branches
- [ ] WAF doc delivered for infra handoff
