# Design: Cart UI Strangle (container-presentational + atomic + RTL)

## Technical Approach

First UI strangle. Establishes `features/cart/ui/` (atoms / molecules / organisms / containers) as the
pattern-setting template all future UI slices copy. Presentational layer is pure-props; only containers
touch hooks/store. Behavior is preserved exactly — internal architecture strangle, no spec change.
Delivered as 2 chained PRs. NOTE: `app/lib/stores/cart.store.ts` is a re-export of
`features/cart/application/cart.store` — single store, no duplication.

## Architecture Decisions

### ADR-1: `features/cart/ui/` layout + atomic taxonomy (THE template)

**Choice** — right-sized, do NOT over-atomize:
```
features/cart/ui/
  atoms/        QuantityStepper, CartItemImage, CartEmptyState (variant: drawer|page), CartLinePrice
  molecules/    CartItemRow (variant: drawer|page), CartSummaryPanel
  organisms/    CartItemList, CartDrawerPanel, CartPageLayout
  containers/   CartDrawerContainer, CartPageContainer
  index.ts      public API (containers + types only)
```
**Layering rule (LOCKED template):** presentational (atoms/molecules/organisms) = pure props, ZERO
imports from store/hooks/`app/`. Containers consume hooks. `ui/` may import `application` + `domain`,
NEVER `infrastructure`. Atoms import only `react` + domain pure fns (e.g. `formatPrice`).
**Alternatives:** Option A (containers only) — no reuse, no atomic tests. Option C (molecules only) —
fat molecules. **Rationale:** atoms are the reusable seed for checkout/catalog slices; granularity stops
at 4 atoms because finer leaves (close button, CTA) add no reuse value this slice.

### ADR-2: next/image mock — GLOBAL via `__mocks__` + vitest alias

**Choice:** `__mocks__/next-image.tsx` exporting passthrough `<img>`; register GLOBALLY in
`vitest.config.mts` `resolve.alias` (`'next/image' -> __mocks__/next-image.tsx`), mirroring the existing
`server-only` alias precedent. **Alternatives:** per-test `vi.mock('next/image')` (repeated boilerplate,
easy to forget). **Rationale:** every component test rendering an image reuses it for free; matches the
repo's established alias-based mock convention. Strip `fill`/`priority` non-DOM props in the mock.

### ADR-3: motion/react mock — GLOBAL via `__mocks__` + vitest alias

**Choice:** `__mocks__/motion-react.tsx` — `AnimatePresence` renders `children`; `motion` is a Proxy
returning the plain element for `motion.<tag>` (strips `initial/animate/exit/transition`). Register
GLOBALLY in `vitest.config.mts` alias (`'motion/react' -> __mocks__/motion-react.tsx`).
**Structural rule:** in `CartDrawerPanel` the `AnimatePresence` + `motion.div` shell is the OUTERMOST
wrapper ONLY; all inner content is plain/testable markup. `FreeShippingProgress` (motion.div) also
benefits. **Alternatives:** per-test mock (boilerplate); reduced-motion stub (jsdom lacks the APIs).
**Rationale:** jsdom has no ResizeObserver/CSS-transition support; global mock makes animated organisms
renderable. Animation is presentation-only, never asserted.

### ADR-4: `useCartDrawer()` hook

**Choice:** new `features/cart/application/use-cart-drawer.ts` → `{ isOpen, openCart, closeCart, toggleCart }`,
thin store-selector wrappers (one selector per field, NOT a function-in-selector). **Rationale:**
single-responsibility (UI/open state separate from `useCart` mutations); fixes the
`useCartStore(s => s.getTotal())` class of anti-pattern by selecting raw fields.

### ADR-5: `useCartSummary().finalTotal` via checkout `orderTotal` (cross-feature DOMAIN import)

**Choice:** extend `useCartSummary` to read `discountAmount` from store and return
`finalTotal = orderTotal(subtotal, discountAmount, shipping)` importing
`@/features/checkout/domain/checkout.rules`. Verified signature:
`orderTotal(subtotal, discount, shipping) = Math.max(0, subtotal - discount + shipping)`. Single tested
location; NO inline re-derivation. **Acceptable per cross-feature rule:** cart/application → checkout/DOMAIN
is allowed (domain is pure, framework-free); cart/application → checkout/infrastructure would NOT be.
**Rationale:** kills the drawer's inline `Math.max(0, getTotal - discountAmount)` and routes the canonical
formula through one tested function.

### ADR-6: Container designs (behavior preservation contract)

**CartDrawerContainer** consumes `useCart()` (items, removeItem, updateQuantity), `useCartSummary()`
(subtotal, finalTotal, discountAmount), `useCartDrawer()` (isOpen, closeCart); reads
`appliedCoupon/setCoupon/clearCoupon` directly from store (simple case). Preserves: scroll-lock `useEffect`
on `isOpen`, `CartCrossSell` render when items>0, `FreeShippingProgress cartTotal={subtotal}`, `CouponInput`
apply/clear wiring. Renders `CartDrawerPanel` (organism). **CartPageContainer** consumes `useCart()` +
`useCartSummary()` (subtotal/shipping/total). Preserves: `mounted` hydration guard, `trackViewCart`
once-per-entry via `tracked` ref, `handleRemoveItem` toast, `clearCart` toast, `CartSkeleton`/`Header`/
`Footer`. Renders `CartPageLayout`. **getTotal() anti-pattern fix:** both drop
`useCartStore(s => s.getTotal())` for `useCartSummary()`.

### ADR-7: Consumer swap (keep file paths — thin shells)

`app/components/CartDrawer.tsx` and `app/carrito/page.tsx` KEEP their paths (other code imports them) and
become thin shells: `export { default } from '@/features/cart/ui/containers/...'` (or render the container).
**Rationale:** zero churn for importers; one-line revert = rollback.

### ADR-8: Domain-violation fixes (exact sites)

| # | Site | Becomes |
|---|------|---------|
| 1 | CartDrawer `finalTotal = Math.max(0, getTotal - discountAmount)` | `useCartSummary().finalTotal` (ADR-5) |
| 2 | CartDrawer unit price `Math.round(Number(price)\|\|0).toLocaleString` | `formatPrice(price)` (in `CartLinePrice`/`CartItemRow`) |
| 3 | carrito line total `((price\|\|0)*qty).toLocaleString` | `formatPrice(lineTotal(item))` |
| 4 | carrito unit price `Number(price??0).toLocaleString` | `formatPrice(price)` |
| 5 | discount line `discountAmount.toLocaleString` | `formatPrice(discountAmount)` |
| 6 | `FREE_SHIPPING_THRESHOLD - subtotal).toLocaleString` hint | `formatPrice(remaining)` |
| 7 | `useCartStore(s => s.getTotal())` (both files) | `useCartSummary()` selectors |

CartCrossSell inline `Math.round(...)` and AbandonedCartModal are OUT of scope (ADR-10).

### ADR-9: RTL test strategy + canonical `.test.tsx` template (FIRST precedent)

**Presentational tests:** render-with-props, assert DOM + exact `formatPrice` strings; NO store. **Container
tests:** `vi.mock` the hooks (`use-cart`, `use-cart-summary`, `use-cart-drawer`), render, assert hook values
in DOM + actions called. Follows the `use-search-suggestions.test.ts` module-level-mock precedent.
**Canonical skeleton (copy for all future UI slices):**
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuantityStepper } from './QuantityStepper';
// next/image + motion/react mocked GLOBALLY via vitest alias — no per-test mock
describe('QuantityStepper', () => {
  it('renders quantity and fires callbacks', () => {
    const onIncrement = vi.fn();
    render(<QuantityStepper quantity={2} onIncrement={onIncrement} onDecrement={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
```

### ADR-10: CouponInput / CartCrossSell boundary (no internal refactor)

**Choice:** render both AS-IS via organisms/containers; do NOT refactor internals this slice. CouponInput's
async `ecommerceService.validateCoupon` split (`useCouponValidation`) and CartCrossSell's fetch/Product
boundary are backlog. **Rationale:** keeps the slice focused on the strangle template; touching async/fetch
boundaries balloons scope and risk.

## Data Flow

```
Store (cart.store) ──selectors──> useCart / useCartSummary / useCartDrawer
        │                                   │
   appliedCoupon (direct)                   ▼
        └──────────────> Container (Drawer|Page)  ── props ──>  Organism ──> Molecule ──> Atom
                                                   (pure presentational, domain fns only)
finalTotal = orderTotal(subtotal, discountAmount, shipping)   [checkout/domain]
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `features/cart/ui/atoms/*.tsx` + `.test.tsx` | Create | 4 atoms + tests (PR1) |
| `features/cart/ui/molecules/*.tsx` + `.test.tsx` | Create | 2 molecules + tests (PR1) |
| `features/cart/ui/organisms/*.tsx` + `.test.tsx` | Create | 3 organisms + tests (PR2) |
| `features/cart/ui/containers/*.tsx` | Create | 2 containers (PR2) |
| `features/cart/ui/index.ts` | Create | public API (PR2) |
| `features/cart/application/use-cart-drawer.ts` + `.test.ts` | Create | drawer hook (PR2) |
| `features/cart/application/use-cart-summary.ts` | Modify | add `finalTotal` + `discountAmount` (PR2) |
| `__mocks__/next-image.tsx` | Create | passthrough img (PR1) |
| `__mocks__/motion-react.tsx` | Create | AnimatePresence/motion stub (PR1) |
| `vitest.config.mts` | Modify | alias next/image + motion/react (PR1) |
| `app/components/CartDrawer.tsx` | Modify | thin shell → CartDrawerContainer (PR2) |
| `app/carrito/page.tsx` | Modify | thin shell → CartPageContainer (PR2) |

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Atoms/Molecules | render + props + exact formatPrice | RTL render-with-props, no store |
| Organisms | assembled markup, empty-state | RTL render-with-props (motion mocked) |
| Containers | hook values in DOM, actions called | RTL + `vi.mock` hooks |
| Hook | useCartDrawer / finalTotal | `renderHook` per existing precedent |

## Migration / Rollout

2 chained PRs. **PR1** = atoms + molecules + mocks + alias + their tests (additive, nothing imports them →
DEAD-CODE WINDOW, acceptable: PR2 consumes within same change). **PR2** = organisms + containers + hooks +
finalTotal + consumer swap + domain fixes. **CONFIRMED: 2 chained PRs** (~700-800 LOC > 400 budget).
Rollback: PR1 delete `features/cart/ui/` + `__mocks__/` + alias; PR2 revert 2 consumer one-liners.

## Open Questions

- [ ] CONTRADICTION (low): carrito line total today is `(price||0)*qty` (no per-line round); design routes
      through `formatPrice(lineTotal(item))` which rounds once. Identical for integer CLP prices (all current
      data); flag if fractional prices ever appear. Drawer unit price already used `Math.round` → exact match.
