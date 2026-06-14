# Exploration: catalog-ui-strangle

> Source: Engram observation #997 (sdd/catalog-ui-strangle/explore). Copied verbatim — the explore sub-agent could not write files.

## Current State

**CatalogClient.tsx** (`app/components/CatalogClient.tsx`, ~500 lines, 'use client')

Mixed-concern component that owns:

CONTAINER CONCERNS (must move to hook + container):
- `filters: ActiveFilters` state (from URL)
- `sortOption: SortOption` state (from URL)
- `visibleCount / isLoadingMore` state (infinite scroll pagination)
- `viewMode: 'grid-3' | 'grid-4' | 'list'` state
- `isFilterOpen` state (mobile drawer toggle)
- `parseFiltersFromParams(params)` — URL → ActiveFilters (currently inline, must go to domain/application)
- `filtersToParams(filters, sort)` — ActiveFilters → URLSearchParams (inline, to application)
- `syncURL(f, s)` — `useRouter.replace` (to application hook)
- `handleFiltersChange / handleSortChange / loadMore` — callbacks (to container)
- `IntersectionObserver` sentinel for infinite scroll (to container)
- `trackViewItemList` once-per-mount (to container)
- Inline filtering: `productMatchesCollections`, filter-by-material, filter-by-style, filter-by-price (DOMAIN GAP — domain filterProducts exists but CatalogClient does NOT use it; it has its own inline logic)
- Inline sorting: switch on sortOption (DOMAIN GAP — domain sortProducts exists but CatalogClient uses inline sort)
- Stagger animation ref (`animateFromRef`)

PRESENTATIONAL CONCERNS (atoms/molecules/organisms):
- Controls bar: product count + view mode toggles + sort dropdown
- Active filter tags row (FilterTag component — already inline, should be ActiveFilterChips atom/molecule)
- Mobile filter drawer (slide-in panel — organism candidate)
- Product grid (organism: ProductGrid)
- Infinite scroll: progress bar + loading dots + sentinel + "all products shown" end message (pagination molecule)
- Empty state (organism: CatalogEmptyState)

INLINE HELPER:
- `FilterTag` (~15 lines, already colocated in same file) — atom candidate

**FilterSidebar.tsx** (`app/components/FilterSidebar.tsx`, ~280 lines, 'use client')

Mixed-concern:
- CONTAINER CONCERN: `useMemo` for materialOptions, styleOptions, minPrice, maxPrice derived from `products: Product[]` prop (facet derivation belongs in application hook or can stay as pure prop transformation in presentational if products are passed)
- `openSections` state — presentational state (accordion), stays in presentational
- `ActiveFilters` type EXPORTED from here — WRONG LOCATION: belongs in `features/catalog/domain/catalog.types.ts` (gap flagged in prior explore)
- `emptyFilters` constant — also belongs in domain
- Presentational: accordion sections per filter dimension, price range inputs + slider, collection checkbox tree
- Props: collections (tree), products (for facet derivation), activeFilters, onFiltersChange
- Status: PURELY CLIENT COMPONENT, no RSC

TYPE/CONSTANT LOCATION VIOLATION:
- `ActiveFilters` defined in `app/components/FilterSidebar.tsx` and exported for use by CatalogClient
- Domain already has `CatalogFilter` but it is DIFFERENT from `ActiveFilters`:
  - `ActiveFilters`: { collections: string[], materials: string[], styles: string[], priceMin: number, priceMax: number }
  - `CatalogFilter` (domain): { collections?: string[], material?: string, style?: string, priceMin?: number, priceMax?: number }
  - Key differences: ActiveFilters allows multi-material (array), multi-style (array); domain CatalogFilter allows single material/style strings
  - This means either: (a) domain CatalogFilter needs updating to match multi-select reality, OR (b) a separate UI-facing `CatalogActiveFilters` type lives in domain
  - Recommendation: extend domain `CatalogFilter` to support arrays for material/style, then `ActiveFilters` becomes a re-export alias from domain

**ProductCard.tsx** (`app/components/ProductCard.tsx`, ~155 lines, 'use client')

ALREADY PARTIALLY MIGRATED — uses `formatPrice` + `calcDiscount` from `features/catalog/domain/catalog.rules`.
CONTAINER VIOLATION: imports `useCartStore` directly (for `addItem`). This means it is NOT a pure presentational component.
Receives `product: Product` (full transport type, not `CatalogProduct`).

BLAST RADIUS — consumers that import ProductCard directly from `app/components/ProductCard`:
1. `app/components/CatalogClient.tsx` — main catalog grid
2. `app/components/SearchResultsClient.tsx` — search results
3. `app/components/FeaturedProducts.tsx`
4. `app/components/RelatedProducts.tsx`
5. `app/colecciones/[slug]/page.tsx` — RSC collection page
6. `app/[type]/page.tsx` — RSC product-type landing
7. `app/[type]/[material]/page.tsx` — RSC type+material landing
8. `app/amuletos/page.tsx`
9. `app/amuletos/[tag]/page.tsx`
10. `app/favoritos/page.tsx` — wishlist (client component)
11. `app/regalos/page.tsx`
TOTAL: 11 direct consumers

The `useCartStore` call inside ProductCard makes it a de-facto container. Moving it to `features/catalog/ui/` without breaking 11 consumers requires a re-export shim at `app/components/ProductCard.tsx` (same pattern as cart.store shim).

**SearchResultsClient.tsx** (`app/components/SearchResultsClient.tsx`, ~257 lines, 'use client')

RELATIONSHIP TO CATALOG: shares grid layout + ProductCard but is a SEPARATE container for the /buscar route. Does NOT use CatalogClient or FilterSidebar. Has its own sort dropdown (different options — relevance included). Has server-side pagination (not infinite scroll). Independently tracks analytics via `trackSearch` + `trackViewItemList`.

SCOPE QUESTION: Is SearchResultsClient in scope for catalog-ui-strangle? It uses ProductCard (in scope) and has a sort dropdown + product grid (shareable organisms) but has a fundamentally different container model (RSC-paginated vs client-infinite-scroll). RECOMMENDATION: out of scope for this strangle; a SearchResultsClient can be a future slice once ProductGrid is extracted and reusable.

**Catalog Pages / RSC data flow**

- `app/catalogo/page.tsx` — RSC, fetches via `fetchCatalog` + `getCollections`, passes `products: Product[]` and `collections: Collection[]` as props to `CatalogClient`. DUMMY FALLBACK: `dummyProducts` used when `data.length === 0` OR on catch. Page renders Hero + Breadcrumb + Suspense(`<CatalogClient>`) — hero + breadcrumb stay in page (RSC concerns).
- `app/colecciones/[slug]/page.tsx` — RSC, renders ProductCard directly (no CatalogClient). DOES NOT use dummyProducts.
- `app/[type]/page.tsx` — RSC, renders ProductCard directly (no CatalogClient, no FilterSidebar). No dummyProducts.
- `app/[type]/[material]/page.tsx` — RSC, same as above. No dummyProducts.
- `app/amuletos/page.tsx` — RSC, renders ProductCard directly. No dummyProducts.

CatalogClient is used ONLY by `app/catalogo/page.tsx`. It is NOT reused by collection/type/amuletos pages — those render ProductCard directly within RSC.

**dummy-products analysis**

Sites of use:
1. `app/catalogo/page.tsx` — two fallback paths: `if (data.length === 0) return dummyProducts` AND catch block `return dummyProducts`. This MASKS both empty catalog and network errors.
2. `app/lib/services/products.service.ts` — `getAll()` catch returns `dummyProducts`. Also `getById()` catch uses `getDummyProductById`.
3. `app/sitemap.ts` — startup default `let products = dummyProducts`, overwritten on success. SAFE: this is fallback for sitemap generation only, does not mask errors at runtime.

REMOVAL IMPACT (catalog-ui-strangle scope):
- `app/catalogo/page.tsx`: removing `dummyProducts` fallback means empty catalog OR network errors show empty state / error boundary. Requires CatalogEmptyState + error boundary to surface correctly. `fetchCatalog` already returns `{ data: [], total: 0 }` on non-OK response (it does NOT throw). So removing dummyProducts → empty state shows. This is the correct behavior.
- `app/lib/services/products.service.ts`: `getAll()` is a client-side browser service used by `favoritos` + `regalos` indirectly. NOT directly in catalog-ui-strangle scope. Flagged as tech debt.
- `app/sitemap.ts`: keep dummyProducts as a safe build-time fallback for sitemap generation. Does not mask runtime errors.

RECOMMENDATION: Remove dummyProducts from `app/catalogo/page.tsx` only (in scope). Leave `products.service.ts` and `sitemap.ts` for separate tech-debt slices.

**Domain wiring gaps in CatalogClient**

CRITICAL GAPS — CatalogClient bypasses domain entirely:

1. Filtering logic: CatalogClient has inline `productMatchesCollections` + direct `Array.filter` on material, style, price. Domain `filterProducts(products, filters)` EXISTS but is NOT called. The mismatch: domain `CatalogFilter` is `{ material?: string }` (single) while CatalogClient `ActiveFilters` is `{ materials: string[] }` (multi). This explains why domain wasn't wired — type incompatibility.

2. Sorting logic: CatalogClient has inline `switch(sortOption)` sort. Domain `sortProducts(products, option)` EXISTS but is NOT called.

3. `ActiveFilters` type lives in `FilterSidebar.tsx` instead of domain. `emptyFilters` constant is also in FilterSidebar.

4. `parseFiltersFromParams` and `filtersToParams` are inline functions in CatalogClient. These are application-layer concerns (URL serialization/deserialization).

5. Price formatting in FilterSidebar: `.toLocaleString('es-CL')` inline for price display in placeholder/labels (minor — domain `formatPrice` exists and should be used here).

## Affected Areas

- `app/components/CatalogClient.tsx` — primary strangle target; extract container + presentational
- `app/components/FilterSidebar.tsx` — strangle target; relocate ActiveFilters type; split container/presentational
- `app/components/ProductCard.tsx` — extract useCartStore to make presentational; create shim; move to features/catalog/ui/
- `app/components/SearchResultsClient.tsx` — shares ProductCard; OUT OF SCOPE but affected by ProductCard move (needs shim)
- `app/components/FeaturedProducts.tsx` — shares ProductCard; affected by move
- `app/components/RelatedProducts.tsx` — shares ProductCard; affected by move
- `app/catalogo/page.tsx` — RSC data source; dummyProducts removal + swap to thin shell
- `app/colecciones/[slug]/page.tsx` — uses ProductCard directly; unaffected by strangle logic but affected by ProductCard move (shim needed)
- `app/[type]/page.tsx` — same as above
- `app/[type]/[material]/page.tsx` — same as above
- `app/amuletos/page.tsx` + `app/amuletos/[tag]/page.tsx` — same
- `app/favoritos/page.tsx` — same
- `app/regalos/page.tsx` — same
- `features/catalog/domain/catalog.types.ts` — needs ActiveFilters added / CatalogFilter updated for multi-select
- `features/catalog/application/` — new hook use-catalog-filters.ts
- `features/catalog/ui/` — NEW: atoms, molecules, organisms, containers
- `app/lib/data/dummy-products.ts` — catalog/page.tsx usage removed (but file stays for sitemap + products.service)

## Proposed features/catalog/ui/ Structure

```
features/catalog/ui/
  atoms/
    ProductCardImage.tsx + .test.tsx    (next/image wrapper with fallback)
    ActiveFilterChip.tsx + .test.tsx    (single removable filter chip)
    CatalogEmptyState.tsx + .test.tsx   (no-results + clear-filters CTA)
    SortDropdown.tsx + .test.tsx        (controlled select, pure props)
    ViewModeToggle.tsx + .test.tsx      (grid-3/grid-4/list buttons)
    PaginationProgress.tsx + .test.tsx  (progress bar + sentinel trigger)
  molecules/
    ProductCard.tsx + .test.tsx         (moved from app/components; useCartStore EXTRACTED)
    ActiveFilterChips.tsx + .test.tsx   (row of chips + "clear all" button)
    FilterPriceRange.tsx + .test.tsx    (price min/max inputs + range slider)
    FilterSection.tsx + .test.tsx       (accordion section with checkboxes)
    CatalogControlsBar.tsx + .test.tsx  (count + ViewModeToggle + SortDropdown)
    LoadingMoreIndicator.tsx + .test.tsx (3 animated dots)
    AllProductsShown.tsx + .test.tsx    (end-of-catalog decorative message)
  organisms/
    ProductGrid.tsx + .test.tsx         (grid with stagger animation + sentinel + empty state)
    FilterSidebarPanel.tsx + .test.tsx  (presentational sidebar: price range + accordion sections)
    MobileFilterDrawer.tsx              (animated modal; NOT tested directly per cart-ui precedent)
    CatalogLayout.tsx + .test.tsx       (desktop sidebar + product grid two-column layout)
  containers/
    CatalogContainer.tsx + .test.tsx    (sole consumer of use-catalog-filters hook)
    index.ts
```

HOOK (application layer, not ui):
- `features/catalog/application/use-catalog-filters.ts` — owns: filters state, sortOption state, visibleCount, isLoadingMore, viewMode, isFilterOpen, parseFiltersFromParams, filtersToParams, syncURL, handleFiltersChange, handleSortChange, loadMore, trackViewItemList once-per-mount. Returns all state + handlers as props object.

DOMAIN ADDITIONS:
- `features/catalog/domain/catalog.types.ts`: add `ActiveFilters` type (rename from FilterSidebar, extend with multi-material/multi-style arrays). Also add `emptyFilters` constant. Update `CatalogFilter` if domain rules need to support array material/style OR keep as bridge in application layer.

SHIM:
- `app/components/ProductCard.tsx` → shim re-export from `@/features/catalog/ui/molecules/ProductCard`
- `app/components/FilterSidebar.tsx` → stays as is OR shim after strangle (low priority; no other consumers besides CatalogClient)

## Approaches

| Approach | Pros | Cons | Complexity |
|---|---|---|---|
| A: Full atomic split (recommended) | Mirrors cart-ui/checkout-ui pattern exactly; ProductGrid and FilterSidebar become reusable for future search/collection pages; domain gets properly wired; clean test surface | ProductCard blast-radius requires shim for 11 consumers | High |
| B: Container-only (minimal) | Faster: extract use-catalog-filters hook, wrap CatalogClient in thin container, leave FilterSidebar/ProductCard in place | Doesn't solve type location, domain gap, or ProductCard store violation; future debt | Medium |
| C: Incremental (ProductCard first) | Reduce blast radius risk first, then atomic decomp | Two PRs, slower, no domain wiring | Medium |

## Recommendation

**Approach A — Full atomic split**, delivered as chained PRs to stay within 400-line budget:

PR1: domain + application layer (type migration, use-catalog-filters hook, extend CatalogFilter for multi-select, move ActiveFilters to domain, wire filterProducts/sortProducts)
PR2: atoms + molecules (ProductCard extracted + shim, ActiveFilterChip, SortDropdown, ViewModeToggle, FilterPriceRange, FilterSection, CatalogControlsBar)
PR3: organisms + container swap + dummyProducts removal (ProductGrid, FilterSidebarPanel, MobileFilterDrawer, CatalogLayout, CatalogContainer, app/catalogo/page.tsx thin shell)

Each PR is independently reviewable with working tests. PR1 is prerequisite for PR2+3. PR2 and PR3 can be partially parallelized on a feature-branch-chain.

## Domain wiring gaps (complete list)

1. `CatalogClient` inline filtering bypasses `filterProducts` — TYPE MISMATCH root cause (multi vs single material/style)
2. `CatalogClient` inline sorting bypasses `sortProducts`
3. `ActiveFilters` type + `emptyFilters` exported from `app/components/FilterSidebar.tsx` instead of domain
4. `parseFiltersFromParams` + `filtersToParams` + `syncURL` are inline in CatalogClient (application layer, not domain)
5. `ProductCard` imports `useCartStore` directly — container violation in what should be a presentational atom
6. `FilterSidebar` uses `.toLocaleString('es-CL')` inline for price range labels instead of `formatPrice` from domain

## ProductCard blast-radius

11 consumers import `app/components/ProductCard` directly. Shim pattern (same as cart.store) is mandatory. The shim is a one-liner re-export at `app/components/ProductCard.tsx`. Consumer code changes: ZERO.

ProductCard accepts `Product` (transport type) not `CatalogProduct` (domain type) — it needs both `display_name` and hover image. The `CatalogProduct` type in domain is lean and missing these transport-only fields. Options:
- (a) Keep ProductCard accepting `Product` (transport) and wiring domain functions internally (current approach — OK for UI layer)
- (b) Extend CatalogProduct with display fields — over-engineering
RECOMMENDATION: (a), keep `product: Product` prop, domain functions (`formatPrice`, `calcDiscount`, `isInStock`) called internally.

## dummy-products removal scope

| File | Action | Impact |
|---|---|---|
| `app/catalogo/page.tsx` | REMOVE two dummyProducts branches | Empty catalog shows CatalogEmptyState; network errors surface via error boundary |
| `app/lib/services/products.service.ts` | DEFER (out of scope) | client-side browser service; separate tech-debt slice |
| `app/sitemap.ts` | KEEP (safe build-time fallback) | Does not mask runtime errors |

## Size estimate

- Lines changed: CatalogClient (500) + FilterSidebar (280) + ProductCard (155 + shim) + app/catalogo/page.tsx (~50 edits) + new files (~600-800 lines across atoms/molecules/organisms/container/hook) + tests (~400-500 lines RTL)
- Total estimated diff: ~2000-2500 lines changed/added
- 400-line budget risk: CRITICAL — strongly recommend chained PRs (3 PRs as above)

## Risks

- ActiveFilters vs CatalogFilter type mismatch: domain filterProducts accepts single material/style string but CatalogClient uses arrays. Domain must be updated carefully to avoid breaking catalog.rules.test.ts (currently tests single material/style). Tests must be extended for multi-select.
- ProductCard 11-consumer blast radius: shim is safe but must be verified in TypeScript compile (Product type, display_name, images fields all intact)
- FilterSidebar facet derivation: the `useMemo` that derives materialOptions/styleOptions/price range from products array. Decision: belongs in use-catalog-filters hook (application layer), not in presentational FilterSidebarPanel.
- MobileFilterDrawer animation: uses CSS animation (not motion/react) — testable directly, no motion mock needed.
- SearchResultsClient: uses ProductCard directly + shares sort dropdown concept. Out of scope but gets ProductCard shim for free.
- app/catalogo/page.tsx hero + breadcrumb + JSON-LD: stays in RSC page (NOT moved into container — these are RSC server concerns).
- No existing tests for CatalogClient or FilterSidebar — all new RTL tests are greenfield (precedent: cart-ui + checkout-ui pattern).
- Strict TDD active (pnpm test:run / Vitest jsdom): all new components need tests written before implementation.

## Open Questions (resolved in proposal)

OPEN QUESTION 1: Should `CatalogFilter` in domain be updated to support `materials: string[]` and `styles: string[]` (multi-select arrays), or should the application layer translate ActiveFilters → multiple single-filter domain calls? Recommendation: update domain type (arrays are more expressive, tests can be extended).

OPEN QUESTION 2: Should the MobileFilterDrawer be an organism or part of CatalogContainer? Recommendation: organism (pure presentational props for open/onClose/onApply), same reasoning as CartDrawerPanel precedent.

OPEN QUESTION 3: Does use-catalog-filters go in `features/catalog/application/` (like use-cart-drawer) or `features/catalog/ui/hooks/`? Recommendation: application layer (no JSX, pure state + URL logic), consistent with use-cart-drawer, use-checkout-form.
