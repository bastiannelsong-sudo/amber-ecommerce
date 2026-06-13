# Archive Report: BFF Security Hardening — Slice 1

**Change**: `bff-security-hardening`
**Status**: ARCHIVED
**Archive Date**: 2026-06-13
**Verdict**: PASSED (Verification: 0 CRITICAL, 0 WARNING, 1 SUGGESTION)

---

## Executive Summary

The BFF Security Hardening slice 1 has been successfully completed, verified (PASS), merged to main (PR #31, squash commit 93c7ad3), and is now archived. This slice delivered zod-based input validation on 9 auth route handlers in the Next.js BFF, fixed a production bug in Google login (id_token → credential field), and tightened security header hygiene. All 28 implementation tasks passed Strict TDD (RED → GREEN), 168 tests green, TypeScript clean, spec fully satisfied.

---

## Scope Delivered

### Auth Route Input Validation (zod)

- **Helper module**: `app/lib/validation.ts` — `validateBody()` discriminated union helper. Reads body once, returns `{ok:true, data}` or `{ok:false, response:NextResponse}` with structured 400 error.
- **Schemas module**: `app/lib/auth/schemas.ts` — 9 zod schemas (loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema, createPasswordSchema, googleAuthSchema, linkGoogleSchema, updateProfileSchema) mirroring verified amber-back DTOs with parity annotations.
- **Proxy seam**: Modified `app/lib/bff-proxy.ts` — Added `body?: unknown` option to `ProxyOptions` interface. Enables pre-validated bodies to bypass `req.json()` re-read (NextRequest body is one-shot).
- **9 Auth routes updated**:
  - `app/api/auth/login/route.ts` — validate via loginSchema
  - `app/api/auth/register/route.ts` — validate via registerSchema
  - `app/api/auth/forgot-password/route.ts` — validate via forgotPasswordSchema
  - `app/api/auth/reset-password/route.ts` — validate via resetPasswordSchema, enforce new_password field (not password)
  - `app/api/auth/change-password/route.ts` — validate via changePasswordSchema
  - `app/api/auth/create-password/route.ts` — validate via createPasswordSchema
  - `app/api/auth/profile/route.ts` — validate PUT only via updateProfileSchema (all-optional)
  - `app/api/auth/google/route.ts` — validate via googleAuthSchema, fix credential field
  - `app/api/auth/link-google/route.ts` — validate via linkGoogleSchema, fix credential field

### Production Bug Fix: Google Login

- **Root cause**: GoogleAuthDto on backend uses `credential`, but BFF handlers sent `id_token`. Backend StrictValidationPipe rejected every google/link-google request (400 error).
- **Fix**:
  - Updated `app/lib/services/auth.service.ts`: changed wire field from `{id_token}` to `{credential}` in googleAuth() and linkGoogle() methods (L29-31, L83-85).
  - Updated `app/api/auth/google/route.ts`: validate credential field, forward parsed credential to backendFetch.
  - Updated `app/api/auth/link-google/route.ts`: validate credential field, forward via proxyToBackend({body}).
  - Updated `e2e/auth-bff.spec.ts` L65: changed test scenario to use credential field.
  - Verified: zero occurrences of id_token in non-test source code after merge.

### Security Header Cleanup

- **next.config.ts L45**: Changed Referrer-Policy from `origin-when-cross-origin` (weak) to `strict-origin-when-cross-origin` (strong, matches proxy.ts).
- **proxy.ts**: Left UNCHANGED (already sets both headers correctly; CSP nonce stays in proxy.ts only).
- **Result**: Single authoritative Referrer-Policy and X-Content-Type-Options per response type.

### Test Coverage

- **Test files created**: 12 new test files (schemas.test.ts, validation.test.ts, bff-proxy.test.ts, 9 route tests).
- **Test count**: 168 passing tests across 17 test files. All BFF security tests green.
- **Pre-existing failures**: 24 tests in auth.store.test.ts + cart.store.test.ts (Zustand localStorage jsdom issue — unrelated to this change, pre-existed).
- **TypeScript**: 0 errors (npx tsc --noEmit).

---

## Spec Requirements Satisfied

All 10 requirements from the canonical spec satisfied and verified independently:

| Requirement | Domain | Status | Evidence |
|-------------|--------|--------|----------|
| BFF-SEC-01 | Auth Validation | PASS | All 9 schemas mirror backend DTOs exactly; parity annotations in code |
| BFF-SEC-02 | Auth Validation | PASS | 400 responses have `{error, issues}` shape; Content-Type: application/json |
| BFF-SEC-03 | Auth Validation | PASS | All route tests assert zero proxy calls on validation failure |
| BFF-SEC-04 | Auth Validation | PASS | Google/link-google use credential field; no id_token in source |
| BFF-SEC-05 | Auth Validation | PASS | profile PUT accepts empty {} body; partial updates tested |
| BFF-SEC-06 | Auth Validation | PASS | Password min(6); 5-char passwords rejected in tests |
| BFF-SEC-07 | Auth Validation | PASS | reset-password uses new_password field; password field rejected |
| BFF-SEC-08 | Security Headers | PASS | next.config.ts Referrer-Policy = strict-origin-when-cross-origin |
| BFF-SEC-09 | Security Headers | PASS | Single X-Content-Type-Options header; proxy.ts unchanged (not removed) |
| BFF-SEC-10 | Security Headers | PASS | CSP not in next.config.ts static headers; stays in proxy.ts |

---

## Artifact Traceability (Engram IDs)

| Artifact | Engram Topic Key | Observation ID | Purpose |
|----------|------------------|----------------|---------|
| Proposal | sdd/bff-security-hardening/proposal | #875 | Scope, deliverables, rationale |
| Spec | sdd/bff-security-hardening/spec | #877 | Requirements, testing contract, invariants |
| Design | sdd/bff-security-hardening/design | #878 | ADRs, architecture decisions, seams |
| Tasks | sdd/bff-security-hardening/tasks | #882 | 28 tasks, 4 phases, work unit breakdown |
| Apply Progress | sdd/bff-security-hardening/apply-progress | #886 | TDD cycle evidence, commits, file changes |
| Verify Report | sdd/bff-security-hardening/verify-report | #888 | PASS verdict, all 10 specs verified, 0C/0W/1S |
| State | sdd/bff-security-hardening/state | #891 | PR #31 merged status, deferred follow-ups |

---

## PR and Commit Details

- **PR**: GitHub PR #31 on amber-ecommerce (bastiannelsong-sudo)
- **Title**: `feat(bff-security): zod validation on auth routes + fix Google login (size:exception)`
- **Base**: main
- **Branch**: feat/bff-security-hardening
- **Status**: MERGED (squash commit 93c7ad3)
- **Labels**: `size:exception`, `security`
- **Commits** (6 work-unit commits, then squashed to 93c7ad3):
  1. chore(sdd): add BFF security hardening planning artifacts
  2. feat(bff-security): add zod schemas, validateBody helper, and proxyToBackend body option
  3. feat(bff-security): validate login, register, forgot-password routes with zod
  4. feat(bff-security): validate reset-password, change-password, create-password, profile routes
  5. fix(bff-security): fix Google credential field and tighten Referrer-Policy header
  6. chore(sdd): mark all 28 tasks complete in tasks.md

---

## Files Changed (28 total)

### New Files (12 test files + 3 modules)

| File | Lines | Description |
|------|-------|-------------|
| app/lib/auth/schemas.ts | 80 | 9 zod schemas (new capability) |
| app/lib/auth/schemas.test.ts | 200 | 45 tests for schema validation |
| app/lib/validation.ts | 45 | validateBody() helper |
| app/lib/validation.test.ts | 140 | 7 tests for helper |
| app/lib/bff-proxy.test.ts | 120 | 3 tests for body option |
| app/api/auth/login/route.test.ts | 160 | 8 tests |
| app/api/auth/register/route.test.ts | 180 | 9 tests |
| app/api/auth/forgot-password/route.test.ts | 130 | 5 tests |
| app/api/auth/reset-password/route.test.ts | 170 | 7 tests |
| app/api/auth/change-password/route.test.ts | 150 | 6 tests |
| app/api/auth/create-password/route.test.ts | 110 | 5 tests |
| app/api/auth/profile/route.test.ts | 140 | 6 tests |
| app/api/auth/google/route.test.ts | 160 | 5 tests |
| app/api/auth/link-google/route.test.ts | 120 | 3 tests |
| e2e/auth-bff.spec.ts | +1 test scenario | google credential scenario |

### Modified Files (11)

| File | Change | Lines |
|------|--------|-------|
| app/lib/bff-proxy.ts | Added body? option to ProxyOptions + conditional handling | +15 |
| app/api/auth/login/route.ts | Replace manual guard with validateBody(req, loginSchema) | +5/-8 |
| app/api/auth/register/route.ts | Replace manual guard with validateBody(req, registerSchema) | +5/-8 |
| app/api/auth/forgot-password/route.ts | Add validateBody before proxyToBackend | +4/-2 |
| app/api/auth/reset-password/route.ts | Add validateBody with new_password field | +4/-2 |
| app/api/auth/change-password/route.ts | Add validateBody | +4/-2 |
| app/api/auth/create-password/route.ts | Add validateBody | +4/-2 |
| app/api/auth/profile/route.ts | Add validateBody on PUT only | +4/-0 |
| app/api/auth/google/route.ts | Validate + credential field fix | +8/-4 |
| app/api/auth/link-google/route.ts | Validate + credential field + proxyToBackend body | +8/-2 |
| app/lib/services/auth.service.ts | id_token → credential in googleAuth/linkGoogle | +2/-2 |
| next.config.ts | Referrer-Policy: origin-when-cross-origin → strict-origin-when-cross-origin | +0/-1, +1 |
| package.json + pnpm-lock.yaml | Added zod dependency | +2 |

**Total Changed Lines**: ~520–640 (additions + deletions), consistent with forecast in tasks.

---

## Discovery & Learnings

### Production Bug Reconciliation
Google login was broken in production before this slice. The backend GoogleAuthDto specifies `credential`, but BFF and client sent `id_token`. The StrictValidationPipe on the backend rejected all requests. This slice fixed the chain atomically: client already sends credential in response; BFF now forwards it correctly; backend accepts it. The bug was hidden by incomplete pre-SDD documentation (requerimientos/13 still documents id_token).

### validateBody Seam Pattern
The `body?: unknown` option on proxyToBackend avoids re-reading the NextRequest body (one-shot constraint). This is cleaner than switching proxies or double-reading. Backward compatible — callers that don't use the option still call req.json() as before.

### Zustand localStorage jsdom Issue
24 pre-existing test failures in auth.store.test.ts + cart.store.test.ts are Zustand localStorage middleware trying to call storage.setItem() in jsdom (not available). This is orthogonal to BFF security and should be addressed in a separate PR.

### vi.clearAllMocks() Required with vi.resetModules()
When using vi.resetModules() + dynamic import() in beforeEach for mock resets, mock call counts accumulate unless vi.clearAllMocks() is also called. Pattern established across all new route tests: pair them together.

---

## Deferred Follow-ups (Backlog)

Per original scope and user decision:

1. **Rate limiting on auth routes** (future slice): Upstash distributed or AWS WAF decision needed. In-memory rejected for ECS multi-instance.
2. **zod validation on non-auth routes** (future slice): orders, addresses, reviews, coupons, contact routes.
3. **Fix Zustand localStorage jsdom failures** (separate PR): auth.store.test.ts + cart.store.test.ts, 24 tests. Not related to BFF security.
4. **Stricter password policy** (future slice): Backend currently min(6); policy decision needed before raising.
5. **Doc debt** (low priority): requerimientos/13-autenticacion-ecommerce.md still references id_token wire field — update to credential.

---

## Archival Actions Completed

1. **Canonical spec created**: `openspec/specs/bff-security/spec.md` — delta spec merged into main spec location (first canonical spec for this domain).
2. **Change folder archived**: moved to `openspec/changes/archive/2026-06-13-bff-security-hardening/` with all planning artifacts.
3. **Archive report written**: this report summarizes what shipped, PR details, spec satisfaction, and traceability.
4. **Engram archive report saved**: topic_key `sdd/bff-security-hardening/archive-report` with all observation IDs for cross-session recovery.

---

## Next Recommended

**None** — this change is complete and archived. The next SDD effort should be a new `/sdd-new` for the next planned slice (rate limiting, non-auth route validation, or other priority). Deferred follow-ups are backlog items, not blocking.

---

## Sign-off

- **Spec Verdict**: PASS (all 10 requirements satisfied)
- **Test Verdict**: PASS (168 passing, 0 new failures)
- **TypeScript**: PASS (0 errors)
- **Archive Status**: COMPLETE
- **Date Archived**: 2026-06-13
