# Proposal: checkout-ui-strangle

## Intent

`app/checkout/page.tsx` is a 924-line `'use client'` monolith mixing step machine, form/GEO state, saved-address selection, payment submission, MP redirect, hydration guard, inline validation, and a Math.random() order number in a dead confirmation step. The checkout `domain` + `application` layers shipped (PR #36) but the deferred hooks and UI layer never landed. This change applies the cart-ui-strangle template (PR #38) to checkout: build the deferred hooks, establish `features/checkout/ui/`, fix two latent defects (Math.random dead code, S-001 validation gap), and reduce the page to a thin shell — with zero observable behavior change.

## Scope

### In Scope
- `features/checkout/ui/{atoms,molecules,organisms,containers}` mirroring cart-ui. Presentational = pure props; only containers consume hooks/store; `ui` imports `application`+`domain`, never `infrastructure`.
  - Atoms: CheckoutFormField, CheckoutSelectField, CheckoutSubmitButton, CheckoutGeoErrorBanner.
  - Molecules: ContactInfoForm, ShippingAddressForm, ShippingSummaryCard, MercadoPagoInfoCard, PaymentTrustSignals, CheckoutOrderItemRow (CartSnapshot.unit_price shape), CheckoutOrderSummary.
  - Organisms: ShippingStepForm, PaymentStepForm, CheckoutEmptyState, CheckoutMobileStickyBar (if present).
  - Container: CheckoutPageContainer (owns step state; consumes use-checkout-form + use-checkout-submit + use-checkout-summary + cart store; hydration guard; trackBeginCheckout once-per-entry).
- BUILD deferred hooks: `use-checkout-form.ts` (formData, geo/geoError+retry, communesOfRegion, handleInputChange, handleSelectSavedAddress, handleSubmitShipping via domain missingShippingFields, mounted guard, trackBeginCheckout once) and `use-checkout-submit.ts` (submitGuard, isProcessingPayment, handleSubmitPayment → toCartSnapshot → toOrderPayload → POST /api/orders → window.location MP redirect). `use-checkout-summary` EXISTS — consume it.
- Math.random fix = REMOVAL: delete the dead inline confirmation step, orderNumber state, orderSnapshot ref, and display* variables. Real confirmation is `/checkout/resultado`.
- S-001 fix: wire domain `missingShippingFields` (inline check omits `region`); rename internal field city→commune (select `name="city"`→`"commune"`) for CheckoutFormData alignment; map missing-field keys → Spanish toast labels.
- sanitizePhone boundary: keep spaces in input display (UX); call domain `sanitizePhone` ONLY at the payload boundary in use-checkout-submit (NOT in handleInputChange).
- Consumer swap: `app/checkout/page.tsx` → thin shell rendering CheckoutPageContainer. Reuse as-is (import directly): SavedAddressPicker, CheckoutProgressBar, TrustBadges, CheckoutSkeleton.
- RTL tests (cart-ui precedent): presentational render-with-props; containers/hooks mock deps. window.location mock for submit; addressesService mock for GEO.

### Out of Scope
- SavedAddressPicker internal refactor (stays in `app/components/`).
- `/checkout/resultado` (real confirmation — untouched).
- card-payment Bricks integration.
- e2e changes (Playwright specs remain).

## Capabilities

### New Capabilities
- `checkout-ui`: container-presentational + atomic UI layer for checkout (atoms/molecules/organisms/containers), the deferred form/submit hooks, dependency-direction purity, and RTL test requirements.

### Modified Capabilities
- `checkout`: deferred hooks (use-checkout-form, use-checkout-submit) now realized; S-001 validation wired to domain `missingShippingFields`; dead confirmation step + Math.random order number removed; sanitizePhone applied only at payload boundary.

## Approach

Mirror cart-ui-strangle exactly. Build the two deferred application hooks first (RED→GREEN), then atoms→molecules→organisms→container, then swap the page to a thin shell. Presentational components are pure props; CheckoutPageContainer is the sole hook/store consumer inside `ui/`. The dead confirmation step is deleted (not preserved) and S-001 is fixed by delegating validation to the existing domain function — both folded into the swap PR. Reuse existing global mocks (`__mocks__/next-image.tsx` + motion/react alias); no new test infra.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `features/checkout/ui/**` | New | atoms, molecules, organisms, container + colocated tests |
| `features/checkout/application/use-checkout-form.ts` | New | form/GEO/validation hook + test |
| `features/checkout/application/use-checkout-submit.ts` | New | payment/redirect hook + test |
| `app/checkout/page.tsx` | Modified | 924 lines → thin shell; dead confirmation + Math.random removed; S-001 fixed |
| `features/checkout/application/use-checkout-summary.ts` | Reused | consumed as-is |

## Cross-Feature UI Rule

`features/checkout/ui/` MUST NOT import `features/cart/ui/`. Spec forbids cross-feature UI/application imports AND data shapes differ (CartSnapshot.unit_price vs CartItem.product.price). Use checkout-specific CheckoutOrderItemRow / CheckoutOrderSummary — not premature promotion to shared.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| GEO cascade state in RTL tests | Med | addressesService mock + multiple-state scenarios in ShippingAddressForm tests |
| window.location.href in submit tests | Med | Object.defineProperty / vi.spyOn setup |
| city→commune rename inconsistency | Low | Rename in hook layer only; presentational atoms stay field-agnostic |
| PR2 exceeds 400-line budget | High | Chained PRs; PR2 may need size:exception or 3-way split — defer to tasks Review Workload Guard |
| Dead confirmation deletion regret | Low | Confirmed unreachable; design confirms no future use |

## Delivery Plan

Estimate ~2,500–2,800 lines (924 deleted + ~1,600–1,900 new). **Chained PRs REQUIRED.** Plan 2 chained PRs:
- **PR1** (~650–850 lines): hooks (use-checkout-form, use-checkout-submit) + atoms + molecules + RTL tests. page.tsx untouched (new files only). Note dead-code window: hooks/components unused until PR2.
- **PR2** (~950–1,100 lines): organisms + CheckoutPageContainer + swap page.tsx to thin shell + Math.random removal + S-001 fix. May need `size:exception` or a 3-way split — final delivery decision deferred to the tasks Review Workload Guard.

## Rollback Plan

PR1 adds only new unused files — revert the PR with zero consumer impact. PR2 swaps the page; rollback = revert PR2 to restore the monolithic `page.tsx` (no schema/state/store changes to unwind). Each PR is an isolated, independently revertible squash merge.

## Dependencies

- Checkout domain + application (PR #36) — shipped.
- cart-ui-strangle pattern + global mocks (PR #38) — shipped.

## Success Criteria

- [ ] `features/checkout/ui/` mirrors cart-ui taxonomy; presentational components have zero store/hook/infrastructure imports.
- [ ] use-checkout-form + use-checkout-submit built and consumed; use-checkout-summary reused.
- [ ] Dead confirmation step + Math.random order number removed.
- [ ] S-001 fixed: missingShippingFields domain wired (region validated); city→commune aligned.
- [ ] sanitizePhone applied only at payload boundary.
- [ ] `app/checkout/page.tsx` is a thin shell; behavior preserved (steps, GEO cascade, SavedAddressPicker, MP redirect, toasts, trackBeginCheckout, skeleton/hydration).
- [ ] No checkout/ui → cart/ui import.
- [ ] All 449 existing tests green + new RTL tests pass via `pnpm test:run`.
