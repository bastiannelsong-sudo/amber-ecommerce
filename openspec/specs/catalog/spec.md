# Catalog Capability Specification

**Domains**: catalog-domain, catalog-application, catalog-infrastructure
**Requirement prefix**: CAT-*
**Status**: SHIPPED (PR #37, squash commit d3378ac, includes W-2/W-3/W-4 fixes cfd76c7+007be30)

---

## Purpose

Define the catalog domain, port, adapter, and React Query hook behavior introduced by the `catalog-hexagonal-slice` change. This is the third architectural vertical slice — it adds the **data-fetching dimension** (port + BFF adapter + React Query) on top of the domain + application pattern established by cart/checkout. The canon consumer is `SearchModal` typeahead. `ProductCard` reuses domain formatting rules to remove inline duplication.

---

## Domain 1: catalog-domain (Pure Functions)

Location: `features/catalog/domain/`

Framework-free pure functions and types. Zero React, Zustand, fetch, browser, or `use client` imports allowed. All functions are pure: same inputs produce identical outputs with no side effects.

---

### Requirement: CAT-D1 — CatalogProduct Lean Type

`CatalogProduct` MUST be defined in `features/catalog/domain/catalog.types.ts` with only the fields consumers require: `product_id`, `name`, `price`, `compare_at_price` (nullable), `image_url`, `slug`, `stock`, `material` (optional), `style` (optional), `tags` (optional string array), `category` (`{ name: string }`). The domain MUST NOT import `Product` from `app/lib/types.ts`.

#### Scenario: Domain type is isolated from transport type

- GIVEN `features/catalog/domain/catalog.types.ts` is compiled
- WHEN TypeScript resolves all imports
- THEN zero imports from `app/lib/types` or any `app/` path exist in the domain directory

---

### Requirement: CAT-D2 — Supporting Domain Types

`features/catalog/domain/catalog.types.ts` MUST also define:
- `SortOption`: `'newest' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc'`
- `CatalogFilter`: `{ collections?: string[]; materials?: string[]; styles?: string[]; material?: string; style?: string; priceMin?: number; priceMax?: number }`
- `ActiveFilters`: `{ collections: string[]; materials: string[]; styles: string[]; priceMin: number; priceMax: number }` — UI-facing multi-select filter state (NEW)
- `emptyFilters`: `ActiveFilters` constant with all arrays empty and prices `0`/`Infinity` (NEW, moved from FilterSidebar)
- `SearchSuggestion`: `{ product_id: number | string; name: string; slug: string; image_url?: string; price: number }`
- `SearchSuggestions`: `{ suggestions: SearchSuggestion[]; query: string }`

**MODIFICATIONS** (catalog-ui-strangle PR #42):
- `CatalogFilter` extended with `materials?: string[]` and `styles?: string[]` (additive, backward-compatible; single `material?`/`style?` retained for legacy filters)
- `ActiveFilters` + `emptyFilters` relocated from FilterSidebar.tsx to domain types (living reference for state shape)

**NOTE (DESIGN CORRECTION)**: The `SearchSuggestions` shape returned by the BFF is actually `{ products: [], collections: [{ name, slug }] }` (without image_url per collections). The design corrected this during implementation. The spec above documents the **intended canonical domain shape**; future API updates should push the BFF to match this shape, not the reverse. Until then, the mapper in catalog-application performs shape transformation.

#### Scenario: Types are importable from domain index

- GIVEN a consumer imports `SortOption`, `CatalogFilter`, `ActiveFilters`, `emptyFilters`, `SearchSuggestion`, `SearchSuggestions` from `@/features/catalog`
- WHEN TypeScript compiles
- THEN all resolve without error and match the shapes above

#### Scenario: emptyFilters is the zero-value for ActiveFilters

- GIVEN `emptyFilters` is imported from domain
- WHEN its fields are inspected
- THEN `collections`, `materials`, `styles` are empty arrays and `priceMin === 0`, `priceMax === Infinity`

---

### Requirement: CAT-R1 — filterProducts Matches Active Filters

`filterProducts(products: CatalogProduct[], filters: CatalogFilter): CatalogProduct[]` MUST return only products matching ALL non-empty filter properties. `materials` and `styles` MUST be treated as inclusive arrays: a product matches if its `material` field is included in the `materials` array (or the array is empty). Empty or absent filter properties MUST be treated as match-all.

**MODIFICATIONS** (catalog-ui-strangle PR #42):
- Added support for `materials: string[]` and `styles: string[]` as multi-select arrays
- Single-value `material?` and `style?` remain supported for backward compatibility
- Empty or absent arrays are treated as match-all (no filtering on that dimension)

#### Scenario: No active filters returns all products

- GIVEN `filters = {}`
- WHEN `filterProducts(products, filters)` is called
- THEN all products are returned unchanged

#### Scenario: Collection filter narrows results

- GIVEN `products` has two items: one with `tags: ['anillos']` and one with `tags: ['collares']`
- AND `filters = { collections: ['anillos'] }`
- WHEN `filterProducts(products, filters)` is called
- THEN only the `anillos` product is returned

#### Scenario: Multi-material filter includes all matching products

- GIVEN products `[{ material: 'plata' }, { material: 'oro' }, { material: 'cobre' }]`
- AND `filters = { materials: ['plata', 'oro'] }`
- WHEN `filterProducts(products, filters)` is called
- THEN the products with `plata` and `oro` are returned and `cobre` is excluded

#### Scenario: Multi-style filter includes all matching products

- GIVEN products `[{ style: 'minimalista' }, { style: 'bohemio' }, { style: 'clasico' }]`
- AND `filters = { styles: ['minimalista', 'bohemio'] }`
- WHEN `filterProducts(products, filters)` is called
- THEN the `minimalista` and `bohemio` products are returned and `clasico` is excluded

#### Scenario: Empty materials array matches all (no filter)

- GIVEN products with mixed materials
- AND `filters = { materials: [] }`
- WHEN `filterProducts(products, filters)` is called
- THEN all products are returned unchanged

#### Scenario: Single-value materials array behaves like previous single-string filter

- GIVEN products `[{ material: 'plata' }, { material: 'oro' }]`
- AND `filters = { materials: ['plata'] }`
- WHEN `filterProducts(products, filters)` is called
- THEN only the `plata` product is returned

#### Scenario: Price range filter excludes out-of-range products

- GIVEN `products` with prices `5000`, `15000`, `25000`
- AND `filters = { priceMin: 10000, priceMax: 20000 }`
- WHEN `filterProducts(products, filters)` is called
- THEN only the `15000` product is returned

---

### Requirement: CAT-R2 — sortProducts Orders by SortOption

`sortProducts(products: CatalogProduct[], option: SortOption): CatalogProduct[]` MUST return a new sorted array without mutating the input. It MUST support:
- `'price-asc'`: ascending by `price`
- `'price-desc'`: descending by `price`
- `'name-asc'`: ascending by `name` (locale-insensitive string comparison is acceptable)
- `'name-desc'`: descending by `name`

#### Scenario: price-asc orders lowest first

- GIVEN `products` with prices `[300, 100, 200]`
- WHEN `sortProducts(products, 'price-asc')` is called
- THEN the result order is `[100, 200, 300]`

#### Scenario: price-desc orders highest first

- GIVEN `products` with prices `[300, 100, 200]`
- WHEN `sortProducts(products, 'price-desc')` is called
- THEN the result order is `[300, 200, 100]`

#### Scenario: name-asc orders alphabetically

- GIVEN `products` with names `['Zirconia', 'Ambar', 'Luna']`
- WHEN `sortProducts(products, 'name-asc')` is called
- THEN the result order is `['Ambar', 'Luna', 'Zirconia']`

#### Scenario: Input array is not mutated

- GIVEN an original array `original = [...]`
- WHEN `sortProducts(original, 'price-asc')` is called
- THEN `original` is referentially identical (same order as before the call)

---

### Requirement: CAT-R3 — formatPrice Produces es-CL Currency String (BOUNDARY — locked)

`formatPrice(price: number | string): string` MUST return exactly `Math.round(Number(price)).toLocaleString('es-CL')`. This formula is LOCKED to match the current `ProductCard` output exactly. No alternative rounding or locale is acceptable.

#### Scenario: Integer price formats correctly

- GIVEN `price = 15990`
- WHEN `formatPrice(15990)` is called
- THEN the result is `'15.990'` (es-CL locale, dot as thousands separator)

#### Scenario: Decimal price rounds before formatting

- GIVEN `price = 15990.7`
- WHEN `formatPrice(15990.7)` is called
- THEN the result is `'15.991'` (Math.round applied first)

#### Scenario: String price is coerced to number

- GIVEN `price = '9990'` (string)
- WHEN `formatPrice('9990')` is called
- THEN the result is `'9.990'`

#### Scenario: Zero price formats to zero

- GIVEN `price = 0`
- WHEN `formatPrice(0)` is called
- THEN the result is `'0'`

---

### Requirement: CAT-R4 — calcDiscount Returns Rounded Percent or null

`calcDiscount(price: number, compare_at_price: number | null | undefined): number | null` MUST return `Math.round((1 - price / compare_at_price) * 100)` when `compare_at_price` is a number greater than `price`. It MUST return `null` when `compare_at_price` is `null`, `undefined`, or `<= price`.

#### Scenario: Valid discount computes rounded percent

- GIVEN `price = 8000`, `compare_at_price = 10000`
- WHEN `calcDiscount(8000, 10000)` is called
- THEN the result is `20`

#### Scenario: compare_at_price is null returns null

- GIVEN `price = 8000`, `compare_at_price = null`
- WHEN `calcDiscount(8000, null)` is called
- THEN the result is `null`

#### Scenario: compare_at_price equal to price returns null (no discount)

- GIVEN `price = 10000`, `compare_at_price = 10000`
- WHEN `calcDiscount(10000, 10000)` is called
- THEN the result is `null`

#### Scenario: compare_at_price less than price returns null

- GIVEN `price = 12000`, `compare_at_price = 10000`
- WHEN `calcDiscount(12000, 10000)` is called
- THEN the result is `null`

---

### Requirement: CAT-R5 — isInStock Returns Boolean Availability

`isInStock(product: CatalogProduct): boolean` MUST return `true` when `product.stock > 0`, and `false` otherwise.

#### Scenario: Positive stock returns true

- GIVEN `product.stock = 3`
- WHEN `isInStock(product)` is called
- THEN the result is `true`

#### Scenario: Zero stock returns false

- GIVEN `product.stock = 0`
- WHEN `isInStock(product)` is called
- THEN the result is `false`

---

## Domain 2: catalog-application (Port + Mapper + Hook)

Location: `features/catalog/application/`

Application layer defining the port contract, mapper, and React Query hook. MAY import React, React Query. MUST NOT import from `features/catalog/infrastructure/` directly (dependency inversion: application depends on the port abstraction, not the adapter).

---

### Requirement: CAT-A1 — CatalogPort Contract (Lean)

`features/catalog/application/ports/CatalogPort.ts` MUST define the interface:

```typescript
interface CatalogPort {
  fetchSuggestions(query: string): Promise<SearchSuggestions>;
}
```

This is the ONLY method defined in this slice. Extending the port (fetchCatalog, fetchFacets, fetchProductBySlug) is explicitly OUT OF SCOPE and MUST NOT be added here.

#### Scenario: Port defines exactly one method

- GIVEN `CatalogPort.ts` is compiled
- WHEN the interface members are inspected
- THEN only `fetchSuggestions` exists — no other methods are declared

---

### Requirement: CAT-A2 — catalog.mapper Converts BFF DTO to SearchSuggestions

`features/catalog/application/catalog.mapper.ts` MUST export a function that accepts the raw BFF response from `/api/products/suggestions` and returns a domain `SearchSuggestions` value. The mapper MUST NOT contain business logic beyond field extraction and shape transformation.

#### Scenario: BFF response maps to domain shape

- GIVEN a raw BFF response with a `data` array of product objects
- WHEN the mapper is called with that response
- THEN the result is a `SearchSuggestions` with `suggestions` array where each entry has `product_id`, `name`, `slug`, `image_url`, and `price`
- AND the `query` field reflects the original query string passed to the mapper

#### Scenario: Empty BFF response maps to empty suggestions

- GIVEN a BFF response with `data: []`
- WHEN the mapper is called
- THEN the result is `{ suggestions: [], query: '<query>' }`

---

### Requirement: CAT-A3 — use-product-suggestions Hook with Debounce

`features/catalog/application/use-product-suggestions.ts` MUST be a React Query hook that:
- Accepts `query: string` and a `port: CatalogPort` (or retrieves the adapter via composition root).
- Debounces the query key by ~300ms before triggering a fetch, matching the current `SearchModal` behavior.
- Returns `{ suggestions, isLoading, isEmpty, error }`.
- Does NOT fetch when `query` is an empty string (the query is disabled).

#### Scenario: Empty query disables fetch

- GIVEN `query = ''`
- WHEN the hook is rendered
- THEN no fetch is initiated and `isLoading === false`

#### Scenario: Query below debounce interval does not fetch

- GIVEN a query changes rapidly within the 300ms debounce window
- WHEN the debounce period has not elapsed
- THEN no fetch is initiated

#### Scenario: Query after debounce triggers fetch

- GIVEN `query = 'amat'` and 300ms have elapsed since last keystroke
- WHEN the hook resolves
- THEN `fetchSuggestions('amat')` is called exactly once

#### Scenario: Successful fetch returns suggestions

- GIVEN the port resolves with valid `SearchSuggestions`
- WHEN the hook resolves
- THEN `suggestions` is the mapped array and `isEmpty === false`

#### Scenario: Empty suggestions result marks isEmpty

- GIVEN the port resolves with `suggestions: []`
- WHEN the hook resolves
- THEN `isEmpty === true` and `suggestions === []`

#### Scenario: Port error surfaces as error state

- GIVEN the port rejects with a network error
- WHEN the hook resolves
- THEN `error` is non-null and `suggestions === []`

---

## Domain 3: catalog-infrastructure (BFF Adapter)

Location: `features/catalog/infrastructure/`

Infrastructure adapter implementing `CatalogPort` via `apiClient` calls to the BFF. MUST NOT be imported by application or domain layers. Dependency direction: infrastructure → application port (implements it), never the reverse.

---

### Requirement: CAT-I1 — BffCatalogAdapter Implements CatalogPort

`features/catalog/infrastructure/bff-catalog.adapter.ts` MUST export a class or factory implementing `CatalogPort`. Its `fetchSuggestions(query)` method MUST call `apiClient` (or equivalent) with the `/api/products/suggestions` route, passing `query` as the search parameter, and return the mapped domain `SearchSuggestions`.

#### Scenario: Adapter calls BFF with correct path and query

- GIVEN `fetchSuggestions('collar')` is called
- WHEN the adapter executes
- THEN `apiClient` is invoked with `/api/products/suggestions` and `query='collar'`
- AND the result is a domain `SearchSuggestions` value (mapper applied)

#### Scenario: BFF error propagates as rejected Promise

- GIVEN the BFF returns a non-2xx response
- WHEN `fetchSuggestions('collar')` is called
- THEN the returned Promise rejects with an error
- AND no dummy/fallback data is returned

---

## Consumer Wiring

### Requirement: CAT-W1 — SearchModal Uses Hook (Drop-in Replacement)

`app/components/SearchModal.tsx` MUST use `use-product-suggestions` hook to fetch typeahead suggestions. It MUST NOT retain its hand-rolled `useState`/`useEffect`/`setTimeout` debounce pattern or call `productsService.getSuggestions` directly. All existing UX behavior (keyboard navigation, abort on close, no-results state, result rendering) MUST remain unchanged.

#### Scenario: Typeahead renders suggestions via hook

- GIVEN the user types 'amat' in the search modal
- WHEN 300ms elapse
- THEN the hook provides suggestions and the modal renders them identically to current behavior

#### Scenario: Empty query clears suggestions without fetch

- GIVEN the search input is cleared
- WHEN the hook observes empty query
- THEN no fetch is made and the suggestions list is empty (existing empty-state UI displays)

#### Scenario: Hook error maps to existing no-results state

- GIVEN the port rejects with a network error
- WHEN the modal renders
- THEN the existing no-results UI is shown (no crash, no unhandled rejection)

---

### Requirement: CAT-W2 — ProductCard Uses Domain formatPrice and calcDiscount

`app/components/ProductCard.tsx` MUST use `formatPrice` from `features/catalog/domain/catalog.rules` and `calcDiscount` from `features/catalog/domain/catalog.rules` instead of inline price formatting and discount calculation. The rendered output MUST be pixel-identical to current behavior (no visual regression).

#### Scenario: formatPrice output matches current inline format

- GIVEN a product with `price = 15990`
- WHEN `ProductCard` renders
- THEN the displayed price string equals `formatPrice(15990)` = `'15.990'`
- AND this is identical to the previous inline `Math.round(Number(price)).toLocaleString('es-CL')`

#### Scenario: calcDiscount output matches current inline percent

- GIVEN a product with `price = 8000` and `compare_at_price = 10000`
- WHEN `ProductCard` renders
- THEN the displayed discount equals `calcDiscount(8000, 10000)` = `20`
- AND this is identical to the previous inline `Math.round((1 - price/compare_at_price) * 100)`

#### Scenario: No compare_at_price means no discount badge

- GIVEN `compare_at_price = null`
- WHEN `ProductCard` renders
- THEN no discount badge is displayed (calcDiscount returns null)

---

### Requirement: CAT-W3 — app/lib/types.ts Re-exports SearchSuggestions Shim

`app/lib/types.ts` MUST re-export `SearchSuggestions` from `@/features/catalog/domain/catalog.types` so existing consumers of `SearchSuggestions` from `app/lib/types` compile unchanged.

#### Scenario: Legacy import path resolves

- GIVEN a file imports `SearchSuggestions` from `@/app/lib/types`
- WHEN TypeScript compiles
- THEN the import resolves to the domain definition without error

---

## Testing Requirements

### Requirement: CAT-T1 — Domain Rules Tested TDD First (RED → GREEN)

All functions in `features/catalog/domain/catalog.rules.ts` MUST have unit tests in `features/catalog/domain/catalog.rules.test.ts` written RED before implementation. Tests MUST run in Node/Vitest with no browser or React dependencies (`pnpm test:run`).

#### Scenario: RED then GREEN

- GIVEN `catalog.rules.test.ts` is written with no implementation
- WHEN `pnpm test:run` executes
- THEN tests fail (RED)
- AND after implementation all tests pass (GREEN)

---

### Requirement: CAT-T1a — Domain Multi-Select Tests Extended (NEW — catalog-ui-strangle)

`features/catalog/domain/catalog.rules.test.ts` MUST be extended with tests for: multi-material filter, multi-style filter, empty-array match-all, and single-item array backward compat. All new tests follow existing RED → GREEN strict TDD pattern.

#### Scenario: Multi-select tests added and passing

- GIVEN the extended `catalog.rules.test.ts` with 4+ new multi-select scenarios
- WHEN `pnpm test:run` executes
- THEN all new tests pass and no existing tests regress

---

### Requirement: CAT-T2 — formatPrice Exact-Output Scenarios Are Mandatory (BOUNDARY — locked)

`catalog.rules.test.ts` MUST contain at minimum four separate test cases for `formatPrice`: integer price, decimal price (rounds up), string-coerced price, and zero price. Each MUST assert the exact string output. These tests MUST NOT be omitted, combined, or softened to regex matchers.

#### Scenario: Four formatPrice test cases exist and pass

- GIVEN `catalog.rules.test.ts` has four `it()` blocks covering integer, decimal, string, and zero inputs
- WHEN `pnpm test:run` executes
- THEN all four pass with exact string assertions (`'15.990'`, `'15.991'`, `'9.990'`, `'0'`)

---

### Requirement: CAT-T3 — calcDiscount Boundary Scenarios Are Mandatory

`catalog.rules.test.ts` MUST contain test cases for `calcDiscount` covering: valid discount, `compare_at_price === null`, `compare_at_price === price` (no discount), and `compare_at_price < price` (inverted). Each is a separate `it()` block.

#### Scenario: Four calcDiscount boundary tests exist and pass

- GIVEN `catalog.rules.test.ts` has four `it()` blocks for calcDiscount
- WHEN `pnpm test:run` executes
- THEN all four pass with correct values (`20`, `null`, `null`, `null`)

---

### Requirement: CAT-T4 — Mapper Unit-Tested

`features/catalog/application/catalog.mapper.test.ts` MUST have unit tests covering happy path (BFF response with items) and empty response. Tests MUST assert exact shape of returned `SearchSuggestions`.

#### Scenario: Mapper tests cover happy and empty cases

- GIVEN `catalog.mapper.test.ts` has tests for non-empty and empty BFF response
- WHEN `pnpm test:run` executes
- THEN both pass and the shape matches `SearchSuggestions`

---

### Requirement: CAT-T5 — BFF Adapter Unit-Tested (Mock apiClient)

`features/catalog/infrastructure/bff-catalog.adapter.test.ts` (or colocated) MUST unit-test `fetchSuggestions` by mocking `apiClient` or `fetch`. Tests MUST assert: correct URL and query param passed, domain shape returned, BFF error propagates as rejection.

#### Scenario: Adapter test mocks apiClient and asserts BFF call

- GIVEN `apiClient` is mocked to return a valid BFF response
- WHEN `fetchSuggestions('anillo')` is called
- THEN `apiClient` was called with `/api/products/suggestions` and `query='anillo'`
- AND the result matches `SearchSuggestions` shape

---

### Requirement: CAT-T6 — Hook Unit-Tested (Mocked Port)

`features/catalog/application/use-product-suggestions.test.ts` MUST test the hook with a mocked `CatalogPort`. Tests MUST cover: debounce behavior (no fetch before 300ms), empty query (no fetch), successful suggestions, empty result (isEmpty), and error state.

#### Scenario: Hook test asserts debounce suppresses early fetch

- GIVEN the hook is rendered with a query
- WHEN less than 300ms have elapsed
- THEN the port's `fetchSuggestions` has NOT been called

#### Scenario: Hook test asserts isEmpty flag on empty suggestions

- GIVEN the mocked port returns `{ suggestions: [], query: 'x' }`
- WHEN the hook resolves
- THEN `isEmpty === true`

---

### Requirement: CAT-T7 — Existing Test Suite Stays Green

All 358 existing tests MUST continue to pass after this change. New tests added by this slice MUST not conflict with existing ones. `pnpm test:run` MUST exit zero.

#### Scenario: Full suite green after slice

- GIVEN the full implementation is applied
- WHEN `pnpm test:run` executes
- THEN all pre-existing tests pass and new catalog tests also pass

---

## Data-Fetching Pattern (Reusable Template)

This slice establishes the canonical client data-fetching pattern for future vertical slices. The pattern has three layers:

1. **Domain Layer** (`features/{name}/domain/`): Pure functions and types. No framework, no effects, no async. Test with Vitest in Node.
2. **Application Layer** (`features/{name}/application/`): Port interface (contract), mapper (DTO shape transformation), and React hooks (queries + state management). Imports React and React Query. Does NOT import infrastructure.
3. **Infrastructure Layer** (`features/{name}/infrastructure/`): Adapter implementing the port via concrete HTTP client (`apiClient`) and BFF routes. Imported ONLY by composition root (or module singleton).

Data flow: **Keystroke → Application Hook (debounce) → useQuery (disabled when empty) → Infrastructure Adapter → BFF API → Mapper (shape transform) → Domain Type → Application Hook (return) → UI Component**.

Module-singleton DI (via default export) is pragmatic for this scale. Future slices may optionally refactor to `createUseX(port: Port)` factory for stricter inversion if multiple adapters per hook become common. Test precedent: renderHook with mocked adapter via `vi.mock()`, QueryClientProvider wrapper with `retry: false`, fake timers split with `vi.runAllTimersAsync()` before `waitFor()`.

---

## Out of Scope (Deferred)

| Topic | Reason |
|---|---|
| CatalogPort methods beyond `fetchSuggestions` | No live consumer yet — grows with next slice |
| CatalogClient strangle (container-presentational split) | High risk, separate slice |
| RSC catalog pages migrated to React Query | RSC fetch path unchanged |
| dummy-products removal from products.service.ts | Deferred to strangle slice |
| buscar/page.tsx direct INTERNAL_API_URL bypass | Security follow-up slice |
| Other catalog routes (facets, by-slug, by-id) | No consumer in this slice |

---

## Shipped Artifacts

**PR #37** (squash commit d3378ac) with post-merge fixes:
- `features/catalog/domain/catalog.types.ts`: CatalogProduct, SortOption, CatalogFilter, SearchSuggestions (and orphaned SearchSuggestion, removed in W-3)
- `features/catalog/domain/catalog.rules.ts`: filterProducts, sortProducts, formatPrice, calcDiscount, isInStock
- `features/catalog/domain/catalog.rules.test.ts`: 23 TDD tests (22 original + 1 W-4 null-guard case)
- `features/catalog/application/ports/CatalogPort.ts`: lean interface, fetchSuggestions only
- `features/catalog/application/catalog.mapper.ts`: BFF DTO → domain shape transformation
- `features/catalog/application/catalog.mapper.test.ts`: 4 tests
- `features/catalog/infrastructure/bff-catalog.adapter.ts`: module-singleton implementing CatalogPort, throws on error
- `features/catalog/infrastructure/bff-catalog.adapter.test.ts`: 5 tests with vi.mock + importOriginal
- `features/catalog/application/use-search-suggestions.ts`: React Query hook v5, 300ms debounce, disabled when empty
- `features/catalog/application/use-search-suggestions.test.ts`: 7 tests, FIRST renderHook precedent (QueryClientProvider, fake timers pattern documented)
- `app/lib/types.ts`: SearchSuggestions re-export from domain (per-file shim)
- `app/components/SearchModal.tsx`: wired to useSearchSuggestions hook, dropped hand-rolled debounce, added reset effect (W-2), adopted formatPrice in product row (W-4)
- `app/components/ProductCard.tsx`: formatPrice + calcDiscount from domain

**Verification**: PASS WITH WARNINGS (0 critical)
- W-1: Module-singleton DI accepted as design decision (ADR-5)
- W-2: activeIndex reset on suggestions change (fixed)
- W-3: orphaned SearchSuggestion type (removed)
- W-4: inline toLocaleString in SearchModal product row (replaced with formatPrice)

**Test Results**: 37 test files, 397 tests, 0 failed. tsc --noEmit: 0 errors.

---

## Modifications — catalog-ui-strangle (PR #42–#44, merged via stacked-to-main)

**PR #42** (commit b25845e) extended domain with multi-select support:
- `features/catalog/domain/catalog.types.ts`: added `materials?: string[]`, `styles?: string[]` to `CatalogFilter`; added `ActiveFilters`, `emptyFilters` (moved from FilterSidebar)
- `features/catalog/domain/catalog.rules.ts`: extended `filterProducts` with additive array branches for `materials`, `styles`
- `features/catalog/domain/catalog.rules.test.ts`: 5 new tests for multi-material, multi-style, empty-array match-all, single-value backward compat (total: 28 tests)

**Application Hook** (new):
- `features/catalog/application/use-catalog-filters.ts`: owns filters, sort, pagination, viewMode, isFilterOpen, URL sync, facet derivation, domain-wired filtering+sorting, trackViewItemList once
- `features/catalog/application/use-catalog-filters.test.ts`: 14 tests covering initialization, URL sync, loadMore, facet derivation, cooldown guard

**Test Results (post-PR #44)**: 618 tests (550 baseline + 68 new), 0 failed. tsc --noEmit: 0 errors.
