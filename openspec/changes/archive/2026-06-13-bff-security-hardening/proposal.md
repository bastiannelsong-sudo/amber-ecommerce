# Proposal: BFF Security Hardening — Slice 1 (Auth Input Validation + Header Cleanup)

Change: `bff-security-hardening`
Repo: `amber-ecommerce` (Next.js 16 App Router storefront, BFF pattern)
Status: proposed
Phase: propose

---

## 1. Intent

### Problem
The BFF route handlers under `app/api/auth/*` accept untrusted browser input and forward it to the NestJS backend (`amber-back`) with little or no validation:

- Some endpoints (login, register, google) do **presence-only** checks (truthy), no type/format/length validation.
- Several endpoints (forgot-password, reset-password, change-password, create-password, link-google, profile PUT) are **blind proxies** — they read no body and forward the raw payload verbatim. This forwards arbitrary unknown fields (e.g. `__proto__`) straight to the backend.

There is also a security-header inconsistency: `Referrer-Policy` is set to two different values (`origin-when-cross-origin` in `next.config.ts`, `strict-origin-when-cross-origin` in `proxy.ts`), and `X-Content-Type-Options` is duplicated. Conflicting headers produce undefined browser behavior.

### Why now
This is the FIRST slice of the security-first hardening effort decided in the architecture plan (#867). Input validation at the BFF edge is gap #1: the BFF is the only place that sees untrusted input before it reaches the backend, so it is the correct edge to enforce a contract. Shipping validation here closes the highest-risk gap before later slices (orders, addresses, reviews, etc.).

### Success looks like
- Every auth route handler in scope validates its body against a zod schema that **mirrors the verified amber-back DTO contract** before forwarding.
- Invalid input → `400` with a structured error body, and **no forward** to the backend.
- Unknown fields (incl. prototype-pollution vectors) are **stripped** by zod's default behavior before forwarding.
- `Referrer-Policy` and `X-Content-Type-Options` are each set exactly once, with the stronger `Referrer-Policy` value.
- All behavior is covered by route-handler tests following the existing Vitest pattern (strict TDD: RED → GREEN).

---

## 2. Scope

### In scope

**A. zod input validation at auth Route Handlers** (`app/api/auth/*`)

Add `zod` as a dependency and validate the request body against schemas that mirror the **verified** amber-back DTO contracts (#872, plus the GoogleAuthDto correction below). On invalid input: return `400` with a structured error and do **not** forward. Rely on zod's default `strip` to drop unknown fields before forwarding.

Endpoints and authoritative contracts (field name : rule):

| Endpoint | Backend DTO | Contract (zod target) |
|---|---|---|
| `login` | `login.dto.ts` | `email` (email), `password` (string, non-empty) |
| `register` | `register.dto.ts` | `first_name` (string), `last_name` (string), `email` (email), `password` (string min 6), `phone?` (string, optional) |
| `forgot-password` | `forgot-password.dto.ts` | `email` (email) |
| `reset-password` | `reset-password.dto.ts` | `token` (string), **`new_password`** (string min 6) |
| `change-password` | `update-profile.dto.ts` `ChangePasswordDto` | `current_password` (string), `new_password` (string min 6) |
| `create-password` | `update-profile.dto.ts` `CreatePasswordDto` | `password` (string min 6) |
| `google` | `google-auth.dto.ts` | **`credential`** (string) |
| `link-google` | `google-auth.dto.ts` (`GoogleAuthDto`) | **`credential`** (string) |
| `profile` PUT | `update-profile.dto.ts` `UpdateProfileDto` | all OPTIONAL: `first_name?`, `last_name?`, `email?` (email), `phone?`, `avatar_url?` |

CRITICAL contract facts (locked, do not re-infer):
- reset-password field is **`new_password`** (NOT `password`).
- register has optional **`phone`**.
- Password `MinLength` is **6** across the backend → zod mirrors `min(6)`. Do **NOT** make the front stricter (a stricter rule would reject backend-valid requests). Stricter password policy = FUTURE hardening, out of scope.
- **GoogleAuthDto correction (verified this phase):** the backend field is **`credential`**, not `id_token`. Both the explore inventory (#871) and the auth-contracts note (#872, which left google "not yet read") are WRONG/incomplete on this. The route handlers and the consuming client code must use `credential`. The current `auth/google` handler that reads/forwards `id_token` is therefore likely already mismatched against the backend and must be reconciled to `credential` as part of this slice. Verified at `amber-back/src/ecommerce-auth/dto/google-auth.dto.ts` (`{ credential: string }` via `@IsString()`).

**B. Security header cleanup**
- Remove the duplicate `X-Content-Type-Options` and the conflicting `Referrer-Policy` from `proxy.ts` (lines ~154-155).
- Upgrade `Referrer-Policy` in `next.config.ts` to `strict-origin-when-cross-origin` (the stronger value).
- CSP stays **only** in `proxy.ts` (per-request nonce, by design — correctly excluded from `next.config.ts`).

### Out of scope (explicitly deferred)
- **Rate limiting** — DEFERRED to a future slice. ECS multi-instance makes in-memory rate limiting unreliable; the distributed approach (Upstash Redis REST vs AWS WAF) is an open product/infra decision. Not included here. (See Follow-ups.)
- **Validation of non-auth route handlers** (orders, addresses, reviews, coupons, contact) — future slices.
- **Stricter password policy than the backend** — would break contract parity; separate product decision.
- Edge HMAC signature verification in `proxy.ts` (gap #3 from #867) — separate slice.

---

## 3. Approach

### 3.1 Validation flow per route handler
Replace presence checks / blind forwarding with a single validation step at the top of each handler:

1. Parse the request JSON body.
2. `schema.safeParse(body)`.
3. On failure → return `400` with a structured error (a stable shape, e.g. `{ error: "ValidationError", issues: [...] }`), and return early. **No backend call.** (Early-return pattern, per the architecture skill.)
4. On success → forward `result.data` (the parsed-and-stripped object), not the raw body. This is what removes unknown fields like `__proto__`.

For blind-proxy endpoints currently using `proxyToBackend` (forgot/reset/change/create-password, link-google, profile PUT): introduce a body read + parse + forward of the validated object. Whether to keep `proxyToBackend` (and have it forward the sanitized body) or switch those handlers to `backendFetch` is a **design-phase** decision — the design must pick one consistent mechanism. The proposal's constraint is only: the object forwarded MUST be the zod-parsed output, never the raw body.

A small shared helper for "parse body → 400 on failure → return typed data" is desirable to avoid duplicating the safeParse/400 boilerplate across ~10 handlers (DRY, per the architecture skill). The exact signature/location is a design concern; flagged here so design accounts for it.

### 3.2 Header cleanup
Mechanical edit: delete the two header lines from `proxy.ts`, change one value in `next.config.ts`. Done together to avoid a regression window where `Referrer-Policy` is unset on pages.

### 3.3 Testing (strict TDD — ACTIVE)
Runner: `pnpm test:run` (Vitest). Follow the existing route-handler pattern (`app/api/orders/[orderNumber]/route.test.ts`): hoisted `vi.mock`, `vi.resetModules()` + dynamic `import()` per test, `NextRequest` construction, `server-only` aliased in `vitest.config.mts`.

Each validated route gets, at minimum:
- valid body → forwards (backend mock called with parsed data),
- missing required field → `400`, **no forward**,
- wrong type / bad format (e.g. malformed email) → `400`,
- unknown field present → **stripped** (backend mock receives object without it).

Profile PUT (all-optional) additionally: empty body `{}` → valid (forwards), and a single optional field → forwards only that field.

---

## 4. Schema location — recommendation

Open question from explore: (A) co-located `app/api/auth/*/schema.ts`, (B) shared `app/lib/auth/schemas.ts`, (C) `app/domains/auth/schemas/`.

### Recommendation: **(B) a single shared auth schema module — `app/lib/auth/schemas.ts`.**

Rationale:

1. **Cohesion of one bounded context.** All these schemas belong to ONE concept — the auth contract with `amber-back`. Per the architecture skill (single clear purpose, ubiquitous language, avoid scattering related domain knowledge), the auth contract is one unit. Co-location (A) fragments a single contract across ~9 sibling folders, making it hard to see/maintain the contract as a whole and easy to let `login`'s `email` rule drift from `register`'s.
2. **Client-form reuse is likely.** zod schemas authored here are reusable by client-side React form validation (react-hook-form + zodResolver), so the storefront's login/register/reset forms validate against the SAME schema the BFF enforces. A co-located `app/api/.../schema.ts` is `server-only`-adjacent and awkward to import into client components; a `app/lib/auth/` module is the natural shared home. The schemas must stay framework-pure (no `server-only`, no Node APIs) so both edges can import them.
3. **Screaming Architecture is honored, not violated.** #867 chose Screaming + **selective** hexagonal for a BFF, explicitly NOT a full `app/domains/...` ports/adapters structure (that would be the Golden Hammer #867 warned against). So (C) is over-structured for this slice. (B) keeps the auth slice's contract co-located *with each other* under a clearly-named auth module — it still "screams auth" — without inventing a domain layer the BFF doesn't need yet.
4. **Cost of being wrong is low and reversible.** A shared module can later be promoted into `app/domains/auth/` if the selective-hexagonal refactor reaches auth. Starting co-located (A) and later consolidating is the more painful direction.

Concretely: one file `app/lib/auth/schemas.ts` exporting named schemas (`loginSchema`, `registerSchema`, `forgotPasswordSchema`, `resetPasswordSchema`, `changePasswordSchema`, `createPasswordSchema`, `googleAuthSchema`, `updateProfileSchema`) plus inferred types. If the file approaches the ~200-line guideline, split by sub-concern (e.g. `password-schemas.ts`) — design's call. This is a lean recommendation that informs design; design owns the final file split.

---

## 5. Risks

1. **GoogleAuthDto field mismatch (`credential` vs `id_token`).** The biggest correctness risk. Prior artifacts (#871, #872) assumed `id_token`; the verified backend DTO uses `credential`. If the current `auth/google` handler and the client Google sign-in code send `id_token`, google login may already be broken OR is relying on a backend that accepts both. Design/apply MUST confirm what the client actually sends and reconcile to `credential`. Mitigation: treat google + link-google reconciliation as a deliberate sub-task, not a blind schema add.
2. **Blind-proxy body shapes were inferred, now corrected by #872** — but the *forwarding mechanism* change (reading a body that was previously piped raw) could alter behavior (e.g. content-type, streaming). Mitigation: tests assert the backend mock receives exactly the parsed object; design picks one consistent forward mechanism.
3. **Contract drift between BFF zod and backend DTOs over time.** zod mirrors the backend manually; if backend DTOs change, the BFF can silently reject valid requests. Mitigation (out of scope here, note for future): consider generating/sharing contracts. For now, the schemas reference #872 as the source of truth and comment the backend DTO origin.
4. **Over-strict validation rejecting valid requests.** Specifically password `min(6)` must NOT become stricter; email rule must match backend `IsEmail`. Mitigation: contract parity is locked in scope; tests use backend-valid edge values (6-char password).
5. **Referrer-Policy regression window.** If the two edits aren't shipped together, pages could briefly have no/duplicate policy. Mitigation: both header edits in the same change.
6. **`zod` as a new production dependency.** Pure-JS, no native deps, widely used, tree-shakeable. Low risk. Pin a current major and add once.

---

## 6. Expected PR size / chaining

This slice touches a meaningful number of files:
- ~9 route handlers edited (`login`, `register`, `forgot/reset/change/create-password`, `google`, `link-google`, `profile`).
- 1 shared schema module (+ possible split).
- Possible 1 shared parse-helper.
- ~9 new/updated test files (TDD).
- 2 config edits (`next.config.ts`, `proxy.ts`).
- `package.json` + lockfile (`zod`).

Realistic estimate is **above a 400-line single-PR budget**, driven mostly by the repetitive per-route handler+test pairs. **Chaining is likely warranted.** A natural, safe split:

- **PR 1 — foundation:** add `zod`, the shared `app/lib/auth/schemas.ts`, the parse-helper, and their unit tests. No handler behavior change yet. Small, low-risk, unblocks the rest.
- **PR 2 — high-value/high-risk auth writes:** `login`, `register`, `forgot-password`, `reset-password` handlers + tests (these are the abuse-prone, unauthenticated entry points).
- **PR 3 — authenticated + google:** `change-password`, `create-password`, `link-google`, `google` (incl. the `credential` reconciliation), `profile` PUT + tests.
- **PR 4 (tiny) — header cleanup:** `next.config.ts` + `proxy.ts`. Independent; could also fold into PR 1.

The orchestrator's Review Workload Guard should expect `Chained PRs recommended: Yes`. Final boundaries are a tasks-phase decision; this is guidance, not a mandate.

---

## 7. Follow-ups (deliberately deferred)
- **Rate limiting** on auth endpoints (login / forgot-password / reset-password) via a distributed mechanism (Upstash Redis REST vs AWS WAF) — separate slice, pending product/infra decision.
- **Stricter password policy** than backend `min(6)` — product decision + coordinated backend change.
- **Validation for non-auth route handlers** (orders, addresses, reviews, coupons, contact).
- **Edge HMAC signature verification** in `proxy.ts`.
- **Contract-drift protection** between BFF zod schemas and backend DTOs.

---

## 8. Next phases
- `sdd-spec` and `sdd-design` can run in parallel (both read this proposal).
- Design must resolve: forward mechanism for ex-blind-proxy routes, the shared parse-helper signature/location, the structured 400 error shape, and final schema-file split.
