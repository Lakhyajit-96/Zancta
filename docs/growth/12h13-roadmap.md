# Phase 12H-13 — 30-day acquisition plan

No traffic forecasts. Checkout remains off. Ads remain off. Do not spam IndexNow or communities.

## Funnel (GA4, consent-gated)

Visitor → `tool_view` → `processing_started` → `processing_completed` → `download_completed` → return usage → `premium_feature_view` → `premium_upgrade_clicked`.

`premium_upgrade_clicked` is upgrade **intent**, not a purchase. `pricing_view` is not revenue. Revenue is Dodo/server-side only when checkout is live.

Primary activation: `processing_completed` + `download_completed`.

## Search notes (no invented volumes)

August 2026 web research (SERP patterns, not keyword-tool volumes — volumes were not verified):

- **Compress PDF:** Informational + transactional mix. Upload converters and several browser-WASM tools dominate. User questions: will photos shrink, Gmail 25 MB cap, “no upload.” Competitors often imply image downsampling or quality presets. ZANCTA’s gap is honesty: object streams only; image-heavy files often will not shrink; no fake percentage.
- **Split PDF:** Transactional. Users want `1-3,7` ranges. SERP split between ZIP-per-page tools and single-PDF extractors. ZANCTA matches the latter (one output PDF). Do not claim per-page ZIP.
- **EXIF / GPS:** Privacy intent. Users care about listings, email, chat. SERP promises lossless strip, GPS-only mode, C2PA, HEIC. ZANCTA re-encodes JPG/PNG/WebP on canvas (~0.92 JPEG/WebP). The guide must say that, and that pixels can still identify a place.
- **Browser OCR / scanned PDF / private OCR:** Overlap with the existing OCR guide. Do not clone language landing pages until accuracy is measured.

Do not copy competitor copy. Do not invent search volume.

## Week 1 — SEO foundation + compress guide

| Activity | Objective | Signal | Measurement | Cost | Risk | Success |
| --- | --- | --- | --- | --- | --- | --- |
| Ship `/guides/compress-pdf-without-uploading` | Answer “will this actually shrink?” | Crawl / impressions later | GSC when authenticated; sitemap inclusion | $0 | Ranking claims | Page live, canonical, linked from Compress PDF |
| IndexNow once for prior three guides | Notify Bing/IndexNow partners | HTTP 200/202 | Submit response | $0 | Over-notify | One POST only |
| Confirm GA4 collect | Close 12H-12 event gaps | Collect + dataLayer | Playwright production | $0 | PII leak | Consent-gated, no file content |

## Week 2 — split guide + internal links

| Activity | Objective | Signal | Measurement | Cost | Risk | Success |
| --- | --- | --- | --- | --- | --- | --- |
| Ship `/guides/split-pdf-without-uploading` | Explain range → one PDF | Crawl | GSC later | $0 | Wrong output claims | Matches `parseRanges` + single blob |
| Tighten related tools / next-step graph | Merge ↔ compress ↔ split | Internal clicks | GA4 path if consented | $0 | Over-linking | One next tool + one guide after success |

## Week 3 — EXIF guide + community drafts

| Activity | Objective | Signal | Measurement | Cost | Risk | Success |
| --- | --- | --- | --- | --- | --- | --- |
| Ship `/guides/remove-exif-before-sharing` | Honest metadata copy | Crawl | GSC later | $0 | Over-claiming anonymity | States re-encode + limits |
| Keep Product Hunt / HN / Reddit / Dev.to / IH drafts | Ready when authorized | None until posted | Manual | $0 | Spam | Drafts only |

## Week 4 — controlled experiments

| Activity | Objective | Signal | Measurement | Cost | Risk | Success |
| --- | --- | --- | --- | --- | --- | --- |
| Read GA4 funnel if property access exists | See if activation happens | Event counts | GA4 UI | $0 | Optimizing zeros | Report actual counts or “not established” |
| One authorized community post max, if operator agrees | Technical audience | Referral sessions | GA4 referral | $0 | Ban / spam | Operator posts; agent does not |
| Do not enable checkout or ads | Keep commercial gate | `GET /api/payments/checkout` `live:false` | Production GET | $0 | Accidental live | Flag stays false |

## Explicitly deferred

Ads, paid directories, Sentry purchase, BIMI/VMC, fake reviews, Search Console recrawl loops, IndexNow sitemap blasts.
