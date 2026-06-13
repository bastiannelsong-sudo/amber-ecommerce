# Cart Hexagonal Slice — Specification

**Change**: cart-hexagonal-slice
**Scope**: domain + application layers only (UI deferred)
**Type**: New Capabilities (no existing openspec/specs/cart/ baseline)

---

## Capability: cart-domain

Full specification for `features/cart/domain/` — pure, framework-free functions.

---

### Requirement: CART-C1 — Canonical Constants

The domain MUST export a single source of truth for all numeric thresholds.
`FREE_SHIPPING_THRESHOLD` MUST equal `30000`. `SHIPPING_COST` MUST equal `5000`.
No other file in the codebase MAY hard-code these values.

#### Scenario: Constants are importable from the domain

- GIVEN the file `features/cart/domain/cart.constants.ts` exists
- WHEN any file imports `FREE_SHIPPING_THRESHOLD` or `SHIPPING_COST`
- THEN the values are `30000` and `5000` respectively

---

### Requirement: CART-D1 — CartItem Type Location

`CartItem` MUST be defined in `features/cart/domain/cart.types.ts`.
`app/lib/types.ts` MUST re-export `CartItem` from that canonical path so existing consumers compile unchanged.

#### Scenario: Legacy import path resolves

- GIVEN a file imports `CartItem` from `@/app/lib/types`
- WHEN TypeScript compiles
- THEN the import resolves without error and the type is identical to the domain definition

---

### Requirement: CART-R1 — addItem Merges Same Product

When `addItem` is called with a `product_id` already present in the item list, the system MUST merge the new quantity into the existing line (no duplicate lines).

#### Scenario: Same product added twice sums quantities

- GIVEN `items = [{ product: { product_id: 'A', price: 100 }, quantity: 2 }]`
- WHEN `addItem(items, { product_id: 'A', price: 100 }, 3)` is called
- THEN the result contains exactly one line for product `A` with `quantity === 5`

#### Scenario: Different product appends a new line

- GIVEN `items = [{ product: { product_id: 'A', price: 100 }, quantity: 2 }]`
- WHEN `addItem(items, { product_id: 'B', price: 200 }, 1)` is called
- THEN the result contains two lines: `A` with `quantity === 2` and `B` with `quantity === 1`

---

### Requirement: CART-R2 — removeItem Removes by product_id

`removeItem` MUST return the item list with the entry matching the given `product_id` removed. If the `product_id` is not present, the list MUST be returned unchanged.

#### Scenario: Existing item is removed

- GIVEN `items = [{ product: { product_id: 'A' }, quantity: 1 }, { product: { product_id: 'B' }, quantity: 1 }]`
- WHEN `removeItem(items, 'A')` is called
- THEN the result contains only the `B` line

#### Scenario: Non-existent product_id is a no-op

- GIVEN `items = [{ product: { product_id: 'A' }, quantity: 1 }]`
- WHEN `removeItem(items, 'Z')` is called
- THEN the result is identical to the input (length 1, product `A` present)

---

### Requirement: CART-R3 — setQuantity Removes Line When qty <= 0

`setQuantity` MUST update the quantity for the matching line. If the new quantity is `<= 0`, the line MUST be removed from the list entirely.

#### Scenario: Positive quantity updates the line

- GIVEN `items = [{ product: { product_id: 'A', price: 100 }, quantity: 1 }]`
- WHEN `setQuantity(items, 'A', 4)` is called
- THEN the result contains one line for `A` with `quantity === 4`

#### Scenario: Zero quantity removes the line

- GIVEN `items = [{ product: { product_id: 'A', price: 100 }, quantity: 3 }]`
- WHEN `setQuantity(items, 'A', 0)` is called
- THEN the result is an empty array

#### Scenario: Negative quantity removes the line

- GIVEN `items = [{ product: { product_id: 'A', price: 100 }, quantity: 3 }]`
- WHEN `setQuantity(items, 'A', -1)` is called
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

`qualifiesForFreeShipping(subtotal)` MUST return `true` when `subtotal >= FREE_SHIPPING_THRESHOLD` (30000), and `false` when `subtotal < FREE_SHIPPING_THRESHOLD`.
The operator MUST be `>=`. Using `>` is a bug.

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

## Capability: cart-application

Specification for `features/cart/application/` — Zustand store adapter and selector hooks.

---

### Requirement: CART-A1 — Store Delegates All Math to Domain

The Zustand store at `features/cart/application/cart.store.ts` MUST NOT contain arithmetic for subtotal, shipping, or cart total. All such computations MUST be performed by calling domain functions from `features/cart/domain/cart.rules.ts`.

#### Scenario: addItem delegates to domain addItem

- GIVEN the store has `items = [...]`
- WHEN `addItem(product, quantity)` is called on the store
- THEN the store calls the domain `addItem` function and sets `items` to its return value
- AND no arithmetic for merging or totaling appears in the store callback

#### Scenario: setQuantity delegates to domain setQuantity

- GIVEN the store has a line with `product_id: 'X'`, `quantity: 3`
- WHEN `updateQuantity('X', 0)` is called on the store
- THEN the store calls domain `setQuantity` and the line is removed
- AND `items` reflects the domain function's return value

---

### Requirement: CART-A2 — Canonical Store Path and Re-export Shim

The canonical store file MUST be `features/cart/application/cart.store.ts`.
The file `app/lib/stores/cart.store.ts` MUST contain only a re-export shim (`export * from '@/features/cart/application/cart.store'`) with no logic of its own. Existing consumers of `useCartStore` MUST compile and run unchanged.

#### Scenario: Shim preserves existing importers

- GIVEN a component imports `useCartStore` from `@/app/lib/stores/cart.store`
- WHEN TypeScript compiles
- THEN the import resolves to the canonical store without error
- AND all store actions are available as before

---

### Requirement: CART-A3 — Analytics Side-effects Outside Store Mutations

`trackAddToCart` and `trackRemoveFromCart` MUST NOT be called inside Zustand `set` callbacks. They MUST be called at the application layer (e.g., in the action wrappers or hooks), after the state mutation completes.

#### Scenario: Analytics called exactly once per addItem

- GIVEN the store's `addItem` action is called
- WHEN the action completes
- THEN `trackAddToCart` is called exactly once
- AND `trackAddToCart` is NOT called inside the `set(...)` callback

---

### Requirement: CART-A4 — useCartSummary Exposes Domain-Derived Values

The `useCartSummary` hook MUST expose `{ subtotal, shipping, total, itemCount }` where each numeric value is derived exclusively from domain functions. No arithmetic MUST exist inside the hook body itself.

#### Scenario: Hook returns correct summary

- GIVEN the store has `items = [{ product: { price: 20000 }, quantity: 2 }]`
- WHEN `useCartSummary()` is called
- THEN `subtotal === 40000`, `shipping === 0`, `total === 40000`, `itemCount === 2`

---

### Requirement: CART-A5 — Zero Behavior Change Except Threshold Fix

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

### Requirement: CART-T3 — Existing 23 Store Tests MUST Keep Passing

The existing tests in `app/lib/stores/cart.store.test.ts` (23 tests) MUST pass after the refactor. Import paths in the test file MUST be updated to point to the new canonical store or the shim as needed, but behavior assertions MUST remain identical.

#### Scenario: Test file imports updated, all assertions pass

- GIVEN the test file's import path is updated to resolve via the shim or canonical path
- WHEN `pnpm test:run` executes
- THEN all 23 tests pass with zero changes to assertion logic

---

## Out of Scope

The following are explicitly deferred and MUST NOT be introduced in this change:

| Topic | Reason |
|---|---|
| Coupon-disconnect bug | Dedicated follow-up slice |
| Price snapshot at add-time | Explicitly out of scope (live price kept) |
| Stock validation in domain addItem | Future guard, not this slice |
| selectedVariant field removal | Leave as-is |
| UI container-presentational migration | Follow-up slice |
| Checkout CartSnapshot boundary | Future checkout slice |
