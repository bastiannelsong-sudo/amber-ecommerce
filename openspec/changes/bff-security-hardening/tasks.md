# Tasks: BFF Security Hardening — Slice 1

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 520–640 (additions + deletions) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1 → PR2 → PR3 → PR4 (see Suggested Work Units) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

**Delivery decision**: Single PR with `size:exception` (user-approved).

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Deps + schemas module + validateBody helper + proxyToBackend body option | PR 1 | Base: main. Pure infra — no route changes. Tests: schemas.test.ts + validation.test.ts |
| 2 | Validate login + register + forgot-password + their route tests | PR 2 | Base: PR 1. Covers BFF-SEC-01/02/03/06 for credential routes |
| 3 | Validate reset-password + change-password + create-password + profile PUT + their route tests | PR 3 | Base: PR 2. Covers BFF-SEC-01/05/06/07 for password/profile routes |
| 4 | Google credential fix (atomic) + next.config.ts header fix | PR 4 | Base: PR 3. Covers BFF-SEC-04/08/09. Must be atomic — client+BFF+e2e together |

---

## Phase 1: Foundation — Dependencies & Schemas (PR 1)

- [x] 1.1 [RED] Write `app/lib/auth/schemas.test.ts`: test all 9 schema shapes from BFF-SEC-01 (valid, missing required, wrong type, unknown field stripped). No mocks needed — pure zod. (Satisfies BFF-SEC-01, BFF-SEC-T1)
- [x] 1.2 Add `zod` to `package.json` dependencies via `pnpm add zod`. Verify `pnpm test:run` still passes.
- [x] 1.3 [GREEN] Create `app/lib/auth/schemas.ts`: export `loginSchema`, `registerSchema`, `forgotPasswordSchema`, `resetPasswordSchema`, `changePasswordSchema`, `createPasswordSchema`, `googleAuthSchema`, `linkGoogleSchema`, `updateProfileSchema`. Each with DTO parity inline comment (source DTO path + class). No `server-only`. (Satisfies BFF-SEC-01/T3)
- [x] 1.4 [RED] Write `app/lib/validation.test.ts`: test `validateBody` — valid body returns `{ok:true,data}` with unknown keys stripped, invalid body returns `{ok:false,response}` with status 400 and `{error,issues}` shape, malformed JSON returns `{ok:false,response}` with `{error:'invalid_request'}`. (Satisfies BFF-SEC-02)
- [x] 1.5 [GREEN] Create `app/lib/validation.ts`: export `validateBody(request: NextRequest, schema: ZodSchema)` returning discriminated union. Reads body once with `req.json()`. Catches JSON parse errors. Returns `NextResponse.json({error:'validation_failed',message:'Datos inválidos',fields:{...genericMsgs}}, {status:400})` on failure. No `server-only`. (Satisfies BFF-SEC-02/03)
- [x] 1.6 [RED] Write test asserting `proxyToBackend` called with `{body: parsed}` option passes that value as the serialized body (not re-reading `req.json()`). Add to `app/lib/bff-proxy.test.ts` if it exists, or create it.
- [x] 1.7 [GREEN] Add `body?: unknown` option to `ProxyOptions` interface in `app/lib/bff-proxy.ts`. In `proxyToBackend`, when `options.body !== undefined` skip `req.json()` and use `JSON.stringify(options.body)` as `body`. Keep legacy path (`req.json()`) when option is absent — backward compatible. (Satisfies ADR-003)

---

## Phase 2: Validate Auth Credential Routes (PR 2)

Depends on: Phase 1. Routes: login, register, forgot-password.

- [x] 2.1 [RED] Write `app/api/auth/login/route.test.ts`: cover all BFF-SEC-T2 scenarios — valid body forwards parsed object once; missing `email` → 400, no proxy call; missing `password` → 400; wrong type on `email` → 400; unknown field stripped before forward. Follow hoisted `vi.mock` + `vi.resetModules` + dynamic import pattern from `app/api/orders/[orderNumber]/route.test.ts`. (Satisfies BFF-SEC-01/02/03/T1/T2)
- [x] 2.2 [GREEN] Update `app/api/auth/login/route.ts`: replace manual field guard with `validateBody(req, loginSchema)`. On `!v.ok` return `v.response`. Call `backendFetch` with `v.data` as body. (Satisfies BFF-SEC-01/02/03)
- [x] 2.3 [RED] Write `app/api/auth/register/route.test.ts`: valid body; missing `first_name` → 400; missing `last_name` → 400; optional `phone` absent → 200; wrong type → 400; unknown field stripped. (Satisfies BFF-SEC-01/T2)
- [x] 2.4 [GREEN] Update `app/api/auth/register/route.ts`: replace manual guard with `validateBody(req, registerSchema)`. Forward `v.data` to `backendFetch`. (Satisfies BFF-SEC-01)
- [x] 2.5 [RED] Write `app/api/auth/forgot-password/route.test.ts`: valid email → proxy called once; invalid email → 400; 400 response body does NOT echo email value (generic error — BFF-SEC-T2 + ADR-004). (Satisfies BFF-SEC-01/02/03)
- [x] 2.6 [GREEN] Update `app/api/auth/forgot-password/route.ts`: add `validateBody(req, forgotPasswordSchema)` before `proxyToBackend`. Use `proxyToBackend(req, path, {body: v.data})`. (Satisfies BFF-SEC-01/03)

---

## Phase 3: Validate Password & Profile Routes (PR 3)

Depends on: Phase 2. Routes: reset-password, change-password, create-password, profile PUT.

- [x] 3.1 [RED] Write `app/api/auth/reset-password/route.test.ts`: valid `{token, new_password}` → proxy once; body with `password` instead of `new_password` → 400; 5-char `new_password` → 400; 6-char → 200. (Satisfies BFF-SEC-01/06/07/T2)
- [x] 3.2 [GREEN] Update `app/api/auth/reset-password/route.ts`: add `validateBody(req, resetPasswordSchema)`; forward `{body: v.data}`. (Satisfies BFF-SEC-01/07)
- [x] 3.3 [RED] Write `app/api/auth/change-password/route.test.ts`: valid `{current_password, new_password}` → proxy once; missing `current_password` → 400; 5-char `new_password` → 400. (Satisfies BFF-SEC-01/06/T2)
- [x] 3.4 [GREEN] Update `app/api/auth/change-password/route.ts`: add `validateBody(req, changePasswordSchema)`; forward `{body: v.data}`. (Satisfies BFF-SEC-01)
- [x] 3.5 [RED] Write `app/api/auth/create-password/route.test.ts`: valid `{password}` → proxy once; missing `password` → 400; 5-char → 400. (Satisfies BFF-SEC-01/06/T2)
- [x] 3.6 [GREEN] Update `app/api/auth/create-password/route.ts`: add `validateBody(req, createPasswordSchema)`; forward `{body: v.data}`. (Satisfies BFF-SEC-01)
- [x] 3.7 [RED] Write `app/api/auth/profile/route.test.ts`: empty body `{}` → PUT proxy called once; `{first_name:'Marco'}` → proxy called with exactly `{first_name:'Marco'}`; `{email:'not-email'}` → 400; GET passes through untouched. (Satisfies BFF-SEC-05/T2)
- [x] 3.8 [GREEN] Update `app/api/auth/profile/route.ts`: add `validateBody(req, updateProfileSchema)` only on PUT handler; forward `{body: v.data}`. GET handler unchanged. (Satisfies BFF-SEC-05)

---

## Phase 4: Google Credential Fix + Header Cleanup (PR 4 — Atomic)

Depends on: Phase 3. This phase is atomic — all tasks must land together.

- [x] 4.1 [RED] Write `app/api/auth/google/route.test.ts`: `{credential:'tok'}` → `backendFetch` called with `{credential:'tok'}`; `{id_token:'tok'}` → 400, `backendFetch` not called. (Satisfies BFF-SEC-04/T2)
- [x] 4.2 [GREEN] Update `app/api/auth/google/route.ts`: add `validateBody(req, googleAuthSchema)`. Replace `body.id_token` references with `v.data.credential`. Call `backendFetch` with `{credential: v.data.credential}`. (Satisfies BFF-SEC-04)
- [x] 4.3 [RED] Write `app/api/auth/link-google/route.test.ts`: `{credential:'tok'}` → `proxyToBackend` called with `{body:{credential:'tok'}}`; `{id_token:'tok'}` → 400. (Satisfies BFF-SEC-04/T2)
- [x] 4.4 [GREEN] Update `app/api/auth/link-google/route.ts`: add `validateBody(req, linkGoogleSchema)`; call `proxyToBackend(req, path, {authenticated:true, body:v.data})`. (Satisfies BFF-SEC-04)
- [x] 4.5 [GREEN] Update `app/lib/services/auth.service.ts`: rename `googleAuth(idToken)` method — change `{ id_token: idToken }` to `{ credential: idToken }` in POST body (L29-31). Same for `linkGoogle` (L83-85). No interface change — callers pass the Google credential string, only the wire key changes. (Satisfies BFF-SEC-04/ADR-006)
- [x] 4.6 [GREEN] Update `next.config.ts` L45: change `Referrer-Policy` value from `origin-when-cross-origin` to `strict-origin-when-cross-origin`. Leave `proxy.ts` UNCHANGED. (Satisfies BFF-SEC-08/ADR-005)
- [x] 4.7 [GREEN] Update `e2e/auth-bff.spec.ts` L65: change `id_token` to `credential` in google auth scenario. (Satisfies BFF-SEC-04/ADR-006)
- [x] 4.8 Run `pnpm test:run` — all tests green. Verify `proxy.ts` unchanged (no `X-Content-Type-Options` or `Referrer-Policy` removed). (Satisfies BFF-SEC-09/10)
