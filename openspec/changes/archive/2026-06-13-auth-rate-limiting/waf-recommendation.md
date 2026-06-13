# AWS WAF Recommendation — Auth Endpoint Rate Limiting (Outer Layer)

> **Status**: Documentation-only handoff. This artifact produces NO application code.
> **Owner**: Infrastructure / DevOps.
> **Layer**: Outer (coarse) defense. The fine-grained per-route limiting lives in the
> application (Upstash `@upstash/ratelimit`, slice `auth-rate-limiting`). This WAF rule
> is complementary, not a replacement.

## Why WAF in addition to app-level limiting

Defense in depth (see decision in Engram `amber-ecommerce/rate-limiting-decision`):

- **WAF** stops volumetric / IP brute force **before** traffic reaches ECS, saving compute
  and the Upstash free-tier command budget. Billed to AWS (uses expiring credits now,
  ~$6–10/mo after; rate-based rules are cheap).
- **Upstash app-level** enforces tight per-route limits with a proper `429 + Retry-After`.

WAF is coarse and runs at the edge/ALB; Upstash is precise and runs in the handler.

## Recommended Rule

| Property | Value |
|---|---|
| Rule type | Rate-based rule (AWS WAF v2) |
| Scope | Requests whose URI path starts with `/api/auth/` |
| Suggested limit | 100 requests / 5 minutes per IP (coarse — tune after observing traffic) |
| Aggregation key | Source IP address (`IP`) |
| Action | `Block` (consider `CAPTCHA` if a challenge UX is acceptable) |
| Association | The ALB / CloudFront distribution fronting the storefront ECS service |

Notes:
- WAF rate-based windows are configurable (1/2/5/10 min). 5 min chosen as a balance
  between burst tolerance and abuse suppression. Adjust per observed baseline.
- Keep the WAF limit **looser** than the app-level limits (login 5/60s, forgot 3/60s,
  reset 5/60s). WAF catches floods; Upstash catches targeted brute force. Overlapping
  but intentionally different thresholds.

## Scope Matching

Use a `ByteMatchStatement` / URI path `STARTS_WITH` `/api/auth/` so the rule covers
`login`, `forgot-password`, `reset-password`, and any future auth route without edits.

## Deployment Sketch (Terraform — adapt to existing IaC)

```hcl
resource "aws_wafv2_web_acl" "storefront" {
  name  = "storefront-acl"
  scope = "REGIONAL" # ALB-associated

  default_action { allow {} }

  rule {
    name     = "auth-rate-limit"
    priority = 10

    action { block {} }

    statement {
      rate_based_statement {
        limit              = 100          # per 5-minute window per IP
        aggregate_key_type = "IP"
        evaluation_window_sec = 300

        scope_down_statement {
          byte_match_statement {
            field_to_match { uri_path {} }
            positional_constraint = "STARTS_WITH"
            search_string         = "/api/auth/"
            text_transformation {
              priority = 0
              type     = "LOWERCASE"
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "auth-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "storefront-acl"
    sampled_requests_enabled   = true
  }
}

resource "aws_wafv2_web_acl_association" "storefront" {
  resource_arn = aws_lb.storefront.arn       # the ALB fronting ECS
  web_acl_arn  = aws_wafv2_web_acl.storefront.arn
}
```

Console alternative: WAF & Shield → Web ACLs → create/select the regional ACL on the
storefront ALB → Add rule → Rate-based rule → request rate 100, window 5 min,
aggregate by IP → scope-down to URI path starts-with `/api/auth/` → action Block.

## Operational Notes

- Ensure `X-Forwarded-For` integrity: the ALB must set/override the client IP so neither
  WAF nor the app trusts a spoofed header. This is the same header the app reads for its
  Upstash key. Verify ALB config strips inbound `X-Forwarded-For`.
- Enable CloudWatch metrics + sampled requests to tune the threshold post-launch.
- Roll out in `Count` mode first to observe match volume, then switch to `Block`.

## Handoff Checklist

- [ ] Rule created on the storefront ALB's regional Web ACL
- [ ] Scope-down to `/api/auth/` confirmed
- [ ] Launched in `Count` mode, threshold validated against real traffic
- [ ] Switched to `Block`
- [ ] CloudWatch alarm on `auth-rate-limit` block count configured
