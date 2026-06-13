# Verify Report: Non-Auth Route Input Validation (BFF Security Slice 2)

Change: `non-auth-route-validation`
Branch: `feat/non-auth-route-validation` (5 commits)
Date: 2026-06-13
Verdict: **PASS WITH WARNINGS**
Mode: Strict TDD (adversarial, independent verification)

---

## Test & Build Evidence

| Command | Result |
|---|---|
| `pnpm test:run` | 246 passed / 24 failed (all pre-existing Zustand jsdom) / 0 new failures |
| `npx tsc --noEmit` | Clean — 0 errors |
| Pre-existing failures | `auth.store.test.ts` (5) + `cart.store.test.ts` (19) — Zustand localStorage jsdom issue, NOT introduced by this change |
| New test files | 11 (49 schema unit tests + 29 route tests = 78 total) |

---

## Task Completeness

All 21 tasks marked `[x]` in apply-progress and tasks artifact. Confirmed by code inspection:
- Phase 0 (2/2): zod version confirmed, infra files verified untouched
- Phase 1 (6/6): 3 schema files + 3 test files created
- Phase 2 (10/10): 5 route edits + 5 route test files created
- Phase 3 (3/3): full suite run, source comments confirmed, deferred routes verified untouched

---

## Spec Compliance Matrix

| Requirement | Status | Evidence |
|---|---|---|
| BFF-NAV-01: Schema-DTO byte compatibility | PASS WITH WARNING | See WARNING-01 — `.min(1)` on strings is stricter than `@IsString()` alone |
| BFF-NAV-02: Orders validates before forward | PASS | `validateBody` is first stmt L29; `req.json()` absent from route (grep confirmed) |
| BFF-NAV-02: setOrderAccessCookie preserved | PASS | L55-57: `if (ok && data?.order_number) await setOrderAccessCookie(data.order_number)` |
| BFF-NAV-02: backendFetch receives v.data | PASS | L46: `body: JSON.stringify(v.data)` |
| BFF-NAV-03: Coupons validates before forward | PASS | `validateBody` first, `body: v.data` in proxyToBackend |
| BFF-NAV-04: Contact validates before forward | PASS | `validateBody` first, `body: v.data` in proxyToBackend |
| BFF-NAV-05: Addresses POST validates before forward | PASS | `validateBody` first, `authenticated:true, body: v.data` |
| BFF-NAV-06: Addresses PATCH with updateAddressSchema | PASS | `createAddressSchema.partial()` used; empty `{}` valid |
| BFF-NAV-07: No forward on failure | PASS | Early return `if (!v.ok) return v.response` on all 5 routes |
| BFF-NAV-08: Structured 400 error response | PASS | Inherited from slice-1 validateBody; test verifies `{error, issues}` shape |
| BFF-NAV-09: Unknown fields stripped | PASS | zod default strip mode; tests verify unknown keys absent in forwarded body |
| BFF-NAV-T1: Vitest + hoisted vi.mock + dynamic import | PASS | All 5 route tests follow pattern |
| BFF-NAV-T2: getSession mocked for auth routes | PASS | Flat AmberSession mock in both address test files |
| BFF-NAV-T3: Orders nested validation (all 4 mandatory) | PASS | quantity:string→400, missing internal_sku→400, empty items→400, valid→cookie fires |
| BFF-NAV-T4: Min coverage per route (valid/missing/wrong-type/unknown) | PASS | All 5 routes cover all 4 cases |
| BFF-NAV-T5: `// Source:` comment per schema | PASS | 6 source comments across 3 files (orderItemSchema + createOrderSchema + validateCouponSchema + createContactMessageSchema + createAddressSchema + updateAddressSchema) |

---

## Design Coherence

| ADR | Status | Evidence |
|---|---|---|
| S2-001: Orders keeps backendFetch, one-shot body | PASS | `validateBody` as first stmt; `v.data` passed to `backendFetch` via JSON.stringify; `req.json()` absent |
| S2-002: Per-domain schema files | PASS | `app/lib/ecommerce/`, `app/lib/contact/`, `app/lib/addresses/` |
| S2-003: updateAddressSchema = createAddressSchema.partial() | PASS | Exact implementation confirmed |
| S2-004: z.number() (no coercion); quantity .int().min(1) | PASS | `z.number().int().min(1)` confirmed in ecommerce schemas |
| S2-005: Authenticated routes use proxyToBackend authenticated:true | PASS | Both address routes pass `{authenticated: true, body: v.data}` |
| S2-006: Error contract from slice-1 reused | PASS | validateBody returns structured errors; no custom error logic in new routes |

---

## Deferred Routes — UNTOUCHED

| Route | Diff on branch |
|---|---|
| `app/api/orders/card-payment/route.ts` | Zero changes (confirmed via git diff) |
| `app/api/reviews/route.ts` | Zero changes (pre-existing TODO comment, not added by this branch) |
| `app/api/reviews/[id]/helpful/route.ts` | Zero changes (pre-existing TODO comment, not added by this branch) |

---

## Infra Files — UNTOUCHED

| File | Diff on branch |
|---|---|
| `app/lib/validation.ts` | Zero changes |
| `app/lib/bff-proxy.ts` | Zero changes |

---

## Issues

### WARNING-01 — String fields `.min(1)` stricter than backend DTO

**Severity**: WARNING
**Requirement**: BFF-NAV-01 (no stricter than backend DTO)
**Detail**: The backend `CreateOrderDto` uses `@IsString()` (class-validator) which does NOT reject empty strings `""`. The BFF schema applies `.min(1)` to `customer_name`, `shipping_address`, `shipping_city`, `shipping_region` (orders) and `.min(1)` to `code` (validateCouponSchema). This means the BFF rejects valid bodies that the backend would accept.
**Risk level**: Low in practice — empty strings for these fields are semantically invalid and any real client would not send them. But it technically violates BFF-NAV-01's "no stricter constraint" rule.
**Recommendation**: Either (a) accept as intentional defensive guard and document the decision, or (b) change to `z.string()` to exactly mirror `@IsString()`.
**Non-blocking**: The spec table in BFF-NAV-01 lists the `min(1)` constraints as part of the spec design (ADR S2-004 explicitly calls them out). This was a deliberate spec choice. Flagged for awareness; does NOT block merge.

### WARNING-02 — items array `.min(1)` not in DTO

**Severity**: WARNING
**Requirement**: BFF-NAV-01
**Detail**: `CreateOrderDto.items` uses `@IsArray()` with no `@ArrayMinSize(1)`. The BFF applies `z.array(orderItemSchema).min(1)`. Same rationale as WARNING-01 — semantically valid defensive guard but technically stricter.
**Recommendation**: Same as WARNING-01. The spec explicitly calls for `items array min(1)` in BFF-NAV-01 table — this is a deliberate design choice.
**Non-blocking**.

### SUGGESTION-01 — Missing `quantity: .int()` in DTO, but present in BFF

The backend DTO has `@Min(1)` on `quantity` but NOT `@IsInt()`. The BFF uses `z.number().int().min(1)`. At runtime the backend service receives JSON numbers which are always integers when sent from a frontend. The `.int()` check is sound but slightly stricter. Not a parity violation because the spec explicitly calls for it (ADR S2-004).

### SUGGESTION-02 — No schema test for `name` min-length on contact

`createContactMessageSchema` accepts `name: ""` (empty string) per schema. No test covers this edge case. Not a spec violation (DTO allows it), but worth a note.

---

## TDD Evidence Spot-Check (BFF-NAV-T3)

All four mandatory orders scenarios confirmed:
1. `quantity: 'two'` → 400, `backendFetch` not called ✓
2. `missing internal_sku` → 400, `backendFetch` not called ✓
3. `items: []` → 400, `backendFetch` not called ✓
4. Valid order → `backendFetch` called once with `v.data`, `setOrderAccessCookie('ORD-001')` called ✓

Test at L76-85 directly asserts cookie fires with order_number from backend response.

---

## Verdict: PASS WITH WARNINGS

**0 CRITICAL** — No spec violations, security gaps, broken behavior, or forbidden file touches.
**2 WARNING** — Both relate to `.min(1)` guards being marginally stricter than the DTO; both are deliberate spec decisions (ADR S2-004, BFF-NAV-01 table). Non-blocking.
**2 SUGGESTION** — Minor documentation/coverage gaps.

Implementation is correct, tests are genuine and non-trivial, all five routes validate before forwarding, the orders cookie is preserved, no deferred/infra files were touched, TypeScript is clean.

**Next recommended**: `sdd-archive`
