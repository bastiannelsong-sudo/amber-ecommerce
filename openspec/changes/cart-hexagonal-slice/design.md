# Design: cart-hexagonal-slice (Pattern-Setter ADR)

## Technical Approach

First vertical slice of the Screaming + selective-hexagonal refactor (engram #867). Extract pure cart math/mutation rules into a framework-free `features/cart/domain/`, make the Zustand store a thin `features/cart/application/` adapter that delegates to domain, and move analytics side-effects to an application hook. The legacy store path becomes a one-line re-export shim so the 10 component consumers + checkout pages + existing test compile unchanged. Behavior is identical except the canonical free-shipping threshold fix (`>=`). This ADR is the template every future slice copies.

## Architecture Decisions

### Decision 1: features/ slice layout (THE template)

**Choice**: Repo-root `features/{name}/` with two layers now (`domain/`, `application/`); `ui/` reserved for a later slice.

| Layer | Allowed deps | Forbidden |
|-------|--------------|-----------|
| `domain/` | TS only, other domain files | React, Zustand, fetch, browser/window, analytics, `'use client'` |
| `application/` | domain, Zustand, React hooks, analytics | UI components / JSX |
| `ui/` (future) | application, design system | importing domain directly |

Dependency direction: `domain ← application ← ui`. File naming: `cart.types.ts`, `cart.constants.ts`, `cart.rules.ts`, `cart.rules.test.ts` (domain); `cart.store.ts`, `use-cart.ts`, `use-cart-summary.ts`, `cart.store.test.ts` (application).

**Alternatives**: (A) domain-only in `app/lib/cart/` — rejected: doesn't establish `features/` pattern #867 requires. (B) full hexagonal ports/adapters — rejected: Golden Hammer for a storefront BFF (#867).
**Rationale**: Establishes the seam where logic actually lives, minimal blast radius, strangler-friendly.

### Decision 2: Domain is pure, immutable, operates on CartItem[]

**Choice**: All rules are pure functions returning NEW arrays/values; `CartItem` shape moves to `cart.types.ts`. Signatures:

```ts
// cart.types.ts  (CartItem moves here; app/lib/types.ts re-exports it)
export interface CartItem { product: Product; quantity: number; selectedVariant?: { color: string; size?: string } }

// cart.rules.ts  (all pure, immutable)
addItem(items: CartItem[], product: Product, quantity?: number): CartItem[]   // default 1, merges by product_id
removeItem(items: CartItem[], productId: number): CartItem[]
setQuantity(items: CartItem[], productId: number, quantity: number): CartItem[] // qty <= 0 removes
lineTotal(item: CartItem): number                 // (product.price || 0) * quantity
subtotal(items: CartItem[]): number
qualifiesForFreeShipping(subtotal: number): boolean   // subtotal >= FREE_SHIPPING_THRESHOLD
shippingCost(subtotal: number): number                // free ? 0 : SHIPPING_COST
cartTotal(subtotal: number): number                   // subtotal + shippingCost(subtotal)
itemCount(items: CartItem[]): number                  // backs getItemCount
itemQuantity(items: CartItem[], productId: number): number
```

`Product` stays imported from `app/lib/types.ts` (not moved — it's a transport type, not cart domain).

**Alternatives**: keep math in store/components — rejected: that's the duplication being removed.
**Rationale**: Pure functions are TDD-first, Node-fast, mutation-testable; immutability matches existing Zustand `set` style.

### Decision 3: Store delegates to domain, SAME public API

**Choice**: Keep `CartStore` interface byte-identical (actions + `getTotal/getItemCount/getItemQuantity`). Each action becomes a domain call:

```ts
addItem: (product, quantity = 1) => set((s) => ({ items: addItem(s.items, product, quantity) }))
removeItem: (productId) => set((s) => ({ items: removeItem(s.items, productId) }))
updateQuantity: (productId, quantity) => set((s) => ({ items: setQuantity(s.items, productId, quantity) }))
getTotal: () => subtotal(get().items)
getItemCount: () => itemCount(get().items)
getItemQuantity: (id) => itemQuantity(get().items, id)
```

**Rationale**: No math inside store; 23 existing tests assert the same public behavior → pass unchanged.
**Note (contradiction vs proposal)**: proposal says rename actions to `setQuantity`; store action MUST stay `updateQuantity` (10 consumers + 4 tests call it). Domain fn is `setQuantity`; store action `updateQuantity` delegates to it. Renaming the store action is out of scope (breaks consumers).

### Decision 4: Store relocation + re-export shim

**Choice**: Canonical file → `features/cart/application/cart.store.ts`. Legacy `app/lib/stores/cart.store.ts` becomes:
```ts
export * from '@/features/cart/application/cart.store';
```
**Alias verification (highest-risk item — RESOLVED)**: `tsconfig.json` `@/* → ./*` (root) AND `vitest.config.mts` `@ → path.resolve(__dirname, '.')` (root). Identical. `@/features/cart/...` resolves in Next runtime AND Vitest with NO config change. Confirmed.
**Rationale**: 10 `.tsx` consumers + 2 checkout pages import `.../lib/stores/cart.store` (one via `@/app/lib/stores/cart.store`); shim keeps all compiling, zero diff in consumers.

### Decision 5: Analytics moves to application hook (clean split)

**Choice**: Remove `trackAddToCart`/`trackRemoveFromCart` from store `set` callbacks. Add `use-cart.ts` wrapping the store:
```ts
export const useCart = () => {
  const store = useCartStore();
  const addItem = (p, q = 1) => { store.addItem(p, q); trackAddToCart(p, q); };
  const removeItem = (id) => { const it = store.items.find(i => i.product.product_id === id);
                               store.removeItem(id); if (it) trackRemoveFromCart(it.product, it.quantity); };
  return { ...store, addItem, removeItem };
};
```
**Safety**: `cart.store.test.ts` does NOT assert analytics (verified — no spy/mock on analytics). Moving the call out is behavior-safe for the 23 tests.
**Alternative**: keep analytics in store as documented exception — rejected: it's the exact side-effect-in-state coupling the slice removes. The store stays pure-of-side-effects; analytics is orchestration → application layer.
**Migration note (deferred)**: consumers still call `useCartStore().addItem` directly, so analytics keeps firing via the shim store UNLESS we strip it there. To avoid losing analytics before consumers migrate to `useCart`, **keep the analytics calls in the store for THIS slice but document the `useCart` hook as the target**, OR migrate the ~3 add-to-cart call sites in this PR. RECOMMENDATION: keep analytics in store for this slice (zero behavior change, single PR) and expose `useCart` as the forward path; strip store-level analytics in the UI-migration slice. This is an Open Question for tasks.

## Data Flow

```
ui (consumers, unchanged)
   │  import useCartStore from app/lib/stores/cart.store  (shim)
   ▼
app/lib/stores/cart.store.ts  ──export *──▶ features/cart/application/cart.store.ts
                                                   │ delegates
                                                   ▼
                                         features/cart/domain/cart.rules.ts (pure)
                                                   │ uses
                                                   ▼
                                         cart.constants.ts + cart.types.ts
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `features/cart/domain/cart.types.ts` | Create | `CartItem` (moved from types.ts) |
| `features/cart/domain/cart.constants.ts` | Create | `FREE_SHIPPING_THRESHOLD=30000`, `SHIPPING_COST=5000` |
| `features/cart/domain/cart.rules.ts` | Create | Pure rules (Decision 2) |
| `features/cart/domain/cart.rules.test.ts` | Create | TDD-first unit tests incl. boundary 29999/30000/30001 |
| `features/cart/application/cart.store.ts` | Create | Canonical store delegating to domain |
| `features/cart/application/use-cart.ts` | Create | Hook exposing analytics-wrapped actions (forward path) |
| `features/cart/application/cart.store.test.ts` | Create | The 23 tests, relocated (import from `./cart.store`) |
| `app/lib/stores/cart.store.ts` | Modify | Becomes `export * from '@/features/cart/application/cart.store'` |
| `app/lib/stores/cart.store.test.ts` | Delete | Moved to application layer |
| `app/lib/types.ts` | Modify | `CartItem` re-exported from domain: `export type { CartItem } from '@/features/cart/domain/cart.types'` |

## Interfaces / Contracts

`CartStore` public interface unchanged (Decision 3). New domain contract = signatures in Decision 2. `Cart` interface in types.ts left untouched (dead, out of scope).

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit (domain) | rules: merge, remove-on-≤0, lineTotal, subtotal, shipping boundary, total | Vitest Node, TDD RED→GREEN first, pure |
| Integration (application) | store actions + selectors via public API | relocated 23 tests, behavior unchanged |

`server-only` NOT involved (cart store is client-side; no server-only import). The 23 tests pass with only the import path change.

## Migration / Rollout

Single additive PR (~180 lines, under 400 budget) + shim. No data migration: localStorage key `amber-cart-storage` and `CartItem` shape unchanged. Rollback = revert PR (delete `features/cart/`, restore original `cart.store.ts`/`types.ts`/test).

## Open Questions

- [ ] Analytics placement for THIS slice: keep in store (recommended, zero behavior change) vs migrate ~3 add-to-cart call sites to `useCart` now. Decide in sdd-tasks.
- [ ] `cart.store.test.ts`: relocate to application (recommended) vs keep at old path with updated import. Recommend relocate.
