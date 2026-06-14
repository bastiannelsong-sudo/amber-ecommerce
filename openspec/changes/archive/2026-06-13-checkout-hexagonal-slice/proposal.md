# Proposal: Checkout Hexagonal Slice (domain + application + coupon-seam fix)

## Intent

Second vertical slice after the MERGED cart pattern-setter. Extract checkout business logic (order totals, readiness, payload assembly, price-locked snapshot) into a framework-free `features/checkout/` domain + application layer, and FIX the confirmed coupon-disconnect bug at the cart-to-checkout seam. Today the discount is ephemeral local state in `CartDrawer`; checkout never sends `coupon_code` and shows raw subtotal. Backend/BFF/schema already accept the coupon — only the frontend seam is broken. Success: testable checkout domain mirroring cart idioms, coupon persisted in cart store and forwarded to the order, existing tests green.

## Scope

### In Scope
- `features/checkout/domain/checkout.types.ts`: `CartSnapshot` (immutable, price-locked: readonly items `{product_id,name,internal_sku,quantity,unit_price}`, subtotal, shipping, discount, total), `OrderDraft`, `CheckoutFormData`, `CheckoutMode = 'guest'|'authenticated'`, `CheckoutStep`.
- `features/checkout/domain/checkout.rules.ts` (+ `.test.ts`, TDD-first): `orderTotal(subtotal, discountAmount, shipping)` = `subtotal - discount + shipping` clamped `>= 0`; `isCheckoutReady(formData)`; `missingShippingFields(formData)`; `sanitizePhone(value)`.
- `features/checkout/application/checkout.mapper.ts` (+ tests): `toCartSnapshot(cartItems, discount)`; `toOrderPayload(snapshot, formData, couponCode?)` → `CreateOrderDto`-shaped object INCLUDING `coupon_code`.
- `features/checkout/application/` hooks: `use-checkout-summary` (reads cart store incl. new coupon state → `{subtotal, discount, shipping, total}` via domain `orderTotal`); forward-path `use-checkout-form`, `use-checkout-submit` as the application API the future page-strangle consumes.
- COUPON FIX: add `appliedCoupon: string | null` + `discountAmount: number` to `features/cart/application/cart.store.ts` (Zustand persist, EXPLICIT defaults so old persisted carts hydrate safely; `setCoupon`/`clearCoupon` actions). `CartDrawer.tsx` writes coupon to store instead of local state. MINIMAL edit to `app/checkout/page.tsx`: read `appliedCoupon`/`discountAmount` from store, include `coupon_code` in payload, render discount line (use `toOrderPayload` if clean).

### Out of Scope (backlog)
- Full 924-line `checkout/page.tsx` strangle + container-presentational extraction (follow-up slice).
- `Math.random()` confirmation order-number bug (lives in page UI; fix in strangle follow-up).
- Card-payment Bricks frontend (BFF exists, no UI).
- Price-snapshot enforcement beyond `CartSnapshot` (no add-time price lock in cart).

## Capabilities

### New Capabilities
- `checkout`: checkout domain (order totals, readiness, phone sanitization, price-locked `CartSnapshot`) + application (mapper, summary/form/submit hooks). Mirrors the cart spec template.

### Modified Capabilities
- `cart`: cart store gains `appliedCoupon` + `discountAmount` state and `setCoupon`/`clearCoupon` actions (persisted, explicit defaults). Spec-level addition to the existing cart capability — its "Coupon-disconnect bug" out-of-scope row is now resolved by this slice.

## Approach

Replicate the cart slice exactly: framework-free domain (pure functions, zero React/Zustand/fetch imports), application layer delegating to domain, boundary mapper, selector hooks, TDD-first (RED → GREEN). `CartSnapshot` and `orderTotal` live in CHECKOUT domain (checkout owns order finalization; cart domain stays focused on cart math), per explore recommendation. Coupon state persists in cart store because it is validated against cart total and must survive `CartDrawer` close + checkout navigation. The checkout page receives a MINIMAL surgical edit only to wire the coupon through — no strangle.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `features/checkout/domain/` | New | types, rules, rules.test |
| `features/checkout/application/` | New | mapper (+test), use-checkout-summary, use-checkout-form, use-checkout-submit |
| `features/cart/application/cart.store.ts` | Modified | add appliedCoupon + discountAmount + setCoupon/clearCoupon (persist defaults) |
| `app/components/CartDrawer.tsx` | Modified | coupon → store instead of local React state |
| `app/checkout/page.tsx` | Modified (minimal) | read coupon from store, forward coupon_code, show discount line |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Persisted Zustand hydration of old carts missing new fields | Med | Explicit defaults (`appliedCoupon: null`, `discountAmount: 0`) in store initializer |
| Minimal page edit drifts into strangle | Med | Hard boundary: only coupon wiring; defer everything else to backlog |
| `orderTotal` clamp edge (discount > subtotal+shipping) | Low | TDD boundary case: total clamps to `0`, never negative |
| Coupon math mismatch frontend vs backend | Low | Frontend display only; backend re-validates `coupon_code` authoritatively |

## Rollback Plan

`features/checkout/` is additive — delete the directory to remove the new domain. Coupon fix reverts by restoring `CartDrawer` local state and removing the two cart-store fields + the page edit (single revert commit). Cart store change is backward compatible (defaults), so reverting needs no data migration.

## Dependencies

- Merged cart slice (pattern template, `useCartStore`). No new packages.

## Success Criteria

- [ ] `features/checkout/domain` rules + `checkout.mapper` unit-tested TDD-first; all pass via `pnpm test:run`.
- [ ] `orderTotal` clamps to `0` on over-discount (boundary test present).
- [ ] Cart store exposes `appliedCoupon`/`discountAmount` + `setCoupon`/`clearCoupon`; new tests cover them; old persisted carts hydrate without error.
- [ ] `CartDrawer` reads/writes coupon via store; coupon survives drawer close → checkout.
- [ ] Checkout order payload includes `coupon_code`; checkout summary shows discount line.
- [ ] Existing test suite stays green; TypeScript zero errors.

## PR Size Estimate

Single PR, ~250-350 changed lines (domain ~120, application ~110, cart-store + CartDrawer + page wiring ~90). Within the 400-line review budget. **400-line budget risk: Low. Chained PRs recommended: No.** If `sdd-tasks` forecasts > 400 (e.g. hooks expand), split: PR1 = checkout domain + application + tests; PR2 = coupon-seam fix (cart.store + CartDrawer + page). The full page strangle is a SEPARATE future slice, not part of this change.
