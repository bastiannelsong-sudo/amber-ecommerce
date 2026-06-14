# Catalog UI Strangle — Delta Spec

**Change**: catalog-ui-strangle
**Requirement prefixes**: `CATUI-*` (new capabilities) | `catalog` MODIFIED (domain delta)
**Status**: DRAFT

---

## Affected Domains

| Domain | Type | Spec file |
|--------|------|-----------|
| catalog (domain) | MODIFIED | openspec/specs/catalog/spec.md |
| catalog-ui | NEW | this file |

---

# Part 1 — Delta for `catalog` (domain MODIFIED)

## MODIFIED Requirements

### Requirement: CAT-D2 — Supporting Domain Types

`features/catalog/domain/catalog.types.ts` MUST also define:
- `SortOption`: `'newest' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc'`
- `CatalogFilter`: `{ collections?: string[]; materials?: string[]; styles?: string[]; priceMin?: number; priceMax?: number }`
- `ActiveFilters`: `{ collections: string[]; materials: string[]; styles: string[]; priceMin: number; priceMax: number }` — UI-facing multi-select filter state
- `emptyFilters`: `ActiveFilters` constant with all arrays empty and prices `0`/`Infinity`
- `SearchSuggestion`: `{ product_id: number | string; name: string; slug: string; image_url?: string; price: number }`
- `SearchSuggestions`: `{ suggestions: SearchSuggestion[]; query: string }`

(Previously: `CatalogFilter` had `material?: string` and `style?: string` — single strings; `ActiveFilters` and `emptyFilters` lived in `app/components/FilterSidebar.tsx`)

#### Scenario: Types are importable from domain index

- GIVEN a consumer imports `SortOption`, `CatalogFilter`, `ActiveFilters`, `emptyFilters` from `@/features/catalog`
- WHEN TypeScript compiles
- THEN all resolve without error and match the shapes above

#### Scenario: emptyFilters is the zero-value for ActiveFilters

- GIVEN `emptyFilters` is imported from domain
- WHEN its fields are inspected
- THEN `collections`, `materials`, `styles` are empty arrays and `priceMin === 0`, `priceMax === Infinity`

---

### Requirement: CAT-R1 — filterProducts Matches Active Filters

`filterProducts(products: CatalogProduct[], filters: CatalogFilter): CatalogProduct[]` MUST return only products matching ALL non-empty filter properties. `materials` and `styles` MUST be treated as inclusive arrays: a product matches if its `material` field is included in the `materials` array (or the array is empty). Empty or absent filter properties MUST be treated as match-all.

(Previously: `material` and `style` were single optional strings; multi-select was not supported)

#### Scenario: No active filters returns all products

- GIVEN `filters = {}`
- WHEN `filterProducts(products, filters)` is called
- THEN all products are returned unchanged

#### Scenario: Collection filter narrows results

- GIVEN products has two items: one with `tags: ['anillos']` and one with `tags: ['collares']`
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

- GIVEN products with prices `5000`, `15000`, `25000`
- AND `filters = { priceMin: 10000, priceMax: 20000 }`
- WHEN `filterProducts(products, filters)` is called
- THEN only the `15000` product is returned

---

# Part 2 — New Capability: `catalog-ui`

## Purpose

Full container-presentational + atomic UI layer for the catalog feature (`features/catalog/ui/` + application hook). Mirrors the cart-ui-strangle and checkout-ui pattern. Presentational components accept pure props; `CatalogContainer` is the sole consumer of the hook and store; dependency direction flows domain → application → ui.

---

## Requirements

### Requirement: CATUI-ARCH — UI Layer Dependency Direction

`features/catalog/ui/` MUST import only from `features/catalog/application/` and `features/catalog/domain/`. Presentational components (atoms, molecules, organisms) MUST NOT import from any Zustand store, hook, or infrastructure module. `CatalogContainer` is the SOLE hook/store consumer inside `ui/`. `features/catalog/ui/` MUST NOT import from `features/cart/ui/` or `features/checkout/ui/`.

#### Scenario: Presentational has no store or hook import

- GIVEN any file under `features/catalog/ui/atoms/`, `molecules/`, or `organisms/`
- WHEN TypeScript resolves all imports
- THEN zero imports from any store, hook, or `infrastructure/` path exist in that file

#### Scenario: Container is the sole hook consumer

- GIVEN `CatalogContainer.tsx`
- WHEN TypeScript resolves all imports
- THEN `use-catalog-filters` and `useCartStore` are imported only in this file within `ui/`

---

### Requirement: CATUI-HOOK — use-catalog-filters Application Hook

`features/catalog/application/use-catalog-filters.ts` MUST own all stateful catalog logic: `filters: ActiveFilters`, `sortOption: SortOption`, `visibleCount` (infinite scroll), `viewMode`, `isFilterOpen`, URL sync via `parseFiltersFromParams`/`filtersToParams` + `useRouter.replace`, facet derivation (`materialOptions`, `styleOptions`, `collectionOptions`, `minPrice`, `maxPrice` from the `products` array), filtered+sorted list via domain `filterProducts`/`sortProducts`, `visibleProducts`, `hasMore`, `activeFilterCount`, and a single `trackViewItemList` on mount. The hook MUST return all state values and handlers as a flat props object.

#### Scenario: Filter change updates URL and filtered results

- GIVEN the hook is initialized with products `[{material:'plata'}, {material:'oro'}]`
- WHEN `handleFiltersChange({ materials: ['plata'] })` is called
- THEN `visibleProducts` contains only the `plata` product
- AND `router.replace` is called with `materials=plata` in the URL search params

#### Scenario: Sort change reorders visible products

- GIVEN `visibleProducts` with prices `[300, 100, 200]`
- WHEN `handleSortChange('price-asc')` is called
- THEN `visibleProducts` order becomes `[100, 200, 300]`
- AND `router.replace` is called with `sort=price-asc`

#### Scenario: loadMore increments visibleCount

- GIVEN `visibleCount = 20` and `products.length = 30`
- WHEN `loadMore()` is called
- THEN `hasMore === true` before the call, `visibleCount` increases
- AND after enough calls `hasMore === false`

#### Scenario: Facet derivation from products

- GIVEN `products = [{material:'plata'}, {material:'oro'}, {material:'plata'}]`
- WHEN the hook computes facets
- THEN `materialOptions` is `['plata', 'oro']` (unique, deduplicated)

#### Scenario: URL params initialize filters on mount

- GIVEN URL search params contain `materials=plata&sort=price-asc`
- WHEN the hook initializes via `parseFiltersFromParams`
- THEN `filters.materials === ['plata']` and `sortOption === 'price-asc'`

#### Scenario: trackViewItemList fires exactly once on mount

- GIVEN the hook is mounted with a non-empty products array
- WHEN the component mounts
- THEN `trackViewItemList` is called exactly once and NOT called again on re-renders

---

### Requirement: CATUI-ATOM-1 — Catalog UI Atoms (Pure Props)

The following atoms MUST reside in `features/catalog/ui/atoms/` and accept only pure props (no store or hook imports):

| Atom | Key props |
|------|-----------|
| `ProductCardImage` | `src: string; alt: string; fallback?: string` |
| `ActiveFilterChip` | `label: string; onRemove: () => void` |
| `CatalogEmptyState` | `onClearFilters: () => void` |
| `SortDropdown` | `value: SortOption; options: {value,label}[]; onChange: (v: SortOption) => void` |
| `ViewModeToggle` | `value: 'grid-3'\|'grid-4'\|'list'; onChange: (v) => void` |
| `PaginationProgress` | `visible: number; total: number; onLoadMore: () => void` |

#### Scenario: CatalogEmptyState renders clear-filters action

- GIVEN `CatalogEmptyState` rendered with an `onClearFilters` spy
- WHEN the user clicks the clear-filters call-to-action
- THEN `onClearFilters` is called once

#### Scenario: ActiveFilterChip calls onRemove on click

- GIVEN `ActiveFilterChip` rendered with `label="plata"` and an `onRemove` spy
- WHEN the remove button is clicked
- THEN `onRemove` is called once

---

### Requirement: CATUI-MOL-1 — ProductCard Molecule (Moved + onAddToCart Default)

`features/catalog/ui/molecules/ProductCard.tsx` MUST accept `{ product: Product; onAddToCart?: (product: Product, qty: number) => void }`. When `onAddToCart` is not provided, it MUST default to calling `useCartStore.addItem` internally — preserving existing self-add behavior for all 11 current consumers. It MUST use domain `formatPrice` and `calcDiscount` for display. No raw `toLocaleString` or inline discount math is permitted.

#### Scenario: Default add-to-cart invokes store when prop is absent

- GIVEN `ProductCard` rendered WITHOUT `onAddToCart` prop
- WHEN the add-to-cart button is clicked
- THEN `useCartStore().addItem` is called with the product

#### Scenario: Explicit onAddToCart overrides default

- GIVEN `ProductCard` rendered WITH `onAddToCart` spy
- WHEN the add-to-cart button is clicked
- THEN the spy is called once and `useCartStore().addItem` is NOT called

#### Scenario: Price formatted via domain formatPrice

- GIVEN a product with `price = 15990`
- WHEN `ProductCard` renders
- THEN the displayed price equals `formatPrice(15990)` = `'15.990'`

---

### Requirement: CATUI-MOL-2 — Filter and Controls Molecules

`features/catalog/ui/molecules/` MUST include:

| Molecule | Responsibility |
|----------|---------------|
| `ActiveFilterChips` | Renders row of `ActiveFilterChip` atoms + "clear all" button |
| `FilterPriceRange` | Min/max price inputs + slider; uses `formatPrice` for labels |
| `FilterSection` | Accordion section with checkboxes for a single filter dimension |
| `CatalogControlsBar` | Product count label + `ViewModeToggle` + `SortDropdown` |
| `LoadingMoreIndicator` | Three animated loading dots |
| `AllProductsShown` | End-of-catalog decorative message |

All molecules MUST accept pure props only (no store or hook imports).

#### Scenario: FilterPriceRange uses domain formatPrice for labels

- GIVEN `FilterPriceRange` rendered with `min={5000}` and `max={25000}`
- WHEN the component renders
- THEN price labels display `formatPrice(5000)` and `formatPrice(25000)` values

#### Scenario: ActiveFilterChips clear-all removes all filters

- GIVEN `ActiveFilterChips` rendered with `filters` containing active chips and `onClearAll` spy
- WHEN the "clear all" button is clicked
- THEN `onClearAll` is called once

---

### Requirement: CATUI-ORG-1 — Catalog Organisms (Pure Presentational)

`features/catalog/ui/organisms/` MUST include:

| Organism | Key props |
|----------|-----------|
| `ProductGrid` | `products: Product[]; onAddToCart: (p,qty)=>void; emptyState: ReactNode` |
| `FilterSidebarPanel` | filter props + facet arrays (pure; no store) |
| `MobileFilterDrawer` | `isOpen: boolean; onClose: () => void; children: ReactNode` |
| `CatalogLayout` | `sidebar: ReactNode; grid: ReactNode` (two-column layout) |

`ProductGrid` MUST render `CatalogEmptyState` (via `emptyState` prop) when `products` is empty and MUST support stagger animation and an intersection sentinel for infinite scroll.

#### Scenario: ProductGrid renders CatalogEmptyState on empty products

- GIVEN `ProductGrid` rendered with `products={[]}` and a `CatalogEmptyState` as `emptyState`
- WHEN the component renders
- THEN the empty state content is visible in the DOM

#### Scenario: ProductGrid renders product cards when products are present

- GIVEN `ProductGrid` rendered with two products
- WHEN the component renders
- THEN two `ProductCard` elements are present in the DOM

---

### Requirement: CATUI-SHIM — ProductCard Re-export Shim

`app/components/ProductCard.tsx` MUST be replaced with a single re-export from `@/features/catalog/ui/molecules/ProductCard`. All 11 existing consumers MUST compile without any import path changes.

#### Scenario: All 11 consumers compile unchanged after shim

- GIVEN the shim is applied at `app/components/ProductCard.tsx`
- WHEN `tsc --noEmit` runs over all consumer files
- THEN zero TypeScript errors are reported

#### Scenario: Consumer self-add still works through shim

- GIVEN a consumer renders `<ProductCard product={p} />` (no `onAddToCart` prop) via the shim
- WHEN the add-to-cart button is clicked
- THEN the cart store's `addItem` is invoked (default behavior preserved)

---

### Requirement: CATUI-FIX-DUMMY — Remove dummyProducts Fallback from Catalog Page

`app/catalogo/page.tsx` MUST NOT use `dummyProducts` as a fallback for empty data or fetch errors. When the catalog returns zero products, the page MUST render `CatalogEmptyState`. `app/sitemap.ts` MUST retain its existing `dummyProducts` fallback (build-time safety; out of scope).

#### Scenario: Empty catalog renders CatalogEmptyState (not dummy data)

- GIVEN `fetchCatalog` returns `{ data: [], total: 0 }`
- WHEN `app/catalogo/page.tsx` renders
- THEN `CatalogContainer` receives an empty `products` array
- AND `CatalogEmptyState` is visible in the final rendered output

#### Scenario: sitemap.ts retains fallback

- GIVEN `app/sitemap.ts` is compiled
- WHEN its source is inspected
- THEN `dummyProducts` is still present as a build-time fallback and no change was applied

---

### Requirement: CATUI-SWAP — CatalogContainer Replaces CatalogClient in Page

`app/catalogo/page.tsx` MUST render `CatalogContainer` instead of `CatalogClient`. The RSC shell MUST retain `Hero`, `Breadcrumb`, `JSON-LD`, and `Suspense` boundary unchanged. `CatalogClient.tsx` MAY be deleted after the swap.

#### Scenario: Thin RSC shell delegates to CatalogContainer

- GIVEN `app/catalogo/page.tsx` after the swap
- WHEN its source is inspected
- THEN it imports `CatalogContainer`, NOT `CatalogClient`
- AND `Hero`, `Breadcrumb`, and JSON-LD script tag are still present in the RSC render

#### Scenario: Behavior parity — filter + sort + URL sync

- GIVEN the user visits `/catalogo`
- WHEN the user selects a material filter and sort option
- THEN the URL updates, visible products update, and the behavior is identical to the previous `CatalogClient`

---

### Requirement: CATUI-FIX-DOMAIN — Domain Filter/Sort Wired (Bypass Removed)

`CatalogContainer` (via `use-catalog-filters`) MUST call domain `filterProducts` and `sortProducts`. Inline filtering and sorting logic inside `CatalogClient` MUST NOT be carried into any new file.

#### Scenario: Domain filterProducts is called on filter change

- GIVEN `use-catalog-filters` is initialized with products
- WHEN filters are changed
- THEN `filterProducts(products, filters)` is called to produce `filteredAndSorted`
- AND no inline `Array.filter` bypass exists in the hook or container

---

## Testing Requirements

### Requirement: CATUI-T1 — Domain Multi-Select Tests Extended

`features/catalog/domain/catalog.rules.test.ts` MUST be extended with tests for: multi-material filter, multi-style filter, empty-array match-all, and single-item array backward compat. All new tests MUST follow existing RED → GREEN strict TDD pattern.

#### Scenario: Multi-select tests added and passing

- GIVEN the extended `catalog.rules.test.ts` with 4+ new multi-select scenarios
- WHEN `pnpm test:run` executes
- THEN all new tests pass and no existing tests regress

---

### Requirement: CATUI-T2 — use-catalog-filters Hook Tests

`features/catalog/application/use-catalog-filters.test.ts` MUST cover: filter change updates results + URL, sort change reorders, `loadMore` increments count, facet derivation (unique materials), URL param initialization, `trackViewItemList` fires once. Tests MUST mock `useRouter` and `useSearchParams`.

#### Scenario: Hook test asserts filter change updates URL

- GIVEN the hook rendered with `useRouter` mocked
- WHEN `handleFiltersChange({ materials: ['plata'] })` is called
- THEN the mock router's `replace` was called with a URL containing `materials=plata`

---

### Requirement: CATUI-T3 — ProductCard Shim Parity Tests

`features/catalog/ui/molecules/ProductCard.test.tsx` MUST cover: renders product name+price, default `onAddToCart` invokes cart store, explicit `onAddToCart` spy overrides default, no-discount renders no badge.

#### Scenario: Shim parity — default add-to-cart works

- GIVEN `ProductCard` rendered without `onAddToCart`
- WHEN the add-to-cart action is triggered
- THEN `useCartStore().addItem` is called (same as current behavior)

---

### Requirement: CATUI-T4 — Presentational Render-With-Props Tests

Each atom and molecule (except `MobileFilterDrawer`) MUST have an RTL test covering at minimum: renders with required props, key interaction fires correct callback. Tests follow the cart-ui / checkout-ui jsdom + RTL precedent.

#### Scenario: Atom renders with required props without crashing

- GIVEN any atom rendered with its minimal required props
- WHEN `render()` is called
- THEN no error is thrown and the root element is present in the DOM

---

### Requirement: CATUI-T5 — Existing Tests Stay Green

All 550 existing tests MUST continue to pass after this change. `pnpm test:run` MUST exit zero.

#### Scenario: Full suite green after strangle

- GIVEN the full implementation is applied
- WHEN `pnpm test:run` executes
- THEN all pre-existing tests pass and new catalog-ui tests also pass

---

## Out of Scope

| Topic | Reason |
|-------|--------|
| `SearchResultsClient` refactor | Separate search-ui slice; gets ProductCard shim for free |
| `products.service.ts` dummy removal | Client-side browser service; separate tech-debt slice |
| `buscar/page.tsx` BFF bypass | Security/tech-debt follow-up slice |
| SEO landing routes ([type], colecciones, amuletos) | Render ProductCard via shim; no logic change needed |
| `app/sitemap.ts` dummy fallback | Build-time safe; kept intentionally |
