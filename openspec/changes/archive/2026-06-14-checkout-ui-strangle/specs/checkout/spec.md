# Delta for Checkout Capability

**Change**: checkout-ui-strangle
**Existing spec**: openspec/specs/checkout/spec.md
**Requirement prefix**: CHK-* (modified) | CHKUI-* (new, in checkout-ui spec)

---

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: CHK-D1 — Checkout Domain Types

The system MUST define the following types in `features/checkout/domain/checkout.types.ts`:

- `CartSnapshot`: readonly/immutable value object with `items: readonly { product_id: number; name: string; internal_sku: string; quantity: number; unit_price: number; image_url?: string }[]`, `subtotal: number`, `shipping: number`, `discount: number`, `total: number`.
- `OrderDraft`: shape used to request order creation; includes all checkout form fields plus snapshot totals and optional `coupon_code`.
- `CheckoutFormData`: form field bag (email, firstName, lastName, phone, address, apartment, region, **commune**, postalCode). Note: the field is `commune`, not `city`; any internal usage of `city` is renamed.
- `CheckoutMode`: `'guest' | 'authenticated'`.
- `CheckoutStep`: `'shipping' | 'payment'`. The `'confirmation'` variant is REMOVED — the confirmation flow belongs to `/checkout/resultado`.

(Previously: `CheckoutStep` included `'confirmation'`; `CheckoutFormData` field was ambiguously named with `city` in internal usage.)

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

## REMOVED Requirements

### Requirement: Dead Confirmation Step in app/checkout/page.tsx

(Reason: The inline confirmation step rendered by `app/checkout/page.tsx` (lines 625–831) was unreachable dead code — `handleSubmitPayment` success path fires `window.location.href = init_point` and exits the Next.js app before any React state update can trigger step `'confirmation'`. The real confirmation is `/checkout/resultado`. All code implementing the confirmation step, including the `orderNumber` `useState(Math.random)`, `orderSnapshot` ref, and `display*` derived variables, MUST be deleted and MUST NOT be recreated in any component or hook.)

---

## Testing Coverage Notes

- S-001 region-gap fix (CHK-A4 / CHKUI-FIX-S001): requires explicit test case in `use-checkout-form.test.ts`
- Math.random removal (CHKUI-FIX-MATHRANDOM): no `Math.random` reference must exist in any checkout file post-change
- Deferred hooks CHK-A4 + CHK-A5: each has its own `.test.ts` with `addressesService` / `window.location` / `fetch` mocked
- All 449 pre-existing tests MUST stay green (`pnpm test:run`)
