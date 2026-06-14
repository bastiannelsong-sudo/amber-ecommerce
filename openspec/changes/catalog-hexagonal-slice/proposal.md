# Proposal: Catalog Hexagonal Slice (domain + port + 1 real consumer)

## Intent

Third architecture vertical-slice. Cart and checkout established `features/<ctx>/`
with domain + Zustand client-state. Catalog introduces the missing
**data-fetching dimension**: a `CatalogPort` interface, a BFF adapter, and React
Query for server state. Catalog also carries real duplication (es-CL `formatPrice`,
inline discount/sort/filter logic) and a dummy-products fallback that masks BFF
errors. This slice extracts the pure rules and wires ONE genuinely interactive
consumer through the port — no dead code, no big-bang strangle.

## Scope

### In Scope
- `features/catalog/domain/` (framework-free, TDD-first): `catalog.types.ts`
  (`CatalogProduct` lean, `CatalogQuery`, `CatalogFilter`, `SortOption`,
  `SearchSuggestions`), `catalog.rules.ts` (`filterProducts`, `sortProducts`
  price/name comparators, `formatPrice` es-CL, `calcDiscount`, `isInStock`,
  `matchesCollection`), `catalog.rules.test.ts`.
- `features/catalog/application/ports/CatalogPort.ts` — LEAN interface: only
  `fetchSuggestions(query): Promise<SearchSuggestions>` now (the chosen consumer's
  need). Grow in follow-ups.
- `features/catalog/application/catalog.mapper.ts` (+ test) — raw BFF DTO →
  domain `SearchSuggestions`.
- `features/catalog/infrastructure/bff-catalog.adapter.ts` — implements
  `CatalogPort` via `apiClient` → `/api/products/suggestions`.
- `features/catalog/application/use-product-suggestions.ts` — React Query hook
  wrapping the port (debounce via `query` key + `enabled`).
- WIRE `SearchModal` typeahead to the hook (replaces hand-rolled
  `useState/useEffect/setTimeout` + dummy-fallback `productsService.getSuggestions`).
- Wire `ProductCard` to domain `formatPrice` + `calcDiscount` (removes es-CL +
  discount duplication — real domain consumer).
- `features/catalog/index.ts` re-export shim.

### Out of Scope (backlog)
- `CatalogClient` 500-line strangle and container/presentational split.
- Converting RSC catalog pages to client React Query (RSC + `catalog-api.ts` untouched).
- `dummy-products` removal in `products.service.ts` (used by deferred strangle).
- `buscar/page.tsx` direct `INTERNAL_API_URL` fetch (separate SECURITY follow-up).
- Other catalog routes, facets, by-slug, by-id port methods.

## Capabilities

### New Capabilities
- `catalog`: pure catalog domain (filter/sort/price/discount/stock rules + lean
  types), `CatalogPort` contract, BFF adapter, and a React Query suggestions hook
  consumed by the search typeahead.

### Modified Capabilities
- None (cart/checkout specs unaffected; catalog has no prior spec).

## Approach

Mirror cart/checkout layering, add the port+adapter+React-Query dimension per
amber-front `OrdersPort` prior art adapted to the Next.js BFF reality:
- **Port** in `application/ports/` (contract); **adapter** in `infrastructure/`
  (implements via `apiClient`). Application/UI never import infrastructure.
- **Lean port**: define ONLY `fetchSuggestions` — the one method the consumer
  calls now. Avoid amber-front's fat-port shape until more consumers exist.
- **React Query** for the client consumer (provider already mounted, currently
  unused). RSC pages stay on `catalog-api.ts`.
- **Consumer = `SearchModal`**: inherently client (debounced typeahead, keyboard
  nav, router nav). React Query absorbs loading/stale/abort/cache that the
  component hand-rolls today. Lowest-risk, highest-fit wiring point. The
  `/api/products/suggestions` BFF route already exists.
- Domain never imports `app/lib/types.ts:Product`; `app/lib/types.ts` re-exports
  domain `SearchSuggestions` as a shim.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `features/catalog/domain/*` | New | types + pure rules + tests |
| `features/catalog/application/ports/CatalogPort.ts` | New | lean port interface |
| `features/catalog/application/catalog.mapper.ts` | New | DTO → domain (+ test) |
| `features/catalog/application/use-product-suggestions.ts` | New | React Query hook |
| `features/catalog/infrastructure/bff-catalog.adapter.ts` | New | apiClient adapter |
| `app/components/SearchModal.tsx` | Modified | use hook, drop manual debounce/service |
| `app/components/ProductCard.tsx` | Modified | use domain formatPrice + calcDiscount |
| `app/lib/types.ts` | Modified | re-export domain SearchSuggestions shim |

## Dead-Code-Avoidance Rationale

Every artifact has a live consumer in THIS slice: domain rules → SearchModal +
ProductCard; port + adapter + hook → SearchModal. The port stays single-method;
`fetchCatalog/fetchFacets/fetchProductBySlug` are deliberately NOT defined because
nothing calls them yet — they arrive with their consumers in later slices.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| React Query debounce behaves differently than 300ms setTimeout | Med | Keep DEBOUNCE_MS via debounced query key or `keepPreviousData`; assert in hook test |
| Removing dummy fallback in SearchModal surfaces empty state on BFF error | Med | Hook returns explicit error/empty; UI already has a no-results state |
| Mapper drift vs `SearchSuggestions` wire shape | Low | Mapper unit test pins the shape |
| ProductCard visual regression from formatPrice swap | Low | Pure function reproduces `Math.round(...).toLocaleString('es-CL')` exactly; covered by rules test |

## Rollback Plan

Revert is isolated: `features/catalog/` is additive. Restore `SearchModal` and
`ProductCard` from git; the shim in `app/lib/types.ts` is backward-compatible.
No data migration, no RSC/page changes to undo.

## PR Estimate

Lean scope is far smaller than the full-catalog 500-700 line / 4-PR forecast.
Estimated ~250-320 changed lines (domain+tests ~140, port+adapter+mapper+hook+tests
~120, two component wirings ~40-60). **Likely 1 PR**, under the 400-line budget.
Optional clean split if review prefers: PR1 domain+port+adapter+hook (no UI), PR2
component wiring — both autonomous and individually green.

## Dependencies

- React Query provider (already mounted in `ClientProviders.tsx`).
- `/api/products/suggestions` BFF route (exists).
- `apiClient` (exists).

## Success Criteria

- [ ] `features/catalog/domain` pure rules + types, TDD-first, all tests green.
- [ ] `CatalogPort` defines only `fetchSuggestions`; adapter implements it via BFF.
- [ ] `use-product-suggestions` hook unit-tested with a mocked port.
- [ ] `SearchModal` typeahead works via the hook; manual debounce/service removed.
- [ ] `ProductCard` uses domain `formatPrice` + `calcDiscount`; no visual change.
- [ ] Existing suite (358 on main) stays green; new units added.
