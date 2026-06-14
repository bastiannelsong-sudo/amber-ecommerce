# Proposal: Catalog UI Strangle (CatalogClient → features/catalog/ui/)

## Intent

`CatalogClient` (~500 lines) and `FilterSidebar` (~280 lines) are mixed-concern client components: container state (filters/sort/pagination/viewMode/URL-sync), domain logic (inline filter/sort that BYPASSES existing `filterProducts`/`sortProducts`), and presentation all live together. `ProductCard` imports `useCartStore` directly (container violation) and is consumed by 11 files. This is the FINAL UI strangle, applying the shipped cart-ui (PR #38) and checkout-ui (PR #39-41) pattern: container-presentational + atomic design, with dependency direction domain → application → ui.

Root cause of the domain bypass: `ActiveFilters` (multi-select `materials[]`/`styles[]`) lives in `FilterSidebar` and is incompatible with domain `CatalogFilter` (single `material?`/`style?`). Fixing the domain type unblocks proper wiring.

## Scope

### In Scope
- **Domain**: add `ActiveFilters` + `emptyFilters` to `catalog.types.ts`; extend `CatalogFilter` + `filterProducts`/`sortProducts` for multi-select `materials?: string[]` / `styles?: string[]`; extend domain tests.
- **Application**: `use-catalog-filters.ts` hook — filters/sort/pagination(visibleCount/infinite-scroll)/viewMode/URL-sync state + facet derivation (material/style options, min/max price) + `trackViewItemList` once; owns `parseFiltersFromParams`/`filtersToParams`; consumes domain `filterProducts`/`sortProducts`.
- **UI** (`features/catalog/ui/`, mirrors cart-ui/checkout-ui): atoms (ProductCardImage, ActiveFilterChip, CatalogEmptyState, SortDropdown, ViewModeToggle, PaginationProgress); molecules (ProductCard MOVED + `onAddToCart` extracted, ActiveFilterChips, FilterPriceRange, FilterSection, CatalogControlsBar, LoadingMoreIndicator, AllProductsShown); organisms (ProductGrid, FilterSidebarPanel, MobileFilterDrawer, CatalogLayout); container (CatalogContainer — sole hook+store consumer).
- **ProductCard shim**: `app/components/ProductCard.tsx` re-exports from `@/features/catalog/ui/molecules/ProductCard`; 11 consumers compile unchanged.
- **Wiring**: hook calls domain filter/sort; FilterSidebarPanel price labels use domain `formatPrice`.
- **dummy-products removal**: drop `dummyProducts` fallback (empty-check + catch) from `app/catalogo/page.tsx`; render `CatalogEmptyState` on empty.
- **Swap**: `app/catalogo/page.tsx` `CatalogClient` → `CatalogContainer` (keep Hero/Breadcrumb/JSON-LD/Suspense in RSC).

### Out of Scope
- `SearchResultsClient` refactor (gets ProductCard shim free; future search-ui slice).
- `products.service.ts` dummy removal + `buscar/page` BFF-bypass (separate slices).
- SEO landing routes (`[type]`, `colecciones`, `amuletos`) — render ProductCard directly; shim covers them, no logic change.
- `app/sitemap.ts` dummy fallback — KEEP (build-time safe).

## Capabilities

### New Capabilities
- `catalog-ui`: full container-presentational + atomic UI layer for catalog (atoms/molecules/organisms/container), `use-catalog-filters` application hook, ProductCard shim, page swap, dummy removal. Requirement prefix `CATUI-*`.

### Modified Capabilities
- `catalog` (domain): `CatalogFilter` gains multi-select `materials?: string[]` / `styles?: string[]`; `filterProducts`/`sortProducts` honor arrays; `ActiveFilters` + `emptyFilters` relocate from `FilterSidebar` to domain.

## Approach

Approach A from exploration — full atomic split. Domain type migration first (resolves the multi-select vs single mismatch that caused the bypass), then application hook owns all stateful logic, then pure presentational components, then container assembly + swap. ProductCard moves to `ui/molecules/` and the store call is EXTRACTED to an `onAddToCart?` prop **defaulting to `useCartStore.addItem`** — existing 11 consumers stay self-adding (zero change), CatalogContainer passes an explicit handler. `catalog/ui` MUST NOT import `cart/ui` or `checkout/ui`; cross-feature reuse of ProductCard flows only through the existing `app/components/` shim.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `features/catalog/domain/catalog.types.ts` + `catalog.rules` | Modified | ActiveFilters/emptyFilters added; multi-select filter/sort + tests |
| `features/catalog/application/use-catalog-filters.ts` | New | Stateful hook + facet derivation + URL sync |
| `features/catalog/ui/{atoms,molecules,organisms,containers}` | New | Atomic UI layer + RTL tests |
| `app/components/ProductCard.tsx` | Modified | Becomes shim re-export |
| `app/components/CatalogClient.tsx`, `FilterSidebar.tsx` | Removed (via swap) | Strangled into ui/ |
| `app/catalogo/page.tsx` | Modified | Swap to CatalogContainer; remove dummyProducts |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Multi-select domain change breaks `catalog.rules.test.ts` | Med | Extend tests for arrays; keep single-value backward compat in filter logic |
| ProductCard 11-consumer blast radius | Med | Shim + `onAddToCart` default to `useCartStore.addItem` → zero consumer change; verify TS compile |
| `onAddToCart` extraction silently disables self-add | Med | Default prop preserves internal addItem; explicit container test for parity |
| Dead-code windows (PR1 hook + PR2 components unused until PR3) | Low | Acceptable per cart/checkout precedent; lands in PR3 |
| dummy removal exposes raw empty/error states | Low | CatalogEmptyState on empty; `fetchCatalog` returns `{data:[],total:0}` (no throw) |

## Rollback Plan

Per-PR git revert. ProductCard shim is the only cross-cutting change: reverting it restores the original `app/components/ProductCard.tsx` and all 11 consumers (they import the same path). PR3 swap revert restores `CatalogClient` in `app/catalogo/page.tsx`. No data/schema migration involved.

## Dependencies

- Shipped cart-ui + checkout-ui RTL infra (`__mocks__/next-image.tsx`, `motion/react` vitest alias) — reused, no new test infra.
- Existing catalog domain (`filterProducts`/`sortProducts`/`formatPrice`/`calcDiscount`).

## Delivery (3 chained PRs, stacked-to-main; final decision deferred to tasks Review Workload Guard)

- **PR1**: domain multi-select migration (ActiveFilters→domain, CatalogFilter arrays, extend filter/sort + tests) + `use-catalog-filters` hook + test.
- **PR2**: ProductCard (moved + shim + `onAddToCart` default) + atoms + molecules + RTL tests.
- **PR3**: organisms + CatalogContainer + page swap + dummyProducts removal + CatalogEmptyState wiring.

Estimate: ~2,000–2,500 lines. 400-line budget risk: CRITICAL → chained PRs required.

## Success Criteria

- [ ] `features/catalog/ui/` mirrors cart-ui/checkout-ui; only CatalogContainer consumes hook+store; no `cart/ui`/`checkout/ui` imports.
- [ ] Domain `filterProducts`/`sortProducts` wired (no inline filter/sort in UI); multi-select tests pass.
- [ ] ProductCard shim keeps all 11 consumers compiling with zero edits; self-add behavior preserved.
- [ ] `app/catalogo/page.tsx` is a thin RSC shell; `dummyProducts` fallback gone; empty state surfaces.
- [ ] All pre-existing tests stay green (`pnpm test:run`), new RTL/hook/domain tests added under strict TDD.
