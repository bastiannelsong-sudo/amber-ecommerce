# Design: Checkout Hexagonal Slice (domain + application + coupon-seam fix)

## Technical Approach

Second vertical slice, mirroring the merged cart slice idioms EXACTLY: framework-free `features/checkout/domain/` (pure functions, no React/Zustand/fetch), `features/checkout/application/` delegating to domain via boundary mapper + selector hooks, TDD-first (Vitest, `pnpm test:run`). Dependency direction `domain ← application ← app` is preserved. The confirmed coupon-disconnect bug is fixed at the cart→checkout seam by promoting coupon state from CartDrawer-local React state into the persisted cart store, then forwarding `coupon_code` through a checkout mapper. Checkout page receives a HARD-bounded minimal edit (coupon wiring only) — NO strangle.

## Architecture Decisions

### Decision: features/checkout/ layout mirrors cart

**Choice**: `domain/{checkout.types,checkout.rules,checkout.rules.test}.ts` + `application/{checkout.mapper,checkout.mapper.test}.ts, use-checkout-summary.ts`.
**Alternatives**: put rules in cart domain; one flat module.
**Rationale**: Cart is the binding template. Domain stays framework-free; application owns the app→domain boundary (mapper), exactly like `cart.mapper.toCartProduct`. Direction `domain ← application ← app` enforced.

### Decision: CartSnapshot owned by checkout domain

**Choice**: Immutable, price-locked `readonly` type in `checkout.types.ts`. `toCartSnapshot` mapper builds it in application.
**Alternatives**: define in cart domain; reuse live `CartItem[]`.
**Rationale**: Checkout owns order finalization; a snapshot freezes prices at submit time. Cart domain stays cart math. Mapper isolates `CartItem`→snapshot coupling (one place to update if CartItem changes).

### Decision: cross-feature domain import rule (PRECEDENT)

**Choice**: checkout MAY import `features/cart/domain` (pure, stable functions: `subtotal`, `shippingCost`). It MUST NOT import cart application/store/UI.
**Alternatives**: shared kernel module; duplicate the math.
**Rationale**: A shared kernel is premature for two features; duplication risks drift. Pragmatic rule, documented as the convention: **a feature may depend on another feature's DOMAIN (pure, dependency-free), never its application/store/UI.** Promote to a shared kernel only when a 3rd consumer appears.

### Decision: orderTotal clamp

**Choice**: `orderTotal(subtotal, discount, shipping) = Math.max(0, subtotal - discount + shipping)`.
**Rationale**: Discount applies pre-shipping; never negative. Boundary `discount > subtotal+shipping → 0`. TDD-covered.

### Decision: coupon persists in cart store; Zustand hydration

**Choice**: Add `appliedCoupon: string | null = null`, `discountAmount: number = 0`, `setCoupon(code, amount)`, `clearCoupon()` to `cart.store.ts`. NO `version`/migrate, NO `partialize`/`merge` change.
**Rationale**: Coupon is validated against cart total and must survive drawer-close + navigation, so it belongs in the persisted store. **CONFIRMED by reading cart.store.ts: persist config is bare `{ name: 'amber-cart-storage' }` — no custom `merge`, no `partialize`, no `version`.** Zustand's DEFAULT merge is a shallow merge of persisted state OVER the initializer's output. Old persisted carts lack the two new keys, so the initializer defaults (`null`, `0`) win automatically. A `version`/migrate is therefore UNNECESSARY — adding one would be cargo-culting. Defaults MUST be set explicitly in the initializer (they are the fallback).

### Decision: checkout page minimal edit (HARD boundary)

**Choice**: coupon wiring only — read `appliedCoupon`/`discountAmount` from store, route subtotal/discount/total through `toOrderPayload` + `orderTotal`, add a discount summary line. NO step/form/submit refactor.
**Rationale**: Strangle is a separate future slice. Hard boundary keeps PR < 400 lines and rollback to a single revert.

### Decision: hooks scope — build summary only, DEFER form/submit

**Choice**: Build `use-checkout-summary` + `checkout.mapper` NOW. DEFER `use-checkout-form` / `use-checkout-submit` to the strangle slice.
**Alternatives**: build all hooks now (proposal's forward-path list).
**Rationale**: Nothing consumes form/submit until the page is strangled — building them now is DEAD CODE that bloats the PR and invites premature API design. Summary + mapper ARE consumed now (discount display + payload). This locks the slice under 400 lines. **CONTRADICTION vs proposal/explore**: both list `use-checkout-form`/`use-checkout-submit` as in-scope "forward-path" — design DEFERS them. Justified by the dead-code + PR-budget argument.

## Data Flow

    CartDrawer ──setCoupon(code, amt)──▶ cart.store (persisted) ◀──read── checkout/page
                                              │                              │
                                              ▼                              ▼
                                    use-checkout-summary ──▶ checkout.rules.orderTotal
                                              │                              │
                                    toCartSnapshot / toOrderPayload ──▶ {..., coupon_code}
                                                                             │
                                                                  apiClient.post('/orders')

## File Changes

| File | Action | Description |
|---|---|---|
| `features/checkout/domain/checkout.types.ts` | Create | `CartSnapshot` (readonly), `OrderDraft`, `CheckoutFormData`, `CheckoutMode`, `CheckoutStep` |
| `features/checkout/domain/checkout.rules.ts` | Create | `orderTotal`, `isCheckoutReady`, `missingShippingFields`, `sanitizePhone` |
| `features/checkout/domain/checkout.rules.test.ts` | Create | TDD-first; clamp boundary, readiness, missing fields, phone |
| `features/checkout/application/checkout.mapper.ts` | Create | `toCartSnapshot(items, discount)`, `toOrderPayload(snapshot, formData, couponCode?)` |
| `features/checkout/application/checkout.mapper.test.ts` | Create | mapper incl. `coupon_code` presence/absence |
| `features/checkout/application/use-checkout-summary.ts` | Create | reads cart store (incl. coupon) → `{subtotal, discount, shipping, total}` via domain |
| `features/cart/application/cart.store.ts` | Modify | +`appliedCoupon`/`discountAmount` state + `setCoupon`/`clearCoupon` (explicit defaults) |
| `app/components/CartDrawer.tsx` | Modify | local `[discount]/[appliedCoupon]` → store `setCoupon`/`clearCoupon` |
| `app/checkout/page.tsx` | Modify (minimal) | read coupon from store, forward `coupon_code` via `toOrderPayload`, render discount line |

## Interfaces / Contracts

```ts
// checkout.types.ts
export interface CartSnapshot {
  readonly items: ReadonlyArray<{
    readonly product_id: number;
    readonly name: string;
    readonly internal_sku: string;
    readonly quantity: number;
    readonly unit_price: number;
  }>;
  readonly subtotal: number;
  readonly shipping: number;
  readonly discount: number;
  readonly total: number;
}
export type CheckoutMode = 'guest' | 'authenticated';
export type CheckoutStep = 'shipping' | 'payment' | 'confirmation';

// checkout.rules.ts
export const orderTotal = (subtotal: number, discount: number, shipping: number): number =>
  Math.max(0, subtotal - discount + shipping);

// cart.store.ts additions (initializer)
appliedCoupon: null as string | null,
discountAmount: 0,
setCoupon: (code: string, amount: number) => set({ appliedCoupon: code, discountAmount: amount }),
clearCoupon: () => set({ appliedCoupon: null, discountAmount: 0 }),
```

CartDrawer minimal diff: drop `useState` lines 19-20; read `appliedCoupon`/`discountAmount` + `setCoupon`/`clearCoupon` from store; `onApply={(amt, code) => setCoupon(code, amt)}`, `onRemove={clearCoupon}`, `appliedCode={appliedCoupon ?? ''}`, discount line keyed on `discountAmount`.

Checkout page minimal diff: read `appliedCoupon`/`discountAmount` from store; `const total = orderTotal(subtotal, discountAmount, shipping)`; pass `coupon_code: appliedCoupon ?? undefined` into payload (via `toOrderPayload`); render `discountAmount > 0` line.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit (domain) | `orderTotal` clamp incl. over-discount→0; `isCheckoutReady`; `missingShippingFields`; `sanitizePhone` | TDD RED→GREEN, pure, no mocks |
| Unit (application) | `toCartSnapshot` shape/immutability; `toOrderPayload` includes/omits `coupon_code` | pure mapper tests |
| Unit (cart store) | `setCoupon`/`clearCoupon`; **hydration: old persisted state missing fields → defaults `null`/`0`** | Vitest, simulate partial persisted state |
| Manual / covered | checkout page coupon wiring | page NOT strangled → covered by mapper+summary tests + manual smoke note (coupon survives drawer→checkout, payload carries `coupon_code`) |

No `server-only` imports anywhere in domain/application — keeps tests node-runnable.

## Migration / Rollout

No migration. Cart store change is backward compatible via Zustand default shallow merge (confirmed bare persist config). Additive `features/checkout/` deletes cleanly; coupon fix reverts by restoring CartDrawer local state + removing 2 store fields + page edit (single revert).

## Open Questions

- None blocking. Coupon math is FE display only; backend re-validates `coupon_code` authoritatively.
