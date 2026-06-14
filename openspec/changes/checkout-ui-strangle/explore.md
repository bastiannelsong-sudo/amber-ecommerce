# Exploration: checkout-ui-strangle

## Current State

`app/checkout/page.tsx` is 924 lines, a single 'use client' monolith managing:
- 3-step checkout flow (shipping → payment → confirmation)
- All form state and GEO loading (regions/communes from addressesService)
- Saved address selection and form-population
- Payment submission and MP redirect
- Cart snapshot for display post-redirect
- Hydration guard (mounted state + useEffect)
- Mobile sticky total bar
- Inline validation (duplicate of domain missingShippingFields)
- Math.random() order number in the dead confirmation step

Checkout domain and application layers EXIST and are shipped (PR #36):
- features/checkout/domain/checkout.types.ts — CartSnapshot, CheckoutFormData, OrderDraft, CheckoutMode, CheckoutStep
- features/checkout/domain/checkout.rules.ts — orderTotal, isCheckoutReady, missingShippingFields (REQUIRED_FIELDS: email/firstName/lastName/address/region/commune), sanitizePhone
- features/checkout/application/checkout.mapper.ts — toCartSnapshot, toOrderPayload
- features/checkout/application/use-checkout-summary.ts — useCheckoutSummary (reads cart store, delegates to domain)

Deferred from checkout-hexagonal-slice (confirmed by spec Out-of-Scope):
- use-checkout-form: form state, handleInputChange, sanitizePhone, handleSelectSavedAddress
- use-checkout-submit: payment flow, submitGuard, handleSubmitPayment, POST /api/orders, window.location redirect

Cart-ui-strangle template (PR #38, MERGED) established:
- features/cart/ui/{atoms,molecules,organisms,containers}
- Global mocks: next/image + motion/react (vitest aliases, __mocks__/ files)
- RTL pattern: vi.mock hooks → render → assert DOM
- Container-presentational: containers read hooks, organisms/molecules/atoms are pure props

---

## Checkout Page Complete Map (app/checkout/page.tsx, 924 lines)

### Step Machine
- `step` state: 'shipping' | 'payment' | 'confirmation' (useState, line 30)
- CheckoutStep type already exists in checkout.types.ts — ready to use
- Transitions: shipping → payment (handleSubmitShipping), payment → shipping (back), payment → [window.location.href = MP init_point] (handleSubmitPayment success). NO transition to 'confirmation' in success path.

### Step 1: Shipping (lines 294–497)
Form renders:
- SavedAddressPicker (app/components/SavedAddressPicker.tsx) — self-contained: reads useAuthStore, calls addressesService.list() internally, onSelect callback to parent
- Email, firstName, lastName (required text inputs)
- Phone (optional tel input; inline sanitize: /[^\d+\s]/g — keeps spaces, domain sanitizePhone removes spaces)
- Address, apartment (text/optional)
- GEO error banner + retry
- Region <select> (geo.regions, resets city on change via direct setFormData)
- City/Commune <select> (communesOfRegion useMemo)
- Postal code (optional)
- Submit → handleSubmitShipping

### Step 2: Payment (lines 500–622)
Form renders:
- Shipping summary card (read-only formData display)
- MP info card (static)
- Back button → shipping
- "Pagar con MercadoPago" submit → handleSubmitPayment
- 3 trust signals (lock, data, devolution)

### Step 3: Confirmation (lines 625–831)
**DEAD CODE — never reached in happy path.**
handleSubmitPayment success path: sets orderSnapshot.current then fires window.location.href = res.data.init_point (full navigation exit). Never calls setStep('confirmation'). The real result page is /checkout/resultado which polls the backend for real order.order_number.
The confirmation step in page.tsx is dead legacy code.

---

## Math.random() Bug — Complete Analysis

Location: line 28 — `const [orderNumber] = useState(() => Math.floor(Math.random() * 10000))`
Usage: lines 654–658, in the confirmation step UI (#AMB{orderNumber})

Status: DEAD CODE BUG — the confirmation step is unreachable in the happy path.
- handleSubmitPayment fires window.location.href → exits Next.js app
- Real flow: /checkout → MP → /checkout/resultado?status=success&order={real_order_number}
- /checkout/resultado (shipped, 350 lines) polls backend via ecommerceService.getOrder(orderNumber), shows real order.order_number from EcommerceOrderSummary

Fix: Remove the entire inline confirmation step. Delete orderNumber state. Delete orderSnapshot ref. Delete displayItems/displaySubtotal/displayShipping/displayTotal variables. The confirmation responsibility belongs to /checkout/resultado permanently.

---

## S-001: missingShippingFields Wiring Gap

Current: handleSubmitShipping (lines 133–153) has inline missing[] array checking: email, firstName, lastName, address, city (5 fields, in Spanish labels). Builds a Spanish comma-joined list and calls toast.error.

Domain missingShippingFields checks: email, firstName, lastName, address, region, commune (6 fields — note: region is MISSING from inline check; city != commune field name mismatch).

Gaps:
1. Inline check does NOT validate region — user can skip region and proceed to payment
2. Field name mismatch: inline checks formData.city; domain checks 'commune' key
3. Domain checks region; inline does not

Fix in use-checkout-form: normalize formData (city→commune) before calling missingShippingFields(), then map result keys back to Spanish labels for toast message.

---

## formData Field Name Discrepancy

Internal formData state uses `city` as the commune field (input name="city").
CheckoutFormData type uses `commune`.
At submit: `commune: formData.city` is manually mapped in handleSubmitPayment (line 180).

use-checkout-form should normalize this transparently. Two sub-options:
A) Rename internal field to `commune` (update input name="commune") — cleaner type alignment
B) Keep `city` internal, map to `commune` when calling domain functions

Recommend: A (rename to commune). Avoids dual mapping confusion.

---

## GEO Loading

- addressesService.getGeo() called on mount via useEffect + cancelled ref
- geo: ChileGeoResponse | null — { regions: Array<{ id, short_name, communes: Array<{ name }> }> }
- geoError: string | null
- Inline retry: 12-line lambda inside JSX error banner
- communesOfRegion useMemo: geo.regions.find(r => r.short_name === formData.region)?.communes ?? []
- All of this belongs in use-checkout-form as { geo, geoError, communesOfRegion, retryGeo }

---

## SavedAddressPicker Analysis

app/components/SavedAddressPicker.tsx (125 lines):
- Mixed container/presentational — owns its own data fetching
- Reads useAuthStore (gets user)
- Calls addressesService.list() on user.id change
- Auto-selects default address
- Renders radio list of addresses + "new address" option
- Props: { onSelect: (addr: CustomerAddress | null) => void, selectedId: number | null }
- Returns null when no user or no addresses (graceful degradation for guest checkout)

For strangle scope: Keep SavedAddressPicker in app/components/ as-is. Import it directly into ShippingStepForm organism. Moving it to features/checkout/ui/ is a follow-up scope, not this strangle.

---

## Presentational/Atomic Candidates

### Atoms (features/checkout/ui/atoms/)
- CheckoutFormField.tsx — label + input wrapper (email, firstName, lastName, phone, address, apartment, postalCode)
- CheckoutSelectField.tsx — label + select wrapper with disabled state (region, commune)
- CheckoutSubmitButton.tsx — CTA button with loading spinner (both "Continuar" and "Pagar")
- CheckoutGeoErrorBanner.tsx — error message + retry button

### Molecules (features/checkout/ui/molecules/)
- ContactInfoForm.tsx — email + firstName + lastName + phone section
- ShippingAddressForm.tsx — address + apartment + region/commune/postal + geo error banner; receives geo, geoError, communesOfRegion, onRetryGeo as props
- ShippingSummaryCard.tsx — read-only shipping data display (payment step review)
- MercadoPagoInfoCard.tsx — static MP info card
- PaymentTrustSignals.tsx — 3 trust signals (lock, data, devolution)
- CheckoutOrderItemRow.tsx — checkout-specific order item row (uses CartSnapshot.items shape: unit_price, not CartItem.product.price). CANNOT import from features/cart/ui/ per cross-feature rule.
- CheckoutOrderSummary.tsx — right-side sticky panel: items list + subtotal/shipping/discount/total + TrustBadges

### Organisms (features/checkout/ui/organisms/)
- ShippingStepForm.tsx — composes SavedAddressPicker + ContactInfoForm + ShippingAddressForm + CheckoutSubmitButton. Receives all form props.
- PaymentStepForm.tsx — composes ShippingSummaryCard + MercadoPagoInfoCard + back button + CheckoutSubmitButton + PaymentTrustSignals
- CheckoutMobileStickyBar.tsx — mobile sticky bottom bar (total + step label)
- CheckoutEmptyState.tsx — empty cart state display

### Containers (features/checkout/ui/containers/)
- CheckoutPageContainer.tsx — main container. Consumes: useCheckoutForm, useCheckoutSubmit, useCheckoutSummary, useCartStore (items + appliedCoupon + discountAmount). Owns step state. Composes all organisms. Implements hydration guard + trackBeginCheckout once-per-entry.

---

## Hooks to Build

### use-checkout-form (features/checkout/application/use-checkout-form.ts)
Encapsulates: formData state, selectedAddressId state, geo/geoError/communesOfRegion, handleInputChange (with phone sanitize), handleSelectSavedAddress (populate from saved addr), handleSubmitShipping (validates via missingShippingFields domain, calls setStep), retryGeo, mounted state (hydration guard), checkoutTracked ref + trackBeginCheckout once-per-entry.
Returns: { formData, selectedAddressId, geo, geoError, communesOfRegion, mounted, handleInputChange, handleSelectSavedAddress, handleSubmitShipping, retryGeo }
Dependencies: addressesService, sanitizePhone (checkout domain), missingShippingFields (checkout domain), trackBeginCheckout (analytics), toast.

### use-checkout-submit (features/checkout/application/use-checkout-submit.ts)
Encapsulates: submitGuard ref, isProcessingPayment state, handleSubmitPayment (builds snapshot → payload → POST /api/orders → window.location.href = init_point).
Returns: { isProcessingPayment, handleSubmitPayment }
Dependencies: toCartSnapshot, toOrderPayload (checkout.mapper), apiClient, useCartStore (items, discountAmount, appliedCoupon), toast.

### use-checkout-summary (EXISTS — features/checkout/application/use-checkout-summary.ts)
Already shipped. Returns { subtotal, discount, shipping, total }. Ready to consume.

---

## Cross-Feature UI Reuse Analysis

Checkout spec explicitly: "A feature MAY import another feature's DOMAIN but MUST NOT import another feature's APPLICATION, STORE, or UI."

CartItemRow from features/cart/ui/molecules/ — CANNOT be imported by checkout/ui/. Even if it could, the data shapes differ: CartItem uses item.product.price (live price), CartSnapshot.items uses unit_price (price-locked). They're structurally different.

Decision: Checkout-specific CheckoutOrderItemRow in features/checkout/ui/molecules/. Not premature promotion to shared/.

CartSummaryPanel from features/cart/ui/molecules/ — also different structure (cart has CTAs, checkout has items list + TrustBadges). Create checkout-specific CheckoutOrderSummary.

---

## Target Directory Structure

features/checkout/ui/
  atoms/
    CheckoutFormField.tsx + .test.tsx
    CheckoutSelectField.tsx + .test.tsx
    CheckoutSubmitButton.tsx + .test.tsx
    CheckoutGeoErrorBanner.tsx + .test.tsx
  molecules/
    ContactInfoForm.tsx + .test.tsx
    ShippingAddressForm.tsx + .test.tsx
    ShippingSummaryCard.tsx + .test.tsx
    MercadoPagoInfoCard.tsx + .test.tsx
    PaymentTrustSignals.tsx + .test.tsx
    CheckoutOrderItemRow.tsx + .test.tsx
    CheckoutOrderSummary.tsx + .test.tsx
  organisms/
    ShippingStepForm.tsx + .test.tsx
    PaymentStepForm.tsx + .test.tsx
    CheckoutMobileStickyBar.tsx + .test.tsx
    CheckoutEmptyState.tsx + .test.tsx
  containers/
    CheckoutPageContainer.tsx + .test.tsx

features/checkout/application/:
  use-checkout-form.ts + .test.ts (NEW)
  use-checkout-submit.ts + .test.ts (NEW)

app/checkout/page.tsx → thin shell (5 lines, renders CheckoutPageContainer)

---

## PR Split Estimate

New files: 4+4 atoms, 7+7 molecules, 4+4 organisms, 1+1 container + 2+2 hooks = 34 files approx.
Estimated diff: 924 deleted from page.tsx + ~1,600–1,900 new lines (components + tests) = 2,500–2,800 lines total.
400-line budget risk: HIGH. Chained PRs required.

Recommended split (stacked-to-main):

PR 1 — Hooks + Atoms + Molecules (no consumer change, page.tsx untouched):
- use-checkout-form.ts + test
- use-checkout-submit.ts + test
- features/checkout/ui/atoms/ (4 files + 4 tests)
- features/checkout/ui/molecules/ (7 files + 7 tests)
- Estimated diff: ~650–850 lines

PR 2 — Organisms + Container + Consumer Swap + Fixes:
- features/checkout/ui/organisms/ (4 files + 4 tests)
- features/checkout/ui/containers/CheckoutPageContainer.tsx + test
- app/checkout/page.tsx → thin shell (removes 924 lines, adds ~5)
- S-001 fix: missingShippingFields domain wiring in use-checkout-form
- Math.random() dead code removal (no more confirmation step)
- Estimated diff: ~950–1,100 lines

---

## Current Test Coverage

Unit tests on app/checkout/page.tsx: ZERO (none exist)
E2E: e2e/checkout-mp-sandbox.spec.ts, e2e/checkout-flow.spec.ts (Playwright, not Vitest)
Domain: features/checkout/domain/checkout.rules.test.ts (14 tests, all green)
Mapper: features/checkout/application/checkout.mapper.test.ts (11 tests, all green)
Test infra: __mocks__/next-image.tsx + motion/react alias — BOTH exist and ready. No new infra needed.

---

## Risks

1. GEO loading complexity: cascading region/commune select with error/retry state — RTL tests for ShippingAddressForm require addressesService mock + multiple state scenarios.
2. Phone sanitize UX vs domain discrepancy: domain removes spaces (/\D/g except leading +), inline UX keeps spaces. Need design decision before use-checkout-form implementation.
3. formData.city→commune field rename: must be done consistently across all atoms/molecules. Low risk if done in hook layer only.
4. window.location.href in use-checkout-submit tests: requires Object.defineProperty or vi.spyOn setup in test.
5. Dead confirmation step removal: near-zero risk (unreachable), but design should confirm no future use intended.
6. PR 2 size: even after split, PR 2 may approach 1,100-line diff. May need size:exception or further split (organisms PR + swap PR).

---

## Open Questions For Design Phase

1. sanitizePhone UX: align domain (removes spaces) with input behavior (keeps spaces) or keep them diverged intentionally?
2. step state ownership: in CheckoutPageContainer or in a use-checkout-step hook?
3. SavedAddressPicker: move to features/checkout/ui/ as part of this strangle or leave in app/components/?
4. CheckoutProgressBar: import directly or wrap in a CheckoutStepIndicator atom?
5. Confirmation step: confirmed dead code — remove entirely. Any concerns from business side before deleting?
6. PR 2 size: accept size:exception or split organisms/swap into separate PRs (3-PR chain)?

## Recommendation

Proceed to sdd-propose. All facts confirmed from source code. The approach is clear:
- Mirror cart-ui-strangle pattern exactly
- Build deferred hooks first (use-checkout-form + use-checkout-submit)
- Split into 2 chained PRs (PR1 hooks+atoms+molecules, PR2 organisms+container+swap+fixes)
- Remove dead confirmation step and Math.random() bug
- Wire missingShippingFields domain in use-checkout-form
- Keep SavedAddressPicker in app/components/ for now
- CheckoutOrderItemRow is checkout-specific (no cross-feature UI import)
