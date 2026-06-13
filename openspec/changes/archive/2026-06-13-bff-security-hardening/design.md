# Design — BFF Security Hardening (Slice 1)

Change: `bff-security-hardening`
Phase: design (architecture / ADR)
Repo: amber-ecommerce (Next.js 16 App Router, BFF)
Artifact store: hybrid (engram `sdd/bff-security-hardening/design` + this file)
Reads: proposal #875, auth-contracts #872, architecture-decision #867

> Architectural HOW. No task list here. Decisions in ADR format
> (status / context / decision / consequences / alternatives).

---

## 0. Verified code reality (read this phase)

Before designing, the actual code was read end-to-end. Findings that
shape every decision below:

1. **`proxyToBackend` already reads and re-serializes the body** (bff-proxy.ts
   L132-140): `const parsed = await req.json(); body = JSON.stringify(parsed);`.
   It does NOT stream the raw request — it parses to an object and
   re-stringifies. This is the seam that makes validation injection cheap.
2. **`backendFetch`** is the manipulate-the-response path (login, register,
   google) — used when the handler must `setSession()` from the backend reply.
3. **Both seams set `Content-Type: application/json` and inject
   `x-internal-api-key`.** `proxyToBackend` also injects `Authorization` and
   handles 401 auto-refresh. `backendFetch` does the same only when
   `authenticated: true` is passed.
4. **proxy.ts matcher EXCLUDES `api/*`** (L173) — so proxy.ts security headers
   never touch `/api/*` responses. No API header regression risk from header edits.
5. **Header reality CONTRADICTS the proposal** (see ADR-005). proxy.ts L154-155
   already set `X-Content-Type-Options: nosniff` and `Referrer-Policy:
   strict-origin-when-cross-origin`. next.config.ts sets the SAME nosniff plus a
   WEAKER `Referrer-Policy: origin-when-cross-origin`. The duplication/conflict
   lives in next.config.ts, not proxy.ts.
6. **Google login is CURRENTLY BROKEN** (see ADR-006). Confirmed by reading the
   backend.

### CONTRADICTION — google `credential` (CONFIRMED, production bug)

| Layer | File | Field sent/expected |
|---|---|---|
| Client service | app/lib/services/auth.service.ts L30, L84 | sends `{ id_token }` |
| BFF google route | app/api/auth/google/route.ts L21,29 | reads `body.id_token`, forwards `{ id_token }` |
| BFF link-google | app/api/auth/link-google/route.ts | blind proxy, forwards whatever client sent (`id_token`) |
| Backend DTO | amber-back/.../google-auth.dto.ts | `credential: string` (@IsString) |
| Backend controller | ecommerce-auth.controller.ts L28 | `@UsePipes(StrictValidationPipe)` |
| Backend pipe | common/pipes/validation-pipe.factory.ts L57-59 | `whitelist:true` + `forbidNonWhitelisted:true` |
| Backend service | ecommerce-auth.service.ts L130, L354 | reads `dto.credential` |

The backend pipe is `forbidNonWhitelisted`. A payload `{ id_token: ... }` has an
unknown property (`id_token`) → 400, and `credential` is missing → `IsString`
fails → 400. **Therefore `/ecommerce-auth/google` and `/ecommerce-auth/link-google`
reject every current BFF request.** Google login is not merely mismatched — it is
dead. The e2e test `e2e/auth-bff.spec.ts:65` ("rechaza sin id_token con 400")
codifies the WRONG contract. This must be reconciled (ADR-006).

This corrects #872 ("GoogleAuthDto { id_token } — not yet read") and confirms
#875's suspicion. The client already HAS the right value: `AuthModal.tsx:266`
passes `response.credential` (the real Google ID token) into `googleAuth()` — only
the wire field name is wrong.

---

## ADR-001 — Schema location: one shared module `app/lib/auth/schemas.ts`

**Status:** Accepted

**Context.** Nine auth endpoints need zod schemas mirroring the verified backend
DTOs (#872). Options for placement range from per-endpoint colocated files to a
single shared module. Architecture baseline (#867): Screaming Architecture with
vertical slices, but selective/pragmatic — this is a flat Next.js BFF, not a
domain backend. There is no `features/auth` slice today; auth lives across
`app/api/auth/*` and `app/lib/services/auth.service.ts`. react-hook-form client
reuse of the same schemas is likely in a future slice.

**Decision.** A single framework-pure module `app/lib/auth/schemas.ts` exporting
one named zod schema per endpoint (`loginSchema`, `registerSchema`,
`forgotPasswordSchema`, `resetPasswordSchema`, `changePasswordSchema`,
`createPasswordSchema`, `googleAuthSchema`, `updateProfileSchema`). `link-google`
reuses `googleAuthSchema`. The module imports `zod` only — NO `server-only`, NO
Next imports — so client components and tests can import it freely.

**Consequences.**
- One cohesive auth contract, trivially diffable against backend DTOs.
- Client (react-hook-form) and BFF share the exact same schema → no drift.
- Pure module → unit-testable in isolation, no mock seam needed.
- If/when a real `features/auth` slice is carved out, this file moves wholesale;
  the import surface is a single path, cheap to relocate (reversible).

**Alternatives rejected.**
- *Per-endpoint files* (`app/api/auth/login/schema.ts`): 9 tiny files, more
  import noise, no cohesion, harder to audit contract parity in one view.
  Over-structuring for a flat BFF — violates pragmatic selective-hexagonal.
- *Inline schemas in each route handler*: duplication, no client reuse, untestable
  in isolation.
- *Full `features/auth/domain` layer*: Golden Hammer (#867 explicitly rejects
  full hexagonal for the storefront/BFF).

---

## ADR-002 — Validation helper: `validateBody` in `app/lib/validation.ts`

**Status:** Accepted

**Context.** All 9 handlers must validate consistently. Two flow types exist:
`backendFetch` handlers (login, register, google) that need the PARSED object to
later `setSession`, and `proxyToBackend` handlers (the blind proxies). We want
ONE invocation pattern, a structured 400 shape, and it must not leak account
existence (ADR-004). The body is read exactly once (NextRequest body is a
one-shot stream — reading it twice throws).

**Decision.** A single generic helper in `app/lib/validation.ts`
(framework-aware: imports `next/server` + `zod`, but NOT `server-only`, so it is
testable under jsdom like the existing route tests).

Signature (discriminated-union result so callers branch without throwing):

```ts
import { NextResponse } from 'next/server';
import type { z } from 'zod';

type ValidationOk<T> = { ok: true; data: T };
type ValidationErr = { ok: false; response: NextResponse };

export async function validateBody<S extends z.ZodTypeAny>(
  request: Request,            // NextRequest is assignable to Request
  schema: S,
): Promise<ValidationOk<z.infer<S>> | ValidationErr>;
```

Behavior:
1. `await request.json()` inside a try/catch. Malformed/empty JSON → `ok:false`
   with a generic 400 (`{ error: 'invalid_request', message: 'Cuerpo inválido' }`).
2. `schema.safeParse(parsed)`. On failure → `ok:false` with the structured 400
   (ADR-004 shape). On success → `ok:true` with `data` = the zod-PARSED object
   (zod strips unknown keys by default → `__proto__`/mass-assignment mitigated).
3. The helper consumes the body ONCE. Callers MUST use `result.data` and never
   re-read `request.json()`.

Caller pattern (identical for both flows):

```ts
const v = await validateBody(req, loginSchema);
if (!v.ok) return v.response;
// backendFetch flow: body: JSON.stringify(v.data)
// proxy flow: forward v.data (see ADR-003)
```

**Consequences.**
- One pattern across all 9 handlers; the 400 contract lives in exactly one place.
- Discriminated union → no exceptions for control flow, type-narrowed `data`.
- Body read once → no "body already consumed" bug.
- Returns `NextResponse` so the handler just `return v.response`.

**Alternatives rejected.**
- *Throw-on-invalid + try/catch in handler*: exceptions as control flow, every
  handler needs a catch, easy to forget → inconsistent. Rejected.
- *Higher-order route wrapper* `withValidation(schema, handler)`: cleaner in
  theory but the two flows diverge after validation (one sets a session, one
  proxies), so a wrapper would need escape hatches. More magic, less explicit.
  Deferred — the explicit `if (!v.ok) return v.response` is clearer for a 9-route
  audit and strict TDD.
- *Returning raw zod error*: leaks internal structure and is awkward to assert in
  tests. We map to a fixed shape (ADR-004).

---

## ADR-003 — Blind-proxy seam: validate in handler, forward parsed object via `proxyToBackend` (KEEP proxyToBackend)

**Status:** Accepted — riskiest decision, made concrete here.

**Context.** Six handlers are blind proxies that never inspect the body:
`forgot-password`, `reset-password`, `change-password`, `create-password`,
`link-google`, and `profile` PUT. They call `proxyToBackend(req, path[, opts])`,
which internally does `await req.json()` then `JSON.stringify`. The risk: if the
handler ALSO reads the body (to validate), the NextRequest stream is consumed and
`proxyToBackend`'s internal `req.json()` throws → body silently becomes
`undefined` (the catch at L137-138) → backend gets an empty body. So we cannot
naively "validate in handler then call proxyToBackend(req)".

**Decision.** Validate in the handler with `validateBody` (consuming the body
once), then forward the PARSED object explicitly. Extend `proxyToBackend` with a
new option `body?: unknown` that, when present, is used directly instead of
re-reading the request:

```ts
interface ProxyOptions {
  authenticated?: boolean;
  optionalAuth?: boolean;
  extraHeaders?: Record<string, string>;
  forwardBody?: boolean;
  body?: unknown;            // NEW: pre-parsed/validated body; skips req.json()
}
```

Inside `proxyToBackend`, the body-resolution block (currently L132-140) becomes:

```ts
let body: string | undefined;
if (hasBody) {
  if (options.body !== undefined) {
    body = JSON.stringify(options.body);     // pre-validated path
  } else {
    try { body = JSON.stringify(await req.json()); }
    catch { body = undefined; }              // legacy path, untouched
  }
}
```

Blind-proxy handler after the change (example forgot-password):

```ts
export async function POST(req: NextRequest) {
  const v = await validateBody(req, forgotPasswordSchema);
  if (!v.ok) return v.response;
  return proxyToBackend(req, '/ecommerce-auth/forgot-password', { body: v.data });
}
```

`req` is still passed because `proxyToBackend` needs it for method, query params,
session/auth (`authenticated: true` for change/create/link-google/profile), and
401-refresh — it just won't re-read the body when `options.body` is set.

**Consequences.**
- ONE mechanism for ALL routes (no split between backendFetch and proxy). The
  `backendFetch` handlers (login/register/google) keep using `backendFetch` with
  `body: JSON.stringify(v.data)` because they need the response to set a session;
  the proxy handlers keep `proxyToBackend` with the new `body` option. Consistent
  rule: *validate first with `validateBody`, then forward `v.data`.*
- Backward compatible: every existing `proxyToBackend` call that does NOT pass
  `body` behaves exactly as today (legacy `req.json()` path). Non-auth routes
  untouched.
- Only zod-parsed (stripped) data crosses the wire → prototype-pollution /
  mass-assignment vector closed at the BFF edge (defense-in-depth on top of the
  backend `forbidNonWhitelisted` pipe).
- The double-read hazard is eliminated by contract: if `options.body` is set,
  `req.json()` is never called.

**Alternatives rejected.**
- *Switch the 6 proxies to `backendFetch`*: would require each handler to manually
  re-implement auth-token injection, 401 auto-refresh, query forwarding, and
  content-type passthrough that `proxyToBackend` already centralizes. High
  duplication, high regression risk on the auth-refresh path. Rejected.
- *Have `proxyToBackend` take the schema and validate internally*: couples the
  proxy (server-only, has `Authorization`/session concerns) to the schema module
  and makes the 400 shape live in two places. Also harder to unit-test the schema
  branch without the full proxy. Rejected — keep validation in the framework-aware
  helper, keep proxy as transport.
- *Clone the request* (`req.clone()` then read clone, pass original to proxy):
  works, but relies on Next/undici clone semantics for already-buffered bodies and
  is subtler than an explicit `body` option. The explicit option is more readable
  and trivially testable. Rejected as the primary path.

---

## ADR-004 — Validation error contract (structured, non-leaking)

**Status:** Accepted

**Context.** The 400 must be (a) consistent across all 9 endpoints, (b) useful to
the client for field-level UX, and (c) must NOT leak account existence —
critically for `forgot-password`, where revealing "email not found" enumerates
accounts. The proposal flags this; account-existence semantics are the backend's
job (it returns a generic success for forgot-password regardless), but our
VALIDATION error must stay generic too.

**Decision.** Fixed JSON shape for schema validation failures:

```jsonc
{
  "error": "validation_failed",
  "message": "Datos inválidos",          // generic, user-safe, never per-account
  "fields": {                              // which fields failed + why (shape only)
    "email": "Email inválido",
    "new_password": "Mínimo 6 caracteres"
  }
}
```

Rules:
- `fields` reports ONLY the property name and a generic constraint message derived
  from the zod issue. It NEVER echoes the submitted value and NEVER says anything
  about whether a record exists.
- Malformed JSON (not a schema issue) → `{ "error": "invalid_request", "message":
  "Cuerpo inválido" }`, status 400, no `fields`.
- Built by mapping `safeParse` `error.issues` → `{ [issue.path[0]]: message }`.
  Use zod schema-level custom messages (Spanish, user-facing) so the map is
  stable and assertable in tests.
- `forgot-password` validation only checks `email` is a syntactically valid email.
  It says nothing about existence — existence handling stays 100% backend-side and
  returns the SAME success body whether or not the email exists.
- HTTP status is always `400` for validation; `401`/`409`/etc. remain the
  backend's domain (forwarded untouched by the proxy).

**Consequences.**
- Client can highlight invalid fields without any account-enumeration signal.
- Single shape → one set of test assertions reused across routes.
- No value echo → no reflected-input / XSS-in-error surface.

**Alternatives rejected.**
- *Return raw zod `flatten()`*: leaks zod internals, includes `formErrors`/
  `fieldErrors` arrays that are awkward and inconsistent to assert. Rejected.
- *Plain string message only*: loses field-level UX the client wants. Rejected.
- *Include offending values for debugging*: account-enumeration + reflected-input
  risk. Rejected.

---

## ADR-005 — Header cleanup: fix next.config.ts, leave proxy.ts as-is (CONTRADICTS proposal)

**Status:** Accepted — corrects proposal #875.

**Context.** Proposal said: "remove duplicate X-Content-Type-Options + conflicting
Referrer-Policy from proxy.ts (~L154-155); upgrade Referrer-Policy in
next.config.ts to strict-origin-when-cross-origin." Reading the code shows this is
backwards:

- proxy.ts L154-155 ALREADY set `X-Content-Type-Options: nosniff` and the STRONG
  `Referrer-Policy: strict-origin-when-cross-origin`.
- next.config.ts L44-45 set the SAME `nosniff` AND the WEAKER `Referrer-Policy:
  origin-when-cross-origin`.
- proxy.ts matcher excludes `api/*` and static assets; next.config.ts `headers()`
  applies to `/(.*)` (everything, including `/api/*` and static).

So on page routes the browser receives TWO `Referrer-Policy` values (weak from
next.config, strong from proxy) and two identical `nosniff`. Removing them from
proxy.ts would WEAKEN security on pages (only the weak next.config value remains)
and remove the strong policy entirely.

**Decision.** Keep proxy.ts L154-156 unchanged (it is the correct, strong,
nonce-bearing layer for page routes). In next.config.ts:
- Change `Referrer-Policy` value from `origin-when-cross-origin` to
  `strict-origin-when-cross-origin` (L45) so the global default matches the strong
  policy and `/api/*` + static assets also get the strong value.
- Leave `X-Content-Type-Options: nosniff` in next.config.ts as the global baseline
  (it legitimately covers `/api/*` and static, which proxy.ts does not). The
  proxy.ts duplicate on page routes is harmless (identical value) — do NOT remove
  it; removing it would drop nosniff on the page-route layer if next.config
  changes later. Identical-value duplication of nosniff is acceptable and the
  proposal's "duplicate" concern is moot once values agree.

Net edits: ONE value change in next.config.ts. proxy.ts untouched. CSP stays
exclusively in proxy.ts (already true — next.config.ts comment L55-58 confirms it
was deliberately removed from there).

**Consequences.**
- Single coherent `Referrer-Policy: strict-origin-when-cross-origin` everywhere
  (pages via proxy, api/static via next.config — same value, no contradiction).
- No security regression; `/api/*` responses gain the strong referrer policy.
- Smaller, safer diff than the proposal's plan (which would have weakened pages).

**Alternatives rejected.**
- *Follow the proposal literally (strip proxy.ts L154-155)*: weakens page-route
  security. Rejected with evidence above.
- *Remove nosniff from next.config and keep only proxy.ts*: would drop nosniff on
  `/api/*` and static assets (proxy matcher excludes them). Rejected.

---

## ADR-006 — Google credential reconciliation (fix the dead login path)

**Status:** Accepted — fixes a confirmed production bug; affects apply + e2e.

**Context.** Per section 0, the BFF sends `id_token` but the backend strictly
requires `credential` and rejects unknown fields → google login and link-google
are broken. The client already holds the correct token; only field names are wrong
along the BFF chain. The wrong contract is also encoded in an e2e test.

**Decision.** Reconcile the entire chain to `credential`:
1. `googleAuthSchema = z.object({ credential: z.string().min(1) })` (mirrors
   `GoogleAuthDto`, used by both `google` and `link-google`).
2. `app/api/auth/google/route.ts`: validate with `googleAuthSchema`; forward
   `{ credential: v.data.credential }` via `backendFetch` (keeps `setSession`
   flow). Remove the `id_token` presence check (L21-23) and the `id_token`
   forward (L29).
3. `app/api/auth/link-google/route.ts`: `validateBody(req, googleAuthSchema)` then
   `proxyToBackend(req, '/ecommerce-auth/link-google', { authenticated: true,
   body: v.data })`.
4. Client `app/lib/services/auth.service.ts` L29-31 and L83-85: send
   `{ credential: idToken }` instead of `{ id_token: idToken }`. (The variable is
   still the Google credential JWT — only the wire key changes.) `AuthModal.tsx`
   already passes `response.credential` in, so no UI change.
5. e2e `e2e/auth-bff.spec.ts:65`: update the test name + assertion to "rechaza sin
   `credential` con 400" so the test encodes the correct contract.

This is in-scope for this slice because validating google/link-google REQUIRES
choosing the correct field; shipping the schema with `id_token` would lock in the
broken contract.

**Consequences.**
- Google login/link actually works after this slice (latent bug fixed as a
  side-effect of correct validation).
- The e2e and any docs in `requerimientos/13-*.md` referencing `{ id_token }` on
  the wire become stale — flag for a docs follow-up (out of code scope here).
- The change spans client + BFF + e2e in one slice; it belongs in the same PR as
  the google/link-google validation (PR3 in the proposal's chaining).

**Alternatives rejected.**
- *Translate `id_token`→`credential` only inside the BFF, leave client as-is*:
  hides the bug behind a BFF shim, keeps the client contract wrong, and the BFF
  schema would have to accept `id_token` (non-mirroring). Rejected — fix it at the
  source.
- *Defer google to a later slice*: would require shipping a deliberately wrong or
  permissive schema now. Rejected.

---

## ADR-007 — Testing approach (strict TDD, Vitest, `pnpm test:run`)

**Status:** Accepted

**Context.** Strict TDD is active (#867). Existing pattern (route.test.ts) runs
under jsdom, mocks `../../lib/session` and `../../lib/bff-proxy` with
`vi.mock(...)`, and `server-only` is already aliased to an empty module in
`vitest.config.mts` / `__mocks__/server-only.ts`. Schemas are pure; the helper is
framework-aware but not server-only; the proxy is server-only.

**Decision.** Three test layers, RED→GREEN per unit:

1. **`app/lib/auth/schemas.test.ts`** (pure, no mocks). Per schema: valid input
   parses; each required field missing → issue on that field; wrong type → issue;
   unknown field is STRIPPED (assert `__proto__`/extra key absent from parsed
   output); password schemas reject `< 6` and accept `>= 6`; reset uses
   `new_password`; google uses `credential`.
2. **`app/lib/validation.test.ts`** (helper in isolation). Build a tiny throwaway
   schema. Assert: valid body → `{ ok:true, data }` with stripped object; invalid
   body → `{ ok:false }` whose `response` is a 400 with the ADR-004 shape (parse
   `await response.json()`); malformed JSON → `invalid_request` 400; body is read
   exactly once. No `server-only` concern (helper doesn't import it).
3. **Per-route** `app/api/auth/<name>/route.test.ts` (mock the seam). Reuse the
   existing pattern: `vi.mock('../../../lib/bff-proxy', () => ({ backendFetch:
   vi.fn(), proxyToBackend: vi.fn() }))` and `vi.mock('../../../lib/session')`.
   For each route assert: valid body → seam called once with the PARSED/forwarded
   data (`backendFetch` body or `proxyToBackend` `{ body }` option) and NO 400;
   missing field → 400 with ADR-004 shape and seam NOT called (no forward);
   wrong type → 400; unknown field → stripped before forward. For `forgot-password`
   additionally assert the 400 message is generic (no existence signal).
   For `google`/`link-google` assert `credential` is required and forwarded (not
   `id_token`).

Mock seam summary: tests never hit the network; they mock `bff-proxy`
(`backendFetch`/`proxyToBackend`) and `session`. `server-only` stays aliased
(only the proxy imports it, and the proxy is mocked in route tests). The
`proxyToBackend` `body` option (ADR-003) is verified by asserting the mock's call
args, plus one focused test on the real proxy that passing `options.body` skips
`req.json()` (can be done by spying on a request whose `.json()` would throw).

**Consequences.**
- Schema and helper get fast, pure unit coverage; routes get behavioral coverage
  on the validate→forward seam without network or real backend.
- Strcategy aligns with the only existing route test, minimizing new test infra.

**Alternatives rejected.**
- *Integration tests hitting a real/stubbed backend*: slower, flaky, out of slice
  scope; the contract is already pinned by schemas mirroring DTOs. Rejected for
  this slice.

---

## Component & data-flow summary

```
Browser ──JSON──▶ app/api/auth/<x>/route.ts
                       │ 1. validateBody(req, <x>Schema)   [app/lib/validation.ts]
                       │      └─ schemas from app/lib/auth/schemas.ts (pure)
                       │ 2a. if !ok → return 400 (ADR-004 shape)   ──▶ Browser
                       │ 2b. if ok  → forward v.data only (stripped)
                       ▼
        ┌──────────────────────────────┬───────────────────────────────┐
        │ backendFetch (login/register/ │ proxyToBackend({ body: v.data})│
        │ google) — needs response to   │ (forgot/reset/change/create/   │
        │ setSession()                  │  link-google/profile PUT)      │
        └──────────────┬───────────────┴───────────────┬───────────────┘
                       ▼                                ▼
            amber-back /ecommerce-auth/*  (StrictValidationPipe: whitelist+forbidNonWhitelisted)
```

Headers (page routes): proxy.ts sets CSP(nonce) + nosniff + strong Referrer-Policy.
Headers (api/static): next.config.ts sets nosniff + strong Referrer-Policy
(after ADR-005 value fix) + X-Frame-Options/HSTS/Permissions-Policy.

## Files this design implies (for tasks phase — NOT a task list)

- NEW `app/lib/auth/schemas.ts`, `app/lib/auth/schemas.test.ts`
- NEW `app/lib/validation.ts`, `app/lib/validation.test.ts`
- EDIT `app/lib/bff-proxy.ts` (add `body?: unknown` option; resolve body from it)
- EDIT 9 handlers under `app/api/auth/*` + their `*.test.ts`
- EDIT `app/lib/services/auth.service.ts` (google/link-google → `credential`)
- EDIT `next.config.ts` (Referrer-Policy value)
- EDIT `e2e/auth-bff.spec.ts` (google contract → `credential`)
- EDIT `package.json` (add `zod`)
- proxy.ts: NO change (ADR-005)

## Open risks / assumptions

- **Risk:** the `proxyToBackend` `body` option must be added BEFORE any blind-proxy
  handler is converted, or the body double-read bug bites. Sequencing matters in
  apply (helper + proxy option first, then routes).
- **Risk:** ADR-006 touches client + e2e; if google/link-google ship without the
  client field rename, login stays broken (must land together).
- **Assumption:** `zod` is acceptable as a new prod dependency (proposal scope).
- **Assumption:** backend forgot-password already returns a generic success
  regardless of email existence (consistent with non-leak goal); BFF only must not
  introduce a leak — verified no existence logic lives in the BFF route.
- **Doc debt (out of code scope):** `requerimientos/13-autenticacion-ecommerce.md`
  documents `{ id_token }` on the wire — stale after ADR-006.
