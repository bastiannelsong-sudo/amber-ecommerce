# Archive Report: catalog-hexagonal-slice

**Date**: 2026-06-13
**Change**: catalog-hexagonal-slice
**Status**: ARCHIVED — SDD cycle complete
**PR**: #37 (squash commit d3378ac, includes W-2/W-3/W-4 fixes cfd76c7+007be30)

---

## Executive Summary

The `catalog-hexagonal-slice` change has been successfully implemented, verified (PASS WITH WARNINGS, 0 critical), and archived. The slice ships the canonical client data-fetching pattern: domain + port + BFF adapter + React Query hook, consumed by SearchModal and ProductCard. First renderHook test precedent established.

---

## What Shipped

### Features
- **Catalog Domain** (`features/catalog/domain/`): Pure functions (filterProducts, sortProducts, formatPrice es-CL locked, calcDiscount, isInStock) + lean types (CatalogProduct, SortOption, CatalogFilter, SearchSuggestions)
- **Catalog Application**: CatalogPort interface (fetchSuggestions only), mapper (BFF DTO → domain SearchSuggestions), React Query hook (useSearchSuggestions, 300ms debounce, v5 keepPreviousData)
- **Catalog Infrastructure**: BffCatalogAdapter implementing CatalogPort, throws on error (no dummy fallback)
- **SearchModal Wiring**: Fetch layer swapped from hand-rolled useState/setTimeout to useSearchSuggestions hook; keyboard nav/render/no-results unchanged. formatPrice adopted in product row (W-4).
- **ProductCard Reuse**: formatPrice + calcDiscount from domain, replacing inline duplicates; exact parity.
- **Testing Precedent**: 23 domain TDD tests + 4 mapper + 5 adapter + 7 hook tests (renderHook with QueryClientProvider + fake timers pattern). First renderHook in repo.

### Artifacts
- 10 new files: catalog.types.ts, catalog.rules.ts/test.ts, CatalogPort.ts, catalog.mapper.ts/test.ts, bff-catalog.adapter.ts/test.ts, use-search-suggestions.ts/test.ts
- 3 modified: app/lib/types.ts (re-export shim), SearchModal.tsx (hook + W-2 fix + W-4 formatPrice), ProductCard.tsx (domain formatPrice/calcDiscount)
- 1 canonical spec: openspec/specs/catalog/spec.md (CAT-* requirements locked)

---

## Verification Results

**Verdict**: PASS WITH WARNINGS (0 critical)

### Build / Test
- `pnpm test:run`: 37 files, 397 tests, 0 failed — EXIT 0
- `npx tsc --noEmit`: 0 errors — EXIT 0
- All 358 pre-existing tests still passing

### Warnings (4) — All Resolved or Accepted

| Warning | Status | Details |
|---------|--------|---------|
| **W-1**: Module-singleton DI (application imports concrete adapter) | **ACCEPTED** | Design ADR-5 pragmatic for current scale. Future factory pattern `createUseX(port)` optional if multiple adapters emerge. |
| **W-2**: activeIndex cursor not reset when suggestions update | **FIXED** | Added `useEffect` in SearchModal triggered on suggestions change, calls `setActiveIndex(-1)`. Matches prior fetch-callback behavior. |
| **W-3**: Orphaned SearchSuggestion (singular) type export | **FIXED** | Removed unused type from catalog.types.ts (only SearchSuggestions plural used). Zero source imports verified. |
| **W-4**: Inline `Math.round(...).toLocaleString('es-CL')` in SearchModal product row | **FIXED** | Replaced with `formatPrice(product.price ?? 0)`. Added test case locking coalesced-to-zero output. |

### Suggestions (2)

1. **Document the vi.useFakeTimers + act + vi.runAllTimersAsync pattern** in testing-patterns doc (renderHook precedent)
2. **Update spec CAT-D2 text** to note SearchSuggestions shape was corrected by design during implementation

---

## PR Chain

**Mode**: Single PR (no chaining needed — ~320–390 changed lines, Medium budget risk)

**Commits**:
1. chore(sdd): add catalog-hexagonal-slice planning artifacts
2. feat(catalog): domain types, rules, and TDD test suite (Phase 1)
3. feat(catalog): CatalogPort contract + BFF suggestions mapper with TDD tests (Phase 2)
4. feat(catalog): BFF adapter implementing CatalogPort with throws-on-error (Phase 3)
5. feat(catalog): useSearchSuggestions hook with React Query v5 debounce and first renderHook precedent (Phase 4)
6. feat(catalog): wire SearchModal to domain hook, ProductCard to domain formatPrice/calcDiscount (Phase 5)
7. chore(sdd): mark all catalog-hexagonal-slice tasks complete
8. fix(catalog): resolve post-verify warnings W-2, W-3, W-4 [cfd76c7]
9. chore(sdd): mark W-2 W-3 W-4 fix tasks complete in catalog-hexagonal-slice [007be30]

---

## Pattern Established

This slice sets the **canonical client data-fetching pattern** for all future vertical slices:

```
Domain (pure, TDD)
    ↓ imports types only
Application (React hooks, port interface, mapper)
    ↓ implements port
Infrastructure (BFF adapter, apiClient call, throws on error)
```

**Module singleton DI** by default export is pragmatic. Test with `vi.mock()` + `renderHook(QueryClientProvider wrapper, retry:false)`. **First renderHook precedent**: fake timers init, `act()`-wrapped timer advance, `vi.runAllTimersAsync()` to flush RQ tick, `vi.useRealTimers()` before `waitFor()`.

---

## Deferred Backlog

| Item | Reason | Priority |
|------|--------|----------|
| CatalogPort methods beyond fetchSuggestions | No live consumer; grows with next slice | Medium |
| CatalogClient strangle (container-presentational split) | High risk; separate slice | Medium |
| RSC catalog pages → React Query | RSC fetch path unchanged | Low |
| dummy-products removal from products.service.ts | Deferred to strangle slice | Medium |
| buscar/page.tsx INTERNAL_API_URL bypass | Security follow-up | High |
| Other catalog routes (facets, by-slug, by-id) | No consumer yet | Low |

---

## Source-of-Truth Artifacts

### Engram IDs
- Proposal: #961 `sdd/catalog-hexagonal-slice/proposal`
- Spec: #963 `sdd/catalog-hexagonal-slice/spec`
- Design: #962 `sdd/catalog-hexagonal-slice/design`
- Tasks: #964 `sdd/catalog-hexagonal-slice/tasks`
- Apply Progress: #965 `sdd/catalog-hexagonal-slice/apply-progress`
- Verify Report: #967 `sdd/catalog-hexagonal-slice/verify-report`
- Archive Report: THIS FILE + Engram `sdd/catalog-hexagonal-slice/archive-report`

### Canonical Spec
- Location: `openspec/specs/catalog/spec.md`
- Domains: catalog-domain, catalog-application, catalog-infrastructure
- Requirements: CAT-D1 through CAT-T7 (domain types, port, adapter, hook, wiring, testing)

---

## Rollback Boundary

The change is fully additive:
- `features/catalog/` is new; remove it entirely to rollback
- `app/lib/types.ts` re-export: revert to inline SearchSuggestions definition
- `SearchModal.tsx`, `ProductCard.tsx`: restore from git (pre-change versions)
- No data migrations, no RSC changes, no database schema changes

---

## SDD Cycle Complete

✓ Proposal: Scope, approach, risks, rollback defined (#961)
✓ Spec: CAT-* requirements locked and shipped (#963)
✓ Design: Architecture decisions (domain ← app ← infra), ADRs, file layout (#962)
✓ Tasks: 21 tasks + 3 post-verify fixes, all complete (#964)
✓ Apply: Strict TDD (RED → GREEN), 9 commits, 397 tests green (#965)
✓ Verify: PASS WITH WARNINGS (0 critical), W-1/W-2/W-3/W-4 resolved (#967)
✓ Archive: Canonical spec synced, change folder ready to move, report filed (THIS)

---

## Next Change

The `catalog-hexagonal-slice` establishes the pattern. Future slices (CatalogClient strangle, BFF security, RSC migration, buscar security bypass) may reuse the domain-port-adapter-hook template with confidence. Deferred backlog items have clear scopes and rationales.

Ready for the next SDD change.
