# Exploration: cart-ui-strangle

## Current State

The cart UI currently lives in two monolithic client components — `app/components/CartDrawer.tsx` (206 lines) and `app/carrito/page.tsx` (256 lines) — plus several shared components under `app/components/marketing/` and `app/components/CartCrossSell.tsx`. All read directly from `useCartStore` or domain functions. The forward-path hooks `use-cart.ts` and `use-cart-summary.ts` already exist in `features/cart/application/` but are currently unused (dead-code forward-path built for this strangle).

### CartDrawer.tsx (206 lines) — Container/Presentational Analysis

**Container concerns (all in one component today):**
- Reads `isOpen`, `closeCart`, `items`, `removeItem`, `updateQuantity`, `getTotal`, `appliedCoupon`, `discountAmount`, `setCoupon`, `clearCoupon` directly from `useCartStore`
- Computes `finalTotal = Math.max(0, getTotal - discountAmount)` — inline arithmetic (should use domain)
- Scroll-lock `useEffect` tied to `isOpen`
- Renders `CartCrossSell` (which itself reads `useCartStore`)
- Passes coupon callbacks (`onApply`, `onRemove`) to `CouponInput`
- Passes `cartTotal` prop to `FreeShippingProgress` and `CouponInput`

**Presentational concerns (entangled in same component):**
- Drawer animation (motion/AnimatePresence with overlay)
- Header with close button
- Empty state (SVG + "Tu carrito está vacío" text)
- Item rows (image, name, unit price, quantity stepper +/-/delete buttons)
- Footer with FreeShippingProgress + CouponInput + discount line + total + dual CTA (checkout + "seguir comprando")

**Key bugs/issues:**
- `getTotal` is called as `useCartStore((state) => state.getTotal())` — calling a function inside the selector, which is an anti-pattern (re-executes on every store change)
- `finalTotal` arithmetic is inline: `Math.max(0, getTotal - discountAmount)` — should delegate to `orderTotal` from checkout domain
- Unit price formatted inline: `${Math.round(Number(item.product.price) || 0).toLocaleString('es-CL')}` — should use `formatPrice` from catalog domain
- No `lineTotal` domain usage — just renders unit price, not line total

### app/carrito/page.tsx (256 lines) — Container/Presentational Analysis

**Container concerns:**
- Reads `items`, `removeItem`, `updateQuantity`, `clearCart`, `getTotal` from `useCartStore`
- Hydration guard: `mounted` state + `useEffect(() => setMounted(true))`
- Analytics: `trackViewCart` once-per-entry via `tracked` ref + `mounted` guard
- Computes `subtotal = getTotal` (alias), then calls `shippingCost(subtotal)` and `cartTotal(subtotal)` directly from domain (CORRECT but should go through `useCartSummary`)
- `handleRemoveItem` wraps `removeItem` + `toast.success`
- Routes to checkout via `Link`
- Renders `Header`, `Footer`, `CartSkeleton`

**Presentational concerns (entangled):**
- Breadcrumb
- Page header ("Carrito de Compras" + item count)
- Empty state (SVG + "Agrega productos para continuar comprando")
- Item list: each item card with image, name, SKU, quantity stepper (different style from drawer), remove button
- Line total: `${((item.product.price || 0) * item.quantity).toLocaleString('es-CL')}` — INLINE ARITHMETIC, not using `lineTotal` domain function (this is the bug flagged by verify)
- Unit price: `${Number(item.product.price ?? 0).toLocaleString('es-CL')} c/u` — inline, not using `formatPrice`
- Order summary panel: subtotal, shipping (with free-shipping hint using `FREE_SHIPPING_THRESHOLD`), total, dual CTAs

### Shared Components — Classification

| Component | Location | Classification | Notes |
|---|---|---|---|
| `FreeShippingProgress` | `app/components/marketing/FreeShippingProgress.tsx` | **Mostly presentational** | Accepts `cartTotal: number` prop, reads `FREE_SHIPPING_THRESHOLD` from domain. Uses `motion`. Already prop-driven. |
| `CouponInput` | `app/components/marketing/CouponInput.tsx` | **Mixed** | Has own state (code, loading, error, success) + calls `ecommerceService.validateCoupon` (infrastructure). Accepts callbacks for apply/remove. Presentational shell but contains async logic. |
| `CartCrossSell` | `app/components/CartCrossSell.tsx` | **Container** | Reads `useCartStore` directly (items, addItem), fetches `/api/bestsellers` with `useEffect`. Has its own data-fetching + store dependency. |
| `AbandonedCartModal` | `app/components/marketing/AbandonedCartModal.tsx` | **Container** | Reads `useCartStore` (items, openCart), has localStorage timing logic, inline `totalPrice` arithmetic |
| `CartSkeleton` | `app/components/skeletons/CartSkeleton.tsx` | **Pure Presentational** | No store, no state — pure markup |

### Hook Consumption (Current vs Desired)

**use-cart.ts**: Exposes `{ items, addItem, removeItem, updateQuantity, clearCart }`. Currently UNUSED.
- CartDrawer container should swap its 5 individual store selectors for `useCart()`
- CarritoPage container should swap its individual store selectors for `useCart()`

**use-cart-summary.ts**: Exposes `{ subtotal, shipping, total, itemCount }`. Currently UNUSED.
- CartDrawer container should use this instead of `getTotal` + inline discount math
- CarritoPage container should use this instead of `getTotal` + manual `shippingCost`/`cartTotal` calls

**Missing from both hooks:**
- `isOpen`, `toggleCart`, `openCart`, `closeCart` — drawer open/close state. These are "UI state" on the store, not domain-derived. The container either reads them directly or a dedicated `useCartDrawer()` hook is warranted.
- `appliedCoupon`, `discountAmount`, `setCoupon`, `clearCoupon` — coupon state. Not in either hook. Need to decide: add to `useCart`, create `useCoupon`, or let the container read these directly from the store (simple case).

## Affected Areas

- `app/components/CartDrawer.tsx` — becomes `CartDrawerContainer` wrapping new `features/cart/ui/` components
- `app/carrito/page.tsx` — becomes `CartPageContainer` wrapping new `features/cart/ui/` components
- `features/cart/application/use-cart.ts` — add missing coupon state exposure OR introduce `useCoupon` hook
- `features/cart/application/use-cart-summary.ts` — may need to expose `finalTotal` (subtotal - discount); currently no coupon awareness
- `app/components/CartCrossSell.tsx` — stays where it is (or moves to features/cart/ui/) as a container itself
- `app/components/marketing/CouponInput.tsx` — the async logic makes a clean split harder
- `app/components/marketing/AbandonedCartModal.tsx` — has inline totalPrice arithmetic (should use domain)
- `features/cart/ui/` — new directory, all new files

## Inline Domain Violations (to fix as part of strangle)

1. **CartDrawer**: `finalTotal = Math.max(0, getTotal - discountAmount)` — should be `orderTotal(subtotal, discountAmount, shipping)` from checkout domain
2. **CartDrawer**: unit price `Math.round(Number(item.product.price) || 0).toLocaleString('es-CL')` — should use `formatPrice`
3. **carrito/page.tsx**: line total `((item.product.price || 0) * item.quantity).toLocaleString('es-CL')` — should use `lineTotal(item)` + `formatPrice`
4. **carrito/page.tsx**: unit price `Number(item.product.price ?? 0).toLocaleString('es-CL')` — should use `formatPrice`
5. **AbandonedCartModal**: inline `totalPrice = items.reduce(...)` — should use `subtotal(items)` from domain
6. **CartCrossSell**: inline `Math.round(Number(p.price) || 0).toLocaleString('es-CL')` — should use `formatPrice`

## Atomic Design Candidates

**Atoms** (pure leaf components, no logic, pure props):
- `CartItemImage` — product image with fallback URL, fixed size slot
- `QuantityStepper` — `-` / count / `+` buttons, receives `quantity`, `onDecrement`, `onIncrement`, `onRemove`
- `CartEmptyState` — SVG icon + text + CTA button/link. Two variants (drawer vs page) differ only in size/copy
- `CheckoutButton` — full-width obsidian CTA (reused in drawer footer + page summary)
- `CartLinePrice` — displays `lineTotal` formatted + unit price formatted underneath

**Molecules** (composed of atoms + local logic):
- `CartItemRow` — image + name + price + quantity stepper + remove; receives `CartItem`, callbacks
- `CartSummaryPanel` — subtotal row + shipping row + discount row (conditional) + total row + CTAs. Pure props.
- `FreeShippingBar` — thin wrapper over current `FreeShippingProgress` (already presentational)

**Organisms** (assembled from molecules, may have own layout):
- `CartItemList` — renders list of `CartItemRow`, handles empty state check
- `CartDrawerPanel` — drawer shell (animation, overlay, header with close, scrollable body, footer). Renders CartItemList + CartCrossSell + CartSummaryPanel
- `CartPageLayout` — page grid with CartItemList column + CartSummaryPanel column

**Cross-cutting (stay in marketing/ or get collocated)**:
- `CouponInput` — currently a mixed container/presentational. Cleaner split: make a pure `CouponInputView` (presentational) + keep `CouponInput` as a small container that handles async API call. OR: extract the API call to a hook `useCouponValidation`.
- `CartCrossSell` — stays as a container (has its own fetch + store read); move to `features/cart/ui/containers/`.

## Test Environment Assessment

**Current state:**
- `@testing-library/react@16.1.0` — installed in devDependencies
- `jsdom@25.0.1` — installed, configured as default Vitest environment
- `@testing-library/jest-dom@6.6.3` — installed, loaded in `vitest.setup.mts` via `import '@testing-library/jest-dom/vitest'`
- `vitest.config.mts` — `environment: 'jsdom'`, `setupFiles: ['./vitest.setup.mts']`
- localStorage polyfill already in setup (crucial for Zustand persist)
- `renderHook` + `act` + `waitFor` pattern already established in `use-search-suggestions.test.ts`
- **Zero `.test.tsx` files exist** — this strangle writes the first RTL component tests

**jsdom gotchas for cart UI:**
- `motion/react` (Framer Motion v12): uses animation APIs not available in jsdom (`ResizeObserver`, CSS transitions). Components using `AnimatePresence`/`motion.div` will need `vi.mock('motion/react', ...)` or reduced-motion stubs. Alternatively, test presentational components in isolation (they receive no motion props) and avoid rendering the animated shell in unit tests.
- `next/image`: renders as `<img>` in test environment but may warn/error without mocking. Best practice: `vi.mock('next/image', () => ({ default: (props) => React.createElement('img', props) }))`.
- `next/link`: renders as `<a>` in jsdom, works without mocking in most cases.
- `document.body.style.overflow` manipulation (scroll lock): jsdom supports this but tests should not depend on DOM side effects.
- `ecommerceService.validateCoupon` in `CouponInput` — must be mocked in tests.
- **No existing `__mocks__/` for next/image or motion** — need to establish these mocks.

**Component test approach (container vs presentational):**
- **Presentational components**: render with explicit props, assert rendered output. No store, no mocks (except next/image/motion if used). Fastest, most deterministic.
- **Container components**: mock the hooks (`vi.mock('@/features/cart/application/use-cart')`), render the container, assert that the hook values appear in the DOM + that actions are called. This is the established hook-mock pattern from the catalog slice.

## Structure Options

### Option A: Minimal split — containers only, atoms inline
Extract `CartDrawerContainer` and `CartPageContainer` as thin wrappers that consume hooks; keep all presentational JSX inside them. Move to `features/cart/ui/containers/`.

- Pros: Small diff, quick win, hooks get consumed
- Cons: No reusable atoms, no component tests for UI pieces, presentation still entangled
- Effort: Low

### Option B: Full atomic split (recommended)
Build `features/cart/ui/` with:
```
features/cart/ui/
  atoms/
    CartItemImage.tsx + .test.tsx
    QuantityStepper.tsx + .test.tsx
    CartEmptyState.tsx + .test.tsx
    CartLinePrice.tsx + .test.tsx
  molecules/
    CartItemRow.tsx + .test.tsx
    CartSummaryPanel.tsx + .test.tsx
  organisms/
    CartItemList.tsx + .test.tsx
    CartDrawerPanel.tsx + .test.tsx
    CartPageLayout.tsx + .test.tsx
  containers/
    CartDrawerContainer.tsx
    CartPageContainer.tsx
  index.ts (public API)
```
Containers remain thin wrappers — `useCart()` + `useCartSummary()` + direct store for coupon/drawer state. Presentational atoms/molecules receive only props. Tests target atoms and molecules (no store mock needed).

- Pros: Reusable atoms/molecules for future checkout-strangle; component tests for atomic pieces; clean domain isolation; establishes the ui/ layer pattern for all future slices
- Cons: Larger scope (est. 15-20 new files + tests), higher PR line count, needs chained PRs
- Effort: High

### Option C: Hybrid — molecules only, skip atoms
Build CartItemRow, CartSummaryPanel, CartDrawerPanel as molecules directly (no atom layer). Two containers consume them.

- Pros: Balanced — some reuse without over-engineering
- Cons: Molecules can still get fat, harder to test sub-pieces
- Effort: Medium

## Recommendation

**Option B (Full atomic split)** is the correct long-term approach but MUST be delivered in two chained PRs:

**PR 1 — Atoms + Molecules + shared mocks (no consumer swap yet)**
- `__mocks__/next-image.tsx` (Next.js Image mock for tests)
- `features/cart/ui/atoms/` (4 atoms + tests)
- `features/cart/ui/molecules/` (2 molecules + tests)
- Establishes the RTL component-test pattern and precedent
- Zero behavior change — nothing consumes the new components yet

**PR 2 — Organisms + Containers + consumer swap**
- `features/cart/ui/organisms/` + containers
- Swap `app/components/CartDrawer.tsx` to render `CartDrawerContainer`
- Swap `app/carrito/page.tsx` to render `CartPageContainer`
- Fix all inline domain violations (lineTotal, formatPrice, finalTotal via orderTotal)
- Make `use-cart.ts` and `use-cart-summary.ts` the sole source for containers

**Hook additions needed before PR 2:**
- Add `{ isOpen, openCart, closeCart, appliedCoupon, discountAmount, setCoupon, clearCoupon }` exposure via either extending `use-cart.ts` OR a thin `useCartDrawer()` hook in the application layer. Recommend a separate `useCartDrawer` hook (single-responsibility).

**Scope clarification for design phase:** CartCrossSell is a container itself (fetches data). It should move to `features/cart/ui/containers/CartCrossSellContainer.tsx` but its internal card presentational piece could become a `CrossSellCard` atom.

## Risks

- **motion/react jsdom incompatibility**: AnimatePresence/motion.div in CartDrawer and AbandonedCartModal. Must mock or test around it. Recommend: don't render animated shells in unit tests; test the inner panels (CartDrawerPanel without AnimatePresence wrapper).
- **next/image missing mock**: No `__mocks__/next/image.tsx` established yet. First component test that renders Image will break without it.
- **CouponInput mixed concern**: Has async ecommerceService call embedded. Splitting into CouponInputView + useCouponValidation hook is cleaner but adds scope.
- **getTotal anti-pattern**: `useCartStore((state) => state.getTotal())` calls the function inside the selector — this is wrong (the selector should return a value, not call a function). The container refactor is the right moment to fix this by switching to `useCartSummary`.
- **AbandonedCartModal left out**: This modal also has inline arithmetic and reads the store directly. It is NOT in the drawer/page strangle scope but the inline arithmetic bug should be noted.
- **400-line budget**: Full Option B across both PRs easily exceeds 400 lines. Chained PRs are required. Decision needed before apply.
- **CartCrossSell uses Product (transport type) not CartProduct**: it reads `addItem` from store which does the mapping internally. Moving it to features/cart/ui/ doesn't break this but the type boundary should be noted.

## Ready for Proposal
Yes — the scope, split boundaries, hook gaps, component taxonomy, and test precedent are all clear enough for a proposal. The key open question for the proposal phase: confirm whether `useCartDrawer` is its own hook or if coupon/drawer state is extended into `use-cart.ts`.
