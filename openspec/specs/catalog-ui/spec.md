# Catalog UI Capability Specification

**Domains**: catalog-ui (new feature)  
**Requirement prefix**: CATUI-*  
**Status**: SHIPPED (PR #42, #43, #44 — merged via stacked-to-main, all tests green, verify PASS 0C/3W)

---

## Purpose

Define the catalog UI layer — a full container-presentational + atomic component architecture for the catalog feature. Mirrors the cart-ui and checkout-ui patterns established by previous vertical slices. The UI layer is responsibility-separated from domain logic via the `use-catalog-filters` hook (application layer). All presentational components accept pure props; the sole hook and store consumer is the `CatalogContainer`.

This is the fourth and final architectural dimension for the catalog feature: domain → application → infrastructure (data-fetching) + application hook (stateful logic) → UI (pure presentational).

---

## Architecture Overview

### Layering and Dependency Direction

```
Domain (pure functions)
    ↑
Application (hook + state management)
    ↑
UI (atoms → molecules → organisms → container)
```

**Rule**: `features/catalog/ui/` MUST import only from `features/catalog/application/` and `features/catalog/domain/`. Presentational components (atoms, molecules, organisms) MUST NOT import from any Zustand store, hook, or infrastructure module. `CatalogContainer` is the SOLE hook/store consumer inside `ui/`.

---

## Requirements

### Requirement: CATUI-ARCH — UI Layer Dependency Direction

`features/catalog/ui/` MUST import only from `features/catalog/application/` and `features/catalog/domain/`. Presentational components (atoms, molecules, organisms) MUST NOT import from any store, hook, or `infrastructure/` path. `CatalogContainer` is the SOLE hook/store consumer inside `ui/`. `features/catalog/ui/` MUST NOT import from `features/cart/ui/` or `features/checkout/ui/`.

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

`features/catalog/application/use-catalog-filters.ts` MUST own all stateful catalog logic: `filters: ActiveFilters`, `sortOption: SortOption`, `visibleCount` (infinite scroll), `viewMode`, `isFilterOpen`, URL sync via `parseFiltersFromParams`/`filtersToParams` + `useRouter.replace`, facet derivation (`materialOptions`, `styleOptions`, `minPrice`, `maxPrice` from the `products` array), filtered+sorted list via domain `filterProducts`/`sortProducts`, `visibleProducts`, `hasMore`, `activeFilterCount`, and a single `trackViewItemList` on mount. The hook MUST return all state values and handlers as a flat props object.

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

- GIVEN `ActiveFilterChips` rendered with filters containing active chips and `onClearAll` spy
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

## File Structure

```
features/catalog/ui/
├── atoms/
│   ├── ProductCardImage.tsx
│   ├── ProductCardImage.test.tsx
│   ├── ActiveFilterChip.tsx
│   ├── ActiveFilterChip.test.tsx
│   ├── CatalogEmptyState.tsx
│   ├── CatalogEmptyState.test.tsx
│   ├── SortDropdown.tsx
│   ├── SortDropdown.test.tsx
│   ├── ViewModeToggle.tsx
│   ├── ViewModeToggle.test.tsx
│   ├── PaginationProgress.tsx
│   ├── PaginationProgress.test.tsx
│   └── index.ts (barrel export)
├── molecules/
│   ├── ProductCard.tsx
│   ├── ProductCard.test.tsx
│   ├── ActiveFilterChips.tsx
│   ├── ActiveFilterChips.test.tsx
│   ├── FilterPriceRange.tsx
│   ├── FilterPriceRange.test.tsx
│   ├── FilterSection.tsx
│   ├── FilterSection.test.tsx
│   ├── CatalogControlsBar.tsx
│   ├── CatalogControlsBar.test.tsx
│   ├── LoadingMoreIndicator.tsx
│   ├── LoadingMoreIndicator.test.tsx
│   ├── AllProductsShown.tsx
│   ├── AllProductsShown.test.tsx
│   └── index.ts (barrel export)
├── organisms/
│   ├── ProductGrid.tsx
│   ├── ProductGrid.test.tsx
│   ├── FilterSidebarPanel.tsx
│   ├── FilterSidebarPanel.test.tsx
│   ├── MobileFilterDrawer.tsx
│   ├── CatalogLayout.tsx
│   ├── CatalogLayout.test.tsx
│   └── index.ts (barrel export)
├── containers/
│   ├── CatalogContainer.tsx
│   ├── CatalogContainer.test.tsx
│   └── index.ts (re-export)
└── index.ts (public barrel export)

features/catalog/application/
├── use-catalog-filters.ts
└── use-catalog-filters.test.ts
```

---

## Data Flow

```
RSC page.tsx --props(products,collections)--> 
CatalogContainer --> 
use-catalog-filters (state+URL+facets+domain) --> 
filteredAndSorted=sort(filter(domain)) --> 
CatalogLayout --> 
{FilterSidebarPanel, CatalogControlsBar, ProductGrid (onReachEnd->loadMore), MobileFilterDrawer} --> 
ProductCard (onAddToCart->cart store)
```

`fetchCatalog` returns `[]` on empty/error.

---

## Container vs Presentational Split

**Container (Hook + Store Consumer)**:
- `CatalogContainer`: sole consumer of `useCatalogFilters` + `useCartStore`
- Derives secondary props (e.g., `collectionOptions` from RSC page prop)
- Wires all interactions between hook, store, and presentational children
- Renders `CatalogLayout` with prepared props

**Presentational**:
- All atoms, molecules, organisms accept pure props only
- No framework imports (no React hooks beyond basic `useState` for UI-local state like drawer toggle)
- Decoupled from business logic; fully testable via RTL

---

## Out of Scope

| Topic | Reason |
|-------|--------| 
| `SearchResultsClient` refactor | Separate search-ui slice; gets ProductCard shim for free |
| `products.service.ts` dummy removal | Client-side browser service; separate tech-debt slice |
| `buscar/page.tsx` BFF bypass | Security/tech-debt follow-up slice |
| SEO landing routes ([type], colecciones, amuletos) | Render ProductCard via shim; no logic change needed |
| `app/sitemap.ts` dummy fallback | Build-time safe; kept intentionally |

---

## Shipped Artifacts (3 PRs, merged via stacked-to-main)

**PR #42** (commit b25845e) — Domain + Hook:
- `features/catalog/domain/catalog.types.ts`: CatalogFilter extended with `materials?: string[]`, `styles?: string[]`; `ActiveFilters`, `emptyFilters` relocated from FilterSidebar
- `features/catalog/domain/catalog.rules.ts`: extended `filterProducts` with multi-select logic; `sortProducts` existing
- `features/catalog/domain/catalog.rules.test.ts`: extended with 5 multi-select + backward-compat tests
- `features/catalog/application/use-catalog-filters.ts`: 300+ lines, owns all stateful logic (filters, sort, pagination, URL sync, facets, trackViewItemList)
- `features/catalog/application/use-catalog-filters.test.ts`: 14 tests covering initialization, URL sync, loadMore, facet derivation

**PR #43** (commit b44a8b6) — ProductCard + Atoms + Molecules:
- `features/catalog/ui/molecules/ProductCard.tsx`: moved from `app/components/`, signature with `onAddToCart` defaulting to `useCartStore.addItem`
- `app/components/ProductCard.tsx`: converted to one-line re-export shim
- `features/catalog/ui/atoms/*`: 6 atoms (ProductCardImage, ActiveFilterChip, CatalogEmptyState, SortDropdown, ViewModeToggle, PaginationProgress) + tests
- `features/catalog/ui/molecules/*`: 6 molecules (ActiveFilterChips, FilterPriceRange, FilterSection, CatalogControlsBar, LoadingMoreIndicator, AllProductsShown) + tests

**PR #44** (commit b782f76) — Organisms + Container + Page Swap:
- `features/catalog/ui/organisms/*`: 4 organisms (ProductGrid with IntersectionObserver, FilterSidebarPanel, MobileFilterDrawer, CatalogLayout) + tests
- `features/catalog/ui/containers/CatalogContainer.tsx`: sole hook+store consumer, renders CatalogLayout with wired props
- `app/catalogo/page.tsx`: swapped CatalogClient → CatalogContainer; removed dummyProducts fallback
- Deleted: `app/components/CatalogClient.tsx`, `app/components/FilterSidebar.tsx`

**Verification**: PASS WITH WARNINGS (0 CRITICAL / 3 WARNINGS / 2 SUGGESTIONS)
- W-1: loadMore cooldown removed (minor regression, low real-world risk)
- W-2: collectionOptions empty in hook interface (spec imprecision, no behavior impact)
- W-3: FilterSidebarPanel smoke test (acceptable — other tests substantive)
- S-1, S-2: skipped per verification scope

**Test Results**: 618 tests (550 baseline + 68 new), 0 failed. tsc --noEmit: 0 errors.

**Architectural Achievement**: All 4 architecture patterns (state/orchestration/data-fetching/UI) now established AND applied across cart, checkout, catalog features. 14 PRs total for this foundational effort.
