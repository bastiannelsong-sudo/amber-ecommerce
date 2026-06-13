# Spec: Non-Auth Route Input Validation (BFF Security Slice 2)

Change: `non-auth-route-validation`
Domain: **bff-input-validation** (new)
Requirement prefix: `BFF-NAV-*`
Extends: slice-1 validate-then-forward contract (`validateBody` + `proxyToBackend body?`)

---

## Purpose

Define what MUST be true after applying this change. This is a NEW capability spec.
Five non-auth (and two authenticated) POST/PATCH routes currently blind-proxy untrusted bodies.
After this change no BFF route forwards an unverified body to amber-back.

---

## Parity Contract

### BFF-NAV-01 — Schema-DTO Byte Compatibility

Every zod schema introduced by this change MUST mirror the corresponding amber-back DTO exactly. The BFF MUST NOT impose stricter constraints than the backend. Each schema file MUST carry an inline `// Source:` comment naming the DTO file and class.

| Schema | DTO source | Required fields | Optional fields | Key rules |
|---|---|---|---|---|
| `createOrderSchema` | `ecommerce/dto/create-order.dto.ts` — `CreateOrderDto` | `customer_email`, `customer_name`, `shipping_address`, `shipping_city`, `shipping_region`, `items` | `customer_phone`, `shipping_postal_code`, `coupon_code` | `customer_email` email format; `items` array min(1) |
| `createOrderSchema.items` | `ecommerce/dto/create-order.dto.ts` — `OrderItemDto` | `product_id`, `name`, `internal_sku`, `quantity`, `unit_price` | `image_url` | `product_id` number; `quantity` integer min(1); `unit_price` number |
| `validateCouponSchema` | `ecommerce/dto/create-coupon.dto.ts` — `ValidateCouponDto` | `code`, `cart_total` | — | `cart_total` number |
| `createContactMessageSchema` | `contact/dto/create-contact-message.dto.ts` — `CreateContactMessageDto` | `name`, `email`, `subject`, `message` | `phone` | `name` maxLength(100); `email` email; `phone` maxLength(20); `subject` maxLength(50); `message` maxLength(2000) |
| `createAddressSchema` | `ecommerce-auth/dto/address.dto.ts` — `CreateAddressDto` | `street`, `city`, `region` | `apartment`, `zip_code`, `is_default` | `street` length(5,255); `city` length(2,100); `region` length(2,100); `apartment` maxLength(100); `zip_code` maxLength(20); `is_default` boolean |
| `updateAddressSchema` | `ecommerce-auth/dto/address.dto.ts` — `UpdateAddressDto` | — | all fields of createAddressSchema | same per-field constraints; empty `{}` MUST be valid |

#### Scenario: Divergence from DTO is a blocking violation

- GIVEN a zod schema defines a constraint not present in the corresponding DTO
- WHEN the spec is audited
- THEN the constraint MUST be removed before merge

---

## Route Validation Requirements

### BFF-NAV-02 — POST /api/orders Validates Body Before Forward

The orders POST handler MUST call `validateBody` before any backend call. On success it MUST forward `v.data` via `backendFetch` (never re-read `req.json()`). The `setOrderAccessCookie` call on success MUST be preserved unchanged.

#### Scenario: Valid order body is accepted and cookie is set

- GIVEN a POST to `/api/orders` with a fully valid order body (valid customer fields + items array with one valid item)
- WHEN the handler validates and forwards the body
- THEN `backendFetch` is called once with `v.data`
- AND `setOrderAccessCookie` is called on the success response

#### Scenario: Invalid nested item — wrong type on quantity returns 400

- GIVEN a POST to `/api/orders` with `items: [{ product_id: 1, name: "X", internal_sku: "SKU", quantity: "two", unit_price: 10 }]`
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400
- AND `backendFetch` is NOT called

#### Scenario: Invalid nested item — missing internal_sku returns 400

- GIVEN a POST to `/api/orders` with an item missing `internal_sku`
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400
- AND `backendFetch` is NOT called

#### Scenario: Empty items array returns 400

- GIVEN a POST to `/api/orders` with `items: []`
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400
- AND `backendFetch` is NOT called

#### Scenario: Unknown top-level field stripped before forward

- GIVEN a POST to `/api/orders` with a valid body plus `__proto__: "evil"`
- WHEN the handler validates and forwards the body
- THEN `backendFetch` is called with an object that does NOT contain `__proto__`

---

### BFF-NAV-03 — POST /api/coupons/validate Validates Body Before Forward

The coupons/validate POST handler MUST call `validateBody` with `validateCouponSchema`. On failure it MUST return HTTP 400. On success it MUST forward `v.data` via `proxyToBackend body?`.

#### Scenario: Valid coupon body is accepted

- GIVEN a POST to `/api/coupons/validate` with `{ code: "SAVE10", cart_total: 99.9 }`
- WHEN the handler validates the body
- THEN validation passes and the backend is called once with `v.data`

#### Scenario: Non-numeric cart_total returns 400

- GIVEN a POST to `/api/coupons/validate` with `{ code: "SAVE10", cart_total: "ninety" }`
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400
- AND the backend is NOT called

#### Scenario: Missing code returns 400

- GIVEN a POST to `/api/coupons/validate` with `{ cart_total: 50 }` (missing `code`)
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400

---

### BFF-NAV-04 — POST /api/contact Validates Body Before Forward

The contact POST handler MUST validate with `createContactMessageSchema` before calling the backend. Validation MUST reject before the backend's `@Throttle 3/60s` budget is consumed.

#### Scenario: Valid contact body is accepted

- GIVEN a POST to `/api/contact` with `{ name: "Ana", email: "ana@x.com", subject: "Hello", message: "World" }`
- WHEN the handler validates the body
- THEN validation passes and the backend is called once

#### Scenario: Invalid email returns 400 without consuming throttle budget

- GIVEN a POST to `/api/contact` with `{ name: "Ana", email: "not-email", subject: "Hi", message: "Msg" }`
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400
- AND the backend is NOT called

#### Scenario: Message exceeding 2000 chars returns 400

- GIVEN a POST to `/api/contact` with a `message` field of 2001 characters
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400

#### Scenario: Subject exceeding 50 chars returns 400

- GIVEN a POST to `/api/contact` with a `subject` field of 51 characters
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400

---

### BFF-NAV-05 — POST /api/addresses Validates Body Before Forward (Authenticated)

The addresses POST handler MUST validate with `createAddressSchema`. Because the route is authenticated, test setup MUST mock `getSession`. On failure HTTP 400; on success forward `v.data`.

#### Scenario: Valid address body is accepted

- GIVEN an authenticated POST to `/api/addresses` with `{ street: "Main St 123", city: "Lima", region: "Lima" }`
- WHEN the handler validates the body
- THEN validation passes and the backend is called once with `v.data`

#### Scenario: Street below minimum length returns 400

- GIVEN a POST to `/api/addresses` with `{ street: "Hi", city: "Lima", region: "Lima" }` (`street` has 2 chars, below min 5)
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400

#### Scenario: City below minimum length returns 400

- GIVEN a POST to `/api/addresses` with `{ street: "Main St 123", city: "X", region: "Lima" }` (`city` has 1 char, below min 2)
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400

#### Scenario: Unknown field stripped before forward

- GIVEN a POST to `/api/addresses` with a valid body plus `injected: true`
- WHEN the handler validates and forwards
- THEN the backend is called with an object that does NOT contain `injected`

---

### BFF-NAV-06 — PATCH /api/addresses/[id] Validates Body Before Forward (Authenticated)

The addresses PATCH handler MUST validate with `updateAddressSchema`. All fields are optional; an empty body `{}` MUST be valid and forwarded. Test setup MUST mock `getSession`.

#### Scenario: Empty body is valid for PATCH

- GIVEN an authenticated PATCH to `/api/addresses/42` with body `{}`
- WHEN the handler validates the body
- THEN validation passes and the backend is called with `{}`

#### Scenario: Partial update with one field is valid

- GIVEN an authenticated PATCH to `/api/addresses/42` with `{ city: "Arequipa" }`
- WHEN the handler validates and forwards
- THEN validation passes and the backend is called with `{ city: "Arequipa" }`

#### Scenario: Invalid field value in partial update returns 400

- GIVEN an authenticated PATCH to `/api/addresses/42` with `{ street: "Hi" }` (below min length 5)
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400
- AND the backend is NOT called

---

## Shared Behavioral Invariants

### BFF-NAV-07 — No Forward on Failure (All Five Routes)

All five routes MUST NOT call the backend if body validation fails. This is an absolute prohibition mirroring BFF-SEC-03 from slice 1.

#### Scenario: Backend is never called on invalid input (any of the five routes)

- GIVEN any of the five in-scope routes receives a body that fails schema validation
- WHEN the handler executes
- THEN the backend proxy (backendFetch or proxyToBackend) is called zero times

---

### BFF-NAV-08 — Structured 400 Error Response

On validation failure all five routes MUST return HTTP 400 with a JSON body matching the shape established by slice 1 (`{ error: string, issues: array }`). No stack traces or raw zod objects.

#### Scenario: 400 response has structured error body

- GIVEN any of the five routes receives an invalid body
- WHEN the handler returns 400
- THEN the response body is valid JSON containing at minimum `{ error: string, issues: array }`
- AND the response `Content-Type` is `application/json`

---

### BFF-NAV-09 — Unknown Fields Stripped on All Five Routes

All five handlers MUST strip unknown fields before forwarding. Stripped output is `v.data` from the zod `strip` mode (inherited from `validateBody`).

---

## Testing Contract

### BFF-NAV-T1 — Test Runner and Pattern

All new route tests MUST run under `pnpm test:run` (Vitest). Tests MUST follow the slice-1 pattern: hoisted `vi.mock`, `vi.resetModules()` + dynamic `import()` in `beforeEach`, `NextRequest` construction.

### BFF-NAV-T2 — Authenticated Route Test Setup

Tests for POST /api/addresses and PATCH /api/addresses/[id] MUST mock `getSession` to simulate an authenticated session. An unauthenticated mock is NOT required unless testing auth-guard behavior separately.

### BFF-NAV-T3 — Orders Nested Validation Coverage (Mandatory)

The POST /api/orders test suite MUST include all four of:
1. Wrong-type `quantity` (e.g. string) → HTTP 400, `backendFetch` not called.
2. Missing `internal_sku` → HTTP 400, `backendFetch` not called.
3. Empty `items` array → HTTP 400, `backendFetch` not called.
4. Valid full order → `backendFetch` called once AND `setOrderAccessCookie` called.

### BFF-NAV-T4 — Minimum Coverage Per Route

Every validated route test MUST cover:
1. Valid body → backend called once with the parsed (stripped) object.
2. At least one missing required field → HTTP 400, backend not called.
3. Wrong type on at least one field → HTTP 400.
4. Unknown field → backend called with object that does NOT contain the unknown key.

### BFF-NAV-T5 — Parity Comment Presence

Each schema file MUST carry a `// Source:` comment per schema (mirroring BFF-SEC-T3). A test or linter check SHOULD verify this comment is not accidentally removed.

---

## Out of Scope / Deferred

The following routes MUST NOT be modified in this change. No TODO comments or placeholder code shall be added to their files:

| Route | Reason deferred |
|---|---|
| POST /api/orders/card-payment | Backend endpoint does not exist; no DTO to mirror |
| POST /api/reviews | Backend route stubbed / returns 404 |
| PATCH /api/reviews/[id]/helpful | Sends no body; nothing to validate |
| Rate limiting | Separate future slice; out of scope here |

---

## Invariants (non-negotiable)

- BFF-NAV-01 field shapes are locked to verified DTO shapes. No field name may be changed without updating the backend DTO first.
- `setOrderAccessCookie` in the orders handler MUST NOT be removed or moved by this change.
- `updateAddressSchema` MUST accept empty `{}` — marking all fields `.optional()` is required.
- All HTTP 400 responses MUST have `Content-Type: application/json`.
- Body MUST be read exactly once per request (one `req.json()` call via `validateBody`). After `v.data` is obtained, `req.json()` MUST NOT be called again.
