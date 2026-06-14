# Checkout Hexagonal Slice — Specification

**Change**: checkout-hexagonal-slice
**Requirement prefix**: CHK-* (checkout) + cart delta (CART-A7, CART-A8)
**Domains**: checkout-domain (NEW), checkout-application (NEW), cart-application (MODIFIED)
**Date**: 2026-06-13

---

## Part 1 — New Capability: checkout-domain

Location: `features/checkout/domain/`

Pure, framework-free functions and types for order finalization, form validation, and price-locked snapshots. Zero React, Zustand, fetch, or browser imports allowed.

---

### Requirement: CHK-D1 — Checkout Domain Types

The system MUST define the following types in `features/checkout/domain/checkout.types.ts`:

- `CartSnapshot`: readonly/immutable value object with `items: readonly { product_id: number; name: string; internal_sku: string; quantity: number; unit_price: number }[]`, `subtotal: number`, `shipping: number`, `discount: number`, `total: number`.
- `OrderDraft`: shape used to request order creation; includes all checkout form fields plus snapshot totals and optional `coupon_code`.
- `CheckoutFormData`: form field bag (email, firstName, lastName, phone, address, apartment, region, commune, postalCode).
- `CheckoutMode`: `'guest' | 'authenticated'`.
- `CheckoutStep`: `'shipping' | 'payment' | 'confirmation'`.

#### Scenario: CartSnapshot is immutable

- GIVEN a `CartSnapshot` value is created
- WHEN any consumer attempts to mutate an `items` element or top-level field
- THEN TypeScript MUST emit a compile-time error (readonly enforcement)

#### Scenario: CheckoutMode covers both flows

- GIVEN the current user is not authenticated
- WHEN `CheckoutMode` is used
- THEN the value `'guest'` is valid and `'authenticated'` is valid — no other values are accepted

---

### Requirement: CHK-R1 — orderTotal Clamps to Zero

`orderTotal(subtotal: number, discount: number, shipping: number): number` in `features/checkout/domain/checkout.rules.ts` MUST return `Math.max(0, subtotal - discount + shipping)`.

#### Scenario: Normal order total

- GIVEN `subtotal=25000, discount=2000, shipping=5000`
- WHEN `orderTotal(25000, 2000, 5000)` is called
- THEN the result is `28000`

#### Scenario: Zero discount

- GIVEN `subtotal=20000, discount=0, shipping=5000`
- WHEN `orderTotal(20000, 0, 5000)` is called
- THEN the result is `25000`

#### Scenario: Discount exactly equals subtotal+shipping — clamp boundary (MANDATORY TEST)

- GIVEN `subtotal=10000, discount=15000, shipping=5000`
- WHEN `orderTotal(10000, 15000, 5000)` is called
- THEN the result is `0` (discount >= subtotal+shipping, clamp applies)

#### Scenario: Discount exceeds subtotal+shipping — clamp boundary

- GIVEN `subtotal=5000, discount=20000, shipping=5000`
- WHEN `orderTotal(5000, 20000, 5000)` is called
- THEN the result is `0`

---

### Requirement: CHK-R2 — isCheckoutReady Validates Required Fields

`isCheckoutReady(formData: CheckoutFormData): boolean` MUST return `true` only when all required shipping fields are present and non-empty: `email`, `firstName`, `lastName`, `address`, `region`, `commune`.

#### Scenario: All required fields present

- GIVEN a `CheckoutFormData` with all six required fields non-empty
- WHEN `isCheckoutReady(formData)` is called
- THEN the result is `true`

#### Scenario: Missing one required field

- GIVEN a `CheckoutFormData` where `commune` is an empty string
- WHEN `isCheckoutReady(formData)` is called
- THEN the result is `false`

---

### Requirement: CHK-R3 — missingShippingFields Returns Missing Field Names

`missingShippingFields(formData: CheckoutFormData): string[]` MUST return the names of every required field that is absent or empty. An empty array means the form is ready.

#### Scenario: No missing fields

- GIVEN all required fields are present
- WHEN `missingShippingFields(formData)` is called
- THEN the result is `[]`

#### Scenario: Multiple fields missing

- GIVEN `email` and `region` are empty strings
- WHEN `missingShippingFields(formData)` is called
- THEN the result is `['email', 'region']` (order MAY vary)

---

### Requirement: CHK-R4 — sanitizePhone Normalizes to Digits

`sanitizePhone(value: string): string` MUST remove all non-digit characters except leading `+`. The result MUST contain only digits (and a single leading `+` if present).

#### Scenario: Formatted phone is normalized

- GIVEN `value = '+56 9 1234 5678'`
- WHEN `sanitizePhone(value)` is called
- THEN the result is `'+56912345678'`

#### Scenario: Already clean value is unchanged

- GIVEN `value = '912345678'`
- WHEN `sanitizePhone(value)` is called
- THEN the result is `'912345678'`

---

## Part 2 — New Capability: checkout-application

Location: `features/checkout/application/`

Application layer delegating to checkout domain. MAY import Zustand stores and React. MUST NOT contain JSX or inline domain arithmetic.

---

### Requirement: CHK-A1 — toCartSnapshot Produces Immutable Snapshot

`toCartSnapshot(cartItems: CartItem[], discountAmount: number): CartSnapshot` in `features/checkout/application/checkout.mapper.ts` MUST:
- Map each `CartItem` to the lean `{ product_id, name, internal_sku, quantity, unit_price }` shape.
- Compute `subtotal` via `domainSubtotal(cartItems)` from cart domain.
- Compute `shipping` via `shippingCost(subtotal)` from cart domain.
- Set `discount = discountAmount`.
- Set `total` via `orderTotal(subtotal, discountAmount, shipping)` from checkout domain.
- Return a `CartSnapshot` (readonly).

#### Scenario: Snapshot with active discount

- GIVEN `cartItems` with subtotal `20000` and `discountAmount=2000`
- WHEN `toCartSnapshot(cartItems, 2000)` is called
- THEN `snapshot.subtotal === 20000`, `snapshot.discount === 2000`, `snapshot.shipping === 5000`, `snapshot.total === 23000`

#### Scenario: Snapshot with zero discount

- GIVEN `cartItems` with subtotal `30000` and `discountAmount=0`
- WHEN `toCartSnapshot(cartItems, 0)` is called
- THEN `snapshot.subtotal === 30000`, `snapshot.shipping === 0`, `snapshot.discount === 0`, `snapshot.total === 30000`

---

### Requirement: CHK-A2 — toOrderPayload Includes coupon_code When Present

`toOrderPayload(snapshot: CartSnapshot, formData: CheckoutFormData, couponCode?: string | null): CreateOrderDto` in `checkout.mapper.ts` MUST assemble the full order payload. When `couponCode` is a non-empty string, the payload MUST include `coupon_code: couponCode`. When `couponCode` is absent/null/empty, `coupon_code` MUST be omitted from the payload.

#### Scenario: Payload includes coupon_code

- GIVEN a valid `snapshot`, valid `formData`, and `couponCode='SAVE10'`
- WHEN `toOrderPayload(snapshot, formData, 'SAVE10')` is called
- THEN the result contains `coupon_code: 'SAVE10'`
- AND `items` match `snapshot.items` (price-locked, not live cart)

#### Scenario: Payload omits coupon_code when absent

- GIVEN a valid `snapshot`, valid `formData`, and no `couponCode`
- WHEN `toOrderPayload(snapshot, formData)` is called
- THEN the result does NOT contain a `coupon_code` field (or its value is `undefined`)

#### Scenario: Payload omits coupon_code when empty string

- GIVEN `couponCode = ''`
- WHEN `toOrderPayload(snapshot, formData, '')` is called
- THEN `coupon_code` is NOT present in the payload

---

### Requirement: CHK-A3 — use-checkout-summary Derives Totals from Domain

The `use-checkout-summary` hook in `features/checkout/application/use-checkout-summary.ts` MUST expose `{ subtotal, discount, shipping, total }` by reading `items`, `discountAmount` from `useCartStore` and computing totals through domain functions. No arithmetic MUST exist inside the hook body.

#### Scenario: Hook reflects coupon discount

- GIVEN the cart store has `items` with subtotal `25000` and `discountAmount=3000`
- WHEN `useCheckoutSummary()` is called
- THEN `subtotal === 25000`, `discount === 3000`, `shipping === 5000`, `total === 27000`

#### Scenario: Hook reflects no discount

- GIVEN `discountAmount === 0`
- WHEN `useCheckoutSummary()` is called
- THEN `discount === 0` and `total` equals `subtotal + shipping`

---

## Part 3 — Cart Delta: Coupon State in Store

---

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

## Testing Requirements

### Requirement: CHK-T1 — Domain Rules Tested TDD First

All functions in `features/checkout/domain/checkout.rules.ts` MUST have tests in `features/checkout/domain/checkout.rules.test.ts` written RED before implementation. Tests MUST run in Node/Vitest with no browser or React dependencies (`pnpm test:run`).

#### Scenario: RED then GREEN

- GIVEN `checkout.rules.test.ts` is written with no implementation
- WHEN `pnpm test:run` is executed
- THEN tests fail (RED)
- AND after implementation all tests pass (GREEN)

---

### Requirement: CHK-T2 — orderTotal Clamp Boundary Is Mandatory

The `orderTotal` clamp boundary MUST be tested with at minimum: discount < subtotal+shipping (normal), discount === subtotal+shipping (boundary exact), discount > subtotal+shipping (over-discount). These MUST be three separate test cases.

#### Scenario: Three clamp boundary tests exist

- GIVEN `checkout.rules.test.ts` contains three distinct `it()` blocks covering under/equal/over discount
- WHEN `pnpm test:run` executes
- THEN all three pass with correct values (last two return `0`)

---

### Requirement: CHK-T3 — Mapper Functions Unit-Tested

`toCartSnapshot` and `toOrderPayload` MUST have unit tests in `features/checkout/application/checkout.mapper.test.ts`. Tests MUST cover happy path and coupon present/absent scenarios.

#### Scenario: Mapper tests cover coupon absent and present

- GIVEN `checkout.mapper.test.ts` has one test with `couponCode` and one without
- WHEN `pnpm test:run` executes
- THEN `coupon_code` is present in one payload and absent in the other

---

### Requirement: CHK-T4 — Cart Store Coupon Tests

New store actions (`setCoupon`, `clearCoupon`) and hydration with missing fields MUST be unit-tested. Existing cart store tests MUST remain green.

#### Scenario: setCoupon and clearCoupon tested

- GIVEN cart store tests cover `setCoupon` setting both fields and `clearCoupon` resetting both
- WHEN `pnpm test:run` executes
- THEN all new tests pass and all pre-existing store tests still pass

---

## Out of Scope (Deferred)

| Topic | Deferred To |
|---|---|
| Full 924-line `app/checkout/page.tsx` strangle | Follow-up page-strangle slice |
| Container-presentational extraction for checkout | Follow-up slice |
| `Math.random()` order-number bug fix | Follow-up page-strangle slice |
| Card-payment Bricks frontend | Dedicated card-payment slice |
| `use-checkout-form` / `use-checkout-submit` full hooks | Build only if design requires for coupon wiring; otherwise deferred to strangle slice |
| Stock re-validation at checkout | Future guard slice |
| Price-snapshot enforcement beyond CartSnapshot at submit | Follow-up slice |
