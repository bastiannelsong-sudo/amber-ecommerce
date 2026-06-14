# Exploration: checkout-hexagonal-slice

> Source: Engram observation #944 (`sdd/checkout-hexagonal-slice/explore`). Copied verbatim — the explore agent could not write files.

## Current State

### Flow Overview (3-step SPA inside one page)

`app/checkout/page.tsx` is a single 924-line 'use client' component implementing a 3-step SPA:
- **step: 'shipping'** — Contact + address form (email, firstName, lastName, phone, address, apartment, region/commune from geo API, postalCode)
- **step: 'payment'** — Summary of shipping info + MP info card + "Pagar con MercadoPago" CTA
- **step: 'confirmation'** — Inline success screen with client-side random order number, products from orderSnapshot.current, delivery timeline

Steps are driven by `useState<'shipping' | 'payment' | 'confirmation'>`.

### Cart Consumption (current coupling)

Checkout reads the LIVE cart store directly:
- `items = useCartStore((state) => state.items)` — live, reactive
- `getTotal = useCartStore((state) => state.getTotal())` — calls `domainSubtotal(items)` (domain-routed since cart slice merged)
- `subtotal = getTotal` (raw subtotal, no coupon deduction)
- `shipping = shippingCost(subtotal)` — imports from `@/features/cart/domain/cart.rules` directly
- `cartTotal(subtotal)` — also imports from domain directly

**No CartSnapshot.** The page has a local `orderSnapshot = useRef<{items, subtotal, shipping, total}|null>()` created at the moment of MP redirect. This is only used for the confirmation step display — it is NOT an immutable price-locked snapshot passed to the backend. The backend receives live items at submit time.

**Guest vs. auth branching:** None in checkout domain logic. `SavedAddressPicker` renders only when `useAuthStore` has a user. No explicit auth check guards checkout entry itself.

### Addresses

`SavedAddressPicker` component (app/components/SavedAddressPicker.tsx):
- Reads `useAuthStore(state => state.user)`
- If authenticated: `addressesService.list()` → auto-selects default → populates formData
- If guest: renders nothing, manual form
- Region/commune from `addressesService.getGeo()` loaded on mount

Address fields stored in local `formData` useState. No domain address validation — only UI-level required field check in `handleSubmitShipping`.

### Payment (MercadoPago)

**Checkout Pro flow (redirect):**
1. `handleSubmitPayment` builds payload from formData + live items + NO coupon_code
2. `apiClient.post('/orders', payload)` → BFF POST /api/orders → backendFetch('/ecommerce/orders') → NestJS
3. Backend creates MP preference, returns `{ order: {order_number}, init_point: string }`
4. `window.location.href = res.data.init_point` → full navigation to MP hosted checkout
5. MP redirects back to `/checkout/resultado?status=success|failure|pending&order=<orderNumber>`

**Card-payment route (Bricks flow):** `app/api/orders/card-payment/route.ts` exists as BFF proxy to `/ecommerce/orders/card-payment`. The BFF endpoint is REAL and waiting, but no CardPaymentBrick component exists in the frontend. The checkout UI ONLY uses Checkout Pro redirect.

**`/checkout/resultado`:**
- Polls `ecommerceService.getOrder(orderNumber)` every 2s, max 30s (15 attempts)
- Maps order status → UiStatus: paid|pending|failed|error
- On paid: fires GA4 trackPurchase, fires confetti, calls clearCart()
- Guest access: HMAC cookie (setOrderAccessCookie) set by BFF after order creation allows polling without session

### Order Creation — Payload Assembly (checkout/page.tsx lines 167–185)

```
{
  customer_email, customer_name, customer_phone?,
  shipping_address (with apartment concat), shipping_city, shipping_region, shipping_postal_code?,
  items: [{product_id, name, internal_sku, quantity, unit_price, image_url}],
  // coupon_code: ABSENT
}
```

`createOrderSchema` in `app/lib/ecommerce/schemas.ts` accepts `coupon_code: z.string().optional()` — the BFF is ready for it, but checkout never sends it.

### Coupon-Disconnect Bug (CONFIRMED)

**Level 1 — State isolation:** `CartDrawer.tsx` holds `[discount, setDiscount]` and `[appliedCoupon, setAppliedCoupon]` as LOCAL React state. CouponInput calls `onApply(amt, code)` which sets those local state vars. This state NEVER leaves the CartDrawer component tree.

**Level 2 — Checkout page is blind:** `app/checkout/page.tsx` has ZERO references to `coupon_code`, `discount`, or applied coupon. The handleSubmitPayment payload does not include coupon_code. The backend receives no coupon. The subtotal shown in checkout is raw cart subtotal with no discount deducted.

**The seam:** CartDrawer (closes on navigation) → checkout opens fresh → cart store has no coupon field → checkout builds payload without coupon. The coupon computation is entirely ephemeral UI-only state in the drawer.

**Fix requires:** (a) persist `appliedCoupon` + `discountAmount` into cart.store (application layer), (b) checkout reads and forwards `coupon_code` and computes `subtotal - discountAmount` for display.

### Checkout Readiness Validation (current)

In `handleSubmitShipping`: manual inline check for email, firstName, lastName, address, city — no domain function, no phone/region required in the guard (HTML required attribute present but not programmatically enforced). No minimum order check. No stock re-validation.

### Business Logic Currently Inline in the Page

1. Required fields for checkout readiness (inline missing[] array)
2. Phone sanitization regex (`/[^\d+\s]/g`)
3. Order total calculation (partially routed to domain — shippingCost + cartTotal imported)
4. Order payload assembly (inline mapping)
5. Double-submit guard (submitGuard.current useRef)
6. Confirmation step with client-generated order number (Math.random() — NOT real order_number)
7. orderSnapshot.current management
8. Geo data loading + retry logic

### Components

- `app/components/SavedAddressPicker.tsx` — mixed container/presentational (data fetch + render)
- `app/components/marketing/CheckoutProgressBar.tsx` — pure presentational
- `app/components/marketing/TrustBadges.tsx` — pure presentational
- `app/components/skeletons/CheckoutSkeleton.tsx` — pure presentational

### Existing Tests

**Unit tests for checkout domain: NONE** — `features/checkout/` does not exist.
**BFF tests that cover order creation:**
- `app/api/orders/route.test.ts` — 6 tests (validation, cookie, field stripping)
- `app/lib/ecommerce/schemas.test.ts` — 13 tests for createOrderSchema + validateCouponSchema
**E2E tests:**
- `e2e/checkout-mp-sandbox.spec.ts` — full flow to MP redirect (requires live backend)
- `e2e/checkout-flow.spec.ts` — 5 tests for resultado page (paid/failed/pending/account_money/invalid)

## Affected Areas

- `app/checkout/page.tsx` — 924-line monolith to strangle
- `app/checkout/resultado/page.tsx` — resultado page (clean, mostly fine)
- `app/checkout/layout.tsx` — trivial
- `app/components/CartDrawer.tsx` — coupon bug (discount/appliedCoupon local state)
- `app/components/marketing/CouponInput.tsx` — coupon validation UI
- `features/cart/application/cart.store.ts` — must gain appliedCoupon + discountAmount fields
- `app/lib/stores/cart.store.ts` — shim re-exports (zero change needed)
- `app/lib/services/ecommerce.service.ts` — createOrder already accepts coupon_code (no change needed)
- `app/lib/ecommerce/schemas.ts` — createOrderSchema already has coupon_code (no change needed)
- `app/api/orders/route.ts` — BFF proxy (no changes needed)
- `features/cart/domain/cart.rules.ts` — may need orderTotal(subtotal, discount) or checkout owns this
- New: `features/checkout/domain/` + `features/checkout/application/`

## Approaches

| Approach | Pros | Cons | Effort |
|---|---|---|---|
| A — Strangler + CartSnapshot + coupon fix | Full pattern; snapshot safety; coupon fixed; all domain rules extractable | Cart store must grow fields; 2-3 PRs | High |
| B — Strangler + coupon fix, no CartSnapshot | Matches cart pattern; coupon fixed; no snapshot complexity | Live-cart race remains during checkout | Medium-High |
| C — Domain only, leave page intact | Fast, zero blast radius | Monolith stays; page untestable; coupon not fixed | Low |

## Recommendation

**Approach A, 2-PR stacked-to-main chain:**

**PR 1 (Foundation — ~200-250 lines):**
- `features/checkout/domain/checkout.types.ts` (CartSnapshot, OrderDraft, CheckoutFormData, CheckoutMode)
- `features/checkout/domain/checkout.rules.ts` (orderTotal, isShippingReady, missingShippingFields, isCheckoutReady)
- `features/checkout/domain/checkout.rules.test.ts` (TDD-first)
- `features/checkout/application/checkout.mapper.ts` (toCartSnapshot, toOrderPayload)
- `features/checkout/application/use-checkout-summary.ts` (reads cart store, applies discount, exposes {subtotal, discount, shipping, total, coupon})
- **Coupon fix**: add `appliedCoupon: string` + `discountAmount: number` to cart.store + CartDrawer reads from store instead of local state

**PR 2 (Strangler — ~400-500 lines):**
- `features/checkout/application/use-checkout-orchestrator.ts` (multi-step state, submit logic)
- Refactor `app/checkout/page.tsx` to use hooks from application layer
- Extract shipping form + payment step to container components
- Fix client-generated order number (use real order_number from backend response)

## Open Questions (for design phase)

1. **CartSnapshot in cart or checkout domain?** Recommend: define in `features/checkout/domain/checkout.types.ts`. Checkout owns order finalization. `toCartSnapshot` mapper in `features/checkout/application/checkout.mapper.ts`.

2. **Where does appliedCoupon persist?** Recommend: `features/cart/application/cart.store.ts` — natural since coupon validated against cart total and must survive CartDrawer close/checkout navigation.

3. **`orderTotal` domain rule location?** Recommend: `features/checkout/domain/checkout.rules.ts` owns `orderTotal(subtotal, discountAmount, shipping) => number`. Cart domain stays focused on cart math.

4. **Address validation in domain?** Recommend: `isShippingReady(formData): boolean` + `missingShippingFields(formData): string[]` as pure functions in checkout domain.

5. **CheckoutMode (guest/auth) as domain concept?** Recommend YES — `type CheckoutMode = 'guest' | 'authenticated'` in domain, readiness rules can branch.

6. **Coupon scope:** Fix IN THIS SLICE. Schema/BFF/service already ready. Missing: cart.store coupon state + checkout reads it. Small delta, big correctness gain.

## Risks

1. **Cart.store schema change** — adding fields to persisted Zustand store. Existing localStorage caches won't have these fields. Zustand persist handles missing fields gracefully with defaults but should be explicit.

2. **924-line page strangling without regressions** — e2e tests (mp-sandbox + checkout-flow) require live backend. Domain unit tests are the TDD-first safety net.

3. **Client-generated order number bug** — `Math.random()` generates a fake order number in the confirmation step. The real order_number comes from the backend response but is only in `res.data.order.order_number`. This should be fixed in PR 2 (store in orderSnapshot).

4. **Card-payment Bricks endpoint exists but has no frontend** — out of scope for this slice, but document.

5. **PR 2 size risk** — ~400-500 lines changed (high risk for single PR budget). Stacked PRs are mandatory.

6. **CartSnapshot adds a new maintenance surface** — if CartItem shape changes, CartSnapshot mapper must be updated. The mapper isolates this coupling cleanly.

## Ready for Proposal

Yes. Recommend proceeding to sdd-propose with:
- CartSnapshot in checkout domain: YES
- Coupon-disconnect fix in this slice: YES
- 2-PR stacked-to-main chain
- TDD-first (Vitest, pnpm test:run)
