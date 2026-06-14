# Cart Capability Specification

**Domains**: cart-domain, cart-application
**Requirement prefix**: CART-*
**Status**: SHIPPED (PR #35, commits 4389e9e + 80e50aa)

---

## Purpose

Define the cart domain and application behavior. This spec is the canonical source of truth for cart calculations, mutations, and Zustand store integration. It establishes the `features/{name}/{domain,application}` architectural pattern that all future vertical slices must follow.

---

## Domain 1: cart-domain (Pure Functions)

Location: `features/cart/domain/`

Framework-free pure functions for cart calculation and mutation. No React, Zustand, fetch, window/browser, analytics, or 'use client' imports allowed. All functions accept and return immutable values (arrays, primitives).

---

### Requirement: CART-C1 — Canonical Constants

The domain MUST export a single source of truth for all numeric thresholds. `FREE_SHIPPING_THRESHOLD` MUST equal `30000`. `SHIPPING_COST` MUST equal `5000`. No other file in the codebase MAY hard-code these values.

#### Scenario: Constants are importable from the domain

- GIVEN the file `features/cart/domain/cart.constants.ts` exists
- WHEN any file imports `FREE_SHIPPING_THRESHOLD` or `SHIPPING_COST`
- THEN the values are `30000` and `5000` respectively

---

### Requirement: CART-D1 — CartItem Type Location

`CartItem` MUST be defined in `features/cart/domain/cart.types.ts`. `app/lib/types.ts` MUST re-export `CartItem` from that canonical path so existing consumers compile unchanged.

#### Scenario: Legacy import path resolves

- GIVEN a file imports `CartItem` from `@/app/lib/types`
- WHEN TypeScript compiles
- THEN the import resolves without error and the type is identical to the domain definition

---

### Requirement: CART-D2 — CartProduct Domain Type

`CartProduct` is the lean domain interface owned by `features/cart/domain/cart.types.ts`. It contains only fields required for cart operations: `product_id`, `name`, `price`, `image_url`, `slug` (optional), `internal_sku`, `product_type` (optional). The application layer MUST map the transport `Product` type to `CartProduct` at the boundary using the `toCartProduct` adapter in `features/cart/application/cart.mapper.ts`. The domain MUST NOT import `Product`.

#### Scenario: Domain uses CartProduct, not Product

- GIVEN the domain layer receives a product object
- WHEN cart functions are called
- THEN the object is of type `CartProduct` (lean, domain-owned)
- AND the domain has zero imports from `@/app/lib/types` or `@/app`

---

### Requirement: CART-R1 — addItem Merges Same Product

When `addItem` is called with a `product_id` already present in the item list, the system MUST merge the new quantity into the existing line (no duplicate lines).

#### Scenario: Same product added twice sums quantities

- GIVEN `items = [{ product: { product_id: 1, price: 100 }, quantity: 2 }]`
- WHEN `addItem(items, { product_id: 1, price: 100 }, 3)` is called
- THEN the result contains exactly one line for product `1` with `quantity === 5`

#### Scenario: Different product appends a new line

- GIVEN `items = [{ product: { product_id: 1, price: 100 }, quantity: 2 }]`
- WHEN `addItem(items, { product_id: 2, price: 200 }, 1)` is called
- THEN the result contains two lines: product `1` with `quantity === 2` and product `2` with `quantity === 1`

---

### Requirement: CART-R2 — removeItem Removes by product_id

`removeItem` MUST return the item list with the entry matching the given `product_id` removed. If the `product_id` is not present, the list MUST be returned unchanged.

#### Scenario: Existing item is removed

- GIVEN `items = [{ product: { product_id: 1 }, quantity: 1 }, { product: { product_id: 2 }, quantity: 1 }]`
- WHEN `removeItem(items, 1)` is called
- THEN the result contains only the product `2` line

#### Scenario: Non-existent product_id is a no-op

- GIVEN `items = [{ product: { product_id: 1 }, quantity: 1 }]`
- WHEN `removeItem(items, 99)` is called
- THEN the result is identical to the input (length 1, product `1` present)

---

### Requirement: CART-R3 — setQuantity Removes Line When qty <= 0

`setQuantity` MUST update the quantity for the matching line. If the new quantity is `<= 0`, the line MUST be removed from the list entirely.

#### Scenario: Positive quantity updates the line

- GIVEN `items = [{ product: { product_id: 1, price: 100 }, quantity: 1 }]`
- WHEN `setQuantity(items, 1, 4)` is called
- THEN the result contains one line for product `1` with `quantity === 4`

#### Scenario: Zero quantity removes the line

- GIVEN `items = [{ product: { product_id: 1, price: 100 }, quantity: 3 }]`
- WHEN `setQuantity(items, 1, 0)` is called
- THEN the result is an empty array

#### Scenario: Negative quantity removes the line

- GIVEN `items = [{ product: { product_id: 1, price: 100 }, quantity: 3 }]`
- WHEN `setQuantity(items, 1, -1)` is called
- THEN the result is an empty array

---

### Requirement: CART-R4 — lineTotal Guards Missing Price

`lineTotal(item)` MUST return `item.quantity * item.product.price`. If `item.product.price` is `undefined`, `null`, `0`, or falsy, `lineTotal` MUST treat price as `0` (result is `0`).

#### Scenario: Normal line total

- GIVEN `item = { product: { price: 1500 }, quantity: 3 }`
- WHEN `lineTotal(item)` is called
- THEN the result is `4500`

#### Scenario: Missing price defaults to 0

- GIVEN `item = { product: { price: undefined }, quantity: 3 }`
- WHEN `lineTotal(item)` is called
- THEN the result is `0`

---

### Requirement: CART-R5 — subtotal Is Sum of lineTotals

`subtotal(items)` MUST return the sum of `lineTotal(item)` for every item in the list. An empty list MUST return `0`.

#### Scenario: Multiple items

- GIVEN `items = [{ product: { price: 1000 }, quantity: 2 }, { product: { price: 500 }, quantity: 4 }]`
- WHEN `subtotal(items)` is called
- THEN the result is `4000`

#### Scenario: Empty cart

- GIVEN `items = []`
- WHEN `subtotal(items)` is called
- THEN the result is `0`

---

### Requirement: CART-R6 — qualifiesForFreeShipping Uses >= Threshold

`qualifiesForFreeShipping(subtotal)` MUST return `true` when `subtotal >= FREE_SHIPPING_THRESHOLD` (30000), and `false` when `subtotal < FREE_SHIPPING_THRESHOLD`. The operator MUST be `>=`. Using `>` is a bug.

#### Scenario: One below threshold — false

- GIVEN `subtotal = 29999`
- WHEN `qualifiesForFreeShipping(subtotal)` is called
- THEN the result is `false`

#### Scenario: Exactly at threshold — true (BOUNDARY — locked)

- GIVEN `subtotal = 30000`
- WHEN `qualifiesForFreeShipping(subtotal)` is called
- THEN the result is `true`

#### Scenario: One above threshold — true

- GIVEN `subtotal = 30001`
- WHEN `qualifiesForFreeShipping(subtotal)` is called
- THEN the result is `true`

---

### Requirement: CART-R7 — shippingCost Returns 0 or SHIPPING_COST

`shippingCost(subtotal)` MUST return `0` when `qualifiesForFreeShipping(subtotal)` is true, and `SHIPPING_COST` (5000) otherwise. It MUST NOT contain independent threshold logic — it MUST delegate to `qualifiesForFreeShipping`.

#### Scenario: Free shipping qualifies

- GIVEN `subtotal = 30000`
- WHEN `shippingCost(subtotal)` is called
- THEN the result is `0`

#### Scenario: Paid shipping applies

- GIVEN `subtotal = 29999`
- WHEN `shippingCost(subtotal)` is called
- THEN the result is `5000`

---

### Requirement: CART-R8 — cartTotal Is subtotal + shippingCost

`cartTotal(subtotal)` MUST return `subtotal + shippingCost(subtotal)`.

#### Scenario: Below threshold includes shipping

- GIVEN `subtotal = 20000`
- WHEN `cartTotal(subtotal)` is called
- THEN the result is `25000`

#### Scenario: At threshold shipping is free

- GIVEN `subtotal = 30000`
- WHEN `cartTotal(subtotal)` is called
- THEN the result is `30000`

---

### Requirement: CART-R9 — itemCount and itemQuantity Helpers

`itemCount(items)` MUST return the total number of items (sum of all quantities). `itemQuantity(items, productId)` MUST return the quantity of the item matching `productId`, or `0` if not found.

#### Scenario: itemCount sums quantities

- GIVEN `items = [{ quantity: 2 }, { quantity: 3 }]`
- WHEN `itemCount(items)` is called
- THEN the result is `5`

#### Scenario: itemQuantity finds by product_id

- GIVEN `items = [{ product: { product_id: 1 }, quantity: 2 }, { product: { product_id: 2 }, quantity: 3 }]`
- WHEN `itemQuantity(items, 2)` is called
- THEN the result is `3`

---

## Domain 2: cart-application (Store + Hooks)

Location: `features/cart/application/`

Zustand store adapter delegating to domain functions, selector hooks, and boundary mappers. May contain React imports, Zustand, analytics, but MUST NOT contain JSX/UI or direct domain logic (only delegation).

---

### Requirement: CART-A1 — Store Delegates All Math to Domain

The Zustand store at `features/cart/application/cart.store.ts` MUST NOT contain arithmetic for subtotal, shipping, or cart total. All such computations MUST be performed by calling domain functions from `features/cart/domain/cart.rules.ts`.

#### Scenario: addItem delegates to domain addItem

- GIVEN the store has `items = [...]`
- WHEN `addItem(product, quantity)` is called on the store
- THEN the store calls the domain `addItem` function and sets `items` to its return value
- AND no arithmetic for merging or totaling appears in the store callback

#### Scenario: setQuantity delegates to domain setQuantity

- GIVEN the store has a line with `product_id: 1`, `quantity: 3`
- WHEN `updateQuantity(1, 0)` is called on the store
- THEN the store calls domain `setQuantity` and the line is removed
- AND `items` reflects the domain function's return value

---

### Requirement: CART-A2 — Canonical Store Path and Re-export Shim

The canonical store file MUST be `features/cart/application/cart.store.ts`. The file `app/lib/stores/cart.store.ts` MUST contain only a re-export shim (`export * from '@/features/cart/application/cart.store'`) with no logic of its own. Existing consumers of `useCartStore` MUST compile and run unchanged.

#### Scenario: Shim preserves existing importers

- GIVEN a component imports `useCartStore` from `@/app/lib/stores/cart.store`
- WHEN TypeScript compiles
- THEN the import resolves to the canonical store without error
- AND all store actions are available as before

---

### Requirement: CART-A3 — Analytics Handlers Decoupled from Store Mutations

Analytics functions (`trackAddToCart`, `trackRemoveFromCart`) MUST be called outside Zustand `set(...)` callbacks, after state mutations complete. They MUST NOT be invoked inside the callback closure that modifies state.

#### Scenario: Analytics called exactly once per addItem

- GIVEN the store's `addItem` action is called
- WHEN the action completes
- THEN `trackAddToCart` is called exactly once
- AND `trackAddToCart` is NOT called inside the `set(...)` callback

---

### Requirement: CART-A4 — useCartSummary Exposes Domain-Derived Values (MODIFIED)

The `useCartSummary` hook MUST expose `{ subtotal, shipping, total, itemCount, finalTotal }` where each numeric value is derived exclusively from domain functions. `finalTotal` MUST be computed by calling `orderTotal(subtotal, discountAmount, shipping)` from `features/checkout/domain/` using `discountAmount` read from the store. No arithmetic for `finalTotal` MUST exist inside the hook body itself. This is the SINGLE canonical location for coupon-aware order total computation.

(Previously: hook exposed only `{ subtotal, shipping, total, itemCount }` — no coupon awareness, no finalTotal)

#### Scenario: Hook returns correct summary (no coupon)

- GIVEN the store has `items = [{ product: { price: 20000 }, quantity: 2 }]` and `discountAmount=0`
- WHEN `useCartSummary()` is called
- THEN `subtotal === 40000`, `shipping === 0`, `total === 40000`, `itemCount === 2`
- AND `finalTotal === 40000`

#### Scenario: finalTotal reflects coupon discount

- GIVEN store with `subtotal=20000`, `shipping=5000`, `discountAmount=3000`
- WHEN `useCartSummary()` is called
- THEN `finalTotal === orderTotal(20000, 3000, 5000)` (delegates to checkout domain, never inline)

#### Scenario: finalTotal never negative

- GIVEN `discountAmount` exceeds `subtotal + shipping`
- WHEN `useCartSummary()` is called
- THEN `finalTotal === 0` (orderTotal clamps at zero)

---

### Requirement: CART-A5 — CartProduct Boundary Adapter

The application layer MUST map the transport `Product` type to domain-owned `CartProduct` using the adapter function `toCartProduct(product: Product): CartProduct` in `features/cart/application/cart.mapper.ts`. This mapping MUST occur at the boundary before domain functions are called.

#### Scenario: toCartProduct extracts lean fields

- GIVEN a `Product` object with 20+ fields
- WHEN `toCartProduct(product)` is called
- THEN the result is a `CartProduct` with only 7 fields (product_id, name, price, image_url, slug, internal_sku, product_type)
- AND the result can be passed to domain functions unchanged

---

### Requirement: CART-A6 — Zero Behavior Change Except Threshold Fix

This refactor MUST NOT alter any externally observable behavior, with the single exception of the free-shipping threshold boundary: carts at exactly `subtotal === 30000` will now qualify for free shipping (previously they did not). All other scenarios MUST produce identical results before and after the refactor.

#### Scenario: Threshold-exact cart now qualifies (intended behavior change)

- GIVEN `subtotal === 30000`
- BEFORE this change: shipping cost was `5000` (threshold was `> 30000`)
- AFTER this change: shipping cost is `0` (threshold is `>= 30000`)
- THEN this is the ONLY observable difference

---

## Testing Requirements

### Requirement: CART-T1 — Domain Functions Tested TDD First (RED → GREEN)

Domain pure functions MUST have unit tests written before implementation (RED phase). Tests MUST be in `features/cart/domain/cart.rules.test.ts`. Tests MUST run in Node/Vitest with no browser or React dependencies.

#### Scenario: RED phase before implementation

- GIVEN `cart.rules.test.ts` is written
- WHEN `pnpm test:run` is executed with no implementation
- THEN tests fail (RED)
- AND after domain functions are implemented, all tests pass (GREEN)

---

### Requirement: CART-T2 — Boundary Scenarios Are Mandatory Test Cases

The threshold boundary MUST be tested with exactly three scenarios: `29999` (false), `30000` (true), `30001` (true) — as unit tests in `cart.rules.test.ts`. These tests MUST NOT be omitted or combined.

#### Scenario: All three boundary values tested individually

- GIVEN `cart.rules.test.ts` contains three separate `it()`/`test()` blocks for 29999, 30000, 30001
- WHEN `pnpm test:run` executes
- THEN all three pass with the expected boolean values

---

### Requirement: CART-T3 — Existing Store Tests MUST Keep Passing

The existing tests in the store test suite MUST pass after the refactor. Import paths in test files MUST be updated to point to the new canonical store or the shim as needed, but behavior assertions MUST remain identical.

#### Scenario: Test file imports updated, all assertions pass

- GIVEN the test file's import path is updated to resolve via the shim or canonical path
- WHEN `pnpm test:run` executes
- THEN all tests pass with zero changes to assertion logic

---

## Architectural Pattern (Template for Future Slices)

This change establishes the `features/{name}/{domain,application}` pattern that MUST be followed by all future vertical slices:

### Directory Structure

```
features/
  cart/
    domain/
      cart.types.ts          (CartItem, CartProduct — domain-owned types)
      cart.constants.ts      (FREE_SHIPPING_THRESHOLD, SHIPPING_COST)
      cart.rules.ts          (pure functions: addItem, removeItem, setQuantity, lineTotal, subtotal, etc.)
      cart.rules.test.ts     (unit tests, TDD first)
    application/
      cart.store.ts          (Zustand store, delegates to domain)
      use-cart.ts            (forward-path hook)
      use-cart-summary.ts    (summary selector hook)
      cart.mapper.ts         (Product → CartProduct adapter)
      cart.mapper.test.ts    (adapter tests)
      cart.store.test.ts     (integration tests, relocated from app/)
```

### Dependency Direction

- **domain** ← application ← ui (future)
- domain MUST have zero imports from application, app/, or ui/
- application MAY import from domain
- ui (future) MAY import from application but MUST NOT import from domain

### Re-export Shim Pattern

When moving code from `app/lib/` to `features/`, always create a one-line re-export shim at the old path:

```typescript
// app/lib/stores/cart.store.ts
export * from '@/features/cart/application/cart.store'
```

This ensures all existing importers compile unchanged with zero refactoring of consumer code.

### @ Alias Configuration

The `@/*` alias in `tsconfig.json` MUST resolve to the repository root (`./*`). This allows `@/features/cart/...` to resolve consistently in:
- Next.js runtime
- TypeScript compiler
- Vitest test runner

No per-environment configuration needed.

---

## Coupon State (added by checkout-hexagonal-slice)

### Requirement: CART-A7 — Store Gains Coupon State and Actions (ADDED)

`features/cart/application/cart.store.ts` MUST add three new fields and two new actions to the persisted Zustand store:

- `appliedCoupon: string | null` — default `null`
- `discountAmount: number` — default `0`
- `setCoupon(code: string, amount: number): void` — sets both fields atomically
- `clearCoupon(): void` — resets both to defaults

All four MUST be included in the `persist` middleware configuration so coupon state survives page navigation.

#### Scenario: Coupon is set and persisted

- GIVEN the store is hydrated with no coupon
- WHEN `setCoupon('PROMO20', 5000)` is called
- THEN `appliedCoupon === 'PROMO20'` and `discountAmount === 5000`

#### Scenario: Coupon is cleared

- GIVEN `appliedCoupon='PROMO20'` and `discountAmount=5000`
- WHEN `clearCoupon()` is called
- THEN `appliedCoupon === null` and `discountAmount === 0`

#### Scenario: Hydration with old persisted cart (missing coupon fields)

- GIVEN a localStorage entry that has no `appliedCoupon` or `discountAmount` keys (old cart)
- WHEN the store hydrates from localStorage
- THEN `appliedCoupon` defaults to `null` and `discountAmount` defaults to `0`
- AND no runtime error occurs

---

### Requirement: CART-A8 — CartDrawer Reads and Writes Coupon via Store (ADDED)

`app/components/CartDrawer.tsx` MUST read `appliedCoupon` and `discountAmount` from `useCartStore`, and MUST write coupon state via `setCoupon`/`clearCoupon` store actions. Local component state for coupon MUST be removed. The displayed discount MUST come from `discountAmount` in the store.

#### Scenario: Coupon survives drawer close and checkout navigation

- GIVEN a coupon is applied in CartDrawer (`setCoupon` called)
- WHEN the drawer is closed and the user navigates to `/checkout`
- THEN `useCartStore.getState().appliedCoupon` is non-null
- AND `useCartStore.getState().discountAmount` is the applied amount

#### Scenario: Clearing coupon in drawer updates store

- GIVEN `appliedCoupon='SAVE10'` in the store
- WHEN the user removes the coupon in CartDrawer
- THEN `clearCoupon()` is called and store returns to defaults

---

### Requirement: CART-A9 — Coupon Wired Through Checkout Payload (ADDED)

`app/checkout/page.tsx` MUST read `appliedCoupon` and `discountAmount` from `useCartStore`, pass them to `toOrderPayload` via `couponCode`, and render a discount line in the order summary. This is a MINIMAL surgical edit — no strangle of the page.

#### Scenario: End-to-end coupon in order payload

- GIVEN a user applies coupon `'PROMO10'` in CartDrawer (store: `appliedCoupon='PROMO10'`, `discountAmount=2000`)
- WHEN the user navigates to checkout and submits the order
- THEN the payload sent to `/api/orders` includes `coupon_code: 'PROMO10'`
- AND the checkout summary displays a discount line of `2000`

#### Scenario: No coupon — no coupon_code in payload

- GIVEN `appliedCoupon === null`
- WHEN the order is submitted
- THEN `coupon_code` is absent from the payload

---

## Domain 3: cart-ui Layer (Presentational + Container-Presentational)

Location: `features/cart/ui/`

UI layer for cart implementing the container-presentational split and atomic component taxonomy. All presentational components (atoms, molecules, organisms) accept props only. Containers consume application hooks and store state. This layer establishes the first RTL test precedent and serves as the pattern template for future UI slices (checkout, catalog).

### Architectural Foundation: Layering Purity

The `features/cart/ui/` layer MUST import only from `features/cart/application/` (hooks, types) and `features/cart/domain/` (types). It MUST NOT import from `features/cart/application/cart.store.ts` directly in any presentational component (atoms, molecules, organisms). Containers are the SOLE point of store/hook consumption within `ui/`. No infrastructure import is permitted at any level of `ui/`.

---

### Requirement: CARTUI-ARCH — UI Layer Dependency Direction

The `features/cart/ui/` layer MUST import only from `features/cart/application/` (hooks, types) and `features/cart/domain/` (types). It MUST NOT import from `features/cart/application/cart.store.ts` directly in any presentational component (atoms, molecules, organisms). Containers are the SOLE point of store/hook consumption within `ui/`. No infrastructure import is permitted at any level of `ui/`.

#### Scenario: Presentational component has no store/hook import

- GIVEN any file under `features/cart/ui/atoms/`, `molecules/`, or `organisms/`
- WHEN TypeScript resolves all imports
- THEN zero imports from `cart.store`, `useCartStore`, or any `@/features/*/infrastructure/` path exist in that file

#### Scenario: Container imports hooks, not store

- GIVEN `CartDrawerContainer.tsx` or `CartPageContainer.tsx`
- WHEN TypeScript resolves all imports
- THEN the container imports `useCart`, `useCartSummary`, `useCartDrawer` from `features/cart/application/`
- AND the container does NOT call `useCartStore` for cart items, quantities, or totals

---

### Requirement: CARTUI-ATOM-1 — QuantityStepper (Pure Props)

`features/cart/ui/atoms/QuantityStepper.tsx` MUST accept `{ quantity: number; onIncrement: () => void; onDecrement: () => void; onRemove: () => void }` and render decrement, quantity display, and increment controls. When `quantity === 1`, decrement MUST trigger `onRemove` (not `onDecrement`).

#### Scenario: Increment calls onIncrement

- GIVEN `QuantityStepper` rendered with `quantity=2`
- WHEN the user clicks the increment control
- THEN `onIncrement` is called once and `onDecrement`/`onRemove` are not called

#### Scenario: Decrement at quantity > 1 calls onDecrement

- GIVEN `QuantityStepper` rendered with `quantity=3`
- WHEN the user clicks the decrement control
- THEN `onDecrement` is called once

#### Scenario: Decrement at quantity === 1 calls onRemove

- GIVEN `QuantityStepper` rendered with `quantity=1`
- WHEN the user clicks the decrement control
- THEN `onRemove` is called once and `onDecrement` is not called

---

### Requirement: CARTUI-ATOM-2 — CartItemImage (next/image wrapper)

`features/cart/ui/atoms/CartItemImage.tsx` MUST render a `next/image` `Image` component with the given `src` URL. When `src` is falsy or the image fails to load, the component MUST render a visible fallback element (placeholder or alt text visible in the DOM).

#### Scenario: Valid src renders image

- GIVEN `CartItemImage` rendered with `src="https://cdn.example.com/ring.jpg"` and `alt="Ring"`
- WHEN the component renders
- THEN an `<img>` element with `src` containing the provided URL is present in the DOM

#### Scenario: Missing src renders fallback

- GIVEN `CartItemImage` rendered with `src=""` or `src={undefined}`
- WHEN the component renders
- THEN a fallback element (img with placeholder src, or a non-empty alt attribute) is present in the DOM

---

### Requirement: CARTUI-ATOM-3 — CartEmptyState (variant prop)

`features/cart/ui/atoms/CartEmptyState.tsx` MUST accept `{ variant: 'drawer' | 'page' }` and render appropriate empty-state content. Both variants MUST render a visible message in the DOM. The `page` variant MUST include a call-to-action link to continue shopping.

#### Scenario: Drawer variant renders empty message

- GIVEN `CartEmptyState` rendered with `variant="drawer"`
- WHEN the component renders
- THEN a non-empty text node indicating the cart is empty is present in the DOM

#### Scenario: Page variant renders empty message and CTA

- GIVEN `CartEmptyState` rendered with `variant="page"`
- WHEN the component renders
- THEN a non-empty text node indicating the cart is empty is present
- AND a link or button for continuing shopping is present in the DOM

---

### Requirement: CARTUI-ATOM-4 — CartLinePrice (domain parity)

`features/cart/ui/atoms/CartLinePrice.tsx` MUST accept `{ item: CartItem }`, call `lineTotal(item)` from `features/cart/domain/cart.rules`, and display the result formatted via `formatPrice` from `features/catalog/domain/catalog.rules`. The rendered output MUST be identical to `Math.round(lineTotal(item)).toLocaleString('es-CL')`. No inline arithmetic is permitted.

#### Scenario: Renders correct line price

- GIVEN `CartLinePrice` rendered with `item = { product: { price: 5990 }, quantity: 2 }`
- WHEN the component renders
- THEN the DOM contains the text `'11.980'` (formatPrice(lineTotal(item)) = formatPrice(11980) = '11.980')

#### Scenario: Zero price renders zero

- GIVEN `item = { product: { price: 0 }, quantity: 3 }`
- WHEN `CartLinePrice` renders
- THEN the DOM contains `'0'`

---

### Requirement: CARTUI-MOL-1 — CartItemRow (molecule)

`features/cart/ui/molecules/CartItemRow.tsx` MUST accept `{ item: CartItem; onIncrement: () => void; onDecrement: () => void; onRemove: () => void }` and compose `CartItemImage`, item name, SKU, `CartLinePrice`, and `QuantityStepper`. It MUST NOT import from any store or hook.

#### Scenario: Renders item details from props

- GIVEN `CartItemRow` rendered with a `CartItem` containing `product.name="Anillo Jade"` and `product.internal_sku="SKU-001"`
- WHEN the component renders
- THEN the DOM contains the text `"Anillo Jade"` and `"SKU-001"`

#### Scenario: Callbacks wired to stepper

- GIVEN `CartItemRow` rendered with mock `onIncrement` and `onRemove` callbacks
- WHEN the stepper increment is clicked
- THEN `onIncrement` is invoked once

---

### Requirement: CARTUI-MOL-2 — CartSummaryPanel (molecule)

`features/cart/ui/molecules/CartSummaryPanel.tsx` MUST accept `{ subtotal: number; shipping: number; discountAmount: number; finalTotal: number; onCheckout: () => void; onContinueShopping: () => void }` and render subtotal, shipping, conditional discount row (only when `discountAmount > 0`), total, and two CTAs. All amounts MUST be displayed via `formatPrice`. It MUST NOT import from any store or hook.

#### Scenario: Renders all summary values

- GIVEN `CartSummaryPanel` with `subtotal=20000`, `shipping=5000`, `discountAmount=0`, `finalTotal=25000`
- WHEN the component renders
- THEN the DOM contains formatted values for subtotal (`'20.000'`), shipping (`'5.000'`), and total (`'25.000'`)

#### Scenario: Discount row shown only when discountAmount > 0

- GIVEN `CartSummaryPanel` with `discountAmount=2000`
- WHEN the component renders
- THEN a discount line showing `'2.000'` is present in the DOM

#### Scenario: Discount row hidden when discountAmount === 0

- GIVEN `CartSummaryPanel` with `discountAmount=0`
- WHEN the component renders
- THEN no discount line is present in the DOM

---

### Requirement: CARTUI-ORG-1 — CartItemList (organism)

`features/cart/ui/organisms/CartItemList.tsx` MUST accept `{ items: CartItem[]; onIncrement: (id: number) => void; onDecrement: (id: number) => void; onRemove: (id: number) => void; variant: 'drawer' | 'page' }`. When `items` is empty, it MUST render `CartEmptyState` with the matching `variant`. When `items` is non-empty, it MUST render one `CartItemRow` per item.

#### Scenario: Empty items renders empty state

- GIVEN `CartItemList` with `items=[]` and `variant="drawer"`
- WHEN the component renders
- THEN `CartEmptyState` is rendered (empty message visible in DOM)
- AND no item rows are rendered

#### Scenario: Non-empty items renders item rows

- GIVEN `CartItemList` with two `CartItem` entries
- WHEN the component renders
- THEN two item row elements are rendered in the DOM

---

### Requirement: CARTUI-ORG-2 — CartDrawerPanel (organism)

`features/cart/ui/organisms/CartDrawerPanel.tsx` MUST accept `{ isOpen: boolean; onClose: () => void; items: CartItem[]; summary: CartSummaryProps; onIncrement: ...; onDecrement: ...; onRemove: ...; children?: ReactNode }` and render the drawer chrome (animated shell, overlay, header with close button, scrollable body, footer). The animated shell MUST use `motion/react` (`AnimatePresence` + `motion.div`). Tests MUST NOT render this organism directly; they MUST test inner panels without the animated shell.

#### Scenario: Close button calls onClose

- GIVEN `CartDrawerPanel` rendered with `isOpen=true` and a mock `onClose`
- WHEN the close button is clicked
- THEN `onClose` is called once

#### Scenario: Overlay click calls onClose

- GIVEN `CartDrawerPanel` rendered with `isOpen=true`
- WHEN the overlay/backdrop area is clicked
- THEN `onClose` is called once

---

### Requirement: CARTUI-ORG-3 — CartPageLayout (organism)

`features/cart/ui/organisms/CartPageLayout.tsx` MUST accept `{ items: CartItem[]; summary: CartSummaryProps; onIncrement: ...; onDecrement: ...; onRemove: ...; breadcrumb?: ReactNode }` and render a two-column grid layout: item list column (left) and sticky summary panel column (right).

#### Scenario: Renders both columns

- GIVEN `CartPageLayout` with two items and a summary
- WHEN the component renders
- THEN both the item list area and the summary panel area are present in the DOM

---

### Requirement: CARTUI-CONT-1 — CartDrawerContainer

`features/cart/ui/containers/CartDrawerContainer.tsx` MUST consume `useCart()`, `useCartSummary()`, and `useCartDrawer()` exclusively. It MUST pass all required props to `CartDrawerPanel`. It MUST NOT contain JSX layout logic — all presentation is delegated to organisms. Coupon state (`appliedCoupon`, `discountAmount`, `setCoupon`, `clearCoupon`) MAY be read directly from `useCartStore` as a simple store read (not hook delegation anti-pattern).

#### Scenario: Hook values propagate to drawer panel

- GIVEN `useCart` mocked with `items=[{...}]` and `useCartDrawer` mocked with `isOpen=true`
- WHEN `CartDrawerContainer` renders
- THEN `CartDrawerPanel` receives `isOpen=true` and the items are reflected in the item list

#### Scenario: Remove item calls useCart removeItem

- GIVEN `CartDrawerContainer` rendered with a mock `removeItem` from `useCart`
- WHEN `onRemove` is triggered from a child item row
- THEN `removeItem` is called with the correct `product_id`

---

### Requirement: CARTUI-CONT-2 — CartPageContainer

`features/cart/ui/containers/CartPageContainer.tsx` MUST consume `useCart()` and `useCartSummary()`. It MUST implement the hydration guard (`mounted` state + `useEffect`) before rendering content. It MUST call `trackViewCart` exactly once per entry via a `tracked` ref and the `mounted` guard. It MUST render `CartSkeleton` while `mounted === false`. It MUST NOT contain JSX layout logic.

#### Scenario: Renders skeleton before mounted

- GIVEN `CartPageContainer` on first render (before `useEffect` fires)
- WHEN the component renders
- THEN `CartSkeleton` is present in the DOM and `CartPageLayout` is not

#### Scenario: trackViewCart called once per mount

- GIVEN `CartPageContainer` rendered with `trackViewCart` mocked
- WHEN the component mounts and `mounted` becomes true
- THEN `trackViewCart` is called exactly once

---

### Requirement: CARTUI-HOOK-1 — useCartDrawer Hook

`features/cart/application/use-cart-drawer.ts` MUST expose `{ isOpen: boolean; openCart: () => void; closeCart: () => void; toggleCart: () => void }`. It MUST derive these from `useCartStore` selectors. It MUST NOT contain drawer presentation logic.

#### Scenario: isOpen reflects store state

- GIVEN `useCartStore` has `isOpen=false`
- WHEN `useCartDrawer()` is called
- THEN `isOpen === false`

#### Scenario: toggleCart flips open state

- GIVEN `useCartDrawer()` with `isOpen=false`
- WHEN `toggleCart()` is called
- THEN `isOpen` becomes `true` on the next render

---

### Requirement: CARTUI-SWAP — Consumer Swap (Zero Behavior Change)

`app/components/CartDrawer.tsx` MUST render `CartDrawerContainer` and delegate all rendering to it. `app/carrito/page.tsx` MUST render `CartPageContainer` and delegate all rendering to it. All preserved behaviors MUST remain identical after the swap: drawer animation, scroll-lock, hydration skeleton, `trackViewCart` once-per-entry, toast on remove, coupon apply/clear, `CartCrossSell`, `FreeShippingProgress`, `CouponInput`, checkout CTA, continue-shopping CTA.

#### Scenario: CartDrawer renders container

- GIVEN `app/components/CartDrawer.tsx` after the swap
- WHEN it renders
- THEN `CartDrawerContainer` is the root element rendered (no direct store reads, no inline JSX)

#### Scenario: Carrito page renders container

- GIVEN `app/carrito/page.tsx` after the swap
- WHEN it renders
- THEN `CartPageContainer` is the root element rendered

#### Scenario: Scroll-lock preserved

- GIVEN the CartDrawer is opened
- WHEN `isOpen=true`
- THEN `document.body.style.overflow` is `'hidden'` (scroll lock active, as before)

#### Scenario: Toast on remove preserved

- GIVEN the user removes an item in either drawer or page
- WHEN `onRemove` fires
- THEN a toast notification appears (identical to current behavior)

---

### Requirement: CARTUI-FIX — Domain Violation Removal

All 6 inline domain violations MUST be replaced. No file in `features/cart/ui/` or the consumer swap files MAY contain inline arithmetic for price formatting, line total, or order total calculation.

| Site | Before | After |
|------|--------|-------|
| CartDrawer finalTotal | `Math.max(0, getTotal - discountAmount)` | `useCartSummary().finalTotal` |
| CartDrawer unit price | inline `toLocaleString('es-CL')` | `formatPrice(item.product.price)` |
| carrito/page.tsx line total | inline `* item.quantity` | `lineTotal(item)` + `formatPrice` |
| carrito/page.tsx unit price | inline `toLocaleString('es-CL')` | `formatPrice(item.product.price)` |
| AbandonedCartModal totalPrice | inline `reduce(...)` | `subtotal(items)` from domain |
| CartCrossSell price | inline `toLocaleString('es-CL')` | `formatPrice(p.price)` |

#### Scenario: No inline price formatting in ui/ files

- GIVEN the full `features/cart/ui/` directory
- WHEN source files are scanned for `.toLocaleString('es-CL')`
- THEN zero matches are found

#### Scenario: getTotal selector anti-pattern removed

- GIVEN all container files after the swap
- WHEN source is scanned for `useCartStore((state) => state.getTotal())`
- THEN zero matches are found

---

### Testing Requirements

#### Requirement: CARTUI-T1 — Test Infrastructure (Mocks)

`__mocks__/next-image.tsx` MUST exist and export a default function that renders a standard `<img>` element passing all props through. A `motion/react` mock MUST be established via `vi.mock('motion/react', ...)` in test setup or per-file, rendering children without animation. These mocks are the reusable precedent for all future UI slices.

##### Scenario: next/image mock renders img element

- GIVEN `__mocks__/next-image.tsx` is present
- WHEN a test renders a component that imports `next/image`
- THEN an `<img>` element appears in the DOM without test errors

##### Scenario: motion/react mock renders children

- GIVEN `vi.mock('motion/react', ...)` is active
- WHEN a test renders a component using `AnimatePresence` or `motion.div`
- THEN children render in the DOM without jsdom animation errors

---

#### Requirement: CARTUI-T2 — Atom and Molecule Tests (Render + Props)

Every atom and every molecule MUST have a colocated `.test.tsx` file. Each test MUST render the component with explicit props and assert DOM output. Price-displaying components (`CartLinePrice`, `CartSummaryPanel`) MUST assert exact formatted strings matching `formatPrice` output (es-CL locale). No store or hook mocks are required for atoms/molecules.

##### Scenario: CartLinePrice test asserts exact es-CL format

- GIVEN `CartLinePrice.test.tsx` with `item = { product: { price: 5990 }, quantity: 2 }`
- WHEN `pnpm test:run` executes
- THEN the test asserts the DOM contains `'11.980'` (exact string)

##### Scenario: QuantityStepper test asserts callback invocation

- GIVEN `QuantityStepper.test.tsx` with mock callbacks rendered
- WHEN the increment button is clicked via `fireEvent`
- THEN `onIncrement` is called once and `onDecrement`/`onRemove` are not

---

#### Requirement: CARTUI-T3 — Container Tests (Mocked Hooks)

`CartDrawerContainer` and `CartPageContainer` MUST have `.test.tsx` files. Tests MUST mock application hooks via `vi.mock('@/features/cart/application/use-cart')`, `vi.mock('@/features/cart/application/use-cart-summary')`, and `vi.mock('@/features/cart/application/use-cart-drawer')`. Tests MUST assert that mocked hook values appear in rendered output and that callbacks (remove, increment, decrement) are wired to the correct hook actions.

##### Scenario: CartDrawerContainer test with mocked hooks

- GIVEN `useCart` mocked to return `{ items: [mockItem], removeItem: mockFn }`
- AND `useCartDrawer` mocked to return `{ isOpen: true, closeCart: mockFn }`
- WHEN `CartDrawerContainer` renders
- THEN the mock item's name appears in the DOM

##### Scenario: CartPageContainer test verifies hydration guard

- GIVEN `CartPageContainer` on initial render before `useEffect` fires
- WHEN RTL renders the component
- THEN `CartSkeleton` is in the DOM (not `CartPageLayout`)

---

#### Requirement: CARTUI-T4 — Existing Tests Stay Green

All 397 pre-existing tests MUST continue to pass after this change. `pnpm test:run` MUST exit zero with no regressions.

##### Scenario: Full suite green after strangle

- GIVEN the full implementation is applied
- WHEN `pnpm test:run` executes
- THEN all pre-existing 397 tests pass
- AND new CARTUI tests also pass (zero test failures total)

---

## Out of Scope

The following are explicitly deferred and MUST NOT be introduced in this change:

| Topic | Reason |
|---|---|
| Price snapshot at add-time | Explicitly out of scope (live price kept) |
| Stock validation in domain addItem | Future guard, not this slice |
| selectedVariant field removal | Leave as-is |
| CouponInput async split (useCouponValidation) | Deferred; render as-is, flag tech debt |
| AbandonedCartModal arithmetic fix | Flagged in CARTUI-FIX table; structural refactor deferred |
| CartCrossSell deep refactor | Keep internal store mapping; move to containers/ only if clean |
| checkout / catalog UI strangles | Follow-up slices |
| CartCrossSell CrossSellCard atom | Follow-up (only if CartCrossSell moves to containers/) |

---

## Shipped Evidence

**PR #35**: feat(cart): hexagonal vertical slice — domain + application (pattern-setter)
- **Commits**: 
  - `4389e9e` — Main feature commits (domain, application, shim, threshold fixes)
  - `80e50aa` — W-001 fix (CartProduct domain type, boundary adapter)
- **Test results**: 327/327 passing (27 domain + 19 store + 6 mapper)
- **TypeScript**: zero errors
- **Verification**: PASS (0 CRITICAL, 2 WARNING, 2 SUGGESTION)
- **Branch**: feat/cart-hexagonal-slice → main (squash merge expected post-archive)

---

**PR #38**: feat(cart-ui): UI strangle (container-presentational + atomic + RTL test precedent)
- **Commits**:
  - `576a340` — Main feature commits (mocks, atoms, molecules, organisms, containers, consumer swap, domain fixes, useCartDrawer, useCartSummary.finalTotal)
  - `7f1edfb` — Verify-fix patch (CartSummaryPanel checkoutHref, CartPageContainer page header, CartDrawerContainer CartCrossSell mock, use-cart-summary exact assertions)
- **Test results**: 449 tests passing (397 pre-existing + 46 new CARTUI + 6 verify-fix new)
- **TypeScript**: zero errors
- **Verification**: PASS WITH WARNINGS (0 CRITICAL, 3 WARNING, 3 SUGGESTION)
  - W1 (carrito/page.tsx not pure thin shell) — FIXED (page header moved into CartPageContainer)
  - W3 (CartDrawerContainer.test.tsx act() warnings) — FIXED (CartCrossSell mocked)
  - S3 (checkout CTA missing navigation) — FIXED (CartSummaryPanel.checkoutHref prop wired)
- **Branch**: feat/cart-ui-strangle → main (squash merge, commit 576a340 + verify-fix 7f1edfb)
- **Architectural Pattern**: Established features/cart/ui/ as reusable template for all future UI slices; global next-image + motion-react mocks via vitest alias; container-presentational + atomic taxonomy; RTL .test.tsx precedent
