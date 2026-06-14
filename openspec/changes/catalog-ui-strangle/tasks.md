# Tasks: Catalog UI Strangle (CatalogClient → features/catalog/ui/)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~2,000–2,500 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1 (domain + hook) → PR2 (ProductCard + atoms + molecules) → PR3 (organisms + container + swap) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain multi-select migration + collectionSlugs parity + use-catalog-filters hook | PR1 | Base: main. ~500–650 lines. Independently green. |
| 2 | ProductCard move + shim + 6 atoms + 6 molecules + RTL tests | PR2 | Base: PR1 branch. ~700–850 lines. Dead-code window until PR3 lands. size:exception candidate if tests are heavy. |
| 3 | 4 organisms + CatalogContainer + page swap + dummy removal + delete CatalogClient/FilterSidebar | PR3 | Base: PR2 branch. ~600–800 lines. Final integration. |

---

## PR1 — Domain Multi-Select Migration + Hook

### Phase 1.1 — Domain Types (ref: CAT-D2)

- [x] 1.1.1 RED: add failing test to `catalog.rules.test.ts` for multi-material array filter (CATUI-T1)
- [x] 1.1.2 GREEN: extend `CatalogFilter` in `features/catalog/domain/catalog.types.ts` — add `materials?: string[]`, `styles?: string[]`; keep `material?`/`style?` single strings for back-compat
- [x] 1.1.3 Add `ActiveFilters` type and `emptyFilters` constant to `catalog.types.ts`; remove them from `app/components/FilterSidebar.tsx` (keep re-exports there temporarily until PR3 deletes the file)
- [x] 1.1.4 Export `SortOption`, `CatalogFilter`, `ActiveFilters`, `emptyFilters` from `features/catalog/index.ts`
- [x] 1.1.5 RED→GREEN: extend `filterProducts` in `features/catalog/domain/catalog.rules.ts` — add array branches for `materials` and `styles`; single-value and empty-array paths untouched (all 7 existing scenarios stay green)
- [x] 1.1.6 GREEN: add remaining multi-select test cases in `catalog.rules.test.ts`: multi-style, empty-array match-all, single-value back-compat; verify `pnpm test:run` exits 0

### Phase 1.2 — collectionSlugs Parity (HIGH-RISK CONTRADICTION lock)

- [x] 1.2.1 RED: write parity test in `catalog.rules.test.ts` that asserts `filterProducts` with a `collectionSlugs` projection produces identical results to the old inline `productMatchesCollections` logic (which checked `productCollections[].collection.slug`)
- [x] 1.2.2 Document in a code comment inside `filterProducts` that collection matching uses `CatalogProduct.tags` (string[]) and that the hook is responsible for projecting `Product.productCollections[].collection.slug` into a tag-equivalent `collectionSlugs` array before passing to domain

### Phase 1.3 — use-catalog-filters Hook (ref: CATUI-HOOK, CATUI-T2)

- [x] 1.3.1 Create `features/catalog/application/use-catalog-filters.ts` — owns `filters: ActiveFilters`, `sortOption: SortOption`, `visibleCount`, `isLoadingMore`, `viewMode`, `isFilterOpen`
- [x] 1.3.2 Add `parseFiltersFromParams(params: URLSearchParams): ActiveFilters` and `filtersToParams(f: ActiveFilters, sort: SortOption): URLSearchParams` pure utils in the same file (no DOM dependency)
- [x] 1.3.3 Wire URL sync: `useSearchParams` reads params on init → `parseFiltersFromParams`; handlers call `router.replace(filtersToParams(...), { scroll: false })`
- [x] 1.3.4 Wire `collectionSlugs` projection: for each `Product`, map `productCollections[].collection.slug` into a string array and merge into `CatalogProduct`-compatible shape before calling `filterProducts`
- [x] 1.3.5 Add facet derivation (memoized): `materialOptions`, `styleOptions`, `collectionOptions`, `minPrice`, `maxPrice` from the full products array
- [x] 1.3.6 Add `filteredAndSorted` via `filterProducts(withProjection, filters)` then `sortProducts(filtered, sortOption)`; add `visibleProducts` slice, `hasMore`, `progressPercent`, `activeFilterCount`
- [x] 1.3.7 Add `trackViewItemList` call in a `useEffect(fn, [])` (fires exactly once on mount)
- [x] 1.3.8 Return flat props object with all state + handlers: `onFiltersChange`, `onSortChange`, `onViewModeChange`, `setFilterOpen`, `loadMore`
- [x] 1.3.9 RED→GREEN: create `features/catalog/application/use-catalog-filters.test.ts` — mock `next/navigation` (`useSearchParams`, `useRouter`, `usePathname`); cover: filter change updates `visibleProducts` + `router.replace`, sort change reorders, `loadMore` increments count, facet derivation (unique materials), URL param init, `trackViewItemList` fires once; run `pnpm test:run` → exits 0

---

## PR2 — ProductCard + Atoms + Molecules

### Phase 2.1 — ProductCard Move + Shim (ref: CATUI-MOL-1, CATUI-SHIM, CATUI-T3)

- [x] 2.1.1 Create `features/catalog/ui/molecules/ProductCard.tsx` — signature `{ product: Product; hoverImage?: string; isNew?: boolean; onAddToCart?: (product: Product, qty: number) => void }`; `onAddToCart` defaults to `useCartStore().addItem`; use `formatPrice` and `calcDiscount` from domain; no raw `toLocaleString`
- [x] 2.1.2 Replace body of `app/components/ProductCard.tsx` with single re-export: `export { default } from '@/features/catalog/ui/molecules/ProductCard'` — 11 consumers untouched
- [x] 2.1.3 RED→GREEN: create `features/catalog/ui/molecules/ProductCard.test.tsx` — use RTL + jsdom; cover: renders product name+price, default `onAddToCart` invokes `useCartStore().addItem`, explicit `onAddToCart` spy overrides default and store NOT called, no-discount renders no badge; run `pnpm test:run` → exits 0

### Phase 2.2 — Atoms (ref: CATUI-ATOM-1, CATUI-T4)

Each atom: create file → RED test → GREEN → `pnpm test:run`.

- [x] 2.2.1 `features/catalog/ui/atoms/ProductCardImage.tsx` — props `{ src: string; alt: string; fallback?: string }`; wraps next/image; test: renders img with correct alt
- [x] 2.2.2 `features/catalog/ui/atoms/ActiveFilterChip.tsx` — props `{ label: string; onRemove: () => void }`; test: click fires `onRemove`
- [x] 2.2.3 `features/catalog/ui/atoms/CatalogEmptyState.tsx` — props `{ onClearFilters: () => void }`; test: click CTA fires `onClearFilters`
- [x] 2.2.4 `features/catalog/ui/atoms/SortDropdown.tsx` — props `{ value: SortOption; options: {value,label}[]; onChange: (v: SortOption) => void }`; test: onChange fires on select
- [x] 2.2.5 `features/catalog/ui/atoms/ViewModeToggle.tsx` — props `{ value: 'grid-3'|'grid-4'|'list'; onChange: (v) => void }`; test: click fires onChange
- [x] 2.2.6 `features/catalog/ui/atoms/PaginationProgress.tsx` — props `{ visible: number; total: number; onLoadMore: () => void }`; test: click fires `onLoadMore`
- [x] 2.2.7 Create `features/catalog/ui/atoms/index.ts` — barrel re-export all 6 atoms

### Phase 2.3 — Molecules (ref: CATUI-MOL-2, CATUI-T4)

Each molecule: create file → RED test → GREEN → `pnpm test:run`.

- [x] 2.3.1 `features/catalog/ui/molecules/ActiveFilterChips.tsx` — renders row of `ActiveFilterChip` atoms + "clear all" button; props `{ filters: ActiveFilters; onRemoveFilter: (key, val) => void; onClearAll: () => void }`; test: click "clear all" fires `onClearAll`
- [x] 2.3.2 `features/catalog/ui/molecules/FilterPriceRange.tsx` — min/max price inputs + slider; uses `formatPrice` for labels; pure props; test: renders `formatPrice(min)` and `formatPrice(max)` in DOM
- [x] 2.3.3 `features/catalog/ui/molecules/FilterSection.tsx` — accordion section with checkboxes for a single filter dimension; pure props; test: renders options, click checkbox fires onChange
- [x] 2.3.4 `features/catalog/ui/molecules/CatalogControlsBar.tsx` — product count label + `ViewModeToggle` + `SortDropdown`; pure props; test: renders count
- [x] 2.3.5 `features/catalog/ui/molecules/LoadingMoreIndicator.tsx` — three animated dots; pure presentational; test: renders without crash
- [x] 2.3.6 `features/catalog/ui/molecules/AllProductsShown.tsx` — end-of-catalog message; pure presentational; test: renders without crash
- [x] 2.3.7 Update `features/catalog/ui/molecules/index.ts` — barrel re-export all molecules including ProductCard

---

## PR3 — Organisms + Container + Swap + Cleanup

### Phase 3.1 — Organisms (ref: CATUI-ORG-1)

- [ ] 3.1.1 `features/catalog/ui/organisms/ProductGrid.tsx` — props `{ products: Product[]; onAddToCart: (p,qty)=>void; emptyState: ReactNode; onReachEnd: () => void }`; renders `ProductCard` per product; renders `emptyState` when products empty; mounts `IntersectionObserver` on sentinel for `onReachEnd` (stagger animation via CSS/inline); test: mock `vi.stubGlobal('IntersectionObserver', ...)`, assert empty renders emptyState, assert 2 products renders 2 cards (CATUI-ORG-1 scenarios)
- [ ] 3.1.2 `features/catalog/ui/organisms/FilterSidebarPanel.tsx` — pure props (filters, facets, handlers); composes `FilterSection` + `FilterPriceRange` + `ActiveFilterChips`; test: renders with required props without crash
- [ ] 3.1.3 `features/catalog/ui/organisms/MobileFilterDrawer.tsx` — props `{ isOpen: boolean; onClose: () => void; children: ReactNode }`; CSS animation only (no motion); NO dedicated unit test (exercised via CatalogContainer test per CartDrawerPanel precedent)
- [ ] 3.1.4 `features/catalog/ui/organisms/CatalogLayout.tsx` — two-column layout; props `{ sidebar: ReactNode; grid: ReactNode }`; test: renders both slots
- [ ] 3.1.5 Create `features/catalog/ui/organisms/index.ts` — barrel re-export all 4 organisms

### Phase 3.2 — CatalogContainer (ref: CATUI-ARCH, CATUI-SWAP, CATUI-FIX-DOMAIN)

- [ ] 3.2.1 Create `features/catalog/ui/containers/CatalogContainer.tsx` — imports `use-catalog-filters`; passes explicit `onAddToCart` (using `useCartStore().addItem`) to `ProductGrid`; composes `CatalogLayout` with `FilterSidebarPanel`, `CatalogControlsBar`, `ProductGrid`, `MobileFilterDrawer`; no inline filter/sort logic
- [ ] 3.2.2 Create `features/catalog/ui/containers/index.ts` — re-exports `CatalogContainer`
- [ ] 3.2.3 RED→GREEN: create `features/catalog/ui/containers/CatalogContainer.test.tsx` — mock `use-catalog-filters` return; mock `useCartStore`; mock `next/navigation`; assert: renders product count from hook, MobileFilterDrawer toggled by `setFilterOpen`, `onAddToCart` passed to grid calls `addItem`; run `pnpm test:run` → exits 0

### Phase 3.3 — Page Swap + Dummy Removal (ref: CATUI-SWAP, CATUI-FIX-DUMMY)

- [ ] 3.3.1 Edit `app/catalogo/page.tsx` — replace `CatalogClient` import+JSX with `CatalogContainer`; remove `dummyProducts` import and empty-check fallback; keep `try { ... } catch { return [] }` for network rejection safety; keep `Hero`, `Breadcrumb`, `JSON-LD`, `Suspense` unchanged
- [ ] 3.3.2 Verify `app/sitemap.ts` is NOT modified (still has `dummyProducts` build-time fallback)

### Phase 3.4 — Dead Code Deletion

- [ ] 3.4.1 Delete `app/components/CatalogClient.tsx`
- [ ] 3.4.2 Delete `app/components/FilterSidebar.tsx` (only CatalogClient consumed it; `ActiveFilters`/`emptyFilters` now live in domain)

### Phase 3.5 — Final Verification (ref: CATUI-T5)

- [ ] 3.5.1 Run `pnpm test:run` — all 550+ tests green (no regression)
- [ ] 3.5.2 Run `tsc --noEmit` — zero TypeScript errors; confirm all 11 `ProductCard` consumers compile via shim
- [ ] 3.5.3 Confirm `features/catalog/ui/atoms/`, `molecules/`, `organisms/` have zero imports from stores, hooks, or infrastructure (CATUI-ARCH)
- [ ] 3.5.4 Confirm `CatalogContainer.tsx` is the sole `use-catalog-filters` + `useCartStore` consumer inside `ui/`
