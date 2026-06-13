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

### Requirement: CART-A4 — useCartSummary Exposes Domain-Derived Values

The `useCartSummary` hook MUST expose `{ subtotal, shipping, total, itemCount }` where each numeric value is derived exclusively from domain functions. No arithmetic MUST exist inside the hook body itself.

#### Scenario: Hook returns correct summary

- GIVEN the store has `items = [{ product: { price: 20000 }, quantity: 2 }]`
- WHEN `useCartSummary()` is called
- THEN `subtotal === 40000`, `shipping === 0`, `total === 40000`, `itemCount === 2`

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
