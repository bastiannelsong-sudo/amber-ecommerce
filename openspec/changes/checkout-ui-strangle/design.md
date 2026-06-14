# Design: checkout-ui-strangle

## Technical Approach

Mirror the cart-ui-strangle template (PR #38) on the 924-line `app/checkout/page.tsx`. Build the two deferred application hooks (`use-checkout-form`, `use-checkout-submit`), consume the existing `use-checkout-summary`, establish `features/checkout/ui/{atoms,molecules,organisms,containers}`, and reduce the page to a thin shell. Presentational components are pure-props; only `CheckoutPageContainer` consumes hooks/store. Two latent defects are folded into the swap: dead confirmation step + `Math.random` (removal), and S-001 (wire domain `missingShippingFields`). Zero observable behavior change in the live shipping→payment→MP-redirect flow.

## Architecture Decisions

| Decision | Choice | Rejected | Rationale |
|---|---|---|---|
| ADR-1 UI layering | `features/checkout/ui/{atoms,molecules,organisms,containers}` mirroring cart-ui. ui imports application+domain only, never infrastructure. checkout/ui MUST NOT import cart/ui. | Promote shared cart/checkout UI | Spec forbids cross-feature UI/app imports; shapes differ (`CartSnapshot.unit_price` vs `CartItem.product.price`). Premature promotion = wrong abstraction. |
| ADR-4 step ownership | Container owns `step` 3-value state (`shipping\|payment\|confirmation` type kept, but only shipping/payment reachable). No `use-checkout-step` hook. | Dedicated step hook | Step is trivial local UI state with two transitions; a hook adds ceremony with zero reuse. Container selects the organism per step. |
| ADR-5 sanitizePhone boundary | Display keeps spaces (`handleInputChange` strips only `/[^\d+\s]/g`). Domain `sanitizePhone` applied ONLY in `use-checkout-submit` at payload build. | Sanitize on input; sanitize inside mapper | UX wants readable `+56 9 ...`; backend wants compact. `toOrderPayload` does NOT sanitize (verified) — boundary must live in the submit hook. |
| ADR-6 Math.random removal | Delete `orderNumber` state, `orderSnapshot` ref, `display*` vars, entire confirmation JSX. | Preserve as fallback | `setStep('confirmation')` is never called (verified all 3 setStep call sites). Real confirmation is `/checkout/resultado`. Dead, unreachable, zero behavior impact. |
| ADR-7 S-001 fix | `handleSubmitShipping` calls domain `missingShippingFields(formData)`; map returned keys→Spanish labels. region now validated. | Keep inline 5-field check | Inline omits `region` and uses `city` key; domain checks 6 fields incl. region/commune. Single source of truth. |
| ADR-2/3 mocks | Reuse global `__mocks__/next-image.tsx` + `motion/react` alias. No new infra. | New per-test stubs | Already wired in `vitest.config.mts`. |

## Hook Contracts

### use-checkout-form (NEW)
`formData` field renamed `city`→`commune` (CheckoutFormData alignment; select `name="commune"`).
```
returns {
  formData, selectedAddressId,
  geo, geoError, communesOfRegion, mounted,
  handleInputChange,        // phone: replace(/[^\d+\s]/g,'') — KEEP spaces
  handleSelectSavedAddress, // populates commune (was city)
  handleSubmitShipping,     // (e, setStep) → missingShippingFields → toast Spanish | setStep('payment')
  retryGeo,
}
```
- GEO load: `useEffect` with `let cancelled` flag (preserve current pattern, NOT AbortController) → `addressesService.getGeo()`; same empty/error guards. `retryGeo` extracts the inline JSX retry lambda.
- `communesOfRegion`: `useMemo` over `geo.regions.find(r => r.short_name === formData.region)?.communes ?? []`.
- region change resets `commune: ''` (preserve current cascade reset).
- `mounted` hydration guard; `checkoutTracked` ref → `trackBeginCheckout(items)` once-per-entry.
- Key→label map: `{email:'email',firstName:'nombre',lastName:'apellido',address:'dirección',region:'región',commune:'comuna'}`. Toast uses existing join phrasing (`Falta X para continuar.`).

### use-checkout-submit (NEW)
```
returns { isProcessingPayment, handleSubmitPayment }
```
- `submitGuard` ref (double-click guard) + `isProcessingPayment` state.
- Reads cart store: `items`, `appliedCoupon`, `discountAmount`.
- `toCartSnapshot(items, discountAmount)` → build CheckoutFormData with **`phone: sanitizePhone(formData.phone)`** (boundary) → `toOrderPayload(snapshot, formData, appliedCoupon)`.
- `apiClient.post('/orders', payload)` (preserve current direct call, NOT ecommerceService) → guard `init_point` → `toast.success` → `window.location.href = init_point`.
- Error: ApiError-aware Spanish fallback toast; reset `submitGuard.current=false` + `setIsProcessingPayment(false)`.

### use-checkout-summary (REUSE)
Consumed as-is: `{ subtotal, discount, shipping, total }`.

## Data Flow
```
CheckoutPageContainer (owns step; consumes 3 hooks + cart store)
  ├─ mounted? no → CheckoutSkeleton
  ├─ items==0 → CheckoutEmptyState
  ├─ step==shipping → ShippingStepForm (SavedAddressPicker + ContactInfoForm + ShippingAddressForm)
  │     submit → use-checkout-form.handleSubmitShipping → setStep('payment')
  ├─ step==payment → PaymentStepForm (ShippingSummaryCard + MercadoPagoInfoCard + PaymentTrustSignals)
  │     submit → use-checkout-submit.handleSubmitPayment → window.location.href (MP)
  └─ aside → CheckoutOrderSummary + TrustBadges ; CheckoutMobileStickyBar
```

## File Changes
| File | Action | Description |
|---|---|---|
| `features/checkout/application/use-checkout-form.ts` (+test) | Create | form/GEO/validation hook |
| `features/checkout/application/use-checkout-submit.ts` (+test) | Create | payment/redirect hook |
| `features/checkout/ui/atoms/*` (4 +tests) | Create | CheckoutFormField, CheckoutSelectField, CheckoutSubmitButton, CheckoutGeoErrorBanner |
| `features/checkout/ui/molecules/*` (7 +tests) | Create | ContactInfoForm, ShippingAddressForm, ShippingSummaryCard, MercadoPagoInfoCard, PaymentTrustSignals, CheckoutOrderItemRow, CheckoutOrderSummary |
| `features/checkout/ui/organisms/*` (4 +tests) | Create | ShippingStepForm, PaymentStepForm, CheckoutMobileStickyBar, CheckoutEmptyState |
| `features/checkout/ui/containers/CheckoutPageContainer.tsx` (+test) | Create | sole hook/store consumer; owns step + hydration |
| `app/checkout/page.tsx` | Modify | 924→thin shell; dead confirmation + Math.random removed; S-001 fixed via hook |

`CheckoutOrderItemRow` props: `{ item: CartSnapshot['items'][number] }` using `unit_price` (NOT `product.price`).

## Testing Strategy
| Layer | What | Approach |
|---|---|---|
| Presentational | atoms/molecules/organisms render + callbacks | render-with-props; no mocks beyond global next-image/motion |
| Hook use-checkout-form | GEO load/error/retry, validation toast, city→commune | `vi.mock` addressesService.getGeo (resolve/reject/empty); renderHook + act |
| Hook use-checkout-submit | snapshot→payload→redirect, phone sanitize, guard, error | mock `apiClient`; mock `window.location` via `Object.defineProperty(window,'location',{value:{href:''},writable:true})` (or `vi.stubGlobal`) — **new precedent extending cart-ui RTL** |
| Container | hydration skeleton, empty cart, trackBeginCheckout once, step swap | `vi.mock` the 3 hooks + analytics + toast + skeleton; `act()` flush (cart-ui precedent) |

## Migration / Rollout
2 chained PRs. PR1: hooks + atoms + molecules + tests (page.tsx untouched; new unused files). PR2: organisms + container + page swap + Math.random removal + S-001. **PR2 may exceed 400 lines even split** → tasks Review Workload Guard must decide `size:exception` vs 3-way split (organisms PR / swap PR). Rollback = revert the offending PR; no schema/store/state changes to unwind.

## Open Questions
- [ ] PR2 sizing: `size:exception` vs 3-way split — defer to sdd-tasks Review Workload Guard.
