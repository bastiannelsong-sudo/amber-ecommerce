# Tasks: Catalog Hexagonal Slice

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~320–390 (8 new files + 3 modified) |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR — stays within 400-line budget |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending (single PR, no chain needed) |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain types + rules + tests | PR 1 | Foundation; no dependencies on other new files |
| 2 | Port + mapper + mapper test | PR 1 | Depends on Unit 1 types |
| 3 | BFF adapter + adapter test | PR 1 | Depends on Unit 2 (port + mapper) |
| 4 | Hook + hook test | PR 1 | Depends on Unit 3 (adapter for vi.mock target) |
| 5 | SearchModal + ProductCard wiring + types shim | PR 1 | Depends on Units 1–4; HARD boundary |

All five units ship as one PR given the medium-budget estimate. Work units define the commit ordering for `work-unit-commits` convention.

---

## Phase 1: Domain Foundation (CAT-D1, CAT-D2)

> Strict TDD. Write failing test first, then implement. Runner: `pnpm test:run`.

- [x] 1.1 Create `features/catalog/domain/catalog.types.ts` — define `CatalogProduct`, `SortOption`, `CatalogFilter`, `SearchSuggestion`, `SearchSuggestions` (per CAT-D1, CAT-D2). Zero imports from `app/`.
- [x] 1.2 Create `features/catalog/domain/catalog.rules.test.ts` (RED) — write failing tests for `filterProducts`, `sortProducts`, `formatPrice` (4 cases: integer, decimal, string, zero), `calcDiscount` (4 cases: valid, null, equal, inverted), `isInStock` (2 cases) per CAT-T1, CAT-T2, CAT-T3. Assert exact string outputs for `formatPrice`.
- [x] 1.3 Create `features/catalog/domain/catalog.rules.ts` (GREEN) — implement `filterProducts`, `sortProducts`, `formatPrice`, `calcDiscount`, `isInStock` until all tests in 1.2 pass. Verify `pnpm test:run` is green.
- [x] 1.4 Verify ICU locale for `es-CL`: confirm `Math.round(15990).toLocaleString('es-CL')` outputs `'15.990'` in the Vitest Node process. If full ICU is missing, document and flag — do NOT patch the test.

---

## Phase 2: Application Layer — Port + Mapper (CAT-A1, CAT-A2, CAT-T4)

- [x] 2.1 Create `features/catalog/application/ports/CatalogPort.ts` — interface with `fetchSuggestions(query: string, signal?: AbortSignal): Promise<SearchSuggestions>` only (CAT-A1). No other methods.
- [x] 2.2 Create `features/catalog/application/catalog.mapper.test.ts` (RED) — failing tests for BFF DTO → `SearchSuggestions` (happy path: `data` array with items; empty path: `data: []`). Assert `query` field is present; collections shape `{name,slug}` only — no `image_url` invented (CAT-T4, design contradiction #2).
- [x] 2.3 Create `features/catalog/application/catalog.mapper.ts` (GREEN) — implement mapper from raw BFF response to `SearchSuggestions`. Field extraction only, no business logic. Passes tests from 2.2.

---

## Phase 3: Infrastructure — BFF Adapter (CAT-I1, CAT-T5)

- [x] 3.1 Create `features/catalog/infrastructure/bff-catalog.adapter.test.ts` (RED) — failing tests: `vi.mock('@/app/lib/api-client')`; assert `apiClient.get('/products/suggestions', { params: { q }, signal })` is called; result matches `SearchSuggestions` shape; BFF error (non-2xx / ApiError) propagates as rejected Promise (no dummy fallback).
- [x] 3.2 Create `features/catalog/infrastructure/bff-catalog.adapter.ts` (GREEN) — module-singleton `const bffCatalogAdapter: CatalogPort`. `fetchSuggestions(query, signal?)` → `apiClient.get('/products/suggestions', { params: { q: query }, signal })` → `catalog.mapper` → throws on error. Passes tests from 3.1.

---

## Phase 4: Application Layer — React Query Hook (CAT-A3, CAT-T6)

- [x] 4.1 Create `features/catalog/application/use-search-suggestions.test.ts` (RED) — sets FIRST `renderHook` precedent in repo. Use `renderHook` from `@testing-library/react` + `QueryClientProvider` wrapper with `retry: false`. `vi.mock` the adapter. Failing tests for: (a) `query.length < 2` → no fetch; (b) query changes rapidly within 300ms → no fetch (use `vi.useFakeTimers`); (c) query after 300ms → `fetchSuggestions` called once; (d) successful suggestions (`isEmpty === false`); (e) empty result (`isEmpty === true`); (f) port rejection → `isError` non-null, `suggestions === []`.
- [x] 4.2 Create `features/catalog/application/use-search-suggestions.ts` (GREEN) — `useState + setTimeout(300)` debounce → `debouncedQ`; `useQuery({ queryKey: ['catalog','suggestions',debouncedQ], queryFn: ({signal}) => bffCatalogAdapter.fetchSuggestions(debouncedQ, signal), enabled: debouncedQ.length >= 2, placeholderData: keepPreviousData, staleTime: 60_000 })`. Returns `{ suggestions, isLoading, isError, isEmpty }`. Passes tests from 4.1.
- [x] 4.3 Run `pnpm test:run` — all catalog tests (domain + mapper + adapter + hook) pass. Existing 358 tests still green.

---

## Phase 5: Consumer Wiring (CAT-W1, CAT-W2, CAT-W3)

> HARD boundary on SearchModal: replace ONLY the fetch layer. Do not touch keyboard nav, selection, rendering, or no-results UI.

- [x] 5.1 Modify `app/lib/types.ts` — add per-file re-export shim: `export type { SearchSuggestions } from '@/features/catalog/domain/catalog.types'` (CAT-W3). Match cart's per-file shim pattern. No barrel file at `features/catalog/index.ts`.
- [x] 5.2 Modify `app/components/SearchModal.tsx` — remove: `productsService.getSuggestions` import, `isLoading`/`suggestions` useState, debounced `useEffect` (~lines 57–59, 121–138). Add: `const { suggestions, isLoading } = useSearchSuggestions(query)`. Keep all keyboard nav/selection/recent/render/no-results logic verbatim. Preserve existing optional-chaining guards on `suggestions` (CAT-W1).
- [x] 5.3 Modify `app/components/ProductCard.tsx` — import `formatPrice` and `calcDiscount` from `@/features/catalog/domain/catalog.rules`. Replace inline `Math.round(Number(price)).toLocaleString('es-CL')` with `formatPrice(price)`. Replace inline `Math.round((1 - price / compare_at_price) * 100)` with `calcDiscount(price, compare_at_price)`. Guard null returns from `calcDiscount` identically to current guard (CAT-W2).
- [x] 5.4 Run `pnpm test:run` — full suite green including all new catalog tests (CAT-T7).

---

## Phase 6: Verification

- [x] 6.1 Confirm domain directory has zero imports from `app/` (TypeScript check, CAT-D1 isolation scenario).
- [x] 6.2 Confirm `CatalogPort.ts` declares exactly one method — `fetchSuggestions` (CAT-A1 scenario).
- [x] 6.3 Confirm no `features/catalog/index.ts` file exists (design ADR #1, per-file shim only).
- [x] 6.4 Confirm `app/lib/types.ts` re-export resolves without duplicate-declaration error (CAT-W3).
- [x] 6.5 Final `pnpm test:run` — exits 0, all ≥358 + new catalog tests pass (CAT-T7).

---

## Phase 7: Post-Verify Warning Fixes (W-2, W-3, W-4)

> Continuation batch after verify-report (id 967). W-1 accepted as design decision — not touched.

- [x] W-2 Add `useEffect(() => { setActiveIndex(-1); }, [suggestions])` in `app/components/SearchModal.tsx` to reset keyboard-nav cursor when suggestion results update — restoring original fetch-callback behaviour.
- [x] W-3 Remove orphan `SearchSuggestion` (singular) interface from `features/catalog/domain/catalog.types.ts` — confirmed zero source imports before deletion.
- [x] W-4 Replace `${Math.round(Number(product.price) || 0).toLocaleString('es-CL')}` in SearchModal product row with `${formatPrice(product.price ?? 0)}` (import from domain). Added `catalog.rules.test.ts` test locking the coalesced-to-zero output. `pnpm test:run`: 397 tests, 0 failed. `tsc --noEmit`: 0 errors.
