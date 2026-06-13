# Exploration: cart-hexagonal-slice

## Current State

### Store (`app/lib/stores/cart.store.ts`)

Single Zustand slice, 124 lines, persisted to localStorage key `amber-cart-storage`.

**State shape:**
```
items: CartItem[]        // persisted
isOpen: boolean          // NOT persisted (drawer open state)
```

**Actions:**
- `addItem(product, quantity=1)` — merges if same `product_id`, fires `trackAddToCart`
- `removeItem(productId)` — fires `trackRemoveFromCart`
- `updateQuantity(productId, quantity)` — delegates to `removeItem` if qty <= 0
- `clearCart()` — sets items to []
- `toggleCart() / openCart() / closeCart()` — drawer UI state

**Selectors (methods that compute, not getters):**
- `getTotal()` — `sum(qty * product.price || 0)`
- `getItemCount()` — `sum(qty)`
- `getItemQuantity(productId)` — quantity of a specific item

**Business logic buried in store:**
- Merge-same-product rule (in `addItem`)
- Remove-on-zero-quantity rule (in `updateQuantity`)
- Price-from-product-at-time-of-add (no price snapshot — price is live from the live Product object)
- No max-quantity enforcement

**Analytics coupling:** `trackAddToCart` and `trackRemoveFromCart` are called directly inside store actions. This is a side-effect concern living in state mutation.

### Types (`app/lib/types.ts`)

```typescript
interface CartItem {
  product: Product      // FULL Product object stored (no price snapshot)
  quantity: number
  selectedVariant?: { color: string; size?: string }  // exists but NEVER SET in any add action
}

interface Cart {         // exists as type but NEVER USED anywhere in the app
  items: CartItem[]
  total: number
  itemCount: number
}
```

Key observations:
- CartItem embeds a full `Product` reference — no price snapshot. If product price changes server-side, the cart total silently changes on reload.
- `selectedVariant` in type but none of the `addItem` calls pass it — dead field.
- The `Cart` interface is defined but never instantiated (not a domain object, just a type).

### Cart Page (`app/carrito/page.tsx`)

Full `'use client'` page, ~255 lines. It is simultaneously a container AND a God Component — it directly reads store, contains shipping logic, formats prices, renders item list, handles toast notifications.

**Embedded business rules (not in domain):**
- Free shipping threshold: `const shipping = subtotal > 30000 ? 0 : 5000` — hardcoded
- Total = subtotal + shipping — computed in JSX, not in domain
- Analytics tracking (view_cart) is done in component with manual deduplication ref

**Container/presentational status:** FULLY MIXED. No separation.

### CartDrawer (`app/components/CartDrawer.tsx`)

`'use client'`, ~206 lines. Another God Component:

- Reads store directly
- Manages discount/coupon local state (`useState` for `discount`, `appliedCoupon`) — **coupon discount lives in CartDrawer local state, not in the cart store or domain**
- Computes `finalTotal = getTotal - discount` inline
- Manages body scroll lock effect
- Renders item list with quantity controls
- Hosts `FreeShippingProgress` and `CouponInput` children

**Container/presentational status:** FULLY MIXED. Coupon state lives here, not in the cart.

### CartCrossSell (`app/components/CartCrossSell.tsx`)

`'use client'`, ~90 lines. Fetches `/api/bestsellers`, filters cart items, renders suggestion cards with inline `addItem`. Clean enough but tightly coupled to `useCartStore`.

**Container/presentational status:** Container (has fetch + store coupling). Presentational part is inline.

### AbandonedCartModal (`app/components/marketing/AbandonedCartModal.tsx`)

`'use client'`, ~177 lines. Reads `items` and `openCart` from store. Contains business rule: "show modal if items exist AND last visit > 1 hour ago AND not shown today." Manages localStorage directly. Computes `totalItems` and `totalPrice` inline (duplicate of store's `getItemCount` and `getTotal`).

**Container/presentational status:** FULLY MIXED. Marketing/retention rule lives in component.

### CouponInput (`app/components/marketing/CouponInput.tsx`)

`'use client'`, ~120 lines. Calls `ecommerceService.validateCoupon()` directly. Receives `onApply` callback. This is a presentational/form component with an embedded service call. The coupon validation lives in the BFF (`/api/coupons/validate`). The discount amount is passed up to `CartDrawer` via callback — **discount amount is never in the cart store, only in CartDrawer's local React state**.

### FreeShippingProgress (`app/components/marketing/FreeShippingProgress.tsx`)

Pure presentational. Receives `cartTotal: number` and optional `threshold: number` (default 30000). Computes `remaining` and `progress` in component. The 30000 threshold is hardcoded — same constant as in `app/carrito/page.tsx`. **Two places with the same business constant.**

### StickyAddToCart (`app/components/StickyAddToCart.tsx`)

`'use client'`, ~118 lines. Pure presentation + scroll logic. Receives `onAddToCart` callback — does NOT import `useCartStore` directly. Only place where add-to-cart is properly decoupled.

### Header (`app/components/Header.tsx`)

Reads `openCart` and `getItemCount()` from store. Hydration guard pattern (`hasMounted` state) to avoid SSR mismatch. The item count badge is the "mini-cart."

### ProductCard (`app/components/ProductCard.tsx`)

Calls `addItem` directly from store. Container behavior mixed into card.

### ProductClientUI (`app/producto/[slug]/ProductClientUI.tsx`)

Calls `addItem` + `openCart` directly from store. Also manages quantity state locally. Full page-level container.

### Checkout (`app/checkout/page.tsx`)

Reads `items`, `getTotal()`, `clearCart` from store. The checkout page:
- Computes subtotal/shipping/total inline (same hardcoded 30000 threshold, third place)
- Builds the order payload by mapping `CartItem[]` directly (no cart domain object)
- `clearCart()` is called in `/checkout/resultado` after payment confirmation, NOT here

### Wishlist (`app/lib/stores/wishlist.store.ts`)

Completely separate Zustand store, no interaction with cart store. No shared logic.

---

## Business Rules to Extract into Domain

These rules are currently scattered across components and the store:

1. **Quantity >= 1 invariant**: `updateQuantity` removes item if `<= 0`. Lives in store.
2. **Merge-same-product rule**: `addItem` finds existing item by `product_id` and increments. Lives in store.
3. **Line item total**: `price * quantity` — computed in JSX in 3 places (carrito/page, CartDrawer, AbandonedCartModal).
4. **Cart subtotal**: `sum(item.price * qty)` — computed in `getTotal()` (store) and re-computed inline in page/modal.
5. **Free shipping threshold**: `subtotal > 30000 → shipping = 0 else 5000` — appears in 3 files (carrito/page.tsx, checkout/page.tsx, FreeShippingProgress.tsx default prop). CRITICAL: inconsistent — page uses `> 30000`, FreeShippingProgress defaults to `30000` but the condition is `<= 0`.
6. **Cart total with shipping**: `subtotal + shipping` — never in domain, always inline in pages.
7. **Coupon discount application**: `finalTotal = getTotal - discount` — lives in CartDrawer local state only, not persisted in cart store. Checkout does NOT use it (has its own `coupon_code` logic via form).
8. **No max-quantity enforcement**: Currently there is no upper limit — potential oversell risk.
9. **No stock validation at cart level**: `product.stock` is visible in type but never checked in `addItem` or `updateQuantity`. StickyAddToCart checks it for button disabled state only.

---

## Cross-Feature Edges (Seam Map)

```
Product Detail (ProductClientUI.tsx)
    └─ addItem(product, qty) → cart.store
    └─ openCart() → cart.store

Product Card (ProductCard.tsx)
    └─ addItem(product, 1) → cart.store

StickyAddToCart (component)
    └─ onAddToCart() callback → parent (ProductClientUI) → addItem

Header (Header.tsx)
    └─ openCart() → cart.store
    └─ getItemCount() → cart.store  [mini-cart badge]

CartDrawer (component)
    └─ reads items/removeItem/updateQuantity/getTotal → cart.store
    └─ CouponInput → ecommerceService.validateCoupon (BFF /api/coupons/validate)
    └─ discount state LIVES LOCALLY in CartDrawer, NOT in cart store
    └─ FreeShippingProgress ← cartTotal (passed as prop)
    └─ CartCrossSell ← reads store directly

Cart Page (/carrito/page.tsx)
    └─ reads items/removeItem/updateQuantity/clearCart/getTotal → cart.store
    └─ NO coupon input (coupon only in drawer, not on full cart page)
    └─ shipping + total computed inline

Checkout Page (/checkout/page.tsx)
    └─ reads items/getTotal/clearCart → cart.store
    └─ maps CartItem[] → CreateOrderDto (price snapshot happens HERE at submit)
    └─ clearCart() called on /checkout/resultado after payment

AbandonedCartModal (component)
    └─ reads items/openCart → cart.store
    └─ totalPrice computed inline (duplicate of getTotal)

Analytics (analytics.ts)
    └─ called directly inside cart.store actions (trackAddToCart, trackRemoveFromCart)
    └─ also called in CarritoPage (trackViewCart) and CheckoutPage (trackBeginCheckout)
```

**Wishlist:** no shared logic with cart. Completely independent store.

**Coupon disconnect:** coupon discount is NOT persisted to cart store or localStorage. If user closes drawer and reopens, the discount is lost. Checkout page has `coupon_code` field in form but it's not wired to the drawer's coupon state — the two coupon flows are disconnected.

---

## Affected Areas

- `app/lib/stores/cart.store.ts` — primary, will be refactored to call domain functions
- `app/lib/stores/cart.store.test.ts` — existing 23 tests cover store actions; domain unit tests will supplement
- `app/lib/types.ts` — CartItem, Cart types will move to domain
- `app/carrito/page.tsx` — full cart page, God component → container+presentational split
- `app/components/CartDrawer.tsx` — God component → split + coupon state moved
- `app/components/CartCrossSell.tsx` — container, needs decoupling
- `app/components/marketing/FreeShippingProgress.tsx` — threshold hardcoded, needs domain constant
- `app/components/marketing/CouponInput.tsx` — service call in component, needs extraction
- `app/components/marketing/AbandonedCartModal.tsx` — marketing rule in component, needs extraction
- `app/components/Header.tsx` — reads store, needs no change (clean consumer)
- `app/components/ProductCard.tsx` — calls addItem directly, needs hook intermediary
- `app/producto/[slug]/ProductClientUI.tsx` — calls addItem/openCart directly
- `app/checkout/page.tsx` — reads cart for order creation, slice boundary sits HERE

---

## Structure Options

### Option A: Pure Vertical Slice in `features/cart/`

```
features/cart/
  domain/
    cart.entity.ts          # CartItem, CartLine types (no Product blob, slim ref)
    cart.rules.ts           # Pure functions: addItem, removeItem, calcSubtotal, calcShipping, calcTotal, mergeItem, FREE_SHIPPING_THRESHOLD
    cart.rules.test.ts      # 100% unit, framework-free
  application/
    cart.store.ts           # Zustand store — calls domain functions, has analytics side effects
    use-cart.hook.ts        # Custom hook abstracting store (components don't import useCartStore directly)
    use-cart-summary.hook.ts # Derived hook: subtotal, shipping, total, freeShippingRemaining
  ui/
    containers/
      CartPageContainer.tsx     # Reads hook, passes props down
      CartDrawerContainer.tsx   # Reads hook, owns coupon coordination
    components/
      CartItemList.tsx         # Presentational — list of items
      CartItem.tsx             # Presentational — single item with qty controls
      CartSummary.tsx          # Presentational — subtotal/shipping/total
      CartEmpty.tsx            # Presentational — empty state
      CartCrossSell.tsx        # Container — has fetch
      FreeShippingBar.tsx      # Presentational — progress bar (receives remaining)
```

- **Pros**: Clear vertical slice, domain is fully testable, Zustand stays, strangler-friendly, types owned by feature
- **Cons**: Requires moving components from `app/components/` → potential for breakage in other consumers
- **Effort**: High (6-8 PRs for strangler pattern)

### Option B: Domain-Only Extraction, Keep Component Structure

```
app/lib/cart/
  cart.rules.ts           # Pure functions only (calc, merge, rules)
  cart.rules.test.ts
  cart.constants.ts       # FREE_SHIPPING_THRESHOLD = 30000 etc
  cart.types.ts           # CartItem, CartSummary (moved from types.ts)
app/lib/stores/
  cart.store.ts           # Calls lib/cart/cart.rules.ts — components unchanged
```

- **Pros**: Minimal blast radius, all existing component imports stay valid, fastest to ship
- **Cons**: NOT a vertical slice — domain and UI remain in different directories. Won't establish the `features/` pattern the architecture decision requires.
- **Effort**: Low (1-2 PRs)

### Option C: Hybrid — `features/cart/domain/` + `features/cart/application/` + Gradual UI Migration

Build `features/cart/domain/` and `features/cart/application/` immediately. Keep existing UI components in `app/components/` short-term, pointing to the new store. Migrate UI to `features/cart/ui/` in follow-up PRs.

- **Pros**: Establishes the pattern immediately in domain/application layers where it matters most. UI migration can be incremental. Tests are written for domain immediately. Existing components keep working.
- **Cons**: Transient split (UI still in `app/components/` for 1-2 PRs)
- **Effort**: Medium (3-5 PRs)

---

## Recommendation

**Option C (Hybrid)** is the recommended approach for this pattern-setter.

Rationale:
1. The domain functions (`calcLineTotal`, `calcSubtotal`, `calcShipping`, `calcTotal`, `mergeItem`, `removeItem`, `FREE_SHIPPING_THRESHOLD`) are small and can be extracted and tested in PR #1 with zero blast radius.
2. The Zustand store becomes a thin adapter calling domain functions in PR #2 — existing component imports (`useCartStore`) don't change.
3. The UI split (containers/presentational) follows in PR #3 with the cart page and drawer.
4. The coupon disconnect is a separate concern that surfaces a real bug — the design phase should decide: persist coupon to store, or keep it ephemeral.

PR sequence estimate:
- PR 1 (~100 lines): `features/cart/domain/` — types, constants, pure functions, unit tests (TDD first)
- PR 2 (~80 lines): `features/cart/application/` — store refactor to call domain, `useCart` hook, `useCartSummary` hook
- PR 3 (~200 lines): `features/cart/ui/` — CartPageContainer + CartDrawerContainer split, move presentational components
- PR 4 (~150 lines): Coupon state unification (move discount into store/application layer)

400-line budget risk per PR: Low for PR1+PR2, Medium for PR3+PR4.

---

## Open Questions for Design

1. **Price snapshot**: Should `addItem` snapshot `price` at add-time? Currently, if backend price changes, cart total silently changes on next page load. For a jewelry store with stable prices this may be acceptable — but it's a real risk.

2. **Coupon state location**: Should coupon discount live in the cart store (persisted), or remain ephemeral in the drawer? If persisted, checkout page could read it directly. If ephemeral, the current disconnection between drawer coupon and checkout coupon_code field is a bug.

3. **Stock validation in domain**: Should `addItem` throw/return an error if `product.stock === 0`? Currently there's no domain-level guard.

4. **`selectedVariant` dead field**: `CartItem.selectedVariant` is defined in type but never set. Is variant selection a planned feature? If yes, it belongs in domain. If no, remove it from the type.

5. **`Cart` type unused**: `interface Cart { items, total, itemCount }` is defined in `types.ts` but never instantiated. Should this become the domain's `CartSummary` return value from `useCartSummary()`?

6. **Analytics side effects in store**: `trackAddToCart/trackRemoveFromCart` are called inside Zustand actions. In the slice, these could move to the application layer (hooks calling domain AND analytics), keeping domain functions pure.

7. **Checkout boundary**: The checkout page is the consumer of the cart — it should receive a `CartSnapshot` (immutable, price-captured) rather than reading the live mutable cart. Is that in scope for this slice, or a future checkout slice?

---

## Risks

- Coupon discount state disconnection is a pre-existing bug (drawer discount not reflected in checkout form). Fixing it during this slice adds scope — needs a decision before design.
- The free-shipping threshold (30000) appearing in 3 different places with slightly different conditions (> vs >=) is an existing inconsistency that will surface during extraction.
- No `features/` directory exists yet — this slice establishes the pattern. Any mis-naming of the top-level structure will be carried forward. Confirm naming convention before PR #1 is merged.
- Existing 23 cart store tests test Zustand state mutation. When store calls pure domain functions, those tests become integration tests. New domain unit tests will be written TDD-first, but the test migration path needs to be clear.
- `'use client'` boundary: `features/cart/domain/` must remain pure (no React, no browser APIs). The store's `persist` middleware is fine in `application/`. Domain tests run in Node via Vitest.

---

## Ready for Proposal

Yes. Codebase is fully mapped. The domain rules are clear, the seam boundaries are identified, the PR chain is estimable, and the open questions (coupon, price snapshot, stock validation) are the exact design decisions the proposal phase should resolve.
