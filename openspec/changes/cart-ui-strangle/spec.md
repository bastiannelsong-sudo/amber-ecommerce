# Spec: Cart UI Strangle (cart-ui-strangle)

**Requirement prefix**: CARTUI-*
**Domains affected**: cart-ui (NEW), cart-application (MODIFIED — useCartSummary)
**Behavior change**: NONE (internal architecture strangle; all observable behavior preserved)

---

## Part 1 — NEW Capability: cart-ui Layer

### Purpose

Introduce `features/cart/ui/` as the canonical UI layer for cart. Establish the container-presentational split, atomic component taxonomy (atoms → molecules → organisms → containers), and the first RTL `.test.tsx` precedent. Dependency direction: domain ← application ← ui. Presentational components are pure-props. Containers consume application hooks only.

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

## Part 2 — MODIFIED Capability: cart-application (useCartSummary.finalTotal)

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

## Part 3 — Testing Requirements

### Requirement: CARTUI-T1 — Test Infrastructure (Mocks)

`__mocks__/next-image.tsx` MUST exist and export a default function that renders a standard `<img>` element passing all props through. A `motion/react` mock MUST be established via `vi.mock('motion/react', ...)` in test setup or per-file, rendering children without animation. These mocks are the reusable precedent for all future UI slices.

#### Scenario: next/image mock renders img element

- GIVEN `__mocks__/next-image.tsx` is present
- WHEN a test renders a component that imports `next/image`
- THEN an `<img>` element appears in the DOM without test errors

#### Scenario: motion/react mock renders children

- GIVEN `vi.mock('motion/react', ...)` is active
- WHEN a test renders a component using `AnimatePresence` or `motion.div`
- THEN children render in the DOM without jsdom animation errors

---

### Requirement: CARTUI-T2 — Atom and Molecule Tests (Render + Props)

Every atom and every molecule MUST have a colocated `.test.tsx` file. Each test MUST render the component with explicit props and assert DOM output. Price-displaying components (`CartLinePrice`, `CartSummaryPanel`) MUST assert exact formatted strings matching `formatPrice` output (es-CL locale). No store or hook mocks are required for atoms/molecules.

#### Scenario: CartLinePrice test asserts exact es-CL format

- GIVEN `CartLinePrice.test.tsx` with `item = { product: { price: 5990 }, quantity: 2 }`
- WHEN `pnpm test:run` executes
- THEN the test asserts the DOM contains `'11.980'` (exact string)

#### Scenario: QuantityStepper test asserts callback invocation

- GIVEN `QuantityStepper.test.tsx` with mock callbacks rendered
- WHEN the increment button is clicked via `fireEvent`
- THEN `onIncrement` is called once and `onDecrement`/`onRemove` are not

---

### Requirement: CARTUI-T3 — Container Tests (Mocked Hooks)

`CartDrawerContainer` and `CartPageContainer` MUST have `.test.tsx` files. Tests MUST mock application hooks via `vi.mock('@/features/cart/application/use-cart')`, `vi.mock('@/features/cart/application/use-cart-summary')`, and `vi.mock('@/features/cart/application/use-cart-drawer')`. Tests MUST assert that mocked hook values appear in rendered output and that callbacks (remove, increment, decrement) are wired to the correct hook actions.

#### Scenario: CartDrawerContainer test with mocked hooks

- GIVEN `useCart` mocked to return `{ items: [mockItem], removeItem: mockFn }`
- AND `useCartDrawer` mocked to return `{ isOpen: true, closeCart: mockFn }`
- WHEN `CartDrawerContainer` renders
- THEN the mock item's name appears in the DOM

#### Scenario: CartPageContainer test verifies hydration guard

- GIVEN `CartPageContainer` on initial render before `useEffect` fires
- WHEN RTL renders the component
- THEN `CartSkeleton` is in the DOM (not `CartPageLayout`)

---

### Requirement: CARTUI-T4 — Existing Tests Stay Green

All 397 pre-existing tests MUST continue to pass after this change. `pnpm test:run` MUST exit zero with no regressions.

#### Scenario: Full suite green after strangle

- GIVEN the full implementation is applied
- WHEN `pnpm test:run` executes
- THEN all pre-existing 397 tests pass
- AND new CARTUI tests also pass (zero test failures total)

---

## Out of Scope

| Topic | Reason |
|-------|--------|
| CouponInput async split (useCouponValidation) | Deferred; render as-is, flag tech debt |
| AbandonedCartModal arithmetic fix | Flagged in CARTUI-FIX table; structural refactor deferred |
| CartCrossSell deep refactor | Keep internal store mapping; move to containers/ only if clean |
| checkout / catalog UI strangles | Follow-up slices |
| CartCrossSell CrossSellCard atom | Follow-up (only if CartCrossSell moves to containers/) |
