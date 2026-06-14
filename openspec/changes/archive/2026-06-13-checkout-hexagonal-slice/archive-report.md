# Archive Report: checkout-hexagonal-slice

**Change**: checkout-hexagonal-slice
**Status**: ARCHIVED
**Date**: 2026-06-13
**PR**: #36 (merged to main)
**Commits**: c78e22f (main) + 3be7e13 (W-002 fix)

---

## Executive Summary

Checkout hexagonal vertical slice (second pattern-setter after cart) successfully shipped with domain + application layers, coupon-disconnect bug fixed, and image_url parity restored. All 358 tests passing. 0 CRITICAL issues. Change archived with canonical specs created.

---

## What Shipped

### New Capabilities

1. **checkout-domain** (`features/checkout/domain/`):
   - CartSnapshot: readonly price-locked value object (items, subtotal, shipping, discount, total)
   - CheckoutFormData, CheckoutMode, CheckoutStep types
   - orderTotal(subtotal, discount, shipping): clamps to 0 on over-discount
   - isCheckoutReady(formData): validates 6 required shipping fields
   - missingShippingFields(formData): returns array of missing field names
   - sanitizePhone(value): removes non-digits, preserves leading +

2. **checkout-application** (`features/checkout/application/`):
   - toCartSnapshot(cartItems, discountAmount): maps cart items to immutable snapshot
   - toOrderPayload(snapshot, formData, couponCode?): assembles order with optional coupon
   - use-checkout-summary hook: reads store, delegates all arithmetic to domain

3. **Coupon-disconnect bug FIX** (cart store + CartDrawer + page):
   - Added appliedCoupon: string|null (default null)
   - Added discountAmount: number (default 0)
   - Added setCoupon(code, amount) and clearCoupon() actions
   - Removed local coupon state from CartDrawer; now reads/writes store
   - Checkout page reads coupon from store; includes coupon_code in payload; renders discount line
   - W-002: Added image_url?: string to CartSnapshot items (parity restored)

### Modified Capabilities

- **cart-application** (`features/cart/application/cart.store.ts`):
  - Added appliedCoupon, discountAmount fields (CART-A7)
  - Added setCoupon, clearCoupon actions
  - Explicit defaults in initializer (null, 0) for safe Zustand hydration with old persisted carts
  - Persist config remains bare — leverages Zustand's shallow merge

- **CartDrawer.tsx**: Local coupon state removed; reads/writes store (CART-A8)
- **app/checkout/page.tsx**: Minimal surgical edit (CART-A9)
  - Read appliedCoupon/discountAmount from store
  - Replace cartTotal with orderTotal(subtotal, discountAmount, shipping)
  - Pass couponCode to toOrderPayload
  - Add discount summary line

---

## Artifacts Archived

### Spec Artifacts (Observation IDs for Engram traceability)

| Artifact | Observation ID | Path |
|----------|---|---|
| Proposal | #945 | `sdd/checkout-hexagonal-slice/proposal` |
| Specification | #947 | `sdd/checkout-hexagonal-slice/spec` |
| Design | #946 | `sdd/checkout-hexagonal-slice/design` |
| Tasks | #949 | `sdd/checkout-hexagonal-slice/tasks` |
| Apply Progress | #950 | `sdd/checkout-hexagonal-slice/apply-progress` |
| Verify Report | #952 | `sdd/checkout-hexagonal-slice/verify-report` |
| Archive Report | TBD | `sdd/checkout-hexagonal-slice/archive-report` |

### Canonical Specs Created/Updated

1. **openspec/specs/checkout/spec.md** (NEW)
   - Canonical source of truth for checkout domain + application requirements (CHK-D1 through CHK-T4)
   - Documents cross-feature import rule (feature MAY import domain only, never application/store/ui)
   - Shipped evidence: PR #36, commits c78e22f + 3be7e13, 358 tests passing, 0 critical issues

2. **openspec/specs/cart/spec.md** (UPDATED)
   - Appended "Coupon State" section documenting CART-A7, CART-A8, CART-A9
   - Cart coupon fields (appliedCoupon, discountAmount, setCoupon, clearCoupon) with hydration safety
   - CartDrawer state migration and checkout page wiring
   - Preserved all existing cart spec content intact

---

## Test Results

| Category | Count | Status |
|----------|-------|--------|
| Total Tests | 358 | PASS |
| Pre-existing | 355 | PASS |
| New (W-002 fix batch) | 3 | PASS |
| TypeScript Errors | 0 | CLEAN |
| Domain Purity | — | PASS |
| Cross-Feature Boundaries | — | PASS |

### Key Test Coverage

- 14 domain tests (orderTotal clamp 4 cases, isCheckoutReady, missingShippingFields, sanitizePhone)
- 11 mapper tests (toCartSnapshot shape, toOrderPayload with coupon present/absent/empty-string)
- 3 cart store coupon tests (setCoupon, clearCoupon, hydration with missing fields)
- W-002: 2 image_url tests (presence/absence in snapshot items)

---

## Non-Blocking Findings from Verify Report

### WARNING

**W-001**: use-checkout-summary has no isolated unit test.
- Hook reads from useCartStore and delegates to domain functions.
- Logic implicitly covered by domain + mapper tests, but direct hook testing (renderHook) is absent.
- Design does not mandate hook test; this is a known gap.
- Regression in store selector usage would not be caught at unit level.

**W-002**: image_url no longer sent per item in order payload.
- Old inline payload included image_url; new CartSnapshot items shape does not include it.
- BFF schema marks image_url optional; Zod strips unknown fields — no runtime error.
- Functionality unaffected (backend schema confirms optional), but silent behavioral change.
- FIXED: image_url?: string added to CartSnapshot items (parity restored).

### SUGGESTION

**S-001**: handleSubmitShipping in checkout/page.tsx still uses inline required-field check instead of missingShippingFields domain function.
- Domain function exists and is tested.
- Duplication could be reduced by wiring it in the page; recommended for strangle slice.

**S-002**: Hydration test simulates Zustand's shallow merge manually rather than real hydration cycle.
- Simulation is semantically accurate per Zustand's actual implementation.
- Does not catch regression if Zustand changes merge strategy.
- Low risk (Zustand is stable); future improvement for integration test.

---

## Verification Verdict

**PASS** — 0 CRITICAL, 2 WARNING (W-001, W-002), 2 SUGGESTION (S-001, S-002)

All spec requirements satisfied. All 358 tests green. TypeScript clean. Coupon fix confirmed end-to-end. No strangle creep. Cross-feature and domain purity boundaries intact.

---

## Specs Synced

### New Canonical Spec

- **openspec/specs/checkout/spec.md**: Created
  - Domains: checkout-domain (NEW), checkout-application (NEW)
  - Requirements: CHK-D1 (types), CHK-R1-R4 (domain rules), CHK-A1-A3 (application), CHK-T1-T4 (tests)
  - Status: SHIPPED (PR #36, commits c78e22f + 3be7e13, 358 tests, PASS)

### Updated Canonical Spec

- **openspec/specs/cart/spec.md**: Cart coupon state section appended
  - Added CART-A7 (store coupon fields + actions)
  - Added CART-A8 (CartDrawer state migration)
  - Added CART-A9 (checkout coupon wiring)
  - All existing cart content preserved

---

## Deferred Items (Backlog)

| Topic | Why Deferred | Next Phase |
|---|---|---|
| Full 924-line app/checkout/page.tsx strangle | Too large for single slice; includes container-presentational extraction | Follow-up page-strangle slice |
| Container-presentational extraction for checkout | Architectural refactoring separate from domain build | Follow-up slice |
| Math.random() order-number bug | Page UI fix; part of strangle | Follow-up page-strangle slice |
| Card-payment Bricks frontend | Separate BFF + UI integration | Dedicated card-payment slice |
| use-checkout-form / use-checkout-submit full hooks | Dead code without page strangle consumer; API design premature | Strangle slice or dedicated hooks slice |
| Stock re-validation at checkout | Guard slice with backend reconciliation | Future guard slice |
| Price-snapshot enforcement beyond CartSnapshot | Transactional semantics beyond scope | Future advanced checkout slice |

---

## Rollback Boundary

Clean rollback is guaranteed:

1. Delete `features/checkout/` directory (entirely additive)
2. Restore `features/cart/application/cart.store.ts` (coupon fields default to null/0, backward compatible)
3. Restore `app/components/CartDrawer.tsx` (revert to local useState state)
4. Restore `app/checkout/page.tsx` (remove coupon read + orderTotal + discount line)
5. Delete canonical spec: `openspec/specs/checkout/spec.md`
6. Restore cart spec: `openspec/specs/cart/spec.md` (remove coupon-state section)

No data migration required. Persisted carts with new fields hydrate safely with explicit defaults.

---

## SDD Cycle Completion

**Phase Completion Status**:
- [x] Proposal (#945) — intent, scope, approach documented
- [x] Specification (#947) — CHK-*/CART-A* requirements formalized
- [x] Design (#946) — technical approach, architecture decisions, file changes
- [x] Tasks (#949) — work units, TDD phases, delivery forecast
- [x] Apply (#950) — 15/15 tasks completed, 358 tests passing, 7 commits
- [x] Verify (#952) — PASS verdict, 0 CRITICAL, 2 WARNING, 2 SUGGESTION
- [x] Archive (THIS REPORT) — specs synced, change archived, cycle closed

**Change is fully planned, implemented, verified, and archived. Ready for next change.**

---

## Files Created/Modified in Archive

### Filesystem (openspec/)

1. **openspec/specs/checkout/spec.md** (NEW) — canonical checkout spec
2. **openspec/specs/cart/spec.md** (MODIFIED) — appended coupon state section
3. **openspec/changes/checkout-hexagonal-slice/archive-report.md** (THIS FILE) — archive summary

### Engram (persistent memory)

- Observation #945: proposal
- Observation #947: spec
- Observation #946: design
- Observation #949: tasks
- Observation #950: apply-progress
- Observation #952: verify-report
- Observation TBD: archive-report (saved after this)

---

## Next Recommended

No follow-up required. Change is complete and closed.

If follow-up work is needed (page strangle, card-payment, hooks), each should start as a new `/sdd-new` change with its own proposal → spec → design → tasks → apply → verify → archive cycle.

---

**Status**: ARCHIVED
**Date Archived**: 2026-06-13
**Verified By**: sdd-verify (fresh context)
**Archived By**: sdd-archive (executor)
