# Design: Non-Auth Route Input Validation (BFF Security Slice 2)

## Technical Approach

Slice 2 extends the slice-1 validate-then-forward seam (see `openspec/specs/bff-security/spec.md` and ADR-001..007 in `sdd/bff-security-hardening/design`) to 5 non-auth routes. ALL slice-1 infra is reused UNCHANGED: `validateBody(req, schema)` (discriminated union, one-shot body read, zod strip of unknown keys) and `proxyToBackend(req, path, { body })`. This design documents ONLY what is new or different: the orders `backendFetch` seam, the per-domain schema layout, and the nested order-items array schema.

## Architecture Decisions

### ADR-S2-001: Orders seam keeps backendFetch (one-shot body invariant)

**Choice**: In `app/api/orders/route.ts`, run `validateBody(req, createOrderSchema)` as the FIRST statement; on `!v.ok` return `v.response`; on success replace `JSON.stringify(body)` with `JSON.stringify(v.data)` in the existing `backendFetch` call. Keep `getSession`/header build and the post-success `setOrderAccessCookie(data.order_number)` block byte-for-byte unchanged.

**Alternatives considered**: (a) Convert orders to `proxyToBackend({ body: v.data })` like the auth/proxy routes. (b) Validate after fetch.

**Rationale**: `proxyToBackend` does not run the optional-Bearer + `x-internal-api-key` header logic nor the signed-cookie emission, so converting would duplicate/lose behavior (rejected, mirrors slice-1 ADR-003 reasoning). VERIFIED in code: current route reads `req.json()` ONCE at L29; nothing re-reads the body after. validateBody also consumes the stream once. The one-shot-body invariant is preserved by having validateBody be the SOLE reader and forwarding `v.data` thereafter — `req.json()` MUST never appear again in the handler. This matches the login route precedent (`backendFetch(..., { body: JSON.stringify(v.data) })`).

### ADR-S2-002: Per-domain schema files (screaming architecture)

**Choice**: Three new zod-only modules mirroring amber-back module boundaries:
- `app/lib/ecommerce/schemas.ts` → `createOrderSchema`, `validateCouponSchema`
- `app/lib/contact/schemas.ts` → `createContactMessageSchema`
- `app/lib/addresses/schemas.ts` → `createAddressSchema`, `updateAddressSchema`

Style copied EXACTLY from `app/lib/auth/schemas.ts`: header comment, one `// Source: <dto>` parity-anchor per schema, `z.object({...})`, `.optional()` for optional fields, `.min(n)` for length floors, inferred `export type X = z.infer<typeof xSchema>`, NO `server-only` import (must load under jsdom/Vitest).

**Alternatives considered**: Single `app/lib/non-auth-schemas.ts`; or extend `app/lib/auth/schemas.ts`.

**Rationale**: Domain split keeps bounded contexts clear and each file small (software-architecture skill). Slice-1's single-file choice (ADR-001) was justified for the flat auth surface only; non-auth spans 3 distinct domains, so per-domain wins. Each file stays well under 200 lines.

### ADR-S2-003: updateAddressSchema = createAddressSchema.partial()

**Choice**: `updateAddressSchema = createAddressSchema.partial()`. Empty `{}` is valid.

**Rationale**: Backend `UpdateAddressDto` = `Partial<CreateAddressDto>` (confirmed in explore #895). `.partial()` derives identical constraints with zero drift — single source of truth, no copy-paste divergence. Mirrors slice-1's empty-`{}`-valid handling for `updateProfileSchema` (BFF-SEC-05).

### ADR-S2-004: Nested order-items array uses z.number() (no coercion)

**Choice**:
```ts
const orderItemSchema = z.object({
  product_id: z.number(),
  name: z.string().min(1),
  internal_sku: z.string().min(1),
  quantity: z.number().int().min(1),
  unit_price: z.number(),
  image_url: z.string().optional(),
});
export const createOrderSchema = z.object({
  customer_email: z.string().email(),
  customer_name: z.string().min(1),
  customer_phone: z.string().optional(),
  shipping_address: z.string().min(1),
  shipping_city: z.string().min(1),
  shipping_region: z.string().min(1),
  shipping_postal_code: z.string().optional(),
  items: z.array(orderItemSchema).min(1),
  coupon_code: z.string().optional(),
});
```

**Alternatives considered**: `z.coerce.number()` for numeric fields.

**Rationale**: VERIFIED in `app/lib/services/ecommerce.service.ts` L40-47/L98-103: client sends `product_id/quantity/unit_price/cart_total` as native JS `number`, serialized as JSON numbers. `z.number()` matches the wire type exactly; `z.coerce` would wrongly accept stringified numbers and break DTO parity (slice-1 "never stricter, never looser" lesson). `quantity` gets `.int().min(1)` to mirror backend `@Min(1)`. `validateCouponSchema = z.object({ code: z.string().min(1), cart_total: z.number() })`.

### ADR-S2-005: Authenticated address routes — { authenticated: true, body: v.data }

**Choice**: `POST /api/addresses` and `PATCH /api/addresses/[id]` keep `{ authenticated: true }` and ADD `body: v.data`: `proxyToBackend(req, path, { authenticated: true, body: v.data })`. Other GET/DELETE handlers in those files are untouched.

**Rationale**: Direct combination of slice-1 ADR-003 (`body` option) + existing auth flag. Tests mock `getSession` per slice-1 route-test pattern.

### ADR-S2-006: Error contract + unknown-field strip reused as-is

**Choice**: No redesign. `validateBody` already returns `validation_failed` / `invalid_request` (malformed JSON) with `{ error, message, issues }` and zod `.strip()` drops unknown keys pre-forward. Reference slice-1 ADR-004 / BFF-SEC-02.

## Data Flow

    POST /api/orders
      validateBody(req, createOrderSchema)  ←─ sole body reader (one-shot)
        ├─ !ok ─→ return v.response (400, no forward)
        └─ ok ──→ getSession → build headers
                  backendFetch('/ecommerce/orders', { body: JSON.stringify(v.data) })
                  on ok && data.order_number → setOrderAccessCookie(...)  [UNCHANGED]

    POST coupons|contact / POST,PATCH addresses
      validateBody(req, schema) → !ok return v.response
        └─ ok → proxyToBackend(req, path, { [authenticated], body: v.data })

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `app/lib/ecommerce/schemas.ts` | Create | createOrderSchema (+orderItemSchema), validateCouponSchema |
| `app/lib/contact/schemas.ts` | Create | createContactMessageSchema |
| `app/lib/addresses/schemas.ts` | Create | createAddressSchema, updateAddressSchema (.partial()) |
| `app/api/orders/route.ts` | Modify | validateBody first; forward v.data via backendFetch; cookie block intact |
| `app/api/coupons/validate/route.ts` | Modify | validate then proxyToBackend({ body: v.data }) |
| `app/api/contact/route.ts` | Modify | validate then proxyToBackend({ body: v.data }) |
| `app/api/addresses/route.ts` | Modify | POST: validate then proxyToBackend({ authenticated, body: v.data }) |
| `app/api/addresses/[id]/route.ts` | Modify | PATCH: validate then proxyToBackend({ authenticated, body: v.data }) |
| 5× `route.test.ts` | Create | strict TDD per slice-1 pattern |

## Interfaces / Contracts

`createContactMessageSchema`: `name` max100, `email` email, `phone?` max20, `subject` max50, `message` max2000 — expressed as `z.string().max(n)` (mirror DTO `@MaxLength`). `createAddressSchema`: `street` min5/max255, `apartment?` max100, `city`/`region` min2/max100, `zip_code?` max20, `is_default?` boolean.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (schemas) | each schema accept/reject, items `.min(1)`, `.partial()` empty `{}` valid | pure, no mocks |
| Route (orders) | valid→backendFetch once with v.data; invalid nested (bad quantity type, missing internal_sku, empty items)→400 no forward; **cookie still set on success** | hoisted `vi.mock(bff-proxy, session)`, `resetModules` + dynamic import |
| Route (coupons/contact) | valid forward, missing/wrong-type→400, unknown stripped | mock proxyToBackend |
| Route (addresses) | same + mock `getSession`; PATCH empty `{}`→forward | mock proxyToBackend + session |

## Migration / Rollout

No migration required. Pure additive — 3 new schema files + 5 localized handler edits at the validate seam. Rollback = revert PR or per-file.

## Open Questions

- None. All parity confirmed via explore #895; numeric wire types confirmed in ecommerce.service.ts.

## Contradictions vs proposal/explore

- None material. Proposal mentioned both "8 routes" (explore enumeration) and "5 active"; this design implements exactly the 5 active routes (orders, coupons/validate, contact, addresses POST, addresses [id] PATCH), with card-payment/reviews/reviews-helpful deferred as the proposal states (files untouched, no TODO comments).
