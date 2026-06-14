# Verify Report: checkout-ui-strangle — PR1

**Date**: 2026-06-14
**Branch**: feat/checkout-ui-pr1-hooks-atoms-molecules
**Scope**: PR1 only — hooks + atoms + molecules (page NOT swapped, organisms NOT included)
**Mode**: Strict TDD (adversarial, fresh context)
**Verdict**: PASS

---

## Completeness Table

| Phase | Tasks | Completed | Status |
|-------|-------|-----------|--------|
| Phase 1 — Hooks | 4 (1.1–1.4) | 4 | COMPLETE |
| Phase 2 — Atoms | 8 (2.1–2.8) | 8 | COMPLETE |
| Phase 3 — Molecules | 14 (3.1–3.14) | 14 | COMPLETE |
| Architecture Guards G.1, G.2, G.4, G.5, G.6 | 5 | 5 | VERIFIED |
| Phase 4–6 (PR2a/PR2b) | deferred | 0 | NOT IN SCOPE |

**PR1 tasks complete: 26/26 (100%)**

---

## Build / Tests / Coverage Evidence

| Check | Command | Result |
|-------|---------|--------|
| Test suite | `pnpm test:run` | **524 passed, 0 failed** (449 baseline + 75 new) |
| Type check | `npx tsc --noEmit` | **Clean — 0 errors** |
| Old page regression | `git diff main..branch -- app/checkout/page.tsx` | **0 lines changed (untouched)** |
| Files changed (source) | `git diff --stat` | 26 new files, 0 deletions, 0 regressions |

---

## Spec Compliance Matrix

### CHKUI-HOOK-1 — use-checkout-form

| Scenario | Implementation | Test | Status |
|----------|---------------|------|--------|
| handleSubmitShipping blocks when region missing | `missingShippingFields(formData)` delegates to domain; `REQUIRED_FIELDS` includes `region` | `blocks and shows toast when region is missing` (test L272) | PASS |
| handleSubmitShipping blocks when commune missing | same domain delegation | `blocks when commune is missing` (test L285) | PASS |
| handleSubmitShipping advances when all valid | `setStep('payment')` on empty missing array | `advances to payment step when all required fields are valid` (test L309) | PASS |
| handleInputChange preserves phone spaces | `value.replace(/[^\d+\s]/g, '')` | `preserves phone spaces` (test L234) | PASS |
| communesOfRegion updates when region changes | `useMemo([geo, formData.region])` | `returns communes for selected region` / `resets commune when region changes` | PASS |
| retryGeo retriggers GEO load | `setGeoTrigger(t => t + 1)` | `re-triggers GEO load on retryGeo call` / `clears geoError on retryGeo` | PASS |
| GEO uses `let cancelled` flag | `let cancelled = false; return () => { cancelled = true; }` | `cancels pending GEO fetch on unmount` | PASS |
| mounted guard | `useState(false)` + `useEffect(() => setMounted(true), [])` | `returns all expected properties` (includes `mounted`) | PASS |
| trackBeginCheckout once via ref | `checkoutTracked = useRef(false)` | `calls trackBeginCheckout once when items present` | PASS |
| commune field name (not city) | `CheckoutFormData` has `commune` field | `formData uses commune (not city) field` | PASS |
| No sanitizePhone in handleInputChange | grep confirms absent | N/A — code verification | PASS |
| GEO error on reject | `setGeoError(msg)` in catch | `sets geoError when getGeo rejects` | PASS |
| GEO error on empty regions | explicit `if (!data || !Array.isArray(data.regions) || data.regions.length === 0)` | `sets geoError when getGeo returns empty regions` | PASS |

**S-001 gap (region validation)**: CONFIRMED FIXED. `missingShippingFields` `REQUIRED_FIELDS` array includes `region` at domain level (checkout.rules.ts L10). The hook delegates entirely to this function. Test at L332 explicitly asserts `toast.error` message contains `"región"` when region is missing.

### CHKUI-HOOK-2 — use-checkout-submit

| Scenario | Implementation | Test | Status |
|----------|---------------|------|--------|
| Redirects to init_point on success | `window.location.href = res.data.init_point` | `redirects window.location.href to init_point` | PASS |
| sanitizePhone at payload boundary | `phone: sanitizePhone(formData.phone)` before `toOrderPayload` | `sanitizes phone in POST body: spaces stripped` — asserts `customer_phone === '+56912345678'` | PASS |
| double-submit guarded | `submitGuard = useRef(false)` | `only fires one POST when called twice rapidly` | PASS |
| apiClient.post('/orders') direct | `apiClient.post<...>('/orders', payload)` — no ecommerceService | `calls apiClient.post directly to /orders (NOT ecommerceService)` | PASS |
| Reads cart items, appliedCoupon, discountAmount | three `useCartStore` selectors | mock in test asserts correct shape forwarded to payload | PASS |
| Error: shows toast, resets guard + state | catch block: `toast.error`, `submitGuard.current = false`, `setIsProcessingPayment(false)` | `shows error toast when POST fails` / `resets isProcessingPayment to false after error` | PASS |
| ApiError backend message extraction | `err instanceof ApiError && err.data && 'error' in err.data` | `uses ApiError backend message when available` | PASS |
| Missing init_point treated as error | `if (!res.data?.init_point) throw new Error(...)` | `throws when init_point is missing from response` | PASS |

### CHKUI-ATOM-1..4 and CHKUI-MOL-1..7

All 11 components verified against spec scenarios — RTL tests with explicit props cover all stated scenarios. 37 tests across atoms and molecules, all PASS.

### CHKUI-ARCH — Layering Purity

| Guard | Check Method | Result |
|-------|-------------|--------|
| No `features/cart/ui/` imports in `features/checkout/ui/` | `rg "^import.*features/cart/ui"` — zero matches | PASS |
| No store/hook imports in atoms/molecules | `rg "useStore|useCart|/stores/|/hooks/"` in atoms/ + molecules/ — zero matches | PASS |
| CheckoutOrderItemRow uses `CartSnapshot.unit_price` | Source code: `item: CartSnapshot['items'][number]` + `{formatPrice(item.unit_price)}` | PASS |
| No cart/ui import in CheckoutOrderItemRow | Import section: only `next/image` + checkout domain type | PASS |

### CHK-D1 — Old Page Intact (PR1 constraint)

| Guard | Check | Result |
|-------|-------|--------|
| `app/checkout/page.tsx` untouched | `git diff main..branch -- app/checkout/page.tsx` → 0 lines | PASS |
| `CheckoutStep` still has `'confirmation'` | `checkout.types.ts` L59: `'shipping' | 'payment' | 'confirmation'` | PASS |
| Domain types file NOT changed in PR1 | `git diff main..branch -- features/checkout/domain/checkout.types.ts` → 0 lines | PASS |

### CHKUI-T1..T5 — Test Infrastructure

| Spec | Status |
|------|--------|
| CHKUI-T1: reuse existing `__mocks__` | No new test infrastructure added | PASS |
| CHKUI-T2: every atom + molecule has colocated `.test.tsx` | 11 test files (4 atoms + 7 molecules) | PASS |
| CHKUI-T3: hook tests mock service deps properly | `addressesService.getGeo` mocked; `window.location` via `Object.defineProperty`; `apiClient` mocked | PASS |
| CHKUI-T5: 449 baseline tests stay green | 524 total — 449 baseline all passing (zero regressions) | PASS |

---

## Design Coherence

| ADR | Design Decision | Code Evidence | Status |
|-----|----------------|--------------|--------|
| ADR-1 | No cross-feature UI imports | Zero `features/cart/ui/` import statements in checkout | COMPLIANT |
| ADR-3 | GEO uses `let cancelled` (not AbortController) | `let cancelled = false` pattern | COMPLIANT |
| ADR-5 | sanitizePhone at submit boundary only | Absent from form hook; present only in submit hook pre-payload | COMPLIANT |
| ADR-7 | missingShippingFields region gap fixed | Domain REQUIRED_FIELDS includes region; hook delegates 100% | COMPLIANT |
| LOCKED #1 | sanitizePhone NOT inside toOrderPayload | Implementation: sanitize before toOrderPayload call | COMPLIANT |
| LOCKED #2 | apiClient.post direct, not ecommerceService | Import: `apiClient` from `@/app/lib/api-client` | COMPLIANT |

---

## Issues

### CRITICAL
None.

### WARNING
None.

### SUGGESTION

- **SUGG-1**: The `handleSubmitShipping` signature accepts `setStep: (step: 'payment') => void` as a parameter rather than consuming it from context. This is intentional for testability and matches the spec, but means the container must wire this correctly in PR2b. Document this coupling expectation in the organism/container handoff.

- **SUGG-2**: `stderr` output during tests shows two expected `console.error` calls (`[checkout] getGeo() falló`) from error-path tests. These are intentional and suppressed by the test design (not silenced with `vi.spyOn`). Consider adding `vi.spyOn(console, 'error').mockImplementation(() => {})` in these tests to keep CI output clean.

---

## Dead-Code Acknowledgment

PR1 hooks/atoms/molecules are unused until PR2a/PR2b wire them. This is EXPECTED for a stacked strangle pattern — NOT a finding.

---

## Final Verdict: PASS

- 0 CRITICAL
- 0 WARNING  
- 2 SUGGESTION (non-blocking)
- 524/524 tests green
- tsc: clean
- Old page: untouched
- S-001 region gap: CONFIRMED FIXED
- Layering purity: VERIFIED

Ready for PR2a.
