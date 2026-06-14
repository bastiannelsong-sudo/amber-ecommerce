# Operations Pending — Manual Setup

> Follow-up tasks that require human/ops action (accounts, secrets, infra).
> The code is already shipped; these steps **activate** it. Until done, the
> related feature degrades safely (documented per item).

---

## 1. Activate auth rate limiting (Upstash Redis)

**Status:** ⏳ Not configured → rate limiting is **fail-open (disabled)**. The app
does NOT block; it just skips the limiter (with a `console.warn`). No outage risk.

**Shipped in:** PR #34 (`app/lib/rate-limit/`). Routes guarded: `login`,
`forgot-password`, `reset-password` (per-IP sliding window).

**Steps to activate:**

1. Create a free Upstash Redis database — https://upstash.com (free tier:
   10k commands/day, enough for auth rate limiting at current scale).
2. Add these two keys to **`.env.example`** (the coding agent is blocked from
   writing `.env*` files, so add them by hand):

   ```dotenv
   # Upstash Redis — BFF auth rate limiting
   # Leave blank to disable rate limiting (fail-open). Set both to enable.
   UPSTASH_REDIS_REST_URL=
   UPSTASH_REDIS_REST_TOKEN=
   ```

3. Set the **real values** in the deployment environment (ECS task definition /
   secrets manager) — `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
   from the Upstash console.

**Verify after setup:** hit `/api/auth/login` more than 5 times in 60s from one
IP → expect HTTP `429` with a `Retry-After` header.

---

## 2. AWS WAF rate-based rule (infra-owned)

**Status:** ⏳ Not applied. This is the coarse, edge-level layer that complements
the app-level Upstash limiter (defense in depth).

**Spec / handoff doc:**
`openspec/changes/archive/2026-06-13-auth-rate-limiting/waf-recommendation.md`

**Recommended rule (give to infra/DevOps):**

- Type: rate-based rule on the ALB/CloudFront Web ACL
- Scope: URI path `/api/auth/*`
- Limit: ~100 requests / 5 min per source IP (tune to traffic)
- Aggregation key: IP
- Action: Block (or CAPTCHA)

**Why both layers:** WAF stops volumetric/IP abuse at the edge (cheap, uses AWS
credits); Upstash handles fine-grained per-route brute force in the app.

---

## Notes

- Cost context: WAF is billed to AWS (covered by credits, ~$10/mo after);
  Upstash free tier is $0. ElastiCache was deliberately **not** chosen (too
  expensive to run 24/7 just for rate limiting).
- Deferred **code** backlog (tracked separately, not ops): full checkout/cart UI
  strangle, `Math.random()` order-number bug, `card-payment`/`reviews` validation
  (blocked on backend endpoints), `requerimientos/13` doc debt (`id_token` →
  `credential`).
