# Tasks: Cart UI Strangle (cart-ui-strangle)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 700–800 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (mocks + atoms + molecules) → PR 2 (hooks + organisms + containers + swap + fixes) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Global mocks + vitest alias | PR 1 | Base = main; prerequisite for all .test.tsx |
| 2 | Atoms (4) + RTL tests | PR 1 | Depends on Unit 1 |
| 3 | Molecules (2) + RTL tests | PR 1 | Depends on Unit 2 |
| 4 | useCartDrawer hook + test | PR 2 | Base = PR 1; prerequisite for containers |
| 5 | useCartSummary finalTotal extension + test | PR 2 | Depends on Unit 4 (parallel possible) |
| 6 | Organisms (3) + RTL tests | PR 2 | Depends on Units 2–3 (via PR 1 merge) |
| 7 | Containers (2) + RTL tests | PR 2 | Depends on Units 4–6 |
| 8 | Consumer swap (CartDrawer + carrito/page) | PR 2 | Depends on Unit 7 |
| 9 | Domain violation fixes (6 sites + getTotal) | PR 2 | Depends on Units 5 + 8 |

---

## PR 1 — Foundation: Mocks + Atoms + Molecules (~300–350 LOC)
> Base branch: main. New files only. Zero behavior change. pnpm test:run green at PR close.

### Phase 1: Test Infrastructure (CARTUI-T1)

- [x] 1.1 Create `__mocks__/next-image.tsx` — passthrough `<img>` component stripping fill/priority non-DOM props; satisfies CARTUI-T1
- [x] 1.2 Create `__mocks__/motion-react.tsx` — `AnimatePresence` renders children; `motion` Proxy returning plain HTML element for `motion.<tag>`; satisfies CARTUI-T1
- [x] 1.3 Modify `vitest.config.mts` — add resolve.alias entries: `'next/image' -> path.resolve(__dirname, '__mocks__/next-image.tsx')` and `'motion/react' -> path.resolve(__dirname, '__mocks__/motion-react.tsx')` mirroring existing server-only alias pattern; satisfies CARTUI-T1

### Phase 2: Atoms RED→GREEN (CARTUI-ATOM-1..4, CARTUI-T2)

- [x] 2.1 RED: Write `features/cart/ui/atoms/QuantityStepper.test.tsx` — 3 scenarios: increment calls onIncrement; decrement at qty>1 calls onDecrement; decrement at qty===1 calls onRemove; satisfies CARTUI-ATOM-1 + CARTUI-T2
- [x] 2.2 GREEN: Create `features/cart/ui/atoms/QuantityStepper.tsx` — pure-props, no store imports; make 2.1 pass; satisfies CARTUI-ATOM-1
- [x] 2.3 RED: Write `features/cart/ui/atoms/CartItemImage.test.tsx` — 2 scenarios: valid src renders img; falsy src renders fallback; satisfies CARTUI-ATOM-2 + CARTUI-T2
- [x] 2.4 GREEN: Create `features/cart/ui/atoms/CartItemImage.tsx` — wraps next/image; on missing src shows fallback; make 2.3 pass; satisfies CARTUI-ATOM-2
- [x] 2.5 RED: Write `features/cart/ui/atoms/CartEmptyState.test.tsx` — 2 scenarios: drawer variant shows empty message; page variant shows message + CTA link; satisfies CARTUI-ATOM-3 + CARTUI-T2
- [x] 2.6 GREEN: Create `features/cart/ui/atoms/CartEmptyState.tsx` — accepts `variant: 'drawer' | 'page'`; make 2.5 pass; satisfies CARTUI-ATOM-3
- [x] 2.7 RED: Write `features/cart/ui/atoms/CartLinePrice.test.tsx` — 2 scenarios: price 5990×2 = '11.980'; price 0×3 = '0'; satisfies CARTUI-ATOM-4 + CARTUI-T2
- [x] 2.8 GREEN: Create `features/cart/ui/atoms/CartLinePrice.tsx` — calls `lineTotal(item)` + `formatPrice`; no inline arithmetic; make 2.7 pass; satisfies CARTUI-ATOM-4

### Phase 3: Molecules RED→GREEN (CARTUI-MOL-1..2, CARTUI-T2)

- [x] 3.1 RED: Write `features/cart/ui/molecules/CartItemRow.test.tsx` — 2 scenarios: renders item name + SKU from props; increment click calls onIncrement; satisfies CARTUI-MOL-1 + CARTUI-T2
- [x] 3.2 GREEN: Create `features/cart/ui/molecules/CartItemRow.tsx` — composes CartItemImage + CartLinePrice + QuantityStepper; no store imports; make 3.1 pass; satisfies CARTUI-MOL-1
- [x] 3.3 RED: Write `features/cart/ui/molecules/CartSummaryPanel.test.tsx` — 3 scenarios: renders subtotal/shipping/total formatted; discount row visible when discountAmount>0; discount row absent when discountAmount===0; satisfies CARTUI-MOL-2 + CARTUI-T2
- [x] 3.4 GREEN: Create `features/cart/ui/molecules/CartSummaryPanel.tsx` — all amounts via formatPrice; conditional discount row; no store imports; make 3.3 pass; satisfies CARTUI-MOL-2

---

## PR 2 — Integration: Hooks + Organisms + Containers + Swap + Fixes (~400–450 LOC)
> Base branch: PR 1 (after merge to main). pnpm test:run green + tsc clean at PR close.

### Phase 4: Application Hooks RED→GREEN (CARTUI-HOOK-1, CART-A4)

- [x] 4.1 RED: Write `features/cart/application/use-cart-drawer.test.ts` — 2 scenarios: isOpen reflects store state; toggleCart flips state; satisfies CARTUI-HOOK-1
- [x] 4.2 GREEN: Create `features/cart/application/use-cart-drawer.ts` — thin selector wrappers around useCartStore (isOpen, openCart, closeCart, toggleCart); make 4.1 pass; satisfies CARTUI-HOOK-1
- [x] 4.3 RED: Write additional test case in `features/cart/application/use-cart-summary.test.ts` (or extend existing) — 3 scenarios: finalTotal no coupon; finalTotal with coupon; finalTotal never negative; satisfies CART-A4
- [x] 4.4 GREEN: Modify `features/cart/application/use-cart-summary.ts` — read discountAmount from store; return `finalTotal = orderTotal(subtotal, discountAmount, shipping)` importing `features/checkout/domain/checkout.rules`; make 4.3 pass; satisfies CART-A4

### Phase 5: Organisms RED→GREEN (CARTUI-ORG-1..3)

- [x] 5.1 RED: Write `features/cart/ui/organisms/CartItemList.test.tsx` — 2 scenarios: empty items renders CartEmptyState; non-empty renders one row per item; satisfies CARTUI-ORG-1
- [x] 5.2 GREEN: Create `features/cart/ui/organisms/CartItemList.tsx` — delegates to CartEmptyState or CartItemRow per item; make 5.1 pass; satisfies CARTUI-ORG-1
- [x] 5.3 Create `features/cart/ui/organisms/CartDrawerPanel.tsx` — outermost AnimatePresence+motion.div shell ONLY; inner chrome (overlay, header, scrollable body, footer) plain elements; accepts CartSummaryProps + items + callbacks + children; satisfies CARTUI-ORG-2 (NOTE: no direct test on animated shell per spec — inner panels testable independently)
- [x] 5.4 Create `features/cart/ui/organisms/CartPageLayout.tsx` — two-column grid: left=CartItemList, right=CartSummaryPanel sticky; satisfies CARTUI-ORG-3
- [x] 5.5 RED: Write `features/cart/ui/organisms/CartPageLayout.test.tsx` — 1 scenario: both columns (item list area + summary panel area) present in DOM; satisfies CARTUI-ORG-3

### Phase 6: Containers RED→GREEN (CARTUI-CONT-1..2, CARTUI-T3)

- [x] 6.1 RED: Write `features/cart/ui/containers/CartDrawerContainer.test.tsx` — 2 scenarios: mocked useCart+useCartDrawer values appear in rendered output; onRemove wired to useCart.removeItem; satisfies CARTUI-CONT-1 + CARTUI-T3
- [x] 6.2 GREEN: Create `features/cart/ui/containers/CartDrawerContainer.tsx` — consumes useCart + useCartSummary + useCartDrawer exclusively; reads appliedCoupon/setCoupon/clearCoupon directly from store; renders CartDrawerPanel; preserves scroll-lock useEffect + CartCrossSell + FreeShippingProgress + CouponInput; make 6.1 pass; satisfies CARTUI-CONT-1 + CARTUI-ARCH
- [x] 6.3 RED: Write `features/cart/ui/containers/CartPageContainer.test.tsx` — 2 scenarios: renders CartSkeleton before mounted; trackViewCart called once on mount; satisfies CARTUI-CONT-2 + CARTUI-T3
- [x] 6.4 GREEN: Create `features/cart/ui/containers/CartPageContainer.tsx` — consumes useCart + useCartSummary; mounted hydration guard; trackViewCart once via tracked ref; CartSkeleton while !mounted; preserves toast handlers + CartPageLayout; make 6.3 pass; satisfies CARTUI-CONT-2 + CARTUI-ARCH
- [x] 6.5 Create `features/cart/ui/containers/index.ts` — re-exports CartDrawerContainer + CartPageContainer + CartSummaryProps type; satisfies CARTUI-ARCH

### Phase 7: Consumer Swap (CARTUI-SWAP)

- [x] 7.1 Modify `app/components/CartDrawer.tsx` — replace body with thin shell rendering `<CartDrawerContainer />`; remove all direct store reads + inline JSX; satisfies CARTUI-SWAP
- [x] 7.2 Modify `app/carrito/page.tsx` — replace body with thin shell rendering `<CartPageContainer />`; remove all direct store reads + inline JSX; satisfies CARTUI-SWAP

### Phase 8: Domain Violation Fixes (CARTUI-FIX)

- [x] 8.1 Fix `app/components/CartDrawer.tsx` — replace `Math.max(0, getTotal - discountAmount)` with `useCartSummary().finalTotal`; replace inline `toLocaleString('es-CL')` unit price with `formatPrice(item.product.price)`; remove `useCartStore(s => s.getTotal())`; satisfies CARTUI-FIX site 1 + 2 + getTotal (fixed via thin-shell swap — domain violations eliminated at source)
- [x] 8.2 Fix `app/carrito/page.tsx` — replace `(price||0)*qty` line total with `formatPrice(lineTotal(item))`; replace unit price inline with `formatPrice(item.product.price)`; replace `discountAmount.toLocaleString` with `formatPrice(discountAmount)`; replace remaining hint toLocaleString with `formatPrice(remaining)`; remove `useCartStore(s => s.getTotal())`; satisfies CARTUI-FIX sites 3–6 + getTotal (fixed via thin-shell swap — domain violations eliminated at source)
- [x] 8.3 Verify `pnpm test:run` exits zero (all 397 pre-existing + new CARTUI tests pass); satisfies CARTUI-T4 — 443 tests passing (397 + 46 new)
- [x] 8.4 Verify `tsc --noEmit` exits zero (strict type check with no errors) — CLEAN

---

---

## Verify-Fix Batch (post-verify findings)

- [x] S3-fix: Add `checkoutHref?: string` prop to `CartSummaryPanel`; render `Link` when provided; `CartDrawerContainer` passes `checkoutHref='/checkout'`; restores /checkout navigation from drawer
- [x] W1-fix: Move page header (`h1` + item-count `p`) from `app/carrito/page.tsx` into `CartPageContainer`; shell now a pure thin wrapper with zero hook calls
- [x] W3-fix: Add `vi.mock('@/app/components/CartCrossSell', () => ({ default: () => null }))` to `CartDrawerContainer.test.tsx`; eliminates act() warnings
- [x] S2-fix: Add exact-value assertions to `use-cart-summary.test.ts` — `finalTotal=35000` (subtotal=40000, discount=5000, shipping=0); `finalTotal=0` when discount exceeds total
- [x] Final: 449 tests passing, tsc clean, commit 7f1edfb

---

## Parallelism Notes

- Tasks 2.1–2.8 can be done as 4 parallel RED→GREEN pairs after Phase 1 completes.
- Tasks 3.1–3.4 can be done as 2 parallel RED→GREEN pairs after Phase 2 completes.
- Tasks 4.1–4.2 and 4.3–4.4 are parallelizable within PR 2 (both are independent hook files).
- Tasks 5.3 and 5.4 are parallelizable with 5.1–5.2 (no shared dependency between CartDrawerPanel/CartPageLayout and CartItemList).
- Tasks 6.1–6.4 are sequential within containers (each container is independent of the other, so 6.1–6.2 and 6.3–6.4 can be parallel).
- Phase 7 and Phase 8 are sequential (swap first, then fix inline violations in the now-thin shells).
