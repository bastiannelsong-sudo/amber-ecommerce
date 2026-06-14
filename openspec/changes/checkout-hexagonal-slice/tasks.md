# Tasks: Checkout Hexagonal Slice

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 280–350 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | size-exception (single PR, fits budget) |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

### Work Unit Grouping

| Unit | Goal | Files | Notes |
|------|------|-------|-------|
| 1 | Checkout domain types + rules + tests | `checkout.types.ts`, `checkout.rules.ts`, `checkout.rules.test.ts` | Pure, no deps. Domain first — mapper imports it |
| 2 | Checkout mapper + summary hook + tests | `checkout.mapper.ts`, `checkout.mapper.test.ts`, `use-checkout-summary.ts` | Imports cart domain + checkout domain. Depends on Unit 1 |
| 3 | Cart store coupon fields + tests (incl. hydration) | `cart.store.ts` (modify), `cart.store.test.ts` (extend) | Blocks CartDrawer + page wiring |
| 4 | CartDrawer coupon state migration to store | `CartDrawer.tsx` (modify) | Depends on Unit 3 |
| 5 | Checkout page minimal coupon wiring | `app/checkout/page.tsx` (modify) | Depends on Units 2 + 3 |

---

## Phase 1: Checkout Domain Foundation
_Satisfies: CHK-D1, CHK-R1, CHK-R2, CHK-R3, CHK-R4, CHK-T1, CHK-T2_

- [x] 1.1 **[RED]** Create `features/checkout/domain/checkout.rules.test.ts` with failing tests for `orderTotal` (3 clamp cases: under/equal/over — CHK-T2 MANDATORY), `isCheckoutReady`, `missingShippingFields`, `sanitizePhone`. Run `pnpm test:run` → must FAIL.
- [x] 1.2 **[RED]** Create `features/checkout/domain/checkout.types.ts` with `CartSnapshot` (all items `readonly`), `OrderDraft`, `CheckoutFormData`, `CheckoutMode`, `CheckoutStep`. TypeScript compile must reject mutation (CHK-D1).
- [x] 1.3 **[GREEN]** Create `features/checkout/domain/checkout.rules.ts` with `orderTotal(subtotal, discount, shipping): number = Math.max(0, subtotal - discount + shipping)`, `isCheckoutReady`, `missingShippingFields`, `sanitizePhone`. Run `pnpm test:run` → all new tests pass (CHK-R1, CHK-R2, CHK-R3, CHK-R4, CHK-T1).

---

## Phase 2: Checkout Application Layer
_Satisfies: CHK-A1, CHK-A2, CHK-A3, CHK-T3_

- [x] 2.1 **[RED]** Create `features/checkout/application/checkout.mapper.test.ts` with failing tests: `toCartSnapshot` (snapshot shape, `unit_price` from `item.product.price` — LOCKED naming, discount present/absent), `toOrderPayload` (coupon_code present/absent/empty-string — CHK-T3).
- [x] 2.2 **[GREEN]** Create `features/checkout/application/checkout.mapper.ts` with `toCartSnapshot(cartItems: CartItem[], discountAmount: number): CartSnapshot` (imports `subtotal`, `shippingCost` from cart domain; `orderTotal` from checkout domain; maps `unit_price: item.product.price`) and `toOrderPayload(snapshot, formData, couponCode?)` omits `coupon_code` when absent/null/empty (CHK-A1, CHK-A2).
- [x] 2.3 Create `features/checkout/application/use-checkout-summary.ts` hook exposing `{ subtotal, discount, shipping, total }` — reads `items` and `discountAmount` from `useCartStore`, delegates all arithmetic to domain fns; zero arithmetic in hook body (CHK-A3).

> Note: `use-checkout-form` and `use-checkout-submit` are DEFERRED (dead code without consumer).

---

## Phase 3: Cart Store Coupon Fields
_Satisfies: CART-A7, CHK-T4_

- [x] 3.1 **[RED]** Extend `features/cart/application/cart.store.test.ts` with failing tests: `setCoupon` sets both fields atomically, `clearCoupon` resets both to defaults, hydration with missing coupon fields defaults to `null`/`0` without runtime error (CHK-T4 MANDATORY hydration test). Run `pnpm test:run` → new tests FAIL; existing tests stay green.
- [x] 3.2 **[GREEN]** Modify `features/cart/application/cart.store.ts`: add `appliedCoupon: null as string | null` and `discountAmount: 0` to the initializer (EXPLICIT defaults — bare persist shallow merge relies on these), add `setCoupon(code: string, amount: number)` and `clearCoupon()` actions to both `CartStore` interface and initializer body (CART-A7). Run `pnpm test:run` → all store tests pass.

---

## Phase 4: CartDrawer Coupon State Migration
_Satisfies: CART-A8_

- [x] 4.1 Modify `app/components/CartDrawer.tsx`: remove local `useState` for `discount` and `appliedCoupon` (lines 19-20); read `appliedCoupon` and `discountAmount` from `useCartStore`; wire `onApply` callback to `setCoupon(code, amount)`; wire remove/clear to `clearCoupon()`; derive displayed discount from store `discountAmount` (CART-A8). Verify coupon survives drawer close manually.

---

## Phase 5: Checkout Page Minimal Coupon Wiring
_Satisfies: CART-A9_

- [x] 5.1 Modify `app/checkout/page.tsx` (MINIMAL surgical edit — NO strangle): read `appliedCoupon` and `discountAmount` from `useCartStore`; replace bare subtotal/shipping/total locals with `orderTotal(subtotal, discountAmount, shipping)`; pass `couponCode: appliedCoupon` to `toOrderPayload`; add discount display line in order summary when `discountAmount > 0` (CART-A9). Confirm `coupon_code` present/absent in payload per store state.

---

## Phase 6: Cross-cutting Verification
_Satisfies: CHK-T1, CHK-T2, CHK-T3, CHK-T4_

- [x] 6.1 Run full `pnpm test:run` — all tests (new + pre-existing) must pass. Confirm 3 `orderTotal` clamp test cases present and green (CHK-T2 MANDATORY). Confirm hydration-missing-fields test present and green (CHK-T4 MANDATORY).
- [x] 6.2 Verify no cross-feature boundary violations: `features/checkout/` MUST NOT import from `features/cart/application`, `features/cart/application/cart.store.ts`, or any `app/components`. Grep: `rg 'from.*features/cart/(application|store|ui)' features/checkout/` must return empty.
- [x] 6.3 Verify domain purity: `features/checkout/domain/` MUST import nothing from React, Zustand, or `next/`. Grep: `rg 'from.*(react|zustand|next)' features/checkout/domain/` must return empty.
