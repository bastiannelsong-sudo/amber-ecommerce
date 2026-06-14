# Tasks: checkout-ui-strangle

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~2,600–2,900 (924 deleted from page.tsx + ~1,700–2,000 new) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1 (hooks + atoms) → PR2 (molecules) → PR3 (organisms + container + page swap) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Per-Slice Line Estimates

| Slice | Files | Est. Lines | Risk |
|-------|-------|------------|------|
| PR1 | use-checkout-form.ts+test, use-checkout-submit.ts+test, 4 atoms+4 tests | ~700–820 | size:exception |
| PR2 | 7 molecules + 7 tests | ~380–440 | borderline; likely size:exception |
| PR3 | 4 organisms+4 tests, CheckoutPageContainer+test, page.tsx swap (924→~25) | ~1,450–1,650 | size:exception required |

> **Decision needed before apply.** Delivery strategy is `ask-on-risk`. All three slices exceed or brush the 400-line budget.
> Orchestrator MUST ask user: accept `size:exception` per slice, or further split PR1 into hooks-only / atoms-only.

### Suggested Work Units (stacked-to-main)

| Unit | Goal | Base Branch | Autonomous? |
|------|------|-------------|-------------|
| PR1 | Hooks (form + submit) + 4 atoms + tests | `feat/checkout-ui-strangle` | Yes — page.tsx untouched, new files only |
| PR2 | 7 molecules + tests | PR1 branch | Yes — no consumers yet |
| PR3 | 4 organisms + container + page.tsx swap + Math.random removal + S-001 | PR2 branch | Yes — behavior-change; size:exception required |

---

## Phase 1 — Application Hooks [PR1]

Spec refs: CHK-A4, CHK-A5, CHKUI-HOOK-1, CHKUI-HOOK-2, CHKUI-T3.
ADRs: ADR-5 (sanitizePhone boundary), ADR-7 (S-001/domain delegation), commune field.

- [x] 1.1 **RED** Create `features/checkout/application/use-checkout-form.test.ts` — failing tests: exported API shape (all 10 return values present); GEO loads on mount via `addressesService.getGeo()` and cancels on unmount via `let cancelled`; `communesOfRegion` memo updates when `formData.region` changes; `handleInputChange` preserves phone spaces (no strip); `handleSubmitShipping` blocks + shows Spanish toast when `region` empty (S-001/CHKUI-FIX-S001); `handleSubmitShipping` calls `setStep('payment')` when all fields valid; `retryGeo` re-calls `getGeo` + resets `geoError`; `trackBeginCheckout` called exactly once under strict-mode double-effect. Mock `addressesService.getGeo` via `vi.mock`. Est. ~130 lines.
- [x] 1.2 **GREEN** Create `features/checkout/application/use-checkout-form.ts` — `formData` initial state with `commune` key (not `city`); GEO via `addressesService.getGeo()` in `useEffect` with `let cancelled` guard; `communesOfRegion` via `useMemo` (`geo.regions.find(r => r.short_name === formData.region)?.communes ?? []`); region change resets `commune: ''`; `handleInputChange` strips `/[^\d+\s]/g` for phone only; `handleSelectSavedAddress` populates `commune`; `handleSubmitShipping(e, setStep)` → `missingShippingFields(formData)` → Spanish label map `{email:'email', firstName:'nombre', lastName:'apellido', address:'dirección', region:'región', commune:'comuna'}` → toast on missing → `setStep('payment')` on clear; `checkoutTracked` ref → `trackBeginCheckout(items)` once; `retryGeo` flip-flop trigger; `mounted` hydration guard; NO JSX. Make 1.1 green. Est. ~120 lines.
- [x] 1.3 **RED** Create `features/checkout/application/use-checkout-submit.test.ts` — failing tests: exported API shape (`isProcessingPayment` boolean, `handleSubmitPayment` function); redirect to `init_point` on success (`window.location.href` mocked via `Object.defineProperty(window, 'location', { value: { href: '' }, writable: true })`); `sanitizePhone` at payload boundary only — POST body phone is `'+56912345678'` when `formData.phone = '+56 9 1234 5678'`; double-submit guard: second call is no-op (only one POST). Mock `apiClient`, `useCartStore`. Est. ~100 lines.
- [x] 1.4 **GREEN** Create `features/checkout/application/use-checkout-submit.ts` — `submitGuard` ref; `isProcessingPayment` state; `handleSubmitPayment`: guard check → `toCartSnapshot(items, discountAmount)` → `toOrderPayload(snapshot, { ...formData, phone: sanitizePhone(formData.phone) }, appliedCoupon)` (`sanitizePhone` applied AT BOUNDARY here, NOT inside `toOrderPayload`) → `apiClient.post('/orders', payload)` (direct call, NOT ecommerceService) → guard `init_point` → `toast.success` → `window.location.href = init_point`; on error: ApiError-aware Spanish fallback toast + reset guard + `setIsProcessingPayment(false)`; NO JSX. Make 1.3 green. Est. ~80 lines.

## Phase 2 — Atoms [PR1]

Spec refs: CHKUI-ATOM-1..4, CHKUI-T2. Reuse global `__mocks__/next-image.tsx` + motion/react alias (CHKUI-T1). No store/hook imports.

- [x] 2.1 **RED** Create `features/checkout/ui/atoms/CheckoutFormField.test.tsx` — label text + input value present in DOM. Est. ~20 lines.
- [x] 2.2 **GREEN** Create `features/checkout/ui/atoms/CheckoutFormField.tsx` — `{ label, name, value, onChange, type?, required?, placeholder? }`; renders `<label>` + `<input>`. Make 2.1 green. Est. ~25 lines.
- [x] 2.3 **RED** Create `features/checkout/ui/atoms/CheckoutSelectField.test.tsx` — two options render; `<select>` has `disabled` attribute when `disabled=true`. Est. ~30 lines.
- [x] 2.4 **GREEN** Create `features/checkout/ui/atoms/CheckoutSelectField.tsx` — `{ label, name, value, onChange, options, disabled?, placeholder? }`; `<label>` + `<select>` with mapped `<option>` elements. Make 2.3 green. Est. ~30 lines.
- [x] 2.5 **RED** Create `features/checkout/ui/atoms/CheckoutSubmitButton.test.tsx` — loading: indicator present + button `disabled`; idle: label visible + not disabled. Est. ~30 lines.
- [x] 2.6 **GREEN** Create `features/checkout/ui/atoms/CheckoutSubmitButton.tsx` — `{ label, isLoading, disabled?, onClick? }`; when `isLoading`: button disabled + spinner/indicator visible; else: label text rendered. Make 2.5 green. Est. ~30 lines.
- [x] 2.7 **RED** Create `features/checkout/ui/atoms/CheckoutGeoErrorBanner.test.tsx` — message visible; `onRetry` called once on button click. Est. ~20 lines.
- [x] 2.8 **GREEN** Create `features/checkout/ui/atoms/CheckoutGeoErrorBanner.tsx` — `{ message, onRetry }`; renders error message text + retry `<button>`. Make 2.7 green. Est. ~20 lines.

## Phase 3 — Molecules [PR2]

Spec refs: CHKUI-MOL-1..7, CHKUI-T2. Compose atoms only. No store/hook imports. No `features/cart/ui/` imports (ADR-1).

- [x] 3.1 **RED** Create `features/checkout/ui/molecules/ContactInfoForm.test.tsx` — four labeled inputs present. Est. ~25 lines.
- [x] 3.2 **GREEN** Create `features/checkout/ui/molecules/ContactInfoForm.tsx` — composes `CheckoutFormField` ×4 (email, firstName, lastName, phone) + `onChange`. Make 3.1 green. Est. ~40 lines.
- [x] 3.3 **RED** Create `features/checkout/ui/molecules/ShippingAddressForm.test.tsx` — `CheckoutGeoErrorBanner` present when `geoError` set; commune select options match `communesOfRegion`. Est. ~40 lines.
- [x] 3.4 **GREEN** Create `features/checkout/ui/molecules/ShippingAddressForm.tsx` — `{ formData, geo, geoError, communesOfRegion, onChange, onRetryGeo }`; address via `CheckoutFormField`; region + commune via `CheckoutSelectField`; renders `CheckoutGeoErrorBanner` when `geoError` non-null. Make 3.3 green. Est. ~55 lines.
- [x] 3.5 **RED** Create `features/checkout/ui/molecules/ShippingSummaryCard.test.tsx` — email, name, address from `formData` in DOM. Est. ~25 lines.
- [x] 3.6 **GREEN** Create `features/checkout/ui/molecules/ShippingSummaryCard.tsx` — `{ formData: CheckoutFormData }`; read-only display of contact + shipping fields. Make 3.5 green. Est. ~35 lines.
- [x] 3.7 **RED** Create `features/checkout/ui/molecules/MercadoPagoInfoCard.test.tsx` — static MP content present in DOM. Est. ~15 lines.
- [x] 3.8 **GREEN** Create `features/checkout/ui/molecules/MercadoPagoInfoCard.tsx` — no dynamic props; static MercadoPago info. Make 3.7 green. Est. ~20 lines.
- [x] 3.9 **RED** Create `features/checkout/ui/molecules/PaymentTrustSignals.test.tsx` — three distinct trust signal elements present. Est. ~20 lines.
- [x] 3.10 **GREEN** Create `features/checkout/ui/molecules/PaymentTrustSignals.tsx` — no dynamic props; lock / data-protection / devolution badges. Make 3.9 green. Est. ~25 lines.
- [x] 3.11 **RED** Create `features/checkout/ui/molecules/CheckoutOrderItemRow.test.tsx` — name, quantity, formatted `unit_price` rendered from `CartSnapshot['items'][number]`. Est. ~20 lines.
- [x] 3.12 **GREEN** Create `features/checkout/ui/molecules/CheckoutOrderItemRow.tsx` — `{ item: CartSnapshot['items'][number] }`; renders `item.name`, `item.quantity`, `item.unit_price`; NO import from `features/cart/ui/`. Make 3.11 green. Est. ~25 lines.
- [x] 3.13 **RED** Create `features/checkout/ui/molecules/CheckoutOrderSummary.test.tsx` — two item rows + subtotal/discount/shipping/total values visible. Est. ~30 lines.
- [x] 3.14 **GREEN** Create `features/checkout/ui/molecules/CheckoutOrderSummary.tsx` — `{ items, subtotal, discount, shipping, total }`; maps items to `CheckoutOrderItemRow`; totals panel; NO import from `features/cart/ui/`. Make 3.13 green. Est. ~40 lines.

## Phase 4 — Organisms [PR3]

Spec refs: CHKUI-ORG-1..3 + mobile sticky bar. No store/hook imports.

- [x] 4.1 **RED** Create `features/checkout/ui/organisms/ShippingStepForm.test.tsx` — contact fields and address fields both present with mock props. Est. ~35 lines.
- [x] 4.2 **GREEN** Create `features/checkout/ui/organisms/ShippingStepForm.tsx` — accepts form/GEO/saved-address/submit props; composes `SavedAddressPicker` (from `app/components/`), `ContactInfoForm`, `ShippingAddressForm`, `CheckoutSubmitButton`; no store/hook imports. Make 4.1 green. Est. ~70 lines.
- [x] 4.3 **RED** Create `features/checkout/ui/organisms/PaymentStepForm.test.tsx` — back button calls `onBack` once; `isProcessingPayment=true` disables submit button. Est. ~35 lines.
- [x] 4.4 **GREEN** Create `features/checkout/ui/organisms/PaymentStepForm.tsx` — `{ formData, isProcessingPayment, onBack, onSubmitPayment, summary }`; composes `ShippingSummaryCard`, `MercadoPagoInfoCard`, back `<button>` calling `onBack`, `CheckoutSubmitButton`, `PaymentTrustSignals`; no store/hook imports. Make 4.3 green. Est. ~65 lines.
- [x] 4.5 **RED** Create `features/checkout/ui/organisms/CheckoutEmptyState.test.tsx` — empty-cart message + catalog CTA present. Est. ~20 lines.
- [x] 4.6 **GREEN** Create `features/checkout/ui/organisms/CheckoutEmptyState.tsx` — static empty-cart message + link/button to catalog; no store/hook imports. Make 4.5 green. Est. ~25 lines.
- [x] 4.7 **RED** Create `features/checkout/ui/organisms/CheckoutMobileStickyBar.test.tsx` — summary totals visible in sticky bar. Est. ~20 lines.
- [x] 4.8 **GREEN** Create `features/checkout/ui/organisms/CheckoutMobileStickyBar.tsx` — accepts summary totals props; mobile-sticky order summary bar; no store/hook imports. Make 4.7 green. Est. ~30 lines.

## Phase 5 — Container [PR3]

Spec refs: CHKUI-CONT-1, CHKUI-T4. Sole hook/store consumer inside `ui/`. Owns step state machine.

- [x] 5.1 **RED** Create `features/checkout/ui/containers/CheckoutPageContainer.test.tsx` — `vi.mock` all four deps (`useCheckoutForm`, `useCheckoutSubmit`, `useCheckoutSummary`, `useCartStore`); tests: `CheckoutSkeleton` in DOM before `mounted` fires; `ShippingStepForm` content visible when `step='shipping'` + items present; `PaymentStepForm` content visible when `step='payment'`; `CheckoutEmptyState` when `items=[]`; `trackBeginCheckout` called exactly once via `act()` flush (strict-mode guard). Est. ~100 lines.
- [x] 5.2 **GREEN** Create `features/checkout/ui/containers/CheckoutPageContainer.tsx` — imports `useCheckoutForm`, `useCheckoutSubmit`, `useCheckoutSummary`, `useCartStore`; `step` state `'shipping' | 'payment'`; `mounted` + `useEffect` hydration guard → `CheckoutSkeleton` while unmounted; `checkoutTracked` ref → `trackBeginCheckout(items)` once; `items.length === 0` → `CheckoutEmptyState`; `step === 'shipping'` → `ShippingStepForm`; `step === 'payment'` → `PaymentStepForm`; aside: `CheckoutOrderSummary` + `TrustBadges` + `CheckoutMobileStickyBar` + `CheckoutProgressBar`. Make 5.1 green. Est. ~120 lines.

## Phase 6 — Consumer Swap + Dead Code Removal [PR3]

Spec refs: CHKUI-SWAP, CHKUI-FIX-MATHRANDOM, CHKUI-FIX-S001, CHK-D1. ADRs: ADR-4 (step in container), ADR-6 (Math.random removal).

- [x] 6.1 **RED** Add to `CheckoutPageContainer.test.tsx`: assert `CheckoutStep` does not include `'confirmation'` (TypeScript `@ts-expect-error` or type assertion test); assert no `Math.random` reference survives in checkout implementation files. Est. ~15 lines added.
- [x] 6.2 **GREEN** Modify `app/checkout/page.tsx` (924 lines → ~25 lines thin shell): delete `orderNumber` useState + `Math.random()` init; delete `orderSnapshot` ref; delete all `display*` vars (`displayItems`, `displaySubtotal`, `displayShipping`, `displayTotal`); delete entire confirmation step JSX block (original lines 625–831); remove all inline hooks, state, validation, and handler logic; retain only `'use client'` directive + import of `CheckoutPageContainer` + thin render `<CheckoutPageContainer />`. (`CheckoutProgressBar`, `CheckoutSkeleton`, `TrustBadges` are now composed inside the container.) Est. ~924 deleted + ~25 new = ~949 delta lines. Make 6.1 green.
- [x] 6.3 **VERIFY** Inspect `features/checkout/domain/checkout.types.ts`: `CheckoutStep` MUST be `'shipping' | 'payment'` only — remove `'confirmation'` variant if still present (CHK-D1). Est. ~3–5 lines modified.
- [x] 6.4 **VERIFY** Run `pnpm test:run` — all 449 pre-existing tests green + all new RTL tests pass; zero `Math.random` in any checkout file; zero `step === 'confirmation'` in checkout UI layer; `tsc --noEmit` exits zero (CHKUI-T5).

---

## Architecture Guards (run after each PR merge)

- [x] G.1 Verify zero imports from `features/cart/ui/` anywhere in `features/checkout/ui/` (ADR-1, CHKUI-ARCH). VERIFIED PR2b.
- [x] G.2 Verify atoms/molecules/organisms have zero imports from stores, hooks, or `features/*/infrastructure/` (CHKUI-ARCH). VERIFIED PR2b.
- [x] G.3 Verify `CheckoutPageContainer` is the SOLE consumer of the three hooks + `useCartStore` inside `ui/` (CHKUI-ARCH). VERIFIED PR2b.
- [x] G.4 Verify `sanitizePhone` is called ONLY in `use-checkout-submit.ts` at payload boundary — NOT inside `toOrderPayload`, NOT in `handleInputChange` (ADR-5). VERIFIED PR1.
- [x] G.5 Verify `apiClient.post('/orders', payload)` is the direct call — NOT via `ecommerceService` (design note). VERIFIED PR1.
- [x] G.6 Verify GEO effect uses `let cancelled` flag — NOT AbortController (design note). VERIFIED PR1.

---

## Dependency Order

```
Phase 1 (hooks) → Phase 2 (atoms) → [PR1 merge to main]
                                           ↓
                               Phase 3 (molecules) → [PR2 merge to main]
                                                           ↓
                                           Phase 4 (organisms)
                                                 ↓
                                           Phase 5 (container)
                                                 ↓
                                           Phase 6 (swap) → [PR3 merge to main]
```

Within PR1: Phase 1 before Phase 2 (atoms are spec-driven, not hook-dependent, but depend on domain type `commune` being confirmed in 1.2).
Within PR3: Phases 4 → 5 → 6 are strictly sequential. Sibling atoms/molecules within same phase can be parallelized.
