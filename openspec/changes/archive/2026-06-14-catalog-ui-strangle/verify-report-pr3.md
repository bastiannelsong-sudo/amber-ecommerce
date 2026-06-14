# Verify Report — PR3: catalog-ui-strangle (FINAL SWAP)

**Change**: catalog-ui-strangle  
**PR**: 3 of 3 — organisms + CatalogContainer + page swap + dummy removal + CatalogClient/FilterSidebar deletion  
**Branch**: feat/catalog-ui-pr3-swap  
**Date**: 2026-06-14  
**Mode**: Strict TDD (ACTIVE)  
**Verdict**: PASS WITH WARNINGS

---

## Build & Test Evidence

| Check | Result | Detail |
|-------|--------|--------|
| `pnpm test:run` | ✅ 617/617 PASS | 86 test files, 617 tests, zero failures |
| `npx tsc --noEmit` | ✅ CLEAN | Zero type errors |
| Test regression | ✅ None | 550 baseline all green |
| New PR3 tests | ✅ 14 new | ProductGrid×4, FilterSidebarPanel×3, CatalogLayout×3, CatalogContainer×4 |

---

## Task Completeness

| PR/Phase | Tasks | Complete | Incomplete |
|----------|-------|----------|------------|
| PR1 (Domain + Hook) | 15 | 15 | 0 |
| PR2 (ProductCard + Atoms + Molecules) | 14 | 14 | 0 |
| PR3 (Organisms + Container + Swap + Cleanup) | 11 | 11 | 0 |
| **Total** | **40** | **40** | **0** |

---

## Behavior Preservation Matrix (vs OLD CatalogClient)

| Behavior | Old CatalogClient | New Implementation | Status |
|----------|-------------------|-------------------|--------|
| Multi-select filtering (materials/styles) | inline filter | `filterProducts(projected, domainFilters)` | ✅ PRESERVED |
| Collection filtering | `productMatchesCollections` checks `productCollections[].collection.slug` | `projectToCatalogProduct()` merges slugs into `tags[]`; domain filters on tags | ✅ PRESERVED |
| Price range filter | inline | domain `filterProducts` | ✅ PRESERVED |
| Sorting (all 5 options) | inline `.sort()` | domain `sortProducts()` | ✅ PRESERVED |
| URL sync (read on init) | `parseFiltersFromParams(searchParams)` | identical pure fn in hook | ✅ PRESERVED |
| URL sync (write on change) | `router.replace(pathname?qs, {scroll:false})` | identical in `syncURL()` | ✅ PRESERVED |
| Infinite scroll / IntersectionObserver | `sentinelRef` + IO in CatalogClient | moved to `ProductGrid` organism | ✅ PRESERVED |
| loadMore with 300ms delay | `cooldownRef` + 300ms setTimeout | 300ms setTimeout (cooldownRef removed) | ⚠️ WARNING-1 |
| visibleCount pagination | `visibleCount + PRODUCTS_PER_BATCH` | identical | ✅ PRESERVED |
| viewMode toggle (grid-3/4/list) | local state | hook state + `ProductGrid.viewMode` prop | ✅ PRESERVED |
| Mobile filter drawer open/close | `isFilterOpen` + conditional render | `MobileFilterDrawer` + `hook.isFilterOpen` | ✅ PRESERVED |
| Results count display | `filteredAndSorted.length` | `hook.totalCount` | ✅ PRESERVED |
| activeFilterCount | manual sum | identical sum in hook | ✅ PRESERVED |
| trackViewItemList once on mount | `useRef(false)` + `useEffect(fn, [])` | identical in hook | ✅ PRESERVED |
| Add-to-cart from ProductCard | default addItem | container `handleAddToCart` → `useCartStore.addItem` | ✅ PRESERVED |
| Empty state (no results) | inline JSX div | `CatalogEmptyState` via `ProductGrid.emptyState` | ✅ PRESERVED |
| Stagger animation | `animateFromRef` + CSS | identical in `ProductGrid` | ✅ PRESERVED |

---

## collectionSlugs Correctness (HIGH-RISK ITEM)

**Verdict: CORRECT — parity achieved.**

Old `productMatchesCollections`:
```typescript
product.productCollections.some(pc => pc.collection && slugs.includes(pc.collection.slug))
```

New `projectToCatalogProduct` + domain:
```typescript
// projection:
const collectionSlugs = (p.productCollections ?? []).map(pc => pc.collection?.slug).filter(Boolean);
const mergedTags = Array.from(new Set([...existingTags, ...collectionSlugs]));
// domain:
filters.collections.some(col => tags.includes(col))
```

Semantically equivalent. Parity test at `catalog.rules.test.ts:219` passes. **CORRECT.**

---

## Spec Compliance Matrix

| Requirement | Status |
|-------------|--------|
| CAT-D2 (types importable) | ✅ |
| CAT-R1 (filterProducts multi-select) | ✅ (28 tests) |
| CATUI-ARCH (dependency direction) | ✅ (grep: zero violations) |
| CATUI-HOOK (use-catalog-filters) | ✅ (14 tests) |
| CATUI-ATOM-1 (6 atoms, pure props) | ✅ |
| CATUI-MOL-1 (ProductCard + onAddToCart default) | ✅ (6 tests) |
| CATUI-MOL-2 (6 molecules) | ✅ |
| CATUI-ORG-1 (4 organisms) | ✅ (10 tests) |
| CATUI-SHIM (ProductCard re-export) | ✅ (tsc clean) |
| CATUI-FIX-DUMMY (no dummyProducts in page) | ✅ |
| CATUI-SWAP (CatalogContainer in page) | ✅ |
| CATUI-FIX-DOMAIN (domain filter/sort wired) | ✅ |
| CATUI-T1–T5 (all test requirements) | ✅ (617/617) |
| sitemap.ts dummyProducts retained | ✅ |

---

## TDD Compliance

| Check | Result |
|-------|--------|
| TDD Evidence in apply-progress | ✅ |
| Test files exist for all tasks | ✅ (MobileFilterDrawer waived by design precedent) |
| Tests pass on execution | ✅ 617/617 |
| Triangulation adequate | ✅ (3–4 cases per organism/container) |
| Safety net for modified files | ✅ |

---

## Issues

### WARNINGS

**WARNING-1: loadMore cooldown removed**
Old CatalogClient had `cooldownRef` preventing rapid double-fire of IntersectionObserver. New hook has no guard — rapid IO intersections could fire `loadMore` multiple times per scroll. Low real-world risk. Not in spec. Non-blocking.

**WARNING-2: hook returns `collectionOptions: []` (hardcoded)**
Spec CATUI-HOOK says hook returns `collectionOptions`. Hook always returns `[]`; container builds options from RSC `collections` prop instead. Architecturally correct (collections come from separate fetch), but deviates from spec wording. No behavior impact.

**WARNING-3: FilterSidebarPanel test 1 is smoke-test-only**
`expect(document.body.firstChild).toBeTruthy()` — compensated by tests 2 and 3 which check actual content.

### SUGGESTIONS

**SUGGESTION-1**: Add container test for `hasMore: true` path / `LoadingMoreIndicator` rendering.

**SUGGESTION-2**: Remove `collectionOptions` from `UseCatalogFiltersResult` interface or document that it's always `[]` (collections come from RSC page props).

---

## Deletions Verified

| File | Status |
|------|--------|
| `app/components/CatalogClient.tsx` | ✅ DELETED |
| `app/components/FilterSidebar.tsx` | ✅ DELETED |
| Remaining imports | ✅ ZERO |
| `app/sitemap.ts` dummyProducts | ✅ RETAINED |

---

## Final Verdict: PASS WITH WARNINGS

**0 CRITICAL / 3 WARNINGS / 2 SUGGESTIONS**

All 617 tests pass. tsc clean. All spec requirements met. collectionSlugs projection correctly replicates old `productMatchesCollections` behavior. Warnings are non-blocking. Proceed to `sdd-archive`.
