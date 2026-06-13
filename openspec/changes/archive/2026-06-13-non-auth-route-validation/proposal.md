# Proposal: Non-Auth Route Input Validation (BFF Security Slice 2)

## Intent

Slice 1 (`bff-security-hardening`, MERGED) built the reusable validation infra: `validateBody(request, schema)` (discriminated union, reads body once, strips unknown keys) and the `proxyToBackend` `body?` option. It validated 9 auth routes. This slice extends the SAME validate-then-forward pattern to 5 non-auth POST/PATCH routes that currently blind-proxy untrusted bodies. Goal: close the remaining unvalidated BFF surface so no non-auth route forwards an unverified body to amber-back.

## Scope

### In Scope (5 routes, validate-then-forward)
- `POST /api/orders` — `createOrderSchema` (nested: `items` array of objects, `.min(1)`; numeric `product_id`/`quantity`/`unit_price`). Uses `backendFetch` + post-success `setOrderAccessCookie`.
- `POST /api/coupons/validate` — `validateCouponSchema` `{code, cart_total:number}` via `proxyToBackend` `body?`.
- `POST /api/contact` — `createContactMessageSchema` (name max100, email, phone? max20, subject max50, message max2000). Backend `@Throttle 3/60s`.
- `POST /api/addresses` — `createAddressSchema` (street Length(5,255), apartment? max100, city/region Length(2,100), zip_code? max20, is_default? boolean). Authenticated.
- `PATCH /api/addresses/[id]` — `updateAddressSchema` (all optional, same constraints; empty `{}` valid). Authenticated.

### Out of Scope (deferred backlog — files untouched)
- `POST /api/orders/card-payment` — backend endpoint does not exist (stub). No DTO to mirror.
- `POST /api/reviews` — backend route stubbed/404. Deferred.
- `PATCH /api/reviews/[id]/helpful` — sends no body, nothing to validate.
- Rate limiting — its own future slice.
- No TODO comments in deferred files (keeps verify clean).

## Capabilities

### New Capabilities
- `bff-input-validation`: input validation contract for non-auth BFF routes (orders, coupons, contact, addresses). Requirement prefix `BFF-NAV-*`. Mirrors slice-1 structure but for non-auth domains.

### Modified Capabilities
- None. Slice-1 `bff-security` spec (auth + headers) is untouched; infra is reused as-is, not modified.

## Approach

Reuse slice-1 infra unchanged. Per-domain schema files (screaming architecture, mirrors amber-back module boundaries):

| File | Schemas |
|---|---|
| `app/lib/ecommerce/schemas.ts` | `createOrderSchema`, `validateCouponSchema` |
| `app/lib/contact/schemas.ts` | `createContactMessageSchema` |
| `app/lib/addresses/schemas.ts` | `createAddressSchema`, `updateAddressSchema` |

Each handler: `validateBody` first → on failure return 400 (no forward) → on success forward `v.data`. Coupons/contact/addresses use `proxyToBackend(req, path, { body: v.data })`. Orders is the nuance: keep `backendFetch`, pass `v.data` directly (do NOT re-read `req.json()` — body is one-shot), preserve `setOrderAccessCookie` post-success logic intact.

**Parity contract**: schemas mirror amber-back DTO constraints EXACTLY — `z.number()` for numbers, Length/MaxLength mirrored, optional stays optional. Never stricter (slice-1 lesson: stricter rejects backend-valid requests). zod default strip drops unknown fields pre-forward. Each schema carries a `// Source:` parity-anchor comment.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `app/lib/ecommerce/schemas.ts` | New | order + coupon schemas |
| `app/lib/contact/schemas.ts` | New | contact schema |
| `app/lib/addresses/schemas.ts` | New | address create/update schemas |
| `app/api/orders/route.ts` | Modified | validate, preserve backendFetch + cookie |
| `app/api/coupons/validate/route.ts` | Modified | validate + `body?` |
| `app/api/contact/route.ts` | Modified | validate + `body?` |
| `app/api/addresses/route.ts` | Modified | validate + `body?` |
| `app/api/addresses/[id]/route.ts` | Modified | validate + `body?` |
| `app/api/**/*.test.ts` (5) | New | route tests (strict TDD) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Orders double body read throws (one-shot NextRequest) | Med | validate once, forward `v.data`; never call `req.json()` again |
| Schema stricter than DTO rejects valid requests | Med | exact parity + `// Source:` anchor; numbers as `z.number()` |
| Cookie emission regressed on orders | Med | dedicated test asserting cookie still set after success |
| Nested order shape under-tested | Med | explicit invalid-nested tests: wrong-type quantity, missing internal_sku, empty items |

## Rollback Plan

Pure additive. Revert the slice PR (or per-file revert). Schema files are new and isolated; handler edits are localized to the validate-then-forward seam. No infra/migration changes — reverting restores prior blind-proxy behavior.

## Dependencies

- Slice 1 (`bff-security-hardening`) MERGED — provides `validateBody` + `proxyToBackend` `body?`. Hard prerequisite, satisfied.
- amber-back DTOs (read-only parity source): `create-order.dto.ts`, `create-coupon.dto.ts`, `create-contact-message.dto.ts`, `address.dto.ts`.

## Success Criteria

- [ ] 5 routes reject invalid/missing/wrong-type bodies with 400, no forward.
- [ ] Unknown fields stripped before forward on all 5.
- [ ] Orders preserves `setOrderAccessCookie` and forwards validated `v.data` via `backendFetch` (no double read).
- [ ] Empty `{}` valid for `PATCH /api/addresses/[id]`.
- [ ] Schemas mirror DTO constraints exactly (parity comments present).
- [ ] All new route + schema tests pass (`pnpm test:run`).

## PR Size Forecast

Smaller than slice 1 (~600 lines, chained). 5 handler edits + 3 schema files + 5 test files. Estimate ~300-380 changed lines — likely fits ONE PR without `size:exception`. Flag at `sdd-tasks` if the forecast lands above 400 (then split: schemas+infra-reuse PR, then routes).
