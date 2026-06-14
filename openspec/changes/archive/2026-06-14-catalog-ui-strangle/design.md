# Design: Catalog UI Strangle (CatalogClient → features/catalog/ui/)

## Technical Approach

Final UI strangle. Apply the cart-ui (PR#38) + checkout-ui (PR#39-41) precedent: domain → application → ui, container-presentational + atomic. Domain type migration first (resolves the multi-select mismatch that caused the inline-filter bypass), then a DOM-free `use-catalog-filters` hook, then pure presentational atoms/molecules/organisms, then a single `CatalogContainer` that swaps into the RSC page. ProductCard moves to ui/molecules with the store call extracted behind a defaulted `onAddToCart`. `catalog/ui` MUST NOT import `cart/ui` or `checkout/ui`; cross-feature reuse flows only through the `app/components/ProductCard` shim.

## Architecture Decisions

### Decision: catalog/ui layout + layering
**Choice**: `features/catalog/ui/{atoms,molecules,organisms,containers}` mirroring cart-ui/checkout-ui. Hook lives in `features/catalog/application/use-catalog-filters.ts` (no JSX). Only `CatalogContainer` imports the hook + cart store.
**Alternatives**: hook under `ui/hooks/` (rejected — breaks precedent of use-cart-drawer/use-checkout-form in application); container-only minimal strangle (rejected — leaves domain bypass + ProductCard violation).
**Rationale**: Consistency with two shipped strangles; clean unidirectional dependency.

### Decision: domain multi-select migration (backward-compatible)
**Choice**: Extend `CatalogFilter` with `materials?: string[]` and `styles?: string[]`; KEEP single `material?`/`style?` for backward compat. Move `ActiveFilters` + `emptyFilters` into `catalog.types.ts`. `filterProducts` matches if the selected array is empty/absent OR `p.material ∈ materials` (same for styles, collections, price range).

```ts
// catalog.types.ts
export interface CatalogFilter {
  collections?: string[];
  material?: string;        // kept (back-compat)
  style?: string;           // kept (back-compat)
  materials?: string[];     // new multi-select
  styles?: string[];        // new multi-select
  priceMin?: number;
  priceMax?: number;
}
export interface ActiveFilters { collections: string[]; materials: string[]; styles: string[]; priceMin: number; priceMax: number; }
export const emptyFilters: ActiveFilters = { collections: [], materials: [], styles: [], priceMin: 0, priceMax: 0 };
```
```ts
// catalog.rules.ts filterProducts additions (additive, single-value branches untouched)
if (filters.materials?.length && !(p.material && filters.materials.includes(p.material))) return false;
if (filters.styles?.length && !(p.style && filters.styles.includes(p.style))) return false;
```
**Alternatives**: replace single with arrays (rejected — breaks existing single-value tests + SEO landing callers); translate ActiveFilters → N single-filter calls in the hook (rejected — loses AND semantics, duplicates logic).
**Rationale**: Additive arrays keep all 7 existing `catalog.rules.test.ts` cases green; new array cases get new tests.
**CONTRADICTION FLAGGED (collections)**: Domain `filterProducts` matches collections against `CatalogProduct.tags` (string[]). `CatalogClient` matches against `Product.productCollections[].collection.slug` (relation objects). These are DIFFERENT shapes. RESOLUTION: the hook maps `Product` → collection-slug set at the call boundary (derive `tags`-equivalent from `productCollections`), OR keeps the existing `productMatchesCollections` predicate in the application layer and only delegates material/style/price to domain. Chosen: hook builds a `collectionSlugs` projection per product and passes it so domain stays pure; preserve current matching behavior exactly. Lock with a parity test against the old inline result.

### Decision: use-catalog-filters hook shape (DOM-free)
**Choice**: Hook owns `filters`, `sortOption`, `visibleCount`, `isLoadingMore`, `viewMode`, `isFilterOpen` plus `parseFiltersFromParams`/`filtersToParams`/`syncURL` (reads `useSearchParams`, writes `useRouter().replace(url,{scroll:false})`), facet derivation (materialOptions/styleOptions/min/maxPrice memoized from products), `filteredAndSorted` via domain `filterProducts`+`sortProducts`, pagination slice, `activeFilterCount`, handlers, and `trackViewItemList` once-per-mount. Returns a flat props object.
**Alternatives**: keep facet derivation in FilterSidebarPanel (rejected — couples presentational to product data); observer inside hook (rejected — see next ADR).
**Rationale**: One stateful unit, testable via renderHook with mocked next/navigation; presentational layer stays prop-driven.

### Decision: infinite-scroll observer placement
**Choice**: IntersectionObserver lives in the `ProductGrid` organism. Grid exposes `onReachEnd` callback wired to `hook.loadMore`; hook stays DOM-free. Stagger `animateFromRef` lives in ProductGrid (presentational animation detail).
**Alternatives**: observer + sentinelRef in hook (rejected — couples hook to DOM, hurts testability); observer in container (rejected — container should stay logic-thin).
**Rationale**: Keeps hook unit-testable without jsdom DOM refs; grid is the only component that knows the sentinel position. Test `loadMore` via the callback; mock IntersectionObserver for the grid render test.

### Decision: ProductCard extraction + shim (11 consumers)
**Choice**: Move to `features/catalog/ui/molecules/ProductCard.tsx` with signature `{ product: Product; hoverImage?; isNew?; onAddToCart?: (product: Product, qty: number) => void }`. `onAddToCart` DEFAULTS to a local `useCartStore.addItem` call, so the 11 consumers compile and self-add unchanged. `app/components/ProductCard.tsx` becomes a one-line re-export shim. `CatalogContainer` passes an EXPLICIT `onAddToCart` so ITS grid path is container-driven; the default keeps standalone callers working.
**Alternatives**: fully pure card requiring every caller to pass a handler (rejected — 11-file blast radius, breaks RSC landing pages); separate ProductCardContainer wrapper (rejected — duplicates 150 lines).
**Rationale**: Accepted tradeoff — the card stays a hook-using component BY DEFAULT (pragmatic, zero-churn), while the catalog grid path is explicit. Verified: none of the 11 consumers pass props that conflict with the new optional prop. Prop stays `product: Product` (transport) — needs display_name/hover/stock not in lean CatalogProduct.

### Decision: dummy-products removal (catalog page only)
**Choice**: In `app/catalogo/page.tsx` `getProducts`, remove `if (data.length === 0) return dummyProducts` and `catch return dummyProducts`. `fetchCatalog` returns `{data:[],total:0}` on non-OK (no throw), so empty surfaces as `[]`. KEEP a try/catch that returns `[]` on a thrown network rejection (fetch itself can reject) — do NOT return dummies. Empty `[]` renders `CatalogEmptyState`. Drop the `dummyProducts` import. KEEP `app/sitemap.ts` and `products.service.ts` (out of scope).
**Alternatives**: remove try/catch entirely (rejected — unhandled fetch rejection would 500 the page); keep dummies (rejected — masks empty/error, the root motivation).
**Rationale**: Surfaces true empty state while staying crash-safe.

### Decision: CatalogContainer + swap
**Choice**: `CatalogContainer` consumes `use-catalog-filters` + cart store (only for the grid's add-to-cart handler), renders `CatalogLayout` composing `FilterSidebarPanel` + `ProductGrid` + `CatalogControlsBar` + `MobileFilterDrawer`. `app/catalogo/page.tsx` swaps `<CatalogClient/>` → `<CatalogContainer/>` inside the existing `<Suspense>`. Hero/Breadcrumb/JSON-LD/Header/Footer stay in the RSC shell.
**Rationale**: Thin RSC shell; one client boundary; preserves SEO server concerns.

### Decision: MobileFilterDrawer + RTL test strategy
**Choice**: MobileFilterDrawer is a presentational organism using CSS animation (`animate-fade-in`), NOT motion/react — so NO motion mock is needed and it is exercised via the container test, not a dedicated unit test (cart-ui CartDrawerPanel precedent). Tests: hook test mocks `next/navigation` (`useSearchParams`/`useRouter`); ProductCard shim-parity test asserts default add-to-cart fires the store; presentational atoms/molecules render-with-props; ProductGrid uses an IntersectionObserver mock and `loadMore` is tested via the `onReachEnd` callback.
```ts
// next/navigation mock precedent (hook test, module-level)
const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(''),
  useRouter: () => ({ replace }),
  usePathname: () => '/catalogo',
}));
// IntersectionObserver mock (ProductGrid test, beforeEach)
vi.stubGlobal('IntersectionObserver', class {
  observe() {} unobserve() {} disconnect() {}
});
```
**Rationale**: No new mocking infra beyond renderHook + jsdom globals; matches existing Vitest patterns.

## Data Flow

    RSC page.tsx ──props(products,collections)──▶ CatalogContainer
         │                                              │
    fetchCatalog([] on empty/error)        use-catalog-filters (state+URL+facets+domain)
                                                        │ filteredAndSorted = sort(filter(domain))
                                                        ▼
                                    CatalogLayout ─▶ FilterSidebarPanel
                                                  ─▶ CatalogControlsBar
                                                  ─▶ ProductGrid ─onReachEnd▶ hook.loadMore
                                                  ─▶ MobileFilterDrawer
                                                        │
                                    ProductCard (onAddToCart → cart store)

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `features/catalog/domain/catalog.types.ts` | Modify | Add `materials?`/`styles?` to CatalogFilter; add ActiveFilters + emptyFilters |
| `features/catalog/domain/catalog.rules.ts` | Modify | Multi-select branches in filterProducts (additive) |
| `features/catalog/domain/catalog.rules.test.ts` | Modify | Add multi-select array cases (keep single-value cases) |
| `features/catalog/application/use-catalog-filters.ts` (+test) | Create | DOM-free state/URL/facets/domain-wiring hook |
| `features/catalog/ui/atoms/*` (+tests) | Create | ProductCardImage, ActiveFilterChip, CatalogEmptyState, SortDropdown, ViewModeToggle, PaginationProgress |
| `features/catalog/ui/molecules/ProductCard.tsx` (+test) | Create | Moved card + onAddToCart default; shim-parity test |
| `features/catalog/ui/molecules/*` (+tests) | Create | ActiveFilterChips, FilterPriceRange, FilterSection, CatalogControlsBar, LoadingMoreIndicator, AllProductsShown |
| `features/catalog/ui/organisms/*` | Create | ProductGrid (+test, IO mock), FilterSidebarPanel (+test), MobileFilterDrawer (no unit test), CatalogLayout (+test) |
| `features/catalog/ui/containers/CatalogContainer.tsx` (+test, index.ts) | Create | Sole hook+store consumer |
| `app/components/ProductCard.tsx` | Modify | Re-export shim from ui/molecules |
| `app/components/CatalogClient.tsx` | Delete | Strangled (after swap) |
| `app/components/FilterSidebar.tsx` | Delete | Strangled (only CatalogClient consumed it) |
| `app/catalogo/page.tsx` | Modify | Swap to CatalogContainer; remove dummyProducts fallback |

## Interfaces / Contracts

```ts
// use-catalog-filters return (flat props object)
interface UseCatalogFilters {
  filters: ActiveFilters; sortOption: SortOption; viewMode: ViewMode;
  isFilterOpen: boolean; visibleCount: number; isLoadingMore: boolean;
  visibleProducts: Product[]; totalCount: number; hasMore: boolean;
  progressPercent: number; activeFilterCount: number;
  materialOptions: FacetOption[]; styleOptions: FacetOption[]; minPrice: number; maxPrice: number;
  onFiltersChange(f: ActiveFilters): void; onSortChange(s: SortOption): void;
  onViewModeChange(v: ViewMode): void; setFilterOpen(b: boolean): void; loadMore(): void;
}
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit (domain) | multi-select filter, back-compat single | extend catalog.rules.test.ts (TDD) |
| Unit (hook) | URL parse/serialize, facets, filteredAndSorted, loadMore, track-once | renderHook + next/navigation mock |
| Unit (presentational) | atoms/molecules render with props | RTL render-with-props |
| Unit (organism) | ProductGrid onReachEnd, empty state | RTL + IntersectionObserver mock |
| Parity | ProductCard default add-to-cart fires store; collection-match parity | RTL + store getState assertion |

## Migration / Rollout

3 chained PRs (stacked-to-main; final decision deferred to tasks Review Workload Guard). ~2,000–2,500 lines → 400-line budget risk CRITICAL.
- PR1: domain multi-select + ActiveFilters relocation + use-catalog-filters hook + tests.
- PR2: ProductCard move + shim + atoms + molecules + tests. (Dead-code window: new components unused until PR3.)
- PR3: organisms + CatalogContainer + page swap + dummyProducts removal + delete CatalogClient/FilterSidebar.
Per-PR git revert; ProductCard shim is the only cross-cutting change. No data migration.

## Open Questions

- [ ] Collection-match projection: confirm tasks/apply keep `productCollections`→slug parity exactly (CONTRADICTION resolution above) rather than relying on `CatalogProduct.tags`.
