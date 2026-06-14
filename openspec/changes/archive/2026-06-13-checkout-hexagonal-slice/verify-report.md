# Verify Report: checkout-hexagonal-slice

**Change**: checkout-hexagonal-slice
**Branch**: feat/checkout-hexagonal-slice (7 commits)
**Date**: 2026-06-13
**Verifier**: sdd-verify (adversarial, fresh context)
**Mode**: Strict TDD
**Verdict**: PASS

---

## Test & Build Evidence

| Command | Result |
|---------|--------|
| `pnpm test:run` | 355/355 passed, 0 failed, 33 test files |
| `npx tsc --noEmit` | 0 errors |
| New tests added | 28 (14 domain + 11 mapper + 3 store coupon) |
| Pre-existing tests | 327 — all still green |

---

## Task Completeness

| Phase | Tasks | Status |
|-------|-------|--------|
| Phase 1: Domain Foundation | 1.1, 1.2, 1.3 | All [x] complete |
| Phase 2: Application Layer | 2.1, 2.2, 2.3 | All [x] complete |
| Phase 3: Cart Store Coupon | 3.1, 3.2 | All [x] complete |
| Phase 4: CartDrawer Migration | 4.1 | [x] complete |
| Phase 5: Checkout Page Wiring | 5.1 | [x] complete |
| Phase 6: Cross-cutting Verification | 6.1, 6.2, 6.3 | All [x] complete |

**13/13 tasks complete.**

---

## Domain Purity Check (CHK-T1, 6.3)

`rg 'from.*(react|zustand|next)' features/checkout/domain/` → **empty (PASS)**

`features/checkout/domain/checkout.rules.ts` imports only `./checkout.types` (same domain).  
`features/checkout/domain/checkout.types.ts` has zero imports.

---

## Cross-Feature Boundary Check (6.2)

`rg 'from.*features/cart/(application|store|ui)' features/checkout/` → **empty (PASS)**

`features/checkout/application/use-checkout-summary.ts` imports `useCartStore` via `@/app/lib/stores/cart.store` (the established shim from CART-A2), NOT via `features/cart/application/cart.store` directly. This does not violate the cross-feature rule.

---

## Spec Compliance Matrix

| Requirement | Implementation | Tests | Status |
|-------------|---------------|-------|--------|
| CHK-D1: CartSnapshot readonly | All fields + items array readonly | TypeScript compile guard | PASS |
| CHK-D1: CheckoutMode | `'guest' \| 'authenticated'` | type-level | PASS |
| CHK-D1: CheckoutStep | `'shipping' \| 'payment' \| 'confirmation'` | type-level | PASS |
| CHK-R1: orderTotal clamp | `Math.max(0, subtotal - discount + shipping)` | 4 cases (2 clamp boundaries) | PASS |
| CHK-R2: isCheckoutReady | All 6 required fields checked | 4 tests | PASS |
| CHK-R3: missingShippingFields | Returns missing field names array | 3 tests | PASS |
| CHK-R4: sanitizePhone | Leading +, removes non-digits | 3 tests | PASS |
| CHK-T2: 3 clamp boundary tests | Under/equal/over all present (4 total) | 3+ separate `it()` blocks | PASS |
| CHK-A1: toCartSnapshot | Correct shape, unit_price←product.price LOCKED | 5 tests | PASS |
| CHK-A2: toOrderPayload coupon | present/absent/null/empty-string cases | 4 tests | PASS |
| CHK-A3: use-checkout-summary | Reads store, zero arithmetic in hook body | no isolated test | PASS (acknowledged) |
| CART-A7: Store coupon state | appliedCoupon+discountAmount+setCoupon+clearCoupon | 3 tests | PASS |
| CART-A7: Hydration safety | Explicit defaults in initializer, bare persist | hydration simulation test | PASS |
| CART-A8: CartDrawer migration | Local useState removed, reads/writes store | diff + tsc | PASS |
| CART-A9: Coupon wired through checkout | coupon_code in payload; discount line rendered | code + diff confirmed | PASS |
| CHK-T3: Mapper tests | toCartSnapshot + toOrderPayload coupon present/absent | 11 tests | PASS |
| CHK-T4: Store coupon tests + hydration | setCoupon/clearCoupon/hydration | 3 tests | PASS |

---

## Coupon Fix End-to-End Confirmation (CART-A9)

**Before this fix:** coupon applied in CartDrawer stored in ephemeral local React state — lost on drawer close/navigation — checkout page blind, backend receives no `coupon_code`.

**After this fix (verified at code level):**

1. `features/cart/application/cart.store.ts`: `appliedCoupon: null as string | null` and `discountAmount: 0` added with explicit initializer defaults. `setCoupon` and `clearCoupon` actions added. Persist config remains bare `{ name: 'amber-cart-storage' }` — Zustand's shallow merge correctly fills missing keys from defaults on old persisted carts (no migration needed).

2. `app/components/CartDrawer.tsx`: `useState` for discount/appliedCoupon REMOVED. Now reads store; wires `onApply={(amt, code) => setCoupon(code, amt)}` and `onRemove={() => clearCoupon()}`.

3. `app/checkout/page.tsx` (3 surgical changes only):
   - Reads `appliedCoupon` and `discountAmount` from store.
   - `total = orderTotal(subtotal, discountAmount, shipping)` — discount factored in.
   - `toOrderPayload(snapshot, checkoutFormData, appliedCoupon)` — `coupon_code` now in API payload.
   - Discount line rendered in sidebar when `discountAmount > 0`.

---

## Hard Boundary Compliance

`git diff main..HEAD -- app/checkout/page.tsx` — **44 changed lines (+24/-20)**. No strangle: step logic, form, payment flow, geo loading, address picker all untouched. Only the 3 coupon-wiring changes as specified.

Deferred items confirmed NOT built: `use-checkout-form`, `use-checkout-submit`, page strangle, container-presentational extraction, Math.random() fix.

---

## Issues

### CRITICAL
None.

### WARNING

**W-001**: `use-checkout-summary` has no isolated unit test. Logic is implicitly covered by domain and mapper tests, but a regression in store selector usage would not be caught at unit level. Known gap, acknowledged in apply-progress.

**W-002**: `image_url` is no longer sent per item in the order payload. Old inline payload included it; new `CartSnapshot` items shape omits it. BFF schema marks `image_url` as `z.string().optional()` — no runtime breakage, but silent behavioral change worth documenting for backend/MP display purposes.

### SUGGESTION

**S-001**: `handleSubmitShipping` (checkout/page.tsx:136-150) still uses inline required-field check instead of `missingShippingFields` from the checkout domain. Wiring it here would close the gap. Recommended for the strangle slice.

**S-002**: Hydration test (CART-T4) simulates Zustand's shallow merge manually. Low risk given Zustand's stability, but a real integration test would be more robust.

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| WARNING | 2 |
| SUGGESTION | 2 |

**Verdict: PASS — recommended next phase: sdd-archive**
