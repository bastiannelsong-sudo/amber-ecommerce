# Checkout UI Capability Specification

**Domains**: checkout-ui
**Requirement prefix**: CHKUI-*
**Status**: SHIPPED (PR #39 hooks/atoms/molecules, PR #40 organisms, PR #41 container+swap)

---

## Purpose

Full container-presentational + atomic UI layer for the checkout feature (`features/checkout/ui/`). Mirrors the cart-ui-strangle pattern (PR #38). Presentational components accept pure props; only the container consumes hooks and cart store; dependency direction flows domain → application → ui, never toward infrastructure.

---

## Requirements

### Requirement: CHKUI-ARCH — UI Layer Dependency Direction

`features/checkout/ui/` MUST import only from `features/checkout/application/` and `features/checkout/domain/`. Presentational components (atoms, molecules, organisms) MUST NOT import from any store, hook, or infrastructure module. `CheckoutPageContainer` is the SOLE hook/store consumer inside `ui/`. `features/checkout/ui/` MUST NOT import from `features/cart/ui/` (cross-feature UI import is prohibited — shapes differ: `CartSnapshot.unit_price` vs `CartItem.product.price`).

#### Scenario: Presentational has no store/hook import

- GIVEN any file under `features/checkout/ui/atoms/`, `molecules/`, or `organisms/`
- WHEN TypeScript resolves all imports
- THEN zero imports from any store, hook, or `infrastructure/` path exist in that file

#### Scenario: Cross-feature UI import is absent

- GIVEN the full `features/checkout/ui/` directory
- WHEN source files are scanned for imports from `features/cart/ui/`
- THEN zero matches are found

#### Scenario: Container is the sole hook consumer

- GIVEN `CheckoutPageContainer.tsx`
- WHEN TypeScript resolves all imports
- THEN hooks (`useCheckoutForm`, `useCheckoutSubmit`, `useCheckoutSummary`) and `useCartStore` are imported only in this file within `ui/`

---

### Requirement: CHKUI-ATOM-1 — CheckoutFormField

`features/checkout/ui/atoms/CheckoutFormField.tsx` MUST accept `{ label: string; name: string; value: string; onChange: (e: ChangeEvent) => void; type?: string; required?: boolean; placeholder?: string }` and render a labeled input. No store or hook imports are permitted.

#### Scenario: Renders label and input with correct props

- GIVEN `CheckoutFormField` rendered with `label="Email"`, `name="email"`, `value="a@b.com"`
- WHEN the component renders
- THEN the DOM contains a `<label>` with text "Email" and an `<input>` with `value="a@b.com"`

---

### Requirement: CHKUI-ATOM-2 — CheckoutSelectField

`features/checkout/ui/atoms/CheckoutSelectField.tsx` MUST accept `{ label: string; name: string; value: string; onChange: (e: ChangeEvent) => void; options: { value: string; label: string }[]; disabled?: boolean; placeholder?: string }` and render a labeled `<select>`. No store or hook imports are permitted.

#### Scenario: Renders options from props

- GIVEN `CheckoutSelectField` rendered with two options (`{ value: 'RM', label: 'Metropolitana' }`, `{ value: 'V', label: 'Valparaíso' }`)
- WHEN the component renders
- THEN the DOM contains two `<option>` elements with those labels

#### Scenario: Disabled select is not interactive

- GIVEN `CheckoutSelectField` rendered with `disabled={true}`
- WHEN the component renders
- THEN the `<select>` element has `disabled` attribute set

---

### Requirement: CHKUI-ATOM-3 — CheckoutSubmitButton

`features/checkout/ui/atoms/CheckoutSubmitButton.tsx` MUST accept `{ label: string; isLoading: boolean; disabled?: boolean; onClick?: () => void }`. When `isLoading` is true, a loading indicator MUST be visible and the button MUST be disabled.

#### Scenario: Loading state renders indicator and disables button

- GIVEN `CheckoutSubmitButton` rendered with `isLoading={true}` and `label="Continuar"`
- WHEN the component renders
- THEN a loading indicator is present in the DOM
- AND the button element is disabled

#### Scenario: Idle state renders label

- GIVEN `CheckoutSubmitButton` rendered with `isLoading={false}` and `label="Pagar con MercadoPago"`
- WHEN the component renders
- THEN the text "Pagar con MercadoPago" is present
- AND the button is not disabled

---

### Requirement: CHKUI-ATOM-4 — CheckoutGeoErrorBanner

`features/checkout/ui/atoms/CheckoutGeoErrorBanner.tsx` MUST accept `{ message: string; onRetry: () => void }` and render the error message and a retry button. No store or hook imports are permitted.

#### Scenario: Renders message and retry trigger

- GIVEN `CheckoutGeoErrorBanner` rendered with `message="Error al cargar regiones"` and a mock `onRetry`
- WHEN the retry button is clicked
- THEN `onRetry` is called once
- AND the error message is visible in the DOM

---

### Requirement: CHKUI-MOL-1 — ContactInfoForm

`features/checkout/ui/molecules/ContactInfoForm.tsx` MUST accept form field props for email, firstName, lastName, and phone, plus an `onChange` callback, and compose `CheckoutFormField` atoms. No store or hook imports are permitted.

#### Scenario: Renders all four contact fields

- GIVEN `ContactInfoForm` rendered with mock values for all four fields
- WHEN the component renders
- THEN four labeled input elements are present in the DOM

---

### Requirement: CHKUI-MOL-2 — ShippingAddressForm

`features/checkout/ui/molecules/ShippingAddressForm.tsx` MUST accept `{ formData; geo; geoError; communesOfRegion; onChange; onRetryGeo }` and compose address, region, and commune fields. When `geoError` is non-null it MUST render `CheckoutGeoErrorBanner`. No store or hook imports are permitted.

#### Scenario: Renders GEO error banner when geoError is set

- GIVEN `ShippingAddressForm` rendered with `geoError="Error de red"` and a mock `onRetryGeo`
- WHEN the component renders
- THEN `CheckoutGeoErrorBanner` is visible in the DOM with the error message

#### Scenario: Commune options reflect communesOfRegion

- GIVEN `communesOfRegion=[{ name: 'Santiago' }, { name: 'Ñuñoa' }]`
- WHEN the component renders
- THEN the commune select contains exactly those two options

---

### Requirement: CHKUI-MOL-3 — ShippingSummaryCard

`features/checkout/ui/molecules/ShippingSummaryCard.tsx` MUST accept `{ formData: CheckoutFormData }` and render a read-only summary of the shipping fields. No store or hook imports are permitted.

#### Scenario: Renders read-only contact and address info

- GIVEN `ShippingSummaryCard` rendered with a populated `formData`
- WHEN the component renders
- THEN the DOM contains the email, name, and address values from `formData`

---

### Requirement: CHKUI-MOL-4 — MercadoPagoInfoCard

`features/checkout/ui/molecules/MercadoPagoInfoCard.tsx` MUST render static MercadoPago payment information. It accepts no dynamic props. No store or hook imports are permitted.

#### Scenario: Renders MercadoPago static content

- GIVEN `MercadoPagoInfoCard` rendered
- WHEN the component renders
- THEN static MP-related content is present in the DOM

---

### Requirement: CHKUI-MOL-5 — PaymentTrustSignals

`features/checkout/ui/molecules/PaymentTrustSignals.tsx` MUST render the three trust signal badges (lock, data, devolution). It accepts no dynamic props. No store or hook imports are permitted.

#### Scenario: Renders all three trust signals

- GIVEN `PaymentTrustSignals` rendered
- WHEN the component renders
- THEN three distinct trust signal elements are present in the DOM

---

### Requirement: CHKUI-MOL-6 — CheckoutOrderItemRow

`features/checkout/ui/molecules/CheckoutOrderItemRow.tsx` MUST accept `{ item: CartSnapshot['items'][number] }` and render item name, quantity, and `unit_price`. It MUST NOT import from `features/cart/ui/`. No store or hook imports are permitted.

#### Scenario: Renders item fields from CartSnapshot unit_price shape

- GIVEN `CheckoutOrderItemRow` rendered with `item = { name: 'Anillo', quantity: 2, unit_price: 19990 }`
- WHEN the component renders
- THEN the DOM contains "Anillo", "2", and the formatted price for 19990

---

### Requirement: CHKUI-MOL-7 — CheckoutOrderSummary

`features/checkout/ui/molecules/CheckoutOrderSummary.tsx` MUST accept `{ items: CartSnapshot['items']; subtotal: number; discount: number; shipping: number; total: number }` and render the item list (via `CheckoutOrderItemRow`) plus the totals panel. It MUST NOT import from `features/cart/ui/`. No store or hook imports are permitted.

#### Scenario: Renders all items and totals

- GIVEN `CheckoutOrderSummary` rendered with two items and summary values
- WHEN the component renders
- THEN two item rows and the subtotal, discount, shipping, and total values are visible in the DOM

---

### Requirement: CHKUI-ORG-1 — ShippingStepForm

`features/checkout/ui/organisms/ShippingStepForm.tsx` MUST accept all form, GEO, saved-address, and submit props, and compose `SavedAddressPicker` (imported directly from `app/components/`), `ContactInfoForm`, `ShippingAddressForm`, and `CheckoutSubmitButton`. No store or hook imports are permitted.

#### Scenario: Renders all shipping form sections

- GIVEN `ShippingStepForm` rendered with mock props
- WHEN the component renders
- THEN contact fields and address fields are both present in the DOM

---

### Requirement: CHKUI-ORG-2 — PaymentStepForm

`features/checkout/ui/organisms/PaymentStepForm.tsx` MUST accept `{ formData; isProcessingPayment; onBack; onSubmitPayment; summary }` and compose `ShippingSummaryCard`, `MercadoPagoInfoCard`, back button, `CheckoutSubmitButton`, and `PaymentTrustSignals`. No store or hook imports are permitted.

#### Scenario: Back button calls onBack

- GIVEN `PaymentStepForm` rendered with a mock `onBack`
- WHEN the back button is clicked
- THEN `onBack` is called once

#### Scenario: Submit button reflects isProcessingPayment

- GIVEN `PaymentStepForm` rendered with `isProcessingPayment={true}`
- WHEN the component renders
- THEN `CheckoutSubmitButton` is in loading state (disabled)

---

### Requirement: CHKUI-ORG-3 — CheckoutEmptyState

`features/checkout/ui/organisms/CheckoutEmptyState.tsx` MUST render an empty-cart message and a call-to-action to return to the catalog. No store or hook imports are permitted.

#### Scenario: Renders empty message and CTA

- GIVEN `CheckoutEmptyState` rendered
- WHEN the component renders
- THEN an empty-cart message and a navigation CTA are present in the DOM

---

### Requirement: CHKUI-CONT-1 — CheckoutPageContainer

`features/checkout/ui/containers/CheckoutPageContainer.tsx` MUST consume `useCheckoutForm`, `useCheckoutSubmit`, `useCheckoutSummary`, and `useCartStore` exclusively. It MUST own the `step` state machine (`'shipping' | 'payment'`). It MUST implement the hydration guard (`mounted` state + `useEffect`) and render `CheckoutSkeleton` while unmounted. It MUST call `trackBeginCheckout` exactly once per entry via a tracked ref. It MUST render `ShippingStepForm` when step is `'shipping'` and `PaymentStepForm` when step is `'payment'`. It MUST render `CheckoutEmptyState` when the cart has no items.

#### Scenario: Renders skeleton before mounted

- GIVEN `CheckoutPageContainer` on first render before `useEffect` fires
- WHEN the component renders
- THEN `CheckoutSkeleton` is in the DOM and no step form is rendered

#### Scenario: Renders ShippingStepForm on shipping step

- GIVEN hooks mocked; `step='shipping'`; cart has items
- WHEN the component renders after mount
- THEN `ShippingStepForm` content is in the DOM

#### Scenario: Renders PaymentStepForm on payment step

- GIVEN hooks mocked; `step='payment'`; cart has items
- WHEN the component renders after mount
- THEN `PaymentStepForm` content is in the DOM

#### Scenario: Renders empty state when cart is empty

- GIVEN hooks mocked; cart items = []
- WHEN the component renders after mount
- THEN `CheckoutEmptyState` content is in the DOM

#### Scenario: trackBeginCheckout called once per mount

- GIVEN `trackBeginCheckout` mocked; component renders twice (strict-mode double effect)
- WHEN the component mounts
- THEN `trackBeginCheckout` is called exactly once

---

### Requirement: CHKUI-HOOK-1 — use-checkout-form

`features/checkout/application/use-checkout-form.ts` MUST expose `{ formData, selectedAddressId, geo, geoError, communesOfRegion, mounted, handleInputChange, handleSelectSavedAddress, handleSubmitShipping, retryGeo }`. It MUST use `commune` (not `city`) as the internal field name for `CheckoutFormData` alignment. `handleInputChange` MUST preserve spaces in phone input (no sanitization here). `communesOfRegion` MUST be a derived value (useMemo) from `formData.region` and `geo`. `handleSubmitShipping` MUST call the domain `missingShippingFields` and, if any fields are missing, show a Spanish toast listing them and NOT advance the step. `trackBeginCheckout` MUST be called once per entry via a ref guard. GEO MUST be loaded via `addressesService.getGeo()` on mount with cancellation. No JSX is permitted in this hook.

#### Scenario: handleSubmitShipping blocks when region is missing

- GIVEN `useCheckoutForm` initialized; `formData.region` is empty
- WHEN `handleSubmitShipping` is called
- THEN `missingShippingFields` returns `['region']` (among others)
- AND a toast error is shown containing "región"
- AND `setStep` is NOT called

#### Scenario: handleSubmitShipping advances when all fields valid

- GIVEN `formData` has all required fields populated
- WHEN `handleSubmitShipping` is called
- THEN `missingShippingFields` returns `[]`
- AND step advances to `'payment'`

#### Scenario: handleInputChange preserves phone spaces

- GIVEN `formData.phone = ''`
- WHEN `handleInputChange` fires with `{ name: 'phone', value: '+56 9 1234 5678' }`
- THEN `formData.phone === '+56 9 1234 5678'` (spaces preserved)

#### Scenario: communesOfRegion updates when region changes

- GIVEN `geo` has region `'RM'` with communes `['Santiago', 'Ñuñoa']`
- WHEN `formData.region` is set to `'RM'`
- THEN `communesOfRegion` equals `['Santiago', 'Ñuñoa']`

#### Scenario: retryGeo retriggers GEO load after error

- GIVEN `geoError` is non-null
- WHEN `retryGeo` is called
- THEN `addressesService.getGeo()` is called again
- AND `geoError` resets to null while loading

---

### Requirement: CHKUI-HOOK-2 — use-checkout-submit

`features/checkout/application/use-checkout-submit.ts` MUST expose `{ isProcessingPayment, handleSubmitPayment }`. `handleSubmitPayment` MUST: guard against double-submit via a ref; call `toCartSnapshot` then `toOrderPayload` (applying `sanitizePhone` at this boundary, not in the form); POST to `/api/orders`; on success, redirect via `window.location.href = res.data.init_point`. No JSX is permitted in this hook.

#### Scenario: handleSubmitPayment redirects to init_point on success

- GIVEN `fetch` mocked to return `{ data: { init_point: 'https://mp.com/pay' } }`; `useCartStore` mocked with items
- WHEN `handleSubmitPayment` is called
- THEN `window.location.href` is set to `'https://mp.com/pay'`

#### Scenario: sanitizePhone applied at payload boundary

- GIVEN `formData.phone = '+56 9 1234 5678'` (spaces preserved by form)
- WHEN `handleSubmitPayment` builds the payload via `toOrderPayload`
- THEN `sanitizePhone` is applied; the payload phone field is `'+56912345678'`

#### Scenario: Double-submit is guarded

- GIVEN `handleSubmitPayment` is already in flight
- WHEN `handleSubmitPayment` is called a second time
- THEN the second call is a no-op (only one POST is made)

---

### Requirement: CHKUI-SWAP — Consumer Swap (Zero Behavior Change)

`app/checkout/page.tsx` MUST be reduced to a thin shell rendering only `CheckoutPageContainer`. All preserved behaviors MUST remain identical: step flow (shipping → payment), GEO cascade, SavedAddressPicker integration, MP redirect, toast notifications, `trackBeginCheckout`, hydration skeleton. Reused as-is (imported directly): `SavedAddressPicker`, `CheckoutProgressBar`, `TrustBadges`, `CheckoutSkeleton`.

#### Scenario: page.tsx renders only CheckoutPageContainer

- GIVEN `app/checkout/page.tsx` after the swap
- WHEN it renders
- THEN `CheckoutPageContainer` is the single meaningful element rendered (no inline state, no inline hooks beyond what the container manages)

#### Scenario: Behavior-preservation — MP redirect still fires

- GIVEN a completed payment form; `handleSubmitPayment` succeeds
- WHEN the user submits the payment step
- THEN `window.location.href` is set to the MercadoPago `init_point`

---

### Requirement: CHKUI-FIX-MATHRANDOM — Remove Dead Confirmation Step

The inline confirmation step in `app/checkout/page.tsx` MUST be deleted. The `orderNumber` `useState`, `orderSnapshot` ref, and all `display*` variables (displayItems, displaySubtotal, displayShipping, displayTotal) MUST be removed. No `Math.random()` call for order number generation MAY remain anywhere in the checkout flow. The real confirmation page is `/checkout/resultado` (untouched).

#### Scenario: No Math.random order number in checkout

- GIVEN the full checkout implementation after this change
- WHEN source files are scanned for `Math.random` in any checkout-related file
- THEN zero matches are found

#### Scenario: Confirmation step code is absent

- GIVEN `app/checkout/page.tsx` (or its successor) after the swap
- WHEN source is scanned for `step === 'confirmation'` or `'confirmation'` step rendering
- THEN zero matches are found in the checkout UI layer

---

### Requirement: CHKUI-FIX-S001 — missingShippingFields Domain Wired (region validated)

`handleSubmitShipping` in `use-checkout-form` MUST delegate validation entirely to the domain `missingShippingFields`. The inline validation in the old page.tsx MUST be removed. `region` MUST now be included in validation (previously missing from inline check). `formData` MUST use the field name `commune` (aligned with `CheckoutFormData`), not `city`.

#### Scenario: Submitting without region is blocked

- GIVEN `formData` has all fields populated except `region` (empty string)
- WHEN `handleSubmitShipping` is called
- THEN the step does NOT advance
- AND a toast error references "región"

#### Scenario: Submitting without commune is blocked

- GIVEN `formData.commune` is empty; all other fields populated
- WHEN `handleSubmitShipping` is called
- THEN the step does NOT advance
- AND a toast error references "comuna"

---

### Testing Requirements

#### Requirement: CHKUI-T1 — Test Infrastructure Reuse

Existing `__mocks__/next-image.tsx` and `motion/react` vitest alias MUST be reused. No new test infrastructure is required.

#### Scenario: Existing mocks suffice for checkout UI tests

- GIVEN the existing global mocks from cart-ui-strangle (PR #38) are present
- WHEN `pnpm test:run` executes checkout UI tests
- THEN no import errors for `next/image` or `motion/react` occur

---

#### Requirement: CHKUI-T2 — Atom and Molecule RTL Tests

Every atom and molecule MUST have a colocated `.test.tsx` file using RTL. Tests MUST render with explicit props and assert DOM output. No store or hook mocks are needed for atoms/molecules.

#### Scenario: Each atom/molecule test renders from props

- GIVEN a `.test.tsx` file for each atom and molecule
- WHEN `pnpm test:run` executes
- THEN each test renders the component with explicit props and passes

---

#### Requirement: CHKUI-T3 — Hook Tests (Mocked Service Deps)

`use-checkout-form` and `use-checkout-submit` MUST each have a `.test.ts` file. `addressesService` MUST be mocked (`vi.mock`) for GEO tests. `window.location.href` MUST be mocked (via `Object.defineProperty` or `vi.spyOn`) for submit tests. `fetch` or `apiClient` MUST be mocked for POST assertions. The `missingShippingFields` region gap (S-001) and the absence of `Math.random` MUST each have at least one explicit test case.

#### Scenario: use-checkout-form test — region gap covered

- GIVEN `use-checkout-form.test.ts` contains a case where `region` is empty
- WHEN `handleSubmitShipping` is called
- THEN the test asserts the step did not advance and a toast was triggered

#### Scenario: use-checkout-submit test — window.location mocked

- GIVEN `Object.defineProperty(window, 'location', ...)` is set in the test
- WHEN `handleSubmitPayment` succeeds
- THEN the test asserts `window.location.href` equals the mocked `init_point`

---

#### Requirement: CHKUI-T4 — Container Tests (Mocked Hooks)

`CheckoutPageContainer` MUST have a `.test.tsx` file. All hooks (`useCheckoutForm`, `useCheckoutSubmit`, `useCheckoutSummary`) and `useCartStore` MUST be mocked via `vi.mock`. Tests MUST cover: skeleton before mount, shipping step visible when `step='shipping'`, payment step visible when `step='payment'`, empty state when `items=[]`.

#### Scenario: Container test verifies step rendering

- GIVEN `useCheckoutForm` mocked to return mock form data; `step='shipping'`
- WHEN `CheckoutPageContainer` renders after mount
- THEN shipping form content is present in the DOM and payment form is not

---

#### Requirement: CHKUI-T5 — Existing Tests Stay Green

All 449 pre-existing tests MUST continue to pass after this change. `pnpm test:run` MUST exit zero with no regressions.

#### Scenario: Full suite green after strangle

- GIVEN the full implementation is applied
- WHEN `pnpm test:run` executes
- THEN all 449 pre-existing tests pass with zero regressions

---

## Out of Scope

| Topic | Reason |
|---|---|
| SavedAddressPicker internal refactor | Stays in `app/components/`; follow-up slice |
| `/checkout/resultado` changes | Real confirmation page; untouched |
| Card-payment Bricks frontend | Dedicated card-payment slice |
| e2e / Playwright spec changes | Out of scope; behavior preserved end-to-end |
