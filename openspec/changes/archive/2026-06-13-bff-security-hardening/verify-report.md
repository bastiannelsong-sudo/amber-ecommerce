# Verify Report: BFF Security Hardening — Slice 1

**Change**: bff-security-hardening  
**Branch**: feat/bff-security-hardening (6 commits above main)  
**Verdict**: PASS  
**Status**: done  
**Date**: 2026-06-13  

---

## Executive Summary

0 CRITICAL, 0 WARNING, 1 SUGGESTION. All 10 spec requirements (BFF-SEC-01 through BFF-SEC-10) verified against actual code. Test suite: 168 pass / 24 fail (all 24 failures are pre-existing Zustand localStorage jsdom issues in auth.store.test.ts + cart.store.test.ts — zero new failures introduced). TypeScript: 0 errors.

---

## Spec Requirements Verified

| Req | Description | Result |
|-----|-------------|--------|
| BFF-SEC-01 | Zod schemas mirror backend DTOs exactly | PASS |
| BFF-SEC-02 | 400 response has `{ error, issues }` shape | PASS |
| BFF-SEC-03 | No backend call on validation failure | PASS |
| BFF-SEC-04 | Google/link-google use `credential` (not `id_token`) | PASS |
| BFF-SEC-05 | Profile PUT accepts empty `{}` body | PASS |
| BFF-SEC-06 | Password min(6), not stricter | PASS |
| BFF-SEC-07 | reset-password uses `new_password` field | PASS |
| BFF-SEC-08 | next.config.ts Referrer-Policy = strict-origin-when-cross-origin | PASS |
| BFF-SEC-09 | proxy.ts X-Content-Type-Options unchanged (not removed) | PASS |
| BFF-SEC-10 | CSP not in next.config.ts static headers | PASS |

---

## Critical Items — Independent Verification

### 1. Zod Schema Parity (BFF-SEC-01)

Verified `app/lib/auth/schemas.ts` line-by-line against id 872 (verified DTO contracts):

- `loginSchema`: `email` (string.email()) + `password` (string.min(1)) — correct
- `registerSchema`: `first_name`, `last_name`, `email`, `password` (min(6)), `phone?` (optional) — correct; `phone` present as optional
- `forgotPasswordSchema`: `email` only — correct
- `resetPasswordSchema`: `token` + `new_password` (min(6)) — correct; NOT `password`
- `changePasswordSchema`: `current_password` + `new_password` (min(6)) — correct
- `createPasswordSchema`: `password` (min(6)) — correct
- `googleAuthSchema`: `credential` (string.min(1)) — correct; NOT `id_token`
- `linkGoogleSchema`: `credential` (string.min(1)) — correct; NOT `id_token`
- `updateProfileSchema`: all 5 fields optional, email with `.email()` when present, empty `{}` valid — correct
- All schemas have BFF-SEC-T3 inline source comments pointing to amber-back DTO file + class

### 2. Validation Before Proxy (BFF-SEC-03)

Verified in all 9 route handlers. Pattern consistent across all:

```ts
const v = await validateBody(req, schema);
if (!v.ok) return v.response;   // <-- early return, no proxy call
// proxy call only reaches here when validation succeeds
```

### 3. proxyToBackend Body Seam (ADR-003)

`app/lib/bff-proxy.ts` lines 141-152: when `prevalidatedBody !== undefined`, uses `JSON.stringify(prevalidatedBody)` directly. The `req.json()` branch is only reached in the `else if (hasBody)` path. No double-read possible.

### 4. Google id_token → credential (BFF-SEC-04)

- `rg "id_token"` in all non-test, non-e2e TS source: **zero results**
- `auth.service.ts` L29-30: `{ credential: idToken }` (correct)
- `auth.service.ts` L83-84: `{ credential: idToken }` (correct)
- `google/route.ts`: sends `{ credential: v.data.credential }` to backendFetch
- `link-google/route.ts`: passes `v.data` (which is `{ credential }`) via `proxyToBackend body` option
- `AuthModal.tsx` L266: `authService.googleAuth(response.credential)` — unchanged, correct

### 5. Header Fix (BFF-SEC-08/09/10)

- `next.config.ts` L45: `Referrer-Policy: strict-origin-when-cross-origin` ✓
- `proxy.ts` (middleware) L154-155: sets `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin` — unchanged, still strong
- `next.config.ts`: CSP only appears in a comment explaining it was intentionally omitted (BFF-SEC-10 ✓)

### 6. Pre-existing Failures

`git diff main..feat/bff-security-hardening --name-only` does NOT include `auth.store.test.ts` or `cart.store.test.ts`. Both fail with `storage.setItem is not a function` — Zustand localStorage middleware incompatibility with jsdom. Entirely unrelated to this change.

### 7. TypeScript

`npx tsc --noEmit` → **0 errors**

### 8. TDD Evidence

- All 12 test files use hoisted `vi.mock` + `vi.resetModules()` + `vi.clearAllMocks()` + dynamic `import()` in `beforeEach` — matching the established pattern from `app/api/orders/[orderNumber]/route.test.ts`
- Assertions are non-trivial: valid body verifies `backendFetch` called exactly once with the exact parsed object; invalid bodies verify zero proxy calls; unknown fields verify they are absent from the forwarded payload
- forgot-password test explicitly asserts 400 body does NOT contain the submitted email value (ADR-004 — no email-existence leak)
- googleAuth test asserts forwarded body contains `credential` and NOT `id_token`

---

## Findings

### SUGGESTION (1)

**`null` as `options.body` sends `"null"` string body** — `bff-proxy.ts`: since `null !== undefined`, passing `body: null` enters the pre-validated branch and calls `JSON.stringify(null)` = `"null"` as the HTTP body. This is documented and tested (`bff-proxy.test.ts` L85-98), but is a footgun if a future caller passes `body: null` expecting "no body" semantics. No spec violation. Recommendation: document in JSDoc that `undefined` (omit the option) means "no body" and `null` is a valid JSON null payload.

---

## Test Results

| Metric | Value |
|--------|-------|
| Test runner | vitest v3.2.4 via `pnpm test:run` |
| Total tests | 192 |
| Passed | 168 |
| Failed | 24 (pre-existing) |
| New test files | 12 |
| TypeScript errors | 0 |

**Pre-existing failures** (confirmed unrelated): `auth.store.test.ts` × 5, `cart.store.test.ts` × 19. Error: `storage.setItem is not a function` in Zustand localStorage middleware under jsdom.

---

## Recommendation

**next_recommended: sdd-archive** — implementation is clean, spec-compliant, and zero new regressions. Ready to merge.
