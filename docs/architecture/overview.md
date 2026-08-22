# Architecture

ZANCTA is a Next.js App Router application deployed on Vercel at `https://zancta.tech`.

```
Browser
  → Next.js (App Router)
      → Local processing (most tools)
      → API routes (auth, account, contact, payments, OCR packs, IndexNow)
          → PostgreSQL (Prisma)
          → Dodo Payments (checkout currently gated)
          → Resend (transactional email)
          → Upstash Redis (rate limits)
          → GA4 (after consent only)
```

## Local vs server

**Local (in the tab after page load):** merge, split, compress PDF (object streams only), PDF↔images, image compress/convert/resize, EXIF cleaner (canvas re-encode), embedded PDF text extraction, image OCR (Tesseract.js worker). Selected file bytes are not posted to a conversion API.

**Server:** sign-in/sign-up, sessions, OAuth, entitlements, contact form, webhooks, checkout (when live), Premium OCR language files, IndexNow key file and operator notify route, consent-gated analytics collection.

The marketing site, fonts, WASM, and English OCR data are still downloaded as normal web assets.

## Key modules

| Area | Location |
|---|---|
| Tool catalog and limits | `lib/tools.ts` |
| PDF engine | `lib/pdf-engine.ts`, `workers/` |
| Image engine | `lib/image-engine.ts` |
| OCR | `lib/ocr-engine.ts`, `components/ui/ocr-tool.tsx` |
| Auth | `lib/auth.ts` |
| Payments gate | `lib/payments/live.ts` |
| Email | `lib/email/` |
| SEO / canonical URLs | `lib/seo.ts`, `lib/seo/public-urls.ts` |
| IndexNow | `lib/indexnow.ts`, `proxy.ts` |

## Checkout gate

Live charges require `PAYMENTS_LIVE_ENABLED=true`, a live Dodo environment, and product IDs. Production is configured so `GET /api/payments/checkout` returns `{"live":false}`.
