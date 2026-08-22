# Changelog

All notable product milestones for ZANCTA. Internal phase codes are omitted.

The live site is [https://zancta.tech](https://zancta.tech). Package version: `0.1.0`.

## 0.1.0 — 2026-08

### Tools and privacy

- Eleven local PDF and image tools (merge, split, compress, PDF↔images, image compress/convert/resize, EXIF cleaner, embedded PDF text extraction, English OCR).
- Browser-local processing with pdf-lib, PDF.js, and Tesseract.js. Background removal deferred.
- Local-processing guides published on the site.

### Accounts and Premium architecture

- Auth.js credentials plus optional Google and GitHub OAuth.
- Email verification, password reset, account deletion, session revocation.
- Premium entitlements and Dodo Payments integration, with production checkout gated off (`{"live":false}`).

### Email, SEO, analytics

- Resend transactional mail with branded layout.
- Canonical sitemap, robots, `llms.txt`, and IndexNow ownership file (server-side key).
- Consent-gated GA4.

### Production

- PostgreSQL via Prisma, Upstash rate limiting, Vercel deployment on the custom domain.
- Ads remain off.

IndexNow URL batches may be submitted by the operator. Submission is not the same as crawl, index, or rank.
