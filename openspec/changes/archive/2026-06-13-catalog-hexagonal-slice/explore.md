# Exploration: catalog-hexagonal-slice

### Executive Summary
The catalog is the broadest vertical in amber-ecommerce — 7 routes, two data paths (RSC server fetch + client-side productsService), a fat monolithic CatalogClient component, and a dummy-products fallback that leaks into production. The recommended approach introduces `features/catalog/` with a domain (pure filter/sort/price rules), application (CatalogPort interface + React Query hooks), and infrastructure (BFF fetch adapter), following the established cart/checkout pattern but adding the new port + React Query server-state dimension.

---

### Current State

#### Routes / Pages

| Route | RSC/Client | Data Source |
|---|---|---|
| `app/catalogo/page.tsx` | RSC (async) | `fetchCatalog()` from `catalog-api.ts` (server-only) |
| `app/buscar/page.tsx` | RSC (async) | Direct `fetch()` to `INTERNAL_API_URL` (bypasses BFF) |
| `app/colecciones/[slug]/page.tsx` | RSC (async) | Direct `fetch()` to `INTERNAL_API_URL` |
| `app/amuletos/[tag]/page.tsx` | RSC (async) | `fetchCatalog()` from `catalog-api.ts` |
| `app/[type]/page.tsx` | RSC (async) | `fetchCatalog()` from `catalog-api.ts` |
| `app/[type]/[material]/page.tsx` | RSC (async) | `fetchCatalog()` from `catalog-api.ts` |
| `app/colecciones/page.tsx` | RSC (async) | Direct `fetch()` to `INTERNAL_API_URL` |

#### Data Fetching — Two Disconnected Paths

**Path A: RSC server fetchers (catalog-api.ts)**
- File: `app/lib/catalog-api.ts` — marked `import 'server-only'`
- Functions: `fetchCatalog(filters, revalidate)`, `fetchFacets()`, `fetchProductBySlug()`, `fetchReviewSummary()`
- Calls `INTERNAL_API_URL` directly (private backend, subnet AWS)
- Returns `CatalogResponse { data: Product[], total, page, limit }`
- Has own interfaces: `CatalogFilters`, `CatalogResponse`, `FacetsResponse`, `FacetBucket`, `ReviewSummary`

**Path B: Client-side productsService (browser)**
- File: `app/lib/services/products.service.ts`
- Uses `apiClient` (fetch to `/api/products/*` BFF routes)
- Contains: `getAll()`, `getById()`, `getBySlug()`, `search()`, `getSuggestions()`, `getByCategory()`, `getFeatured()`, `sortByPrice()`, `filterByPriceRange()`
- **CONFIRMED dummy fallback**: ALL methods fall back to `dummyProducts` / `getDummyProductById` on error
- **Domain logic leaking**: `sortByPrice()` and `filterByPriceRange()` are pure functions sitting inside a service object

**Path C: CatalogClient (client component)**
- File: `app/components/CatalogClient.tsx` — `'use client'`
- Receives products pre-fetched by RSC, handles: filter state, sort state, infinite scroll (IntersectionObserver), URL sync, view mode, analytics
- Contains: `parseFiltersFromParams()`, `filtersToParams()`, `productMatchesCollections()`, inline sort/filter logic in `useMemo`
- 500 lines — fat monolith mixing container + presentational

**React Query: UNUSED for catalog**
- `QueryClientProvider` exists in `ClientProviders.tsx` but zero `useQuery` calls found for catalog/products
- Provider is there only to support future usage (was presumably added during cart/checkout work)

#### BFF Routes for Products

| Route Handler | Backend Endpoint |
|---|---|
| `app/api/products/catalog/route.ts` | `proxyToBackend(req, '/products/catalog')` |
| `app/api/products/search/route.ts` | `proxyToBackend(req, '/products/ecommerce/search')` |
| `app/api/products/by-slug/[slug]/route.ts` | `proxyToBackend(req, '/products/by-slug/:slug')` |
| `app/api/products/[id]/route.ts` | `proxyToBackend(req, '/products/:id')` |
| `app/api/products/suggestions/route.ts` | `proxyToBackend(req, '/products/suggestions')` |
| `app/api/products/route.ts` | (likely getAll proxy) |

#### Types (app/lib/types.ts)
- `Product` — 20+ fields, fat transport type
- `Collection`, `ProductCollectionRelation`
- `PaginatedResponse<T>`, `SearchResponse extends PaginatedResponse<Product>`
- `SearchSuggestions`

#### Filter/Sort Types (scattered)
- `ActiveFilters` — defined in `FilterSidebar.tsx` (co-located with UI, should move to domain)
- `CatalogFilters` — defined in `catalog-api.ts` (server-only file, leaks backend params into domain concept)
- `SortOption = 'newest' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc'` — inline in `CatalogClient`
- URL sort keys need mapping to backend sort values (`URL_SORT_TO_BACKEND` in `catalogo/page.tsx`)

#### Components

| Component | File | Nature |
|---|---|---|
| `CatalogClient` | `app/components/CatalogClient.tsx` | 'use client' — fat container (500 lines) |
| `FilterSidebar` | `app/components/FilterSidebar.tsx` | 'use client' — mixed (state + UI) |
| `ProductCard` | `app/components/ProductCard.tsx` | 'use client' — mixed (cart interaction + display) |
| `SearchResultsClient` | `app/components/SearchResultsClient.tsx` | 'use client' — search results container |

#### Existing Tests
- ZERO catalog-specific unit tests in `features/` or `app/`
- The `app/api/products/` route handlers have no test files (unlike auth routes which are well tested)

---

### Domain Rules to Extract (pure, framework-free)

1. **Filter matching** — `productMatchesCollections(product, slugs)`, material filter, style filter, price range filter. Currently inline in CatalogClient.useMemo.
2. **Sort comparators** — price asc/desc, name asc/desc, newest. Currently inline sort switch in CatalogClient.useMemo.
3. **Price formatting** — `price.toLocaleString('es-CL')` pattern repeated across ProductCard, FilterSidebar, CatalogClient. Should be a domain utility.
4. **URL param parsing** — `parseFiltersFromParams()`, `filtersToParams()` — currently in CatalogClient, are stateless pure functions.
5. **Sort option mapping** — `URL_SORT_TO_BACKEND` mapping — currently in catalogo/page.tsx, should be domain.
6. **Availability logic** — `stock > 0` checks for display/actions — scattered across ProductCard.
7. **Discount calculation** — `discountPercent = Math.round((1 - price/compare_at_price) * 100)` — in ProductCard.
8. **Domain types** — `CatalogQuery` (clean query intent, not backend params), `CatalogSortOption`, `CatalogFilter`, `ProductAvailability`, `CatalogProduct` (lean view model).

---

### The PORT Design — Options

The fundamental question: catalog introduces server state (products from the backend). Cart/checkout used Zustand for client state only. Catalog needs React Query (or RSC) to manage server state in a hexagonal-friendly way.

**amber-front prior art pattern (OrdersPort)**:
- Interface in `application/ports/OrdersPort.ts` — methods returning Promises of domain types
- Adapter in `infrastructure/` — implements the port using axios
- Hooks in `ui/` — call use cases which depend on ports (injected via composition root)
- React Query wraps the adapter calls inside hooks
- Port is testable: mock the interface, test the hook in isolation

**amber-ecommerce reality**:
- No `src/` layer — it's Next.js App Router with RSC + BFF
- Browser cannot hit backend directly (private VPC)
- Two contexts: RSC (can hit backend directly via catalog-api.ts) and Client (must go through BFF → /api/products/*)
- React Query provider already exists but is unused for catalog

#### Option A: Port in Application, BFF Adapter in Application (recommended)

```
features/catalog/
  domain/
    catalog.types.ts        — CatalogProduct (lean), CatalogQuery, CatalogFilter, CatalogSortOption, CatalogPage
    catalog.rules.ts        — filterProducts(), sortProducts(), formatPrice(), matchesCollection(), calcDiscount()
    catalog.rules.test.ts   — TDD-first unit tests
  application/
    ports/
      CatalogPort.ts        — interface: fetchCatalog(query), fetchFacets(), fetchProductBySlug(slug)
    catalog.mapper.ts       — Product → CatalogProduct (lean view model), CatalogFilters → CatalogQuery
    catalog.mapper.test.ts  — mapper unit tests
    use-catalog.ts          — useQuery wrapping CatalogPort (client-side via BFF adapter)
    use-search.ts           — useQuery for search (client-side)
    use-product.ts          — useQuery for single product (client-side, for product detail page)
  infrastructure/
    bff-catalog.adapter.ts  — implements CatalogPort using apiClient → /api/products/*
  index.ts                  — re-export shim
```

Port placement: `features/catalog/application/ports/CatalogPort.ts` (NOT infrastructure — ports are application contracts).
Adapter: `features/catalog/infrastructure/bff-catalog.adapter.ts` (adapters implement ports, live in infrastructure).

RSC usage: RSC pages keep calling `catalog-api.ts` (server-only fetches) for initial data. The port/adapter is for CLIENT hydration and interactive updates via React Query.

**Pros**: Clean separation; adapter is swappable; hooks testable with mocked port; follows amber-front pattern adapted to Next.js BFF reality; port = interface, adapter = fetch implementation.
**Cons**: Dual fetch paths (RSC uses catalog-api.ts, client uses port adapter); risk of drift between two implementations.
**Effort**: Medium. Port interface is straightforward; most complexity is in moving domain logic and wiring useQuery.

#### Option B: Skip Port, Direct useQuery Hooks (minimal)

No formal port interface. Just React Query hooks in `features/catalog/application/` that call `apiClient` directly.

**Pros**: Less boilerplate; faster to implement; simpler mental model.
**Cons**: Not hexagonal — breaks the "application never imports infrastructure" rule; untestable without mocking fetch; contradicts the pattern established in cart/checkout and amber-front.
**Effort**: Low.

#### Option C: RSC-only, No React Query

Keep all data fetching in RSC. Move domain logic to `features/catalog/domain/`. No port, no adapter, no React Query.

**Pros**: Eliminates client-side complexity; best for SEO (no hydration gap); consistent with how all catalog pages work today.
**Cons**: Loses interactive filter updates without page reloads; CatalogClient's filter state would need to trigger full navigations; worse UX for the faceted filter experience; can't cache search suggestions client-side.
**Effort**: Low — but wrong for interactive catalog features.

#### Option D: Hybrid — RSC for initial fetch, React Query for client hydration (recommended variant of A)

RSC fetches initial product list; CatalogClient rehydrates with React Query using the prefetched data as initial state. Port/adapter used only for client interactions (sort change, filter change, load more).

**Pros**: Best of both worlds — fast initial render from RSC, interactive updates via React Query; aligns with Next.js recommended pattern for App Router + React Query.
**Cons**: Requires careful initial data wiring (initialData / dehydrate pattern or direct prop passing as today).
**Effort**: Medium-High.

---

### Recommendation

**Option A with Hybrid RSC + React Query = Option D**

Specifically:
1. `features/catalog/domain/` — extract ALL pure rules and types (zero framework, fully testable with Vitest).
2. `features/catalog/application/ports/CatalogPort.ts` — interface with `fetchCatalog`, `fetchSearch`, `fetchFacets`, `fetchProductBySlug` returning Promises of domain types (not raw `Product`).
3. `features/catalog/infrastructure/bff-catalog.adapter.ts` — implements CatalogPort using `apiClient` → BFF routes.
4. `features/catalog/application/` hooks — `useCatalog`, `useSearch`, `useProductSuggestions` wrapping CatalogPort via React Query.
5. RSC pages keep `catalog-api.ts` for initial server-side fetch (no change needed immediately). The port/adapter serves client interactions.
6. `catalog-api.ts` becomes a secondary concern — either replace with a server-side port+adapter in a future slice, or leave as-is (server-only concern, not in the hexagonal boundary of the client feature).
7. `CatalogClient` gets split into container (`CatalogContainer` using the hooks) + presentational (`ProductGrid`, `FilterPanel`, `SortBar`). BUT container-presentational split of CatalogClient is HIGH risk / HIGH effort and should be deferred to a follow-up slice.

**Port naming**: `CatalogPort` (not `ProductsPort`) — catalog is the bounded context.
**View model**: `CatalogProduct` — lean type (product_id, name, price, compare_at_price, image_url, slug, stock, material, style, tags, category.name). Domain never imports `Product`.
**Mapper**: `Product → CatalogProduct` in `features/catalog/application/catalog.mapper.ts`.

---

### Open Questions (for Design phase)

1. **Scope of UI split**: Should container-presentational refactor of `CatalogClient` (500 lines) be IN-SCOPE for this slice or deferred? Recommendation: DEFER — UI split is a separate risk with high file count. Focus this slice on domain + port + adapter + hooks. Flag as CATALOG-UI follow-up.

2. **dummy-products removal**: `products.service.ts` has fallbacks to `dummyProducts` in EVERY method. Should this slice remove the dummy fallback? Recommendation: YES for catalog-related methods (getAll, getBySlug, search) — the dummy fallback masks real BFF errors and makes error states invisible. Removal is clean and forces correct error surface. But requires design confirmation.

3. **catalog-api.ts fate**: Does this slice migrate `catalog-api.ts` into the feature slice (as a server-side adapter), or leave it in place and only add a client-side port/adapter? Recommendation: LEAVE catalog-api.ts in place for now (it's server-only, RSC uses it, no consumer issues). The port pattern is for the CLIENT dimension only in this slice.

4. **React Query vs RSC for interactive filters**: Does `CatalogClient` switch to `useCatalog()` hook (calling port adapter) when filters change, or does it continue to receive pre-fetched data and filter client-side? Current behavior: all filtering is CLIENT-SIDE (500 products fetched at once, filtered in JS). Recommended: keep current approach for this slice (avoid RSC navigation on filter). Port/adapter wires up for search-as-you-type and product detail loading.

5. **Port granularity**: One `CatalogPort` (fat port, like amber-front's `OrdersPort`) or multiple thin ports (`ProductFetchPort`, `SearchPort`)? Recommendation: one `CatalogPort` per amber-front pattern — simpler composition root.

6. **CatalogProduct type location**: Should `CatalogProduct` live in `features/catalog/domain/catalog.types.ts` (replacing or supplementing `app/lib/types.ts:Product`)? Yes — domain owns its lean type. `app/lib/types.ts` re-exports `CatalogProduct` as a shim, same pattern as `CartItem`.

---

### Strangler / PR Chain Estimate

This change touches 7 catalog routes (pages) + 4+ component files + new `features/catalog/` structure. Estimated changed lines: **500-700+** (domain + port + adapter + hooks + mapper + shims + tests).

**Chained PRs recommended: YES**
**400-line budget risk: High**
**Decision needed before apply: Yes**

Suggested chain:
- **PR 1 (feat/catalog-domain)**: `features/catalog/domain/` — types, rules, mapper. TDD first. Zero UI changes. ~150 lines.
- **PR 2 (feat/catalog-port-adapter)**: Port interface + BFF adapter + React Query hooks. Wire shims. ~200 lines.
- **PR 3 (feat/catalog-wire-pages)**: Wire hooks into CatalogClient and search. Replace productsService dummy fallbacks. ~200 lines + tests.
- **PR 4 (feat/catalog-ui-split)** [DEFERRED]: Container-presentational split of CatalogClient. Out of scope for this change.

---

### Affected Files

**New (to create)**:
- `features/catalog/domain/catalog.types.ts`
- `features/catalog/domain/catalog.rules.ts`
- `features/catalog/domain/catalog.rules.test.ts`
- `features/catalog/application/ports/CatalogPort.ts`
- `features/catalog/application/catalog.mapper.ts`
- `features/catalog/application/catalog.mapper.test.ts`
- `features/catalog/application/use-catalog.ts`
- `features/catalog/application/use-search.ts`
- `features/catalog/application/use-product.ts`
- `features/catalog/infrastructure/bff-catalog.adapter.ts`
- `features/catalog/index.ts`

**Modified**:
- `app/lib/types.ts` — re-export shim for `CatalogProduct`
- `app/components/FilterSidebar.tsx` — import `ActiveFilters` from domain, not self-defined
- `app/components/CatalogClient.tsx` — use domain rules, import `CatalogFilter`/`SortOption` from domain
- `app/lib/services/products.service.ts` — remove dummy fallbacks, use port adapter

**Untouched (this slice)**:
- `app/lib/catalog-api.ts` — server-only, RSC keeps using it
- All catalog RSC pages (`app/catalogo/`, `app/buscar/`, etc.) — keep existing RSC fetch approach
- `app/components/ProductCard.tsx` — price formatting will be importable from domain but ProductCard itself unchanged in this slice

---

### Risks

1. **Dual fetch path drift**: RSC pages use `catalog-api.ts` while client hooks use the BFF adapter. If the backend changes its response shape, both paths must be updated.
2. **React Query + RSC initial data wiring**: If we want React Query to reuse RSC-fetched data as `initialData`, it requires dehydrate/hydrate pattern (`dehydrate(queryClient)` in RSC, `HydrationBoundary` in client). This is non-trivial and should be explicit in design.
3. **CatalogClient complexity**: At 500 lines, splitting it is risky. Deferring UI split is correct but means technical debt lingers.
4. **dummy-products removal**: Removing fallbacks means any BFF/backend error surfaces as empty state. Need proper error handling in the adapter.
5. **`buscar/page.tsx` uses direct `INTERNAL_API_URL` fetch** — bypasses BFF. This is a security/consistency concern but out of scope for this slice.

---

### Ready for Proposal
Yes — codebase is well-understood. The pattern is clear (follow cart/checkout + amber-front port). Key design decision (port placement, RSC vs React Query split, UI scope) is surfaced as open questions for the proposal phase.

> Note: The propose phase NARROWED the explore recommendation to a lean
> "domain + port + 1 real consumer" slice. The full multi-PR strangle above is
> the broader vision; see `proposal.md` for the locked, dead-code-free scope.
