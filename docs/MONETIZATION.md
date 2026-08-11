# Analytics & Monetization Infrastructure — Bootstrap

## Analytics

| Provider | Status | ID Required | Notes |
|----------|--------|-------------|-------|
| GA4 | BLOCKED | `NEXT_PUBLIC_GA_MEASUREMENT_ID` (G-XXXX) | `BLOCKED — REQUIRES USER ACTION` |
| Search Console | BLOCKED | Domain verification | Requires domain + DNS TXT |
| Plausible/PostHog | OPTIONAL | Domain/key | Privacy-friendly alternative |

Tracking plan: page_view, tool_view, tool_execute, tool_success, tool_error, ad_view (compliant), conversion. No unnecessary PII.

## Monetization

| Stream | Decision | Status |
|--------|----------|--------|
| Display ads (AdSense, Monetag) | DEFERRED | `BLOCKED — REQUIRES USER ACTION` (approval, `ca-pub-`, `ads.txt`) — only if UX not degraded and traffic justifies |
| Premium tools / paywall | DEFERRED | Decide in Phase 1 after tool selection |
| Subscriptions / usage limits | DEFERRED | Needs auth + DB (not yet) |
| Affiliate | OPTIONAL | Evaluate per tool niche |
| API access | OPTIONAL | If tool has programmatic value |

Ads: never deceptive, never incentivized clicks, never layout shift. Policy: `ads.txt`, consent banner where required (GDPR/CCPA + India IT/DIT).

## Verification

- No `NEXT_PUBLIC_GA_MEASUREMENT_ID` set.
- No `NEXT_PUBLIC_ADSENSE_CLIENT` set.
- No payment provider chosen.
