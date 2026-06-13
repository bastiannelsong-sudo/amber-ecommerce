# BFF Security Hardening — Slice 1 Specification

Change: `bff-security-hardening`
Domains: **auth-validation** (new), **security-headers** (new)
Requirement prefix: `BFF-SEC-*`

---

## Purpose

Define what MUST be true after applying this change. This is a NEW capability spec (no prior spec for these domains).

---

## Domain 1: Auth Route Handler Input Validation

### BFF-SEC-01 — Zod Schema Parity Contract

All zod schemas for auth routes MUST mirror the verified amber-back DTO contracts from `amber-back/src/ecommerce-auth/dto/`. The schemas MUST NOT impose stricter constraints than the backend (doing so would reject backend-valid requests). Any divergence MUST be treated as a breaking contract violation.

| Schema | Required Fields | Optional Fields | Rules |
|---|---|---|---|
| `loginSchema` | `email`, `password` | — | email format; password non-empty string |
| `registerSchema` | `first_name`, `last_name`, `email`, `password` | `phone` | email format; password min(6) |
| `forgotPasswordSchema` | `email` | — | email format |
| `resetPasswordSchema` | `token`, `new_password` | — | `new_password` min(6) — NOT `password` |
| `changePasswordSchema` | `current_password`, `new_password` | — | `new_password` min(6) |
| `createPasswordSchema` | `password` | — | password min(6) |
| `googleAuthSchema` | `credential` | — | non-empty string — NOT `id_token` |
| `linkGoogleSchema` | `credential` | — | non-empty string — NOT `id_token` |
| `updateProfileSchema` | — | `first_name`, `last_name`, `email`, `phone`, `avatar_url` | email format when present; all fields optional |

#### Scenario: Valid login body is accepted

- GIVEN a POST to `/api/auth/login` with `{ email: "a@b.com", password: "secret" }`
- WHEN the handler validates the body
- THEN validation passes and the parsed object is forwarded to the backend
- AND the backend proxy is called exactly once

#### Scenario: Invalid login email is rejected

- GIVEN a POST to `/api/auth/login` with `{ email: "not-an-email", password: "secret" }`
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400
- AND the backend proxy is NOT called

#### Scenario: Missing required field returns 400

- GIVEN a POST to `/api/auth/register` with `{ first_name: "Ana", email: "a@b.com", password: "123456" }` (missing `last_name`)
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400
- AND the backend proxy is NOT called

#### Scenario: Wrong type on required field returns 400

- GIVEN a POST to `/api/auth/login` with `{ email: 12345, password: "secret" }`
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400

#### Scenario: Unknown field is stripped before forwarding

- GIVEN a POST to `/api/auth/login` with `{ email: "a@b.com", password: "secret", __proto__: "evil" }`
- WHEN the handler validates and strips the body
- THEN the backend proxy is called with an object that does NOT contain `__proto__`

---

### BFF-SEC-02 — Validation Error Response Shape

On validation failure, the handler MUST return HTTP 400 with a JSON body having a stable, structured shape. The shape MUST NOT include internal stack traces or raw zod error objects.

#### Scenario: 400 response has structured error body

- GIVEN any auth route receives an invalid body
- WHEN the handler returns 400
- THEN the response body is valid JSON containing at minimum `{ error: string, issues: array }`
- AND the response Content-Type is `application/json`

---

### BFF-SEC-03 — No Forward on Failure

The BFF MUST NOT call the backend if body validation fails. This is an absolute prohibition.

#### Scenario: Backend is never called on invalid input

- GIVEN any auth route receives a body that fails zod validation
- WHEN the handler executes
- THEN the backend proxy function is called zero times

---

### BFF-SEC-04 — Google / link-google Field Reconciliation

The `google` and `link-google` route handlers MUST use `credential` (not `id_token`) to match the verified `GoogleAuthDto`. The existing handler code that references `id_token` MUST be reconciled to `credential` as part of this change.

#### Scenario: google auth with credential field forwards correctly

- GIVEN a POST to `/api/auth/google` with `{ credential: "google-jwt-token" }`
- WHEN the handler validates the body
- THEN validation passes and the backend is called with `{ credential: "google-jwt-token" }`

#### Scenario: google auth with id_token field is rejected

- GIVEN a POST to `/api/auth/google` with `{ id_token: "google-jwt-token" }` (wrong field name)
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400
- AND the backend proxy is NOT called

---

### BFF-SEC-05 — Profile PUT Accepts All-Optional Body

The `profile` PUT route MUST accept an empty body `{}` as valid (all fields optional). It MUST also accept a body with any subset of the optional fields.

#### Scenario: Empty body is valid for profile PUT

- GIVEN a PUT to `/api/auth/profile` with body `{}`
- WHEN the handler validates the body
- THEN validation passes and the backend is called with `{}`

#### Scenario: Partial update with one field forwards only that field

- GIVEN a PUT to `/api/auth/profile` with body `{ first_name: "Marco" }`
- WHEN the handler validates and strips the body
- THEN the backend is called with exactly `{ first_name: "Marco" }` (no extra keys)

#### Scenario: Invalid email in profile PUT returns 400

- GIVEN a PUT to `/api/auth/profile` with body `{ email: "not-email" }`
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400

---

### BFF-SEC-06 — Password MinLength Parity

Password fields MUST enforce min(6) to mirror the backend. The BFF MUST NOT enforce a stricter minimum (e.g. min(8)) unless the backend is updated first and this spec is revised accordingly.

#### Scenario: 6-character password is accepted

- GIVEN any password-bearing route receives a body with a 6-character password
- WHEN the handler validates the body
- THEN validation passes

#### Scenario: 5-character password is rejected

- GIVEN any password-bearing route receives a body with a 5-character password
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400

---

### BFF-SEC-07 — reset-password Uses new_password Field

The reset-password route schema MUST use field name `new_password`, NOT `password`. A body with `password` (wrong name) MUST be treated as a missing required field and rejected.

#### Scenario: reset-password with new_password is accepted

- GIVEN a POST to `/api/auth/reset-password` with `{ token: "tok", new_password: "abc123" }`
- WHEN the handler validates the body
- THEN validation passes

#### Scenario: reset-password with password (wrong name) is rejected

- GIVEN a POST to `/api/auth/reset-password` with `{ token: "tok", password: "abc123" }`
- WHEN the handler validates the body
- THEN validation fails and the handler returns HTTP 400

---

## Domain 2: Security Header Cleanup

### BFF-SEC-08 — Single Referrer-Policy Header on Page Responses

Page responses MUST carry exactly ONE `Referrer-Policy` header with value `strict-origin-when-cross-origin`. The conflicting weaker value (`origin-when-cross-origin`) previously set in `next.config.ts` MUST be replaced. The duplicate set in `proxy.ts` (lines ~154-155) MUST be removed. The net result: one authoritative source per response type.

#### Scenario: Page response carries a single Referrer-Policy header

- GIVEN a page response from the Next.js application
- WHEN response headers are inspected
- THEN exactly one `Referrer-Policy` header is present
- AND its value is `strict-origin-when-cross-origin`

---

### BFF-SEC-09 — Single X-Content-Type-Options Header

Page responses MUST carry exactly ONE `X-Content-Type-Options: nosniff` header. The duplicate currently present in `proxy.ts` (~L154-155) MUST be removed. The value set in `next.config.ts` remains authoritative.

#### Scenario: Page response carries a single X-Content-Type-Options header

- GIVEN a page response from the Next.js application
- WHEN response headers are inspected
- THEN exactly one `X-Content-Type-Options` header is present
- AND its value is `nosniff`

---

### BFF-SEC-10 — CSP Nonce Stays in proxy.ts Only

The Content Security Policy (CSP) header with per-request nonce generation MUST remain in `proxy.ts` exclusively. It MUST NOT be added to `next.config.ts` as a static header (that would break nonce rotation). This requirement is a preservation invariant — no change is needed, but apply MUST NOT inadvertently move it.

#### Scenario: CSP is not present in next.config.ts static headers

- GIVEN the `next.config.ts` headers configuration
- WHEN it is inspected
- THEN no `Content-Security-Policy` header is defined there

---

## Testing Contract

### BFF-SEC-T1 — Test Pattern

Each auth route handler under `app/api/auth/*/route.ts` MUST have a co-located or sibling test file following the existing Vitest pattern from `app/api/orders/[orderNumber]/route.test.ts`: hoisted `vi.mock`, `vi.resetModules()` + dynamic `import()` in `beforeEach`, `NextRequest` construction.

### BFF-SEC-T2 — Required Scenarios Per Route

Every validated route test MUST cover:
1. Valid body → backend proxy called once with the parsed (stripped) object.
2. Each required field missing individually → HTTP 400, proxy not called.
3. Wrong type on at least one field → HTTP 400.
4. Unknown field in body → proxy called with object that does NOT contain the unknown field.

### BFF-SEC-T3 — Parity Contract Invariant

The zod schemas MUST be documented (inline comment) with the source amber-back DTO file and class name (e.g. `// Source: amber-back/src/ecommerce-auth/dto/login.dto.ts — LoginDto`). This comment is the parity anchor: if the backend DTO changes, the comment signals the schema needs review.

---

## Invariants (non-negotiable across all requirements)

- `BFF-SEC-01` field names are locked to the verified DTO shapes. No field name may be changed without updating the corresponding backend DTO first.
- `BFF-SEC-06` min(6) MUST NOT be raised to any higher value in this change.
- `BFF-SEC-04` `id_token` MUST NOT appear in any schema or handler after this change is applied.
- All HTTP 400 responses from validation failures MUST have `Content-Type: application/json`.
