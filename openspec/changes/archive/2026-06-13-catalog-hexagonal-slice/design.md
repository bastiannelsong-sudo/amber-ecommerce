# Design: Catalog Hexagonal Slice (data-fetching pattern-setter)

## Technical Approach

Third vertical slice. Establishes THE client data-fetching template: `domain ← application(ports + hooks + mapper) ← infrastructure(adapter)`. Mirrors cart/checkout layering, adds the port+adapter+React-Query dimension (amber-front `OrdersPort` prior art adapted to Next.js BFF). Domain is framework-free and TDD-first. The single live consumer (SearchModal typeahead) gets ONLY its fetch layer swapped; ProductCard swaps inline price/discount for domain functions at exact output parity.

## Contradictions found in code (vs proposal/explore)

| Claim | Reality | Impact |
|---|---|---|
| "SearchModal currently aborts" | NO AbortController; effect only `clearTimeout`s the 300ms timer | Port `signal?` is OPTIONAL; React Query supplies `signal` via `queryFn` ctx — net improvement, not a regression |
| `SearchSuggestions.collections` carries images | shape is `{name,slug}` only; products have `{name,slug,image_url,price}` | Mapper/types must NOT invent image on collections |
| `features/cart/index.ts` barrel shim | NO barrel; shim is per-file re-export (`app/lib/stores/cart.store.ts` → `export * from '@/features/cart/...'`) | Follow per-file shim; SKIP `features/catalog/index.ts` |
| min chars unspecified | hard-coded `length < 2` guard; `DEBOUNCE_MS = 300` | Reproduce: `enabled: q.length >= 2`, debounce 300ms |

## Architecture Decisions

### Decision: Layer layout & dependency direction
**Choice**: `domain/` (catalog.types.ts, catalog.rules.ts + test) — framework-free; `application/ports/CatalogPort.ts`, `application/catalog.mapper.ts` (+test), `application/use-search-suggestions.ts`; `infrastructure/bff-catalog.adapter.ts`. Direction: domain ← application(ports) ← infrastructure(adapter implements port); consumer ← application(hook).
**Alternatives**: port in infrastructure (rejected — ports are application contracts); skip port + direct useQuery (rejected — breaks "application never imports infrastructure", untestable).
**Rationale**: matches cart/checkout + amber-front; adapter swappable; hook testable via mocked port.

### Decision: CatalogPort interface (lean)
**Choice**: single method, threading optional signal:
```ts
export interface CatalogPort {
  fetchSuggestions(query: string, signal?: AbortSignal): Promise<SearchSuggestions>;
}
```
**Alternatives**: fat port (fetchCatalog/fetchFacets/bySlug) rejected — no caller yet (dead code); drop `signal` rejected — `apiClient.get` already accepts `signal`, React Query passes one for free.
**Rationale**: one method per live consumer; `signal` future-proofs cancellation at zero cost.

### Decision: Adapter — error contract, no dummy fallback
**Choice**: `bffCatalogAdapter` implements `CatalogPort` via `apiClient.get('/products/suggestions', { params:{q:query}, signal })`, maps through `catalog.mapper`, and THROWS on error (no `{products:[],collections:[]}` fallback).
**Alternatives**: keep dummy/empty fallback (rejected — masks BFF errors; React Query needs a thrown error to populate `isError`).
**Rationale**: surfaces real failures; existing no-results UI already covers the genuine empty case.

### Decision: React Query hook contract
**Choice**: `use-search-suggestions.ts` debounces the query into a key, then `useQuery`:
```ts
queryKey: ['catalog','suggestions', debouncedQ]
queryFn: ({ signal }) => catalogPort.fetchSuggestions(debouncedQ, signal)
enabled: debouncedQ.length >= MIN_QUERY_LENGTH   // 2
placeholderData: keepPreviousData                 // v5 idiom, smooth UX
staleTime: 60_000
```
Debounce: `useState(query)` + `setTimeout(300)` → `debouncedQ` (reproduces current 300ms). Returns `{ suggestions, isLoading, isError, isEmpty }` where `isEmpty = !!data && data.products.length===0 && data.collections.length===0`.
**Alternatives**: debounce inside queryFn (rejected — fires query per keystroke); `keepPreviousData:true` v4 form (rejected — removed in v5).
**Rationale**: query key carries debounce; React Query owns loading/stale/cancel/cache the component hand-rolls today.

### Decision: Composition root / DI
**Choice**: module-singleton default export. `bff-catalog.adapter.ts` exports `export const bffCatalogAdapter: CatalogPort`; the hook imports it directly. No prop injection into SearchModal.
**Alternatives**: prop-inject port through SearchModal (rejected — leaks wiring into UI, broader change); React context provider (rejected — overkill for one consumer).
**Rationale**: matches cart store shim pragmatism; testable via `vi.mock('../infrastructure/bff-catalog.adapter')`. THIS sets the DI default for future data-fetching slices.

### Decision: SearchModal integration (hard boundary)
**Choice**: replace ONLY the fetch effect. Delete the `productsService` import, the `isLoading`/`suggestions` `useState`, and the debounced `useEffect` (lines ~57-59, 121-138). Add `const { suggestions, isLoading } = useSearchSuggestions(query)`. KEEP keyboard nav, selection, recent searches, rendering, no-results UI verbatim.
**Alternatives**: broader container/presentational split (rejected — out of scope).
**Rationale**: lowest-risk wiring; the hook's `suggestions` is `SearchSuggestions | undefined` — keep the existing `suggestions ?? null`-style guards (`suggestions?.products`).

### Decision: ProductCard domain swap (output parity)
**Choice**: import `formatPrice`, `calcDiscount` from domain. `formatPrice(price)` returns `Math.round(Number(price) || 0).toLocaleString('es-CL')`; `calcDiscount(price, compareAt)` returns the `Math.round((1 - p/c)*100)` integer. Replace inline expressions ONLY.
**Rationale**: exact parity guaranteed by reproducing the existing formulas; rules test pins them. SearchModal's inline `$...toLocaleString('es-CL')` on suggestion rows MAY also adopt `formatPrice` (same parity) but is optional.

## Data Flow

    keystroke → SearchModal(query)
        │
        ▼
    use-search-suggestions ──debounce300──▶ useQuery(key=['catalog','suggestions',q], enabled q>=2)
        │                                        │ queryFn({signal})
        │                                        ▼
        │                              bffCatalogAdapter.fetchSuggestions(q, signal)
        │                                        │ apiClient.get(/products/suggestions)
        │                                        ▼   → catalog.mapper → SearchSuggestions (throws on error)
        ▼
    { suggestions, isLoading, isError, isEmpty } → existing render + keyboard nav

## File Changes

| File | Action | Description |
|---|---|---|
| `features/catalog/domain/catalog.types.ts` | Create | `SearchSuggestions` (canonical lean shape), re-used by hook/mapper |
| `features/catalog/domain/catalog.rules.ts` | Create | `formatPrice`, `calcDiscount` (+ later filter/sort) |
| `features/catalog/domain/catalog.rules.test.ts` | Create | TDD-first pure tests, es-CL + discount parity |
| `features/catalog/application/ports/CatalogPort.ts` | Create | lean interface (one method, optional signal) |
| `features/catalog/application/catalog.mapper.ts` | Create | raw BFF DTO → domain `SearchSuggestions` |
| `features/catalog/application/catalog.mapper.test.ts` | Create | pins wire shape (collections have no image_url) |
| `features/catalog/application/use-search-suggestions.ts` | Create | React Query hook + debounce |
| `features/catalog/infrastructure/bff-catalog.adapter.ts` | Create | module-singleton `bffCatalogAdapter` |
| `app/components/SearchModal.tsx` | Modify | swap fetch layer only |
| `app/components/ProductCard.tsx` | Modify | domain `formatPrice`/`calcDiscount` |
| `app/lib/types.ts` | Modify | re-export domain `SearchSuggestions` shim (per-file pattern) |

No `features/catalog/index.ts` (no barrel precedent). No change to `products.service.ts` (deferred strangle owns dummy removal).

## Interfaces / Contracts

```ts
// domain/catalog.types.ts — canonical, app/lib/types.ts re-exports this
export interface SearchSuggestions {
  products: { name: string; slug: string; image_url: string; price: number }[];
  collections: { name: string; slug: string }[];
}
// hook return
interface UseSearchSuggestionsResult {
  suggestions: SearchSuggestions | undefined;
  isLoading: boolean; isError: boolean; isEmpty: boolean;
}
```

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Unit (domain) | formatPrice/calcDiscount parity | Vitest pure; assert `49990 → "49.990"`, discount integer |
| Unit (mapper) | DTO → SearchSuggestions; no invented collection image | Vitest pure |
| Unit (adapter) | calls `/products/suggestions`, passes signal, throws on error | `vi.mock('@/app/lib/api-client')` |
| Unit (hook) | enabled<2 no fetch; debounce; isEmpty/isError; mocked port | `renderHook` (@testing-library/react v16) + `QueryClientProvider` wrapper with `retry:false`; `vi.mock` adapter. FIRST hook test in repo — set this precedent (vitest, jsdom, globals already configured) |

`server-only` NOT involved (pure client path via BFF). Existing suite (~358) stays green.

## Migration / Rollout
No migration. `features/catalog/` is additive; `app/lib/types.ts` shim is backward-compatible. Rollback = restore SearchModal/ProductCard from git.

## Open Questions
- [ ] Adopt `formatPrice` for SearchModal suggestion-row price too? (parity-safe, optional — defer to tasks)
