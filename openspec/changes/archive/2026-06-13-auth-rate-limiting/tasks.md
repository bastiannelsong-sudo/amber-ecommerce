# Tasks: Auth Rate Limiting (Slice 4 — BFF Security)

> STRICT TDD MODE ACTIVE. Runner: `pnpm test:run` (Vitest). Every impl task ships RED→GREEN. Mock strategy: `vi.mock` at module level, `vi.resetModules()` + dynamic `import()` in `beforeEach`. No live Upstash in tests.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 300–380 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Deps + env stub + limiter module + enforce helper | PR 1 | Foundation; no handler changes yet |
| 2 | 3 handler integrations + WAF doc verification | PR 1 | Builds on unit 1; same PR under budget |

---

## Phase 1: Foundation — Dependencies & Environment

- [x] 1.1 Add `@upstash/ratelimit@^2.0.8` and `@upstash/redis` to `package.json` via `pnpm add @upstash/ratelimit @upstash/redis`. Verify lockfile updates. (Satisfies: BFF-RL-01, BFF-RL-04)
- [ ] 1.2 Add `UPSTASH_REDIS_REST_URL=` and `UPSTASH_REDIS_REST_TOKEN=` (blank) to `.env.example`. Blank = fail-open, no redeploy needed. (Satisfies: BFF-RL-11) **BLOCKED: .env.example is permission-restricted in this context. Must be done manually.**

---

## Phase 2: Core Modules — RED (write failing tests first)

- [x] 2.1 **RED** — Create `app/lib/rate-limit/auth-limiter.test.ts`. Write failing tests for `getAuthLimiter(route)`: (a) both env vars set → returns `Ratelimit` instance; (b) `UPSTASH_REDIS_REST_URL` absent → `null`; (c) `UPSTASH_REDIS_REST_TOKEN` absent → `null`; (d) constructor throws → `null` + `console.warn`; (e) two calls same route → same instance (singleton/memoized). Mock `@upstash/ratelimit` and `@upstash/redis` via `vi.mock`. (Satisfies: BFF-RL-01, BFF-RL-T2)
- [x] 2.2 **RED** — Create `app/lib/rate-limit/enforce.test.ts`. Write failing tests for `enforceRateLimit(req, route)`: (a) `getAuthLimiter` returns `null` → returns `null`; (b) limiter returns `{ success: true }` → returns `null`; (c) limiter returns `{ success: false, reset: N }` → returns `NextResponse` with status 429, `Retry-After` header = `ceil((N - Date.now()) / 1000)`, body `{ error:'rate_limited', message:'...' }`; (d) `limiter.limit()` throws → `console.warn` + returns `null`. Mock `./auth-limiter` via `vi.mock`. (Satisfies: BFF-RL-03, BFF-RL-05, BFF-RL-06, BFF-RL-07, BFF-RL-08, BFF-RL-T1)

---

## Phase 3: Core Modules — GREEN (implement to pass tests)

- [x] 3.1 **GREEN** — Create `app/lib/rate-limit/get-client-ip.ts`. Export `getClientIp(req: NextRequest): string`. Implementation: `req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1'`. Uses `||` (not `??`) so empty string falls back. No `server-only` import needed. Run `pnpm test:run` — all `get-client-ip` tests pass. (Satisfies: BFF-RL-03)
- [x] 3.2 **GREEN** — Create `app/lib/rate-limit/auth-limiter.ts`. First import: `import 'server-only'`. Export `type AuthRoute = 'login' | 'forgot' | 'reset'`. Export `getAuthLimiter(route: AuthRoute): Ratelimit | null`. Internals: memoized `Record<AuthRoute, Ratelimit>` built lazily; shared `Redis.fromEnv()`; per-route `slidingWindow` limits (login=5, forgot=3, reset=5), window `'60 s'`; `analytics: false`; whole build in `try/catch` → `console.warn` + set `failed` flag → return `null`. Run `pnpm test:run` — `auth-limiter.test.ts` all green. (Satisfies: BFF-RL-01, BFF-RL-04, BFF-RL-09)
- [x] 3.3 **GREEN** — Create `app/lib/rate-limit/enforce.ts`. Export `enforceRateLimit(req: NextRequest, route: AuthRoute): Promise<NextResponse | null>`. Logic (early returns): (1) `const limiter = getAuthLimiter(route); if (!limiter) return null;` (2) `const ip = getClientIp(req);` (3) `try { const res = await limiter.limit(\`${route}:${ip}\`); if (!res.success) return NextResponse.json({ error:'rate_limited', message:'Demasiados intentos. Intentá de nuevo más tarde.' }, { status:429, headers:{ 'Retry-After': String(Math.ceil((res.reset - Date.now()) / 1000)) } }); return null; } catch (e) { console.warn(...); return null; }`. No `server-only` import. Run `pnpm test:run` — `enforce.test.ts` all green. (Satisfies: BFF-RL-05, BFF-RL-06, BFF-RL-07, BFF-RL-08, BFF-RL-T1)

---

## Phase 4: Handler Integration — RED (write failing route tests first)

- [x] 4.1 **RED** — Extend `app/api/auth/login/route.test.ts`. Add `vi.mock('../../../lib/rate-limit/enforce', () => ({ enforceRateLimit: vi.fn() }))` (hoisted). Add 4 new describe/it blocks: (a) `enforceRateLimit` resolves `null` → proceeds, `validateBody` called, `backendFetch` called, no 429; (b) `enforceRateLimit` resolves 429 `NextResponse` → status 429, `backendFetch` NOT called, `setSession` NOT called; (c) limiter null (pass-through when enforce returns null) → proceeds; (d) enforce returns null after internal throw → proceeds. Run `pnpm test:run` — new tests RED. (Satisfies: BFF-RL-02, BFF-RL-05, BFF-RL-06, BFF-RL-07, BFF-RL-T3, BFF-RL-T4)
- [x] 4.2 **RED** — Same 4 scenarios for `app/api/auth/forgot-password/route.test.ts`. Mock `enforceRateLimit` identically. Run `pnpm test:run` — new tests RED. (Satisfies: BFF-RL-02, BFF-RL-T3)
- [x] 4.3 **RED** — Same 4 scenarios for `app/api/auth/reset-password/route.test.ts`. Mock `enforceRateLimit` identically. Run `pnpm test:run` — new tests RED. (Satisfies: BFF-RL-02, BFF-RL-T3)

---

## Phase 5: Handler Integration — GREEN (integrate gate into handlers)

- [x] 5.1 **GREEN** — Modify `app/api/auth/login/route.ts`. Add import `enforceRateLimit` from `../../../lib/rate-limit/enforce`. First two statements in `POST`: `const limited = await enforceRateLimit(req, 'login'); if (limited) return limited;`. Gate reads only `req.headers` — body stream untouched. All existing tests must stay green. Run `pnpm test:run`. (Satisfies: BFF-RL-02, BFF-RL-04)
- [x] 5.2 **GREEN** — Modify `app/api/auth/forgot-password/route.ts`. Same pattern, route key `'forgot'`. Run `pnpm test:run`. (Satisfies: BFF-RL-02, BFF-RL-04)
- [x] 5.3 **GREEN** — Modify `app/api/auth/reset-password/route.ts`. Same pattern, route key `'reset'`. Run `pnpm test:run`. (Satisfies: BFF-RL-02, BFF-RL-04)

---

## Phase 6: Verification & Cleanup

- [x] 6.1 Verify `openspec/changes/auth-rate-limiting/waf-recommendation.md` covers all BFF-RL-10 required fields: rule type, path scope (`/api/auth/*`), rate limit value (100 req / 5 min), aggregation key (IP), action (Block), deployment owner (Infra/DevOps). File already exists — read and confirm, do NOT rewrite unless a field is missing. (Satisfies: BFF-RL-10) CONFIRMED: all 6 fields present.
- [x] 6.2 Run full test suite `pnpm test:run`. All prior tests green (regression check). Confirm `auth-limiter.test.ts`, `enforce.test.ts`, and the 3 route test files all pass the new scenarios. RESULT: 294/294 tests green (was 270 pre-slice; +24 new tests).
- [ ] 6.3 Confirm `.env.example` has both Upstash stubs with blank values. Confirm no `UPSTASH_*` vars appear in any other committed dotfiles. **BLOCKED: .env.example is permission-restricted. Append manually:**
  ```
  # Upstash Redis — BFF auth rate limiting (auth-rate-limiting slice 4)
  # Leave blank to disable rate limiting (fail-open). Set both to enable.
  UPSTASH_REDIS_REST_URL=
  UPSTASH_REDIS_REST_TOKEN=
  ```

---

## Parallelism Notes

- Tasks 2.1 and 2.2 can be written in parallel (independent test files).
- Tasks 3.1 and 3.2 and 3.3 are sequential: `get-client-ip` → `auth-limiter` → `enforce` (enforce imports both).
- Tasks 4.1, 4.2, 4.3 can be written in parallel (independent route test files).
- Tasks 5.1, 5.2, 5.3 can be applied in parallel (independent route files).
- Phase 6 is sequential after all Phases complete.

## File Inventory

| Action | Path |
|--------|------|
| NEW | `app/lib/rate-limit/get-client-ip.ts` |
| NEW | `app/lib/rate-limit/auth-limiter.ts` |
| NEW | `app/lib/rate-limit/enforce.ts` |
| NEW | `app/lib/rate-limit/auth-limiter.test.ts` |
| NEW | `app/lib/rate-limit/enforce.test.ts` |
| MODIFY | `app/api/auth/login/route.ts` |
| MODIFY | `app/api/auth/forgot-password/route.ts` |
| MODIFY | `app/api/auth/reset-password/route.ts` |
| MODIFY | `app/api/auth/login/route.test.ts` |
| MODIFY | `app/api/auth/forgot-password/route.test.ts` |
| MODIFY | `app/api/auth/reset-password/route.test.ts` |
| MODIFY | `package.json` (pnpm add) |
| MODIFY | `.env.example` — MANUAL: append UPSTASH_REDIS_REST_URL= and UPSTASH_REDIS_REST_TOKEN= |
| VERIFY | `openspec/changes/auth-rate-limiting/waf-recommendation.md` — CONFIRMED |
