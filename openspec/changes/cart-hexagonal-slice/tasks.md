# Tasks: cart-hexagonal-slice

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~230–280 (new files ~200 net-new + ~30-50 modifications) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| WU-1 | Domain layer (types + constants + rules + tests) | PR 1 | Pure, no framework; TDD RED→GREEN |
| WU-2 | Application layer (store relocation + hooks + shim + test relocation) | PR 1 (same) | Sequential after WU-1; budget stays under 280 lines total |
| WU-3 | Threshold call-site fixes in app/ | PR 1 (same) | Sequential after WU-1; fixes the `> 30000` bug |

All three work units are sequential and ship together in a single PR under budget.

---

## Phase 1 — Domain Foundation (WU-1)
_Satisfies: CART-C1, CART-D1, CART-R1–R8, CART-T1, CART-T2_

- [ ] 1.1 Create `features/cart/domain/cart.types.ts` — move `CartItem` definition from `app/lib/types.ts`; no other types moved. (CART-D1)
- [ ] 1.2 Modify `app/lib/types.ts` — replace `CartItem` definition with `export { CartItem } from '@/features/cart/domain/cart.types'`. (CART-D1)
- [ ] 1.3 Create `features/cart/domain/cart.constants.ts` — export `FREE_SHIPPING_THRESHOLD = 30000` and `SHIPPING_COST = 5000`. (CART-C1)
- [ ] 1.4 **RED** — Create `features/cart/domain/cart.rules.test.ts` with all failing tests for: `addItem` (CART-R1), `removeItem` (CART-R2), `setQuantity` (CART-R3), `lineTotal` (CART-R4), `subtotal` (CART-R5), `qualifiesForFreeShipping` boundary 29999/30000/30001 (CART-R6, CART-T2), `shippingCost` (CART-R7), `cartTotal` (CART-R8). Run `pnpm test:run` → must be RED. (CART-T1)
- [ ] 1.5 **GREEN** — Create `features/cart/domain/cart.rules.ts` implementing all pure functions from ADR 2 signatures; import constants from `cart.constants.ts`. Run `pnpm test:run` → all domain tests GREEN. (CART-R1–R8, CART-T1, CART-T2)

---

## Phase 2 — Application Layer (WU-2)
_Satisfies: CART-A1, CART-A2, CART-A3, CART-A4, CART-T3_

- [ ] 2.1 Create `features/cart/application/cart.store.ts` — Zustand store with `CartItem[]` state; actions `addItem`, `removeItem`, `updateQuantity` delegate to domain functions (`addItem`, `removeItem`, `setQuantity`); selectors `getTotal` → `subtotal(items)`, `getItemCount` → `itemCount(items)`, `getItemQuantity` → `itemQuantity(items, id)`; analytics (`trackAddToCart`, `trackRemoveFromCart`) called AFTER `set(...)`, not inside. (CART-A1, CART-A3)
- [ ] 2.2 Create `features/cart/application/use-cart.ts` — `useCart` hook wrapping `useCartStore`; re-exposes `addItem`/`removeItem` as public forward path for future analytics migration; NO behavior change for current consumers. (CART-A3)
- [ ] 2.3 Create `features/cart/application/use-cart-summary.ts` — `useCartSummary` hook returning `{ subtotal, shipping, total, itemCount }` derived only from domain functions; no inline arithmetic. (CART-A4)
- [ ] 2.4 Relocate `app/lib/stores/cart.store.test.ts` → `features/cart/application/cart.store.test.ts`; update only the import path to resolve to canonical store or shim; zero changes to assertion logic; 23 tests must pass. (CART-T3)
- [ ] 2.5 Modify `app/lib/stores/cart.store.ts` — replace entire file body with `export * from '@/features/cart/application/cart.store'`. (CART-A2)
- [ ] 2.6 Delete `app/lib/stores/cart.store.test.ts` (file was relocated in 2.4). (CART-A2, CART-T3)
- [ ] 2.7 Run `pnpm test:run` — verify all 23 relocated tests pass; no test regressions. (CART-T3)

---

## Phase 3 — Threshold Call-site Fixes (WU-3)
_Satisfies: CART-C1, CART-R6, CART-A5_

- [ ] 3.1 Fix `app/carrito/page.tsx` lines ~39 and ~220 — replace inline `subtotal > 30000 ? 0 : 5000` and hardcoded `30000` with imports of `shippingCost` and `FREE_SHIPPING_THRESHOLD` from `@/features/cart/domain/cart.rules` / `@/features/cart/domain/cart.constants`. (CART-C1, CART-R6, CART-A5)
- [ ] 3.2 Fix `app/checkout/page.tsx` line ~115 — replace `subtotal > 30000 ? 0 : 5000` with `shippingCost(subtotal)` from domain. (CART-C1, CART-R6, CART-A5)
- [ ] 3.3 Fix `app/components/marketing/FreeShippingProgress.tsx` — replace hardcoded `threshold = 30000` default prop with import of `FREE_SHIPPING_THRESHOLD` from `@/features/cart/domain/cart.constants`; pass it as default. (CART-C1, CART-A5)
- [ ] 3.4 Run `pnpm test:run` — full suite green (domain tests + 23 store tests). (CART-T1, CART-T2, CART-T3)

---

## Phase 4 — Verification
_Satisfies: CART-A5 (zero regression confirmation)_

- [ ] 4.1 Confirm TypeScript compiles clean — `tsc --noEmit` (or `pnpm build`) must produce zero new errors. All 10 `useCartStore` consumers + 2 checkout pages must compile via the shim. (CART-A2, CART-D1)
- [ ] 4.2 Verify no hard-coded `30000` or `5000` remain in app/ source files (excluding tests, comments, and openspec). (CART-C1)
- [ ] 4.3 Confirm `app/lib/stores/cart.store.ts` contains only the re-export shim — no logic. (CART-A2)
- [ ] 4.4 Confirm `features/cart/domain/cart.rules.ts` has zero React, Zustand, fetch, window, or 'use client' imports. (ADR 1 domain boundary)
