# Proposal: Cart UI Strangle (container-presentational + atomic design)

## Intent

Cart UI lives in two monolithic client components (`CartDrawer.tsx` 206 LOC, `carrito/page.tsx` 256 LOC) that read `useCartStore` directly and inline domain math (6 violations + a `getTotal()` selector anti-pattern). The forward-path hooks `use-cart` / `use-cart-summary` are DEAD CODE. This is the FIRST UI strangle: it establishes the `features/cart/ui/` layer (atoms / molecules / organisms / containers), the container-presentational split, and the first RTL `.test.tsx` precedent — the template every future UI slice (checkout, catalog) will copy.

## Scope

### In Scope
- New `features/cart/ui/` layer (right-sized atomic taxonomy below) for BOTH drawer + carrito page (explore Option B).
- Wire the dead hooks: containers consume `useCart` + `useCartSummary`.
- New `useCartDrawer` hook `{ isOpen, openCart, closeCart, toggleCart }` (single-responsibility, not bolted onto `useCart`).
- Extend `useCartSummary` with `finalTotal` (single tested location; reads `discountAmount` from store).
- Swap consumers: `app/components/CartDrawer.tsx` -> `CartDrawerContainer`; `app/carrito/page.tsx` -> `CartPageContainer`. Behavior identical (animation, scroll-lock, hydration guard, `trackViewCart`, toasts, coupon, CartCrossSell, FreeShippingProgress, CouponInput).
- Fix 6 inline domain violations -> `formatPrice` / `lineTotal` / `orderTotal`; kill `useCartStore(s => s.getTotal())`.
- First RTL precedent: `__mocks__/next-image` stub + `motion/react` mock; presentational tests render-with-props, container tests mock hooks (follow `use-search-suggestions.test.ts` renderHook precedent).

### Out of Scope (backlog)
- `CouponInput` async split (`useCouponValidation`) — render as-is, flag tech debt.
- `AbandonedCartModal` — inline arithmetic bug flagged, NOT refactored here.
- `CartCrossSell` deep refactor — keep its `Product -> store.addItem` mapping; relocate/wrap as container only if clean, else leave in place.
- checkout / catalog UI strangles.

## Capabilities

### New Capabilities
- None (UI refactor; no new spec-level behavior).

### Modified Capabilities
- None. Behavior is preserved exactly; this is an internal architecture strangle, not a requirement change. `openspec/specs/cart/spec.md` stays valid.

## Approach

`features/cart/ui/` (right-sized — do NOT over-atomize):
- **atoms** (pure props, import NOTHING from store/app): `QuantityStepper`, `CartItemImage`, `CartEmptyState` (variant: drawer|page), `CartLinePrice` (domain `lineTotal` + catalog `formatPrice`).
- **molecules** (atoms + layout, pure props): `CartItemRow`, `CartSummaryPanel`.
- **organisms** (assembled; the animated shell lives here): `CartItemList`, `CartDrawerPanel`, `CartPageLayout`.
- **containers** (consume hooks, wire store): `CartDrawerContainer`, `CartPageContainer`.

**Layering rule (the ui/ template):** `ui/` imports application hooks + domain types, NEVER infrastructure. Presentational atoms/molecules import NOTHING from store/app — pure props only. Only containers touch hooks/store.

**Hook additions:**
- `useCartDrawer()` -> `{ isOpen, openCart, closeCart, toggleCart }` (thin store selector wrappers).
- `useCartSummary().finalTotal` -> delegates to checkout-domain `orderTotal(subtotal, discountAmount, shipping)` (reads `discountAmount` from store). NOTE: `orderTotal(sub, d, ship) === max(0, total - d)` since `total = sub + ship` — same result the brief specifies, but routed through the canonical domain fn instead of new inline math. Single tested location.

**Coupon/drawer state:** containers read `appliedCoupon`/`discountAmount`/`setCoupon`/`clearCoupon` directly from store (simple case); drawer open/close via `useCartDrawer`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `features/cart/ui/**` | New | atoms/molecules/organisms/containers + `.test.tsx` + `index.ts` |
| `features/cart/application/use-cart-drawer.ts` | New | drawer open/close hook |
| `features/cart/application/use-cart-summary.ts` | Modified | add `finalTotal` via `orderTotal` |
| `app/components/CartDrawer.tsx` | Modified | renders `CartDrawerContainer` |
| `app/carrito/page.tsx` | Modified | renders `CartPageContainer` |
| `__mocks__/next-image.tsx` | New | test stub (also motion/react mock approach) |

## Delivery — 2 chained PRs (~700-800 LOC; exceeds 400-line budget)

- **PR1**: atoms + molecules + mock infra + their RTL tests. New files only; nothing imports them. Zero behavior change.
- **PR2**: organisms + containers + `useCartDrawer` + `useCartSummary.finalTotal` + swap consumers + fix domain violations.

Dead-code tension: PR1 atoms are unused until PR2. Acceptable for a chained strangle — PR1 is pure additive scaffolding, PR2 consumes within the same change. **Recommendation: 2 chained PRs.** Alternative: single `size:exception` PR (avoids dead-code window, but ~800 LOC overloads one review). Orchestrator/user decides at the tasks Review Workload Guard.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `motion/react` jsdom incompat (AnimatePresence) | High | Mock `motion/react`; unit-test inner panels without the animated shell |
| `next/image` breaks first render test | High | Establish `__mocks__/next-image` stub (this PR1) |
| `finalTotal` formula diverges from domain | Med | Route through `orderTotal`; one tested location only |
| `getTotal()` selector anti-pattern regresses | Med | Replace with `useCartSummary` everywhere |
| PR1 dead-code window | Low | Chained: PR2 consumes within same change |
| `CartCrossSell` Product (transport) type at boundary | Low | Keep store-internal mapping; don't touch type boundary |

## Rollback Plan

PR1 is additive (delete `features/cart/ui/` + `__mocks__/` — no consumer impact). PR2 swap is a one-line render change per consumer; revert the two consumer files to restore prior monolith. Hooks are new/additive. No data migration, no store schema change.

## Dependencies

- Existing: `use-cart`, `use-cart-summary`, `cart.store`, domain `lineTotal`/`subtotal`/`shippingCost`/`cartTotal`, catalog `formatPrice`, checkout `orderTotal`. All present.

## Success Criteria

- [ ] `features/cart/ui/` layer exists; presentational pieces are pure-props (no store/app imports).
- [ ] `CartDrawer` + carrito page render via containers; behavior identical (animation, scroll-lock, hydration, analytics, toasts, coupon, cross-sell, free-shipping).
- [ ] All 6 inline domain violations + `getTotal()` selector removed.
- [ ] `useCartDrawer` + `useCartSummary.finalTotal` added and tested.
- [ ] First RTL `.test.tsx` suite green; existing 397 tests stay green (`pnpm test:run`).
- [ ] `__mocks__/next-image` + motion mock established as reusable precedent.
