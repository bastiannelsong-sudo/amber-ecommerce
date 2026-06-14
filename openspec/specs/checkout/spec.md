# Checkout Capability Specification

**Domains**: checkout-domain, checkout-application
**Requirement prefix**: CHK-*
**Status**: SHIPPED (PR #36, commits c78e22f + 3be7e13)

---

## Purpose

Define the checkout domain and application behavior. This spec is the canonical source of truth for order finalization, form validation, price-locked snapshots, and coupon integration. It follows the `features/{name}/{domain,application}` architectural pattern established by the cart slice and serves as the second vertical slice pattern-setter.

---

## Domain 1: checkout-domain (Pure Functions)

Location: `features/checkout/domain/`

Framework-free pure functions for order totals, form validation, and price-locked snapshots. No React, Zustand, fetch, window/browser, or 'use client' imports allowed. All functions accept and return immutable values (types, primitives, readonly arrays).

---

### Requirement: CHK-D1 — Checkout Domain Types

The system MUST define the following types in `features/checkout/domain/checkout.types.ts`:

- `CartSnapshot`: readonly/immutable value object with `items: readonly { product_id: number; name: string; internal_sku: string; quantity: number; unit_price: number; image_url?: string }[]`, `subtotal: number`, `shipping: number`, `discount: number`, `total: number`.
- `OrderDraft`: shape used to request order creation; includes all checkout form fields plus snapshot totals and optional `coupon_code`.
- `CheckoutFormData`: form field bag (email, firstName, lastName, phone, address, apartment, region, **commune**, postalCode). Note: the field is `commune`, not `city`; any internal usage of `city` is renamed.
- `CheckoutMode`: `'guest' | 'authenticated'`.
- `CheckoutStep`: `'shipping' | 'payment'`. The `'confirmation'` variant is REMOVED — the confirmation flow belongs to `/checkout/resultado`.

#### Scenario: CartSnapshot is immutable

- GIVEN a `CartSnapshot` value is created
- WHEN any consumer attempts to mutate an `items` element or top-level field
- THEN TypeScript MUST emit a compile-time error (readonly enforcement)

#### Scenario: CheckoutMode covers both flows

- GIVEN the current user is authenticated or not
- WHEN `CheckoutMode` is used
- THEN the value `'guest'` is valid and `'authenticated'` is valid — no other values are accepted

#### Scenario: CheckoutStep has no confirmation variant

- GIVEN `CheckoutStep` type after this change
- WHEN TypeScript checks `step === 'confirmation'`
- THEN a type error is emitted (or the value is not assignable to `CheckoutStep`)

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

## Domain 2: checkout-application (Store + Hooks + Mappers)

Location: `features/checkout/application/`

Application layer delegating to checkout domain and cart domain. MAY import Zustand stores, React hooks, and cart domain functions. MUST NOT contain JSX or inline domain arithmetic. MUST import cart domain only (never cart application/store).

---

### Requirement: CHK-A1 — toCartSnapshot Produces Immutable Snapshot

`toCartSnapshot(cartItems: CartItem[], discountAmount: number): CartSnapshot` in `features/checkout/application/checkout.mapper.ts` MUST:
- Map each `CartItem` to the lean `{ product_id, name, internal_sku, quantity, unit_price, image_url? }` shape.
- Compute `subtotal` via `subtotal(cartItems)` from cart domain.
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

## Cross-Feature Rule

**Important architectural rule established by this change:**

A feature MAY import another feature's DOMAIN (pure, stable functions) but MUST NOT import another feature's APPLICATION, STORE, or UI.

Example: `features/checkout/` imports `features/cart/domain/` (pure functions like `subtotal`, `shippingCost`). It MUST NOT import `features/cart/application/cart.store.ts` or `features/cart/application/use-cart-summary.ts`.

**Promotion rule**: Shared kernel (in `@/shared/` or `@/lib/`) only when 3+ consumers exist. Duplication is safer than coupling until you have proven need for shared.

---

## ADDED Requirements (checkout-ui-strangle)

### Requirement: CHK-A4 — use-checkout-form Realizes Deferred Hook

`features/checkout/application/use-checkout-form.ts` MUST be created and MUST realize the hook deferred from the checkout-hexagonal-slice. It MUST expose: `formData` (using `commune` field name, aligned with `CheckoutFormData`), `selectedAddressId`, `geo`, `geoError`, `communesOfRegion` (derived), `mounted`, `handleInputChange` (preserves phone spaces), `handleSelectSavedAddress`, `handleSubmitShipping` (delegates to domain `missingShippingFields`; maps keys to Spanish toast labels; calls `trackBeginCheckout` once via ref), `retryGeo`. It MUST NOT contain JSX. It MUST NOT call `sanitizePhone` on input change.

#### Scenario: Hook file exists and exports expected API

- GIVEN `features/checkout/application/use-checkout-form.ts` is created
- WHEN it is imported
- THEN all documented exports are present with correct types

#### Scenario: GEO loaded on mount with cancellation

- GIVEN `addressesService.getGeo` is mocked
- WHEN the hook mounts
- THEN `addressesService.getGeo()` is called once
- AND the cancellation mechanism prevents state updates after unmount

---

### Requirement: CHK-A5 — use-checkout-submit Realizes Deferred Hook

`features/checkout/application/use-checkout-submit.ts` MUST be created. It MUST expose `{ isProcessingPayment, handleSubmitPayment }`. `handleSubmitPayment` MUST: prevent double-submit via a ref guard; call `toCartSnapshot(items, discountAmount)` then `toOrderPayload(snapshot, formData, appliedCoupon)` with `sanitizePhone` applied inside `toOrderPayload` at the payload boundary; POST to `/api/orders`; on success navigate via `window.location.href = res.data.init_point`. It MUST NOT contain JSX.

#### Scenario: Hook file exists and exports expected API

- GIVEN `features/checkout/application/use-checkout-submit.ts` is created
- WHEN it is imported
- THEN `isProcessingPayment` (boolean) and `handleSubmitPayment` (function) are exported

#### Scenario: sanitizePhone applied only at payload boundary

- GIVEN the hook is tested with `formData.phone = '+56 9 1234 5678'`
- WHEN `handleSubmitPayment` constructs the payload
- THEN the phone in the POST body is `'+56912345678'` (spaces removed)
- AND `formData.phone` in the hook state retains spaces throughout

---

## REMOVED Requirements

### Requirement: Dead Confirmation Step in app/checkout/page.tsx

(Reason: The inline confirmation step rendered by `app/checkout/page.tsx` (lines 625–831) was unreachable dead code — `handleSubmitPayment` success path fires `window.location.href = init_point` and exits the Next.js app before any React state update can trigger step `'confirmation'`. The real confirmation is `/checkout/resultado`. All code implementing the confirmation step, including the `orderNumber` `useState(Math.random)`, `orderSnapshot` ref, and `display*` derived variables, MUST be deleted and MUST NOT be recreated in any component or hook.)

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

### Requirement: CHK-T4 — Hydration Safety for Cart Coupon State

Cart store coupon fields (`appliedCoupon`, `discountAmount`, `setCoupon`, `clearCoupon`) added by the coupon-disconnect fix MUST be unit-tested for hydration with missing fields. When localStorage contains an old persisted cart without these fields, the store MUST default to `appliedCoupon: null` and `discountAmount: 0` without runtime error.

#### Scenario: Old persisted cart hydrates with correct defaults

- GIVEN localStorage contains a persisted cart entry from before this change (missing `appliedCoupon` and `discountAmount`)
- WHEN the store hydrates from localStorage
- THEN `appliedCoupon` defaults to `null` and `discountAmount` defaults to `0`
- AND no runtime error occurs

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

---

## Shipped Evidence

**PR #36**: feat(checkout): hexagonal vertical slice + coupon-disconnect bug fix
- **Commits**: 
  - `c78e22f` — Main feature commits (checkout domain, application, coupon state migration)
  - `3be7e13` — W-002 fix (image_url parity in CartSnapshot items)
- **Test results**: 358/358 passing (14 domain + 11 mapper + 3 store coupon + 28 new tests)
- **TypeScript**: zero errors
- **Verification**: PASS (0 CRITICAL, 2 WARNING, 2 SUGGESTION)
- **Branch**: feat/checkout-hexagonal-slice → main (PR #36 merged)
