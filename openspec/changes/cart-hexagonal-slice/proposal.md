# Proposal: cart-hexagonal-slice (Pattern-Setter)

## Intent

Cart business logic (subtotal, shipping, total, merge, remove-on-zero) is scattered and duplicated across the Zustand store and 4+ components, with an inconsistent free-shipping threshold (`> 30000` vs `>= 30000`) in 3 files. This is the FIRST vertical slice of the architecture refactor (engram #867): it establishes the `features/{name}/{domain,application}` convention every future slice will copy. We extract pure, fully-tested cart domain logic and turn the store into a thin application adapter. UI migration is deferred.

## Scope

### In Scope
- Create `features/cart/` at REPO ROOT (sibling to `app/`) — sets the naming convention for all slices.
- `features/cart/domain/` (framework-free, unit-tested, TDD-first):
  - `cart.types.ts` — `CartItem` etc. moved here; old `app/lib/types.ts` re-exports to avoid blast radius.
  - `cart.constants.ts` — `FREE_SHIPPING_THRESHOLD = 30000`, `SHIPPING_COST = 5000`.
  - `cart.rules.ts` — pure fns: `mergeItem`/`addItem`, `removeItem`, `setQuantity` (remove on `<= 0`), `lineTotal`, `subtotal`, `qualifiesForFreeShipping`, `shippingCost`, `cartTotal`.
  - `cart.rules.test.ts` (RED→GREEN first).
- `features/cart/application/`:
  - `cart.store.ts` — canonical Zustand store; calls domain fns (no math inside store).
  - Selector hooks `useCart`, `useCartSummary`.
  - Analytics side-effects (`trackAddToCart`/`trackRemoveFromCart`) moved OUT of `set` callbacks into the application layer.
- Fix free-shipping inconsistency: canonical rule = free when `subtotal >= FREE_SHIPPING_THRESHOLD` (lock `>=`). All shipping/total math routes through domain.
- Re-export shim at `app/lib/stores/cart.store.ts` → `export * from '@/features/cart/application/cart.store'` (zero blast radius for ~12 importers).
- Relocate/adjust the existing 23 `cart.store.test.ts` (now integration over refactored store).

### Out of Scope (documented backlog — do NOT touch)
- Coupon-disconnect bug (dedicated follow-up slice).
- Price snapshot at add-time (keep live-price behavior).
- Stock validation guard in `addItem`.
- `selectedVariant` dead field (leave as-is).
- UI container-presentational migration (CartDrawer / carrito page / components) — follow-up slice.
- Checkout `CartSnapshot` boundary (future checkout slice).

## Capabilities

### New Capabilities
- `cart-domain`: pure cart calculation + mutation rules (line/subtotal/shipping/total, merge, remove, set-quantity) with the canonical free-shipping threshold.
- `cart-application`: Zustand store adapter delegating to `cart-domain`, selector hooks, and analytics side-effect placement.

### Modified Capabilities
- None (no existing `openspec/specs/`; pure refactor — only behavior change is the off-by-one threshold fix, captured in `cart-domain`).

## Approach

Follow exploration Option C (hybrid), domain+application only. The `@/*` alias maps to repo root (`tsconfig.json` `"@/*": ["./*"]`), so `@/features/cart/...` resolves with `features/` at root — verified. Move the canonical store into `features/cart/application/` and keep a thin re-export shim at the old path so the ~12 `useCartStore` importers compile unchanged. Domain functions stay React-free and browser-free (Vitest/Node); `persist` middleware stays in `application/`. TDD: write `cart.rules.test.ts` RED first, implement to GREEN, then refactor the store to call domain and verify the 23 existing tests still pass.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `features/cart/domain/*` | New | types, constants, pure rules + unit tests |
| `features/cart/application/*` | New | canonical store, `useCart`/`useCartSummary`, analytics |
| `app/lib/stores/cart.store.ts` | Modified | becomes re-export shim |
| `app/lib/stores/cart.store.test.ts` | Modified | import paths adjusted; integration over refactored store |
| `app/lib/types.ts` | Modified | `CartItem` moves to domain; re-export back |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Threshold flip (`>` → `>=`) changes total at exactly 30000 | Med | Intended fix; cover boundary (29999/30000/30001) in domain tests |
| Shim/alias misresolution breaks ~12 importers | Low | Alias verified; shim re-exports; typecheck + existing 23 tests gate |
| Mis-naming `features/` carried forward to all slices | Low | Naming locked in this proposal as the convention |
| Analytics double-fire when moving out of `set` | Low | Move to single call site in application layer; assert via store tests |

## Rollback Plan

Single PR, additive + shim. Revert the PR: shim disappears, `app/lib/stores/cart.store.ts` and `app/lib/types.ts` return to originals, `features/cart/` is deleted. No data migration (localStorage key `amber-cart-storage` and `CartItem` shape unchanged).

## Dependencies

- None external. tsconfig `@/*` → repo root (verified).

## Success Criteria

- [ ] `features/cart/domain` + `application` exist; domain is React/browser-free.
- [ ] All cart math routes through domain; free shipping is canonical `>= 30000` everywhere.
- [ ] Re-export shim keeps all existing `useCartStore` importers compiling unchanged.
- [ ] New domain unit tests pass (TDD) AND existing 23 store tests pass (`pnpm test:run`).
- [ ] No behavior change except the threshold fix. Single PR ~180 lines (within 400-line budget).
