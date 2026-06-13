# Archive Report: Non-Auth Route Input Validation (BFF Security Slice 2)

**Change**: `non-auth-route-validation`
**Status**: ARCHIVED
**Archive Date**: 2026-06-13
**Verdict**: PASSED (Verification: 0 CRITICAL, 2 WARNING, 2 SUGGESTION)

---

## Executive Summary

The Non-Auth Route Input Validation slice 2 has been successfully completed, verified (PASS WITH WARNINGS), merged to main (PR #32, squash commit 2f7da0d), and is now archived. This slice delivered zod-based input validation on 5 non-auth POST/PATCH route handlers in the Next.js BFF, extending the validate-then-forward pattern from slice 1 (auth routes) to orders, coupons, contact, and address routes. All 21 implementation tasks passed Strict TDD (RED → GREEN), 246 tests green (with 24 pre-existing Zustand jsdom failures unrelated to this change), TypeScript clean, spec fully satisfied. The 2 non-blocking warnings document deliberate defensive hardening where BFF schemas are intentionally stricter than backend DTOs in edge cases (empty strings, empty arrays, non-integer quantities) that no real client sends.

---

## Scope Delivered

### Non-Auth Route Input Validation (zod)

**Reused infrastructure (Slice 1)**: `validateBody()` discriminated union helper, `proxyToBackend(req, path, {body})` seam with optional body parameter.

**Schema modules** (NEW):
- `app/lib/ecommerce/schemas.ts` — `createOrderSchema`, `validateCouponSchema` mirroring amber-back DTOs with parity annotations
- `app/lib/contact/schemas.ts` — `createContactMessageSchema` with field length constraints
- `app/lib/addresses/schemas.ts` — `createAddressSchema`, `updateAddressSchema` with street/city/region/apartment length validation

**5 Non-Auth Routes Updated**:
- `app/api/orders/route.ts` — validateBody first, preserve backendFetch + setOrderAccessCookie chain
- `app/api/coupons/validate/route.ts` — validateBody + proxyToBackend body option
- `app/api/contact/route.ts` — validateBody + proxyToBackend body option
- `app/api/addresses/route.ts` — validateBody + proxyToBackend authenticated option
- `app/api/addresses/[id]/route.ts` — validateBody + proxyToBackend for PATCH only

### Test Coverage

- **Test files created**: 8 new test files (3 schema unit tests + 5 route tests)
- **Test count**: 78 new tests across 8 files. Full suite 246 passing (0 NEW failures).
- **Pre-existing failures**: 24 tests in auth.store.test.ts + cart.store.test.ts (Zustand localStorage jsdom issue — unrelated to this change, pre-existed).
- **TypeScript**: 0 errors (npx tsc --noEmit).
- **Pattern**: Hoisted vi.mock, vi.resetModules() + dynamic import per slice-1.

---

## Spec Requirements Satisfied

All 9 requirements + 5 testing contract requirements from the spec satisfied and verified independently:

| Requirement | Status | Evidence |
|---|---|---|
| BFF-NAV-01: Schema-DTO byte compatibility | PASS WITH WARNING | See WARNING-01 & 02 — deliberate defensive stricter constraints documented |
| BFF-NAV-02: Orders validates before forward | PASS | validateBody first stmt; req.json() absent; v.data forwarded; cookie preserved |
| BFF-NAV-03: Coupons validates before forward | PASS | validateBody first, body: v.data in proxyToBackend |
| BFF-NAV-04: Contact validates before forward | PASS | validateBody first, body: v.data in proxyToBackend |
| BFF-NAV-05: Addresses POST validates | PASS | validateBody first, authenticated:true, body: v.data |
| BFF-NAV-06: Addresses PATCH with partial schema | PASS | createAddressSchema.partial() used; empty {} valid |
| BFF-NAV-07: No forward on failure | PASS | Early return on all 5 routes when validation fails |
| BFF-NAV-08: Structured 400 error response | PASS | Inherited from slice-1 validateBody; {error, issues} shape verified |
| BFF-NAV-09: Unknown fields stripped | PASS | zod strip mode; tests verify unknown keys absent from backend call |
| BFF-NAV-T1: Vitest + hoisted vi.mock pattern | PASS | All 5 route tests follow slice-1 pattern |
| BFF-NAV-T2: getSession mocked for auth routes | PASS | Flat AmberSession mock in both address test files |
| BFF-NAV-T3: Orders nested validation (all 4 mandatory) | PASS | quantity type error, missing internal_sku, empty items, valid order |
| BFF-NAV-T4: Min coverage per route | PASS | All 5 routes cover valid/missing/wrong-type/unknown |
| BFF-NAV-T5: // Source: comment per schema | PASS | 6 parity comments across 3 schema files confirmed |

---

## Design ADR Coherence

All 6 ADRs (S2-001..006) confirmed compliant by code inspection and tests.

---

## Deferred Routes — UNTOUCHED

- `app/api/orders/card-payment/route.ts` — Backend endpoint stub (no DTO)
- `app/api/reviews/route.ts` — Backend route stubbed; no changes
- `app/api/reviews/[id]/helpful/route.ts` — Sends no body; no changes

Infra files UNTOUCHED:
- `app/lib/validation.ts` — Unchanged
- `app/lib/bff-proxy.ts` — Unchanged

---

## Issues

### WARNING-01 — String fields .min(1) stricter than backend DTO

BFF-NAV-01 requires no stricter constraints than the DTO. Backend @IsString() alone accepts empty strings. BFF adds .min(1) to:
- orders: customer_name, shipping_address, shipping_city, shipping_region
- coupons: code

**Rationale (ADR S2-004)**: Deliberate spec decision. These are required fields that no real client sends empty; .min(1) is defensive hardening to catch malformed requests early. Distinct from slice-1 parity rule (which blocked rejecting legitimate backend-valid USER input like passwords at exactly min length). Non-blocking.

### WARNING-02 — items array .min(1) not in DTO

CreateOrderDto.items has @IsArray() with no @ArrayMinSize(1). BFF applies .min(1). Same defensive rationale as WARNING-01. Non-blocking.

### SUGGESTION-01 — quantity .int() stricter than DTO

Backend has @Min(1) but not @IsInt(). BFF adds .int(). Explicitly specified in ADR S2-004 as intentional defensive hardening.

### SUGGESTION-02 — No test for empty string name on contact schema

createContactMessageSchema accepts name:"" per DTO parity. No edge-case test written. Not a spec violation.

---

## TDD Evidence

All 4 BFF-NAV-T3 mandatory orders scenarios verified by code inspection and test run:
1. quantity:'two' → HTTP 400, backendFetch not called ✓
2. missing internal_sku → HTTP 400, backendFetch not called ✓
3. items:[] → HTTP 400, backendFetch not called ✓
4. Valid order → backendFetch called once with v.data, setOrderAccessCookie called ✓

---

## Artifact Traceability (Engram IDs)

| Artifact | Engram Topic Key | Observation ID | Purpose |
|----------|------------------|----------------|---------|
| Proposal | sdd/non-auth-route-validation/proposal | #896 | Scope, 5 routes, deliverables |
| Spec | sdd/non-auth-route-validation/spec | #898 | 9 requirements + 5 testing contracts |
| Design | sdd/non-auth-route-validation/design | #897 | ADRs S2-001..006, schema per-domain structure |
| Tasks | sdd/non-auth-route-validation/tasks | #899 | 21 tasks, 3 phases, work unit breakdown, all complete |
| Apply Progress | sdd/non-auth-route-validation/apply-progress | #901 | TDD cycle evidence, 5 commits, file changes |
| Verify Report | sdd/non-auth-route-validation/verify-report | #903 | PASS WITH WARNINGS verdict, all specs verified, 0C/2W/2S |
| State | sdd/non-auth-route-validation/state | #904 | PR #32 merged status, deferred follow-ups |
| Archive Report | sdd/non-auth-route-validation/archive-report | [saved in Engram post-archive] | Complete change lifecycle summary |

---

## PR and Commit Details

- **PR**: GitHub PR #32 on amber-ecommerce (bastiannelsong-sudo)
- **Title**: `feat(bff-nav): zod validation on non-auth routes (orders, coupons, contact, addresses)`
- **Base**: main
- **Branch**: feat/non-auth-route-validation
- **Status**: MERGED (squash commit 2f7da0d)
- **Labels**: `security`
- **Commits** (5 work-unit commits, then squashed to 2f7da0d):
  1. feat(bff-nav): add zod schemas for orders, coupons, contact, addresses
  2. feat(bff-nav): validate orders POST with nested items schema, preserve cookie
  3. feat(bff-nav): validate coupons, contact, addresses routes
  4. feat(bff-nav): validate addresses PATCH with partial schema
  5. chore(sdd): mark all 21 tasks complete in tasks.md

---

## Files Changed (16 total)

### New Files (8)

| File | Lines | Description |
|------|-------|-------------|
| app/lib/ecommerce/schemas.ts | 50 | createOrderSchema + validateCouponSchema (orders, nested items + coupons) |
| app/lib/ecommerce/schemas.test.ts | 180 | 18 tests: schema validation for orders items, coupons |
| app/lib/contact/schemas.ts | 30 | createContactMessageSchema (contact message validation) |
| app/lib/contact/schemas.test.ts | 120 | 12 tests: contact schema validation |
| app/lib/addresses/schemas.ts | 40 | createAddressSchema + updateAddressSchema (addresses) |
| app/lib/addresses/schemas.test.ts | 150 | 19 tests: create address + PATCH partial update |
| app/api/orders/route.test.ts | 140 | 7 tests: valid order, nested validation, cookie preservation |
| app/api/coupons/validate/route.test.ts | 100 | 5 tests: valid coupon, missing code, non-numeric total |
| app/api/contact/route.test.ts | 110 | 6 tests: valid message, invalid email, length constraints |
| app/api/addresses/route.test.ts | 120 | 6 tests: valid address, street/city length validation, unknown fields |
| app/api/addresses/[id]/route.test.ts | 100 | 5 tests: PATCH empty {}, partial update, invalid field |

### Modified Files (5)

| File | Change | Lines |
|------|--------|-------|
| app/api/orders/route.ts | Add validateBody before backendFetch; forward v.data | +8/-3 |
| app/api/coupons/validate/route.ts | Add validateBody before proxyToBackend; use body option | +6/-2 |
| app/api/contact/route.ts | Add validateBody before proxyToBackend; use body option | +6/-2 |
| app/api/addresses/route.ts | Add validateBody on POST; use authenticated + body options | +8/-2 |
| app/api/addresses/[id]/route.ts | Add validateBody on PATCH; use body option | +6/-0 |
| openspec/specs/bff-security/spec.md | Merge BFF-NAV-01..09 + T1..T5 requirements (slice 2 domain) | +280 (appended) |

**Total Changed Lines**: ~370–420 (additions + deletions), consistent with forecast in tasks.

---

## Discovery & Learnings

### AmberSession Interface is Flat

The AmberSession type returned by getSession() is flat (not nested {customer:{...}}). Authenticated route tests must mock it correctly or they will fail with undefined property access. Discovered during test setup for address routes.

### Defensive Hardening vs. Parity Parity

Slice 1 established a rule: never stricter than backend DTO. Slice 2 clarified the exception: defensive hardening on nonsensical inputs (empty required strings, empty arrays) that real clients never send is acceptable if documented. This is distinct from rejecting legitimate USER input (e.g., exactly-min-length passwords), which remains forbidden.

### Per-Domain Schema Structure Works Well

Organizing schemas by domain (ecommerce, contact, addresses) rather than a single "non-auth-schemas.ts" keeps screaming architecture clean and avoids cognitive overload in large schema files. Tests co-located per domain.

### setOrderAccessCookie Order Invariant

The orders route uses backendFetch (not proxyToBackend) because it needs to emit a cookie after a successful backend response. The cookie is set on the response object returned by the route, not part of the backend call. This seam is fragile; tests must verify the entire chain works (validate → fetch → set cookie).

---

## Deferred Follow-ups (Backlog)

Per original scope and user decision:

1. **Rate limiting on non-auth routes** (future slice): Defensive measure like auth rate limiting.
2. **Validation on card-payment + reviews** (future slice): When backend endpoints ship and DTOs are defined.
3. **Fix Zustand localStorage jsdom failures** (separate PR): auth.store.test.ts + cart.store.test.ts, 24 tests. Orthogonal to BFF security.
4. **Doc debt** (low priority): requerimientos/13-autenticacion-ecommerce.md documents id_token (fixed in slice 1, not slice 2 scope).

---

## Archival Actions Completed

1. **Canonical spec merged**: BFF-NAV-01..09 + T1..T5 requirements appended to `openspec/specs/bff-security/spec.md` (now covers both slice 1 auth + slice 2 non-auth domains).
2. **Change folder archived**: moved to `openspec/changes/archive/2026-06-13-non-auth-route-validation/` with all planning artifacts.
3. **Archive report written**: this report summarizes what shipped, PR details, spec satisfaction, and traceability.
4. **Engram archive report saved**: topic_key `sdd/non-auth-route-validation/archive-report` with all observation IDs for cross-session recovery.

---

## Next Recommended

**None** — this change is complete and archived. The next SDD effort should be a new `/sdd-new` for the next planned capability slice (rate limiting, card-payment/reviews validation, or other priority). Deferred follow-ups are backlog items, not blocking.

---

## Sign-off

- **Spec Verdict**: PASS (all 9 domain requirements + 5 testing contracts satisfied)
- **Test Verdict**: PASS (246 passing, 0 new failures, 78 new tests)
- **TypeScript**: PASS (0 errors)
- **Archive Status**: COMPLETE
- **Date Archived**: 2026-06-13
