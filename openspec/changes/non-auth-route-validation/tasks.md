# Tasks: Non-Auth Route Input Validation (BFF Security Slice 2)

Change: `non-auth-route-validation`
Spec: BFF-NAV-01..09 + T1..T5 (24 scenarios)
Design ADRs: S2-001..006

---

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~380–420 (3 schema files ~105 + 5 test files ~270 + 5 route diffs ~35–50) |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR — route edits are trivial diffs; test + schema lines dominate but are low cognitive load |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending (not needed) |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | All schema files + schema unit tests | PR 1 (single) | Foundation; routes depend on these |
| 2 | All 5 route edits + route tests | PR 1 (same) | Depends on Unit 1; merged together |

> Rationale: Route edits are 1–5 lines each (swapping `req.json()` for `validateBody` + `v.data`). Test files are additive, not modifying existing tests. Single PR is reviewer-safe.

---

## Phase 0 — Pre-flight Check (sequential, must run first)

- [x] 0.1 Confirm `zod` version in `package.json` supports `.int()` — **zod 4.4.3 installed; `.int()` is safe. No `.refine(Number.isInteger)` fallback needed.** (ADR S2-004)
- [x] 0.2 Confirm slice-1 infra files exist unchanged: `app/lib/validation.ts` (validateBody) and `app/lib/bff-proxy.ts` (proxyToBackend with `body?` option). Do NOT modify. (ADR S2-001, S2-005)

---

## Phase 1 — Schema Files (parallel between files; sequential RED→GREEN within each)

All three files follow the exact style of `app/lib/auth/schemas.ts`: header comment, one `// Source: <dto>` anchor per schema, `.optional()`, `.min(n)`, exported `z.infer<>` types. No `server-only` import (must run under Vitest). (BFF-NAV-01, BFF-NAV-T5, ADR S2-002)

### 1.1 — Ecommerce schemas (RED)

- [x] 1.1a Write failing tests in `app/lib/ecommerce/schemas.test.ts`:
  - `orderItemSchema`: accepts valid item; rejects string `quantity`; rejects missing `internal_sku`; strips unknown fields.
  - `createOrderSchema`: accepts full valid body; rejects empty `items: []` (min 1); rejects invalid `customer_email`; strips `__proto__`.
  - `validateCouponSchema`: accepts `{ code, cart_total }`; rejects string `cart_total`; rejects missing `code`.
  - Run `pnpm test:run` — expect RED. (BFF-NAV-T3, BFF-NAV-T4)

### 1.2 — Ecommerce schemas (GREEN)

- [x] 1.2a Create `app/lib/ecommerce/schemas.ts` with `orderItemSchema`, `createOrderSchema`, `validateCouponSchema` per ADR S2-004 field shapes and `// Source:` comments. Run `pnpm test:run` — expect GREEN. (BFF-NAV-01, BFF-NAV-T5)

### 1.3 — Contact schemas (RED)

- [x] 1.3a Write failing tests in `app/lib/contact/schemas.test.ts`:
  - Accepts valid body `{ name, email, subject, message }`.
  - Rejects invalid `email` format → schema parse fails.
  - Rejects `message` > 2000 chars.
  - Rejects `subject` > 50 chars.
  - Optional `phone` absent → valid.
  - Run `pnpm test:run` — expect RED. (BFF-NAV-04, BFF-NAV-T4)

### 1.4 — Contact schemas (GREEN)

- [x] 1.4a Create `app/lib/contact/schemas.ts` with `createContactMessageSchema` per ADR S2-002 contact constraints. Run `pnpm test:run` — expect GREEN. (BFF-NAV-01, BFF-NAV-T5)

### 1.5 — Address schemas (RED)

- [x] 1.5a Write failing tests in `app/lib/addresses/schemas.test.ts`:
  - `createAddressSchema`: accepts valid `{ street, city, region }`; rejects `street` < 5 chars; rejects `city` < 2 chars; optional fields absent → valid; strips unknown field `injected`.
  - `updateAddressSchema`: empty `{}` → valid (BFF-NAV-06); partial `{ city }` → valid; `{ street: "Hi" }` (2 chars) → invalid.
  - Run `pnpm test:run` — expect RED. (BFF-NAV-05, BFF-NAV-06, BFF-NAV-T4, ADR S2-003)

### 1.6 — Address schemas (GREEN)

- [x] 1.6a Create `app/lib/addresses/schemas.ts` with `createAddressSchema` and `updateAddressSchema = createAddressSchema.partial()` per ADR S2-003. Run `pnpm test:run` — expect GREEN. (BFF-NAV-01, BFF-NAV-T5)

---

## Phase 2 — Route Conversions (each route: RED→GREEN work unit; can parallelize after Phase 1 is GREEN)

Each route test uses hoisted `vi.mock`, `vi.resetModules()` + dynamic `import()` in `beforeEach`, `NextRequest` construction — identical to slice-1 pattern (BFF-NAV-T1).

### 2.1 — POST /api/orders (RED)

- [x] 2.1a Write failing tests in `app/api/orders/route.test.ts`:
  - Valid full order → `backendFetch` called once with `v.data`; `setOrderAccessCookie` called on success. (BFF-NAV-02, BFF-NAV-T3 item 4)
  - `quantity: "two"` (string) → 400, `backendFetch` not called. (BFF-NAV-T3 item 1)
  - Missing `internal_sku` → 400, `backendFetch` not called. (BFF-NAV-T3 item 2)
  - `items: []` → 400, `backendFetch` not called. (BFF-NAV-T3 item 3)
  - Unknown top-level field `__proto__` stripped; `backendFetch` called without it. (BFF-NAV-09)
  - Mock: `vi.mock('../../lib/bff-proxy')`, `vi.mock('../../lib/session')`, `vi.mock('../../lib/order-access')`.
  - Run `pnpm test:run` — expect RED. (BFF-NAV-02, BFF-NAV-07, BFF-NAV-08)

### 2.2 — POST /api/orders (GREEN)

- [x] 2.2a Edit `app/api/orders/route.ts`: add `validateBody` call as FIRST statement; on `!v.ok` return `v.response`; replace `JSON.stringify(body)` with `JSON.stringify(v.data)` in existing `backendFetch` call. PRESERVE `getSession`, header build, and `setOrderAccessCookie` block unchanged. Remove the `req.json()` bare call at L29. (ADR S2-001, BFF-NAV-02)
- [x] 2.2b Run `pnpm test:run` — expect GREEN.

### 2.3 — POST /api/coupons/validate (RED)

- [x] 2.3a Write failing tests in `app/api/coupons/validate/route.test.ts`:
  - Valid `{ code: "SAVE10", cart_total: 99.9 }` → `proxyToBackend` called once. (BFF-NAV-03)
  - `cart_total: "ninety"` → 400, backend not called. (BFF-NAV-03)
  - Missing `code` → 400. (BFF-NAV-03)
  - Mock: `vi.mock('../../../lib/bff-proxy')`.
  - Run `pnpm test:run` — expect RED.

### 2.4 — POST /api/coupons/validate (GREEN)

- [x] 2.4a Edit `app/api/coupons/validate/route.ts`: add `validateBody(req, validateCouponSchema)`; on failure return `v.response`; on success call `proxyToBackend(req, '/ecommerce/coupons/validate', { body: v.data })`. (BFF-NAV-03, BFF-NAV-07)
- [x] 2.4b Run `pnpm test:run` — expect GREEN.

### 2.5 — POST /api/contact (RED)

- [x] 2.5a Write failing tests in `app/api/contact/route.test.ts`:
  - Valid `{ name, email, subject, message }` → `proxyToBackend` called once. (BFF-NAV-04)
  - Invalid `email` format → 400, backend not called. (BFF-NAV-04, throttle guard)
  - `message` > 2000 chars → 400. (BFF-NAV-04)
  - `subject` > 50 chars → 400. (BFF-NAV-04)
  - Mock: `vi.mock('../../lib/bff-proxy')`.
  - Run `pnpm test:run` — expect RED.

### 2.6 — POST /api/contact (GREEN)

- [x] 2.6a Edit `app/api/contact/route.ts`: add `validateBody(req, createContactMessageSchema)`; on failure return `v.response`; on success call `proxyToBackend(req, '/contact', { body: v.data })`. (BFF-NAV-04, BFF-NAV-07)
- [x] 2.6b Run `pnpm test:run` — expect GREEN.

### 2.7 — POST /api/addresses (RED)

- [x] 2.7a Write failing tests in `app/api/addresses/route.test.ts` (POST handler only):
  - Authenticated valid `{ street, city, region }` → `proxyToBackend` called once with `{ authenticated: true, body: v.data }`. (BFF-NAV-05)
  - `street` < 5 chars → 400, backend not called. (BFF-NAV-05)
  - `city` < 2 chars → 400. (BFF-NAV-05)
  - Unknown field `injected` stripped. (BFF-NAV-09)
  - Mock: `vi.mock('../../lib/bff-proxy')`, `vi.mock('../../lib/session')` with `getSession` returning a session. (BFF-NAV-T2)
  - Run `pnpm test:run` — expect RED.

### 2.8 — POST /api/addresses (GREEN)

- [x] 2.8a Edit `app/api/addresses/route.ts` POST handler: add `validateBody(req, createAddressSchema)`; on failure return `v.response`; on success call `proxyToBackend(req, '/ecommerce/me/addresses', { authenticated: true, body: v.data })`. GET handler unchanged. (BFF-NAV-05, ADR S2-005)
- [x] 2.8b Run `pnpm test:run` — expect GREEN.

### 2.9 — PATCH /api/addresses/[id] (RED)

- [x] 2.9a Write failing tests in `app/api/addresses/[id]/route.test.ts` (PATCH handler only):
  - Authenticated PATCH with `{}` → `proxyToBackend` called once with `{}`. (BFF-NAV-06, empty body valid)
  - Partial `{ city: "Arequipa" }` → `proxyToBackend` called once with `{ city: "Arequipa" }`. (BFF-NAV-06)
  - `{ street: "Hi" }` (2 chars) → 400, backend not called. (BFF-NAV-06)
  - Mock: `vi.mock('../../../lib/bff-proxy')`, `vi.mock('../../../lib/session')`. (BFF-NAV-T2)
  - Run `pnpm test:run` — expect RED.

### 2.10 — PATCH /api/addresses/[id] (GREEN)

- [x] 2.10a Edit `app/api/addresses/[id]/route.ts` PATCH handler: add `validateBody(req, updateAddressSchema)`; on failure return `v.response`; on success call `proxyToBackend(req, \`/ecommerce/me/addresses/${id}\`, { authenticated: true, body: v.data })`. GET and DELETE handlers unchanged. (BFF-NAV-06, ADR S2-003, S2-005)
- [x] 2.10b Run `pnpm test:run` — expect GREEN.

---

## Phase 3 — Full Suite Verification (sequential, after all Phase 2 tasks are GREEN)

- [x] 3.1 Run `pnpm test:run` full suite — all existing tests plus new tests must pass; zero regressions. (BFF-NAV-T1)
- [x] 3.2 Verify each schema file has one `// Source: <dto path> — <ClassName>` comment per schema (BFF-NAV-T5). Automated: `rg "// Source:" app/lib/ecommerce/schemas.ts app/lib/contact/schemas.ts app/lib/addresses/schemas.ts` — must emit 5 lines (one per schema).
- [x] 3.3 Confirm deferred routes untouched: `app/api/orders/card-payment/route.ts`, `app/api/reviews/route.ts`, `app/api/reviews/[id]/helpful/route.ts` — no diff on these files. (BFF-NAV out-of-scope)

---

## Dependency Map

```
Phase 0 (pre-flight)
  └─► Phase 1.1–1.6 (schemas, can parallelize 1.1/1.3/1.5 RED in any order)
        └─► Phase 2.1–2.10 (routes, can parallelize after Phase 1 fully GREEN)
              └─► Phase 3 (full suite + audit)
```

Sequential hard constraints:
- Phase 0 before Phase 1
- Phase 1 fully GREEN before starting Phase 2
- Phase 3 only after all Phase 2 tasks are GREEN

Parallelizable:
- 1.1+1.3+1.5 (RED steps for all 3 schema domains)
- 2.1+2.3+2.5+2.7+2.9 (RED steps for all 5 routes, once Phase 1 is done)
- 2.2, 2.4, 2.6, 2.8, 2.10 (GREEN steps per route — independent files)

---

## Files Affected

**New (create):**
- `app/lib/ecommerce/schemas.ts`
- `app/lib/ecommerce/schemas.test.ts`
- `app/lib/contact/schemas.ts`
- `app/lib/contact/schemas.test.ts`
- `app/lib/addresses/schemas.ts`
- `app/lib/addresses/schemas.test.ts`
- `app/api/orders/route.test.ts`
- `app/api/coupons/validate/route.test.ts`
- `app/api/contact/route.test.ts`
- `app/api/addresses/route.test.ts`
- `app/api/addresses/[id]/route.test.ts`

**Modify (route edits only):**
- `app/api/orders/route.ts` (validateBody + v.data, preserve cookie block)
- `app/api/coupons/validate/route.ts` (validateBody + body: v.data)
- `app/api/contact/route.ts` (validateBody + body: v.data)
- `app/api/addresses/route.ts` (POST only — add validateBody + body: v.data)
- `app/api/addresses/[id]/route.ts` (PATCH only — add validateBody + body: v.data)

**Do NOT touch:**
- `app/lib/validation.ts`
- `app/lib/bff-proxy.ts`
- `app/api/orders/card-payment/route.ts`
- `app/api/reviews/route.ts`
- `app/api/reviews/[id]/helpful/route.ts`
- `app/api/reviews/[id]/route.ts`
