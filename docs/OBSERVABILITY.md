# Observability — Bootstrap

## Planned

- **Error tracking:** Sentry (`@sentry/nextjs`) — `SENTRY_DSN` in `.env.example` (BLOCKED until DSN provided)
- **Logs:** Structured JSON logs via `pino` or Next.js logger; Vercel log drains
- **Uptime:** UptimeRobot / BetterStack / Vercel monitoring
- **Analytics:** GA4 (`NEXT_PUBLIC_GA_MEASUREMENT_ID`) + Search Console (BLOCKED)
- **Perf:** Vercel Analytics + Lighthouse CI

## Events (to track when enabled)

- `tool_view`, `tool_execute`, `tool_success`, `tool_error`, `ad_impression` (policy-compliant), `conversion`

No PII collected beyond necessary. Cookie consent where required.

## Verification

- No Sentry/GA installed — no `SENTRY_DSN` or `GA_ID` set.
- No health endpoint yet.

## Next

Wire Sentry + GA in Phase 1 only after user provides IDs (BLOCKED — REQUIRES USER ACTION).
