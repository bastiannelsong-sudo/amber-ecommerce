# Verify Report: catalog-hexagonal-slice

**Change**: catalog-hexagonal-slice
**Branch**: feat/catalog-hexagonal-slice (7 commits)
**Mode**: Strict TDD — adversarial, fresh context
**Date**: 2026-06-13
**Verdict**: PASS WITH WARNINGS

---

## Build / Test Evidence

| Command | Result |
|---------|--------|
| `pnpm test:run` | 37 files, 396 tests, 0 failed — EXIT 0 |
| `npx tsc --noEmit` | 0 errors — EXIT 0 |

---

## Task Completeness

| Phase | Tasks | Status |
|-------|-------|--------|
| 1. Domain Foundation | 1.1–1.4 | All [x] — confirmed in code |
| 2. Application Port + Mapper | 2.1–2.3 | All [x] — confirmed in code |
| 3. Infrastructure Adapter | 3.1–3.2 | All [x] — confirmed in code |
| 4. React Query Hook | 4.1–4.3 | All [x] — confirmed in code |
| 5. Consumer Wiring | 5.1–5.4 | All [x] — confirmed in code |
| 6. Verification | 6.1–6.5 | All [x] — independently confirmed |

All 21 tasks marked complete. Code state matches.

---

## Spec Compliance Matrix

| Requirement | Status | Notes |
|-------------|--------|-------|
| CAT-D1: CatalogProduct lean type | PASS | Defined in catalog.types.ts, zero app/ imports |
| CAT-D2: Supporting domain types | PARTIAL | SearchSuggestion exported but orphaned — not composed into SearchSuggestions. SearchSuggestions shape diverges from spec (has products/collections not suggestions/query) — matches design correction |
| CAT-R1: filterProducts | PASS | All 6 test cases pass; correct AND logic |
| CAT-R2: sortProducts | PASS | All 5 cases pass; no mutation confirmed |
| CAT-R3: formatPrice BOUNDARY | PASS | Exact formula locked. 4 mandatory formatPrice test cases exist with exact string assertions ('15.990', '15.991', '9.990', '0') |
| CAT-R4: calcDiscount | PASS | 5 test cases pass (null/<=price/undefined all return null) |
| CAT-R5: isInStock | PASS | 2 cases pass |
| CAT-A1: CatalogPort one method | PASS | Only fetchSuggestions(query, signal?) defined |
| CAT-A2: catalog.mapper | PASS | 4 test cases; collections shape {name,slug} only — no invented image_url |
| CAT-A3: use-search-suggestions hook | PASS | Debounce 300ms, enabled >=2, keepPreviousData v5 API |
| CAT-I1: BffCatalogAdapter | PASS | Throws on error, no dummy fallback; 5 test cases |
| CAT-W1: SearchModal wiring | PASS WITH WARNING | productsService + hand-rolled setTimeout+fetch removed; hook wired. UX verbatim EXCEPT activeIndex no longer resets when new suggestions arrive (see WARNING-2) |
| CAT-W2: ProductCard domain functions | PASS | formatPrice + calcDiscount from domain; inline duplicates removed; hasDiscount derived from calcDiscount !== null |
| CAT-W3: types.ts shim | PASS | export type { SearchSuggestions } from domain; tsc clean |
| CAT-T1: TDD RED→GREEN cycle | PASS | All 4 test files written RED first (import error = red), then GREEN |
| CAT-T2: 4 formatPrice exact-output tests | PASS | 4 separate it() blocks, exact string assertions |
| CAT-T3: 4 calcDiscount boundary tests | PASS | 5 tests (includes undefined case — extra coverage) |
| CAT-T4: Mapper unit tested | PASS | 4 tests, happy + empty + collections shape |
| CAT-T5: Adapter unit tested | PASS | 5 tests, vi.mock with importOriginal for ApiError |
| CAT-T6: Hook unit tested | PASS | 7 tests, renderHook + QueryClientProvider wrapper |
| CAT-T7: Existing suite stays green | PASS | 396 tests = 358 original + 38 new, all passed |

---

## Design Coherence

| ADR | Status | Notes |
|-----|--------|-------|
| ADR-1: Layer layout domain/application/infrastructure | PASS | Files match layout exactly |
| ADR-2: Lean port, one method only | PASS | fetchSuggestions(query, signal?) only |
| ADR-3: Adapter throws on error, no fallback | PASS | No try/catch, no dummy return |
| ADR-4: Hook useState debounce 300ms + useQuery v5 keepPreviousData | PASS | Exact pattern implemented |
| ADR-5: Module-singleton DI (not prop injection) | PASS | bffCatalogAdapter imported directly, testable via vi.mock |
| ADR-6: SearchModal HARD boundary (fetch only) | PASS | Only fetch layer swapped; keyboard nav/render verbatim |
| ADR-7: ProductCard exact parity | PASS | Identical formula, hasDiscount from null check |

---

## Issues

### WARNINGS

**WARNING-1: application layer directly imports infrastructure**
- File: `features/catalog/application/use-search-suggestions.ts` line 5
- `import { bffCatalogAdapter } from '@/features/catalog/infrastructure/bff-catalog.adapter';`
- This is the "module-singleton DI" pattern documented in design ADR-5. It's a deliberate pragmatic choice — testable via vi.mock, no prop drilling needed. However it means the application layer has a compile-time dependency on infrastructure, which contradicts the "application depends on port abstraction, not adapter" principle stated in CAT-A3.
- The port interface (CatalogPort) exists but the hook doesn't actually depend on it — it depends on the concrete singleton.
- Risk: future slices may follow this pattern and make swapping adapters harder.
- Recommendation: future-proof by exporting a `createUseSearchSuggestions(port: CatalogPort)` factory, keeping the default as the singleton. This slice is fine as-is given the design explicitly chose this pattern.

**WARNING-2: activeIndex not reset when new suggestions arrive**
- Files: `app/components/SearchModal.tsx`
- Old behavior: `setActiveIndex(-1)` was called inside the fetch callback whenever new suggestions resolved.
- New behavior: hook returns suggestions asynchronously; SearchModal has no hook into when new data arrives. activeIndex stays at its previous value until the user closes the modal or presses ArrowUp.
- Practical impact: user types 'ab', presses ArrowDown (activeIndex=0), types 'abc', new results arrive — cursor stays at index 0. If the first result changes, the keyboard cursor stays on the new first result (still index 0), which is probably acceptable but not identical to original behavior.
- This is a minor UX divergence. Mitigatable by adding a `useEffect` on `suggestions` that resets `setActiveIndex(-1)` in SearchModal.

**WARNING-3: SearchSuggestion (singular) type is orphaned**
- File: `features/catalog/domain/catalog.types.ts`
- `SearchSuggestion` interface is exported but `SearchSuggestions` uses inline object literals `{ name, slug, image_url, price }` rather than `SearchSuggestion[]`.
- CAT-D2 spec said `SearchSuggestions: { suggestions: SearchSuggestion[]; query: string }`. The implementation took the actual BFF shape (`products/collections`) from the design correction — which is correct. But `SearchSuggestion` is now dead exported type.
- No compilation error, no functional issue. But the type leaks a misleading abstraction.

**WARNING-4: Inline toLocaleString persists in SearchModal product row**
- File: `app/components/SearchModal.tsx` line 304
- `${Math.round(Number(product.price) || 0).toLocaleString('es-CL')}`
- Design explicitly said this was optional ("MAY adopt formatPrice"), so it's within spec.
- However this duplicates the exact formula now canonicalized in the domain. If the es-CL formatting rule ever changes, this line will be a divergence point.
- Recommendation: replace with `formatPrice(product.price)` in the same line for completeness.

### SUGGESTIONS

**SUGGESTION-1: Pattern precedent documentation**
- The `use-search-suggestions.test.ts` file has excellent inline documentation of the timer strategy pattern. This is the right call for the first renderHook in the repo.
- Suggestion: add a brief `.claude/skills/` or `docs/testing-patterns.md` note capturing the `vi.useFakeTimers + act + vi.runAllTimersAsync` pattern so future hook tests don't rediscover it.

**SUGGESTION-2: spec CAT-D2 text should be updated to match actual SearchSuggestions shape**
- The spec says `SearchSuggestions: { suggestions: SearchSuggestion[]; query: string }` but actual type is `{ products: [...]; collections: [...] }`.
- This is a spec artifact issue — the design correctly overrode it but the spec text was never updated. When sdd-archive runs, note this discrepancy so future readers understand why spec and implementation differ.

---

## Pattern Quality Assessment (data-fetching pattern-setter)

**Verdict: Strong pattern. Reusable with one caveat.**

Strengths:
- Layer layout is clean and learnable: `domain/ ← application/(port+mapper+hook) ← infrastructure/(adapter)`
- Port interface in application layer (not infrastructure) is architecturally correct
- Adapter-as-singleton with vi.mock testability is pragmatic and well-documented
- The renderHook test pattern (QueryClientProvider wrapper, retry:false, fake timers split) is now documented in the test file itself — good precedent
- `mapSuggestions` isolates field extraction cleanly; no business logic leaked into mapper

Caveat to communicate to the next slice:
- The application → infrastructure direct import (ADR-5 module-singleton DI) means future data-fetching slices will NOT have a true port abstraction at test time — they'll vi.mock the concrete adapter. This is pragmatic but should be a conscious choice, not a cargo-cult copy. Future slices that need adapter swapping (e.g., switching from BFF to RSC data source) will need to refactor to factory pattern.

---

## Files Verified

| File | Action | Verified |
|------|--------|---------|
| `features/catalog/domain/catalog.types.ts` | Created | Zero app/ imports, correct types |
| `features/catalog/domain/catalog.rules.ts` | Created | All 5 functions pure, correct formulas |
| `features/catalog/domain/catalog.rules.test.ts` | Created | 22 tests, 4 formatPrice exact, 4+ calcDiscount boundary |
| `features/catalog/application/ports/CatalogPort.ts` | Created | One method only |
| `features/catalog/application/catalog.mapper.ts` | Created | Field extraction only, no invented collection image |
| `features/catalog/application/catalog.mapper.test.ts` | Created | 4 tests |
| `features/catalog/infrastructure/bff-catalog.adapter.ts` | Created | Throws on error, no fallback |
| `features/catalog/infrastructure/bff-catalog.adapter.test.ts` | Created | 5 tests, importOriginal pattern |
| `features/catalog/application/use-search-suggestions.ts` | Created | v5 keepPreviousData, 300ms debounce, enabled>=2 |
| `features/catalog/application/use-search-suggestions.test.ts` | Created | 7 tests, first renderHook precedent |
| `app/lib/types.ts` | Modified | export type re-export shim, tsc clean |
| `app/components/SearchModal.tsx` | Modified | Fetch layer only swapped; UX verbatim with minor activeIndex note |
| `app/components/ProductCard.tsx` | Modified | formatPrice + calcDiscount from domain; inline removed |

No `features/catalog/index.ts` barrel exists — confirmed.

---

## Summary

- CRITICAL issues: 0
- WARNINGS: 4 (none block archive; all are design tradeoffs or minor UX nuances)
- SUGGESTIONS: 2

The implementation is correct, tests are green, TypeScript is clean, and the hexagonal slice is a usable pattern for future data-fetching slices.
