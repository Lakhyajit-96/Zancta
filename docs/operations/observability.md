# Observability

How ZANCTA is observed in production. No fabricated metrics. Sentry is **not** purchased in this phase.

---

## What exists today

| Signal | Where | Coverage |
|---|---|---|
| Runtime / request logs | Vercel Logs | CLI `vercel logs --environment production --level error --since 24h --limit 40` on 23 August 2026 returned no error lines (empty result). That is not a claim of zero 404s. |
| Structured errors | `lib/observability/errors.ts` (`logError`) | Category + severity JSON on stderr; no file bytes, OCR text, or secrets by design |
| Sanitized 500s | `lib/safe-error.ts` | Redacts credentials in URLs before logging |
| Production config | `lib/production-config.ts` | Missing `DATABASE_URL` / `AUTH_SECRET` / Resend |
| Rate-limit failures | `lib/rate-limit.ts` | Redis errors; fail-closed on Vercel Production when Upstash is configured |
| Webhook / checkout | `app/api/payments/**` | Event type / generic messages, not card data |
| Contact | `app/api/contact/route.ts` | Logs **reference id**, not the visitor email body |
| GA4 | consent-gated client | Page and tool events without filenames or file contents |
| Vercel Speed Insights | project toggle | **Baseline not established** (`hasData: false`) |
| Vercel Web Analytics | project toggle | Dashboard feature on; **no `@vercel/analytics` in the app**. Left unused rather than injecting a second tracker beside consent-gated GA4. |
| Sentry | `instrumentation.ts` | Inert unless `SENTRY_DSN` is set. Do not buy Sentry automatically. |

Client PDF parsing may log a generic console warning in the **browser**. Filenames are not written to that console line. User-facing errors in the tab may still name the selected file.

---

## Gaps (measurable)

Vercel logs are enough to see 5xx, timeouts, and the structured `[ZANCTA:…]` lines **if someone looks**. There is:

- no paging/on-call
- no log drain
- no error grouping across deploys (that would be Sentry or equivalent)
- no Core Web Vitals baseline (Speed Insights has no data)

That is acceptable on Hobby with current traffic. Revisit Sentry only when production errors cannot be triaged from Vercel Logs.

---

## Plan (when traffic exists)

| Failure class | First place to look | Owner action if recurring |
|---|---|---|
| Application 500 | Vercel Logs, `logError` category | Fix code; consider Sentry if volume hides patterns |
| API / Auth | Logs + Upstash | Confirm fail-closed vs lockout |
| Payments / webhooks | `[webhook:dodo]`, `[checkout]` | Keep checkout off until authorized; then alert on signature failures |
| Email | `[contact]`, `[auth/…] send failed` | Resend dashboard + `EMAIL_FROM` |
| OCR language packs | `/api/ocr/**` | Auth token and traineddata tracing, never OCR text |
| Performance | Speed Insights once data exists; Playwright benches locally | Do not claim CWV without measurements |

Never send file bytes, OCR output, passwords, tokens, or payment secrets to any vendor.

---

## Privacy vs analytics

Consent-gated GA4 is the customer-facing analytics path. Do not add advertising pixels. Do not add `@vercel/analytics` / Speed Insights client libraries unless the privacy review (consent, CSP, no document data) is explicit.
