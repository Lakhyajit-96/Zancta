# Phase 12H-12 content and growth operating notes

This is a controlled roadmap, not a publishing queue. Do not generate pages only because a keyword exists.

## Measurement window

- Product activation: `processing_completed` and `download_completed` (consent-gated GA4).
- Secondary: return usage, `signup_completed`, `premium_feature_view` / `premium_upgrade_clicked`.
- Server funnel (users → checkout → subscription) is not a traffic KPI while `PAYMENTS_LIVE_ENABLED=false`.
- Search Console / Bing: record impressions only when authenticated. Until then baseline is **not established**.

## Weekly checklist (do not spam)

1. Read GA4: tool_view → processing_completed → download_completed.
2. Check Search Console coverage for `/sitemap.xml` and the three guides — if property access exists.
3. Submit IndexNow only for **new** canonical URLs, never a full-site blast.
4. One content page only if a real user problem is still unanswered.
5. No ads. No paid directories. No fake social proof.

## Funnel definitions (honest)

Visitor → Tool View (`tool_view` / `tool_catalog_view`) → Processing (`processing_started`) → Download (`download_completed`) → Pricing (`pricing_view`) → Upgrade intent (`premium_upgrade_clicked`).

Primary activation metric: successful completion + download.
Do not treat checkout zeros as traffic while payments are off.

## Ten high-intent resources (controlled; do not batch-publish)

| # | Target query | Intent | User problem | URL | Tool | Unique value | Internal links | FAQ | Conversion |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | compress PDF without uploading | commercial/investigational | Size drops or does not | `/guides/compress-pdf-what-actually-changes` | pdf-compress | Honest object-stream vs image recompress | compress tool, merge guide | Why did my PDF not shrink? | Tool CTA after limits |
| 2 | split PDF without uploading | transactional | Extract pages locally | `/guides/split-pdf-without-uploading` | pdf-split | Password/fail cases | split tool, merge guide | Encrypted PDFs | After successful split |
| 3 | remove EXIF before sharing | investigational | Camera GPS/metadata | `/guides/remove-exif-before-sharing` | exif-cleaner | What stripping does not prove | EXIF tool, compress | Is this anonymous? | After download |
| 4 | merge PDF without uploading | transactional | Combine privately | live `/guides/merge-pdf-without-uploading` | pdf-merge | Already shipped | merge tool | — | — |
| 5 | JPG vs PNG vs WebP | informational | Format choice | live `/guides/jpg-vs-png-vs-webp` | image-convert | Already shipped | convert/compress | — | — |
| 6 | OCR without uploading | investigational | Private text extract | live `/guides/browser-ocr-without-uploading` | ocr | Already shipped | OCR, text extractor | — | Premium only if scan/lang |
| 7 | PDF to JPG locally | transactional | Rasterize pages | keep `/tools/pdf-to-images` | pdf-to-images | Tool page is the answer | convert image | Output format | Next: convert |
| 8 | JPG to PDF locally | transactional | Wrap images | keep `/tools/images-to-pdf` | images-to-pdf | Tool page is the answer | merge | Page size | Next: merge |
| 9 | Hindi/Bengali/Tamil OCR | transactional | Indic scripts | do not ship a language landing yet | ocr | Accuracy not benchmarked | OCR guide | Results vary | Only after measured accuracy |
| 10 | scanned PDF OCR | transactional | Image-only PDFs | do not clone a thin landing | ocr + Premium copy | 20-page local cap | OCR guide, pricing | Not ABBYY | After free English image OCR |

**Next three to write (not this phase):** rows 1–3.

## Search-intent map (capability-matched)

| Intent | User problem | Canonical answer now | Next page only if needed |
| --- | --- | --- | --- |
| merge PDF without uploading | Combine files without a converter SaaS | `/tools/pdf-merge` + `/guides/merge-pdf-without-uploading` | — |
| merge PDF online | Same, broader | Tool page | Do not clone the guide |
| split PDF without uploading | Extract ranges locally | `/tools/pdf-split` | Short guide only if merge guide does not cover it |
| compress PDF without uploading | Smaller PDF, honest limits | `/tools/pdf-compress` | Guide: object-stream rewrite ≠ image recompress |
| PDF to JPG / JPG to PDF | Rasterize or wrap images | `/tools/pdf-to-images`, `/tools/images-to-pdf` | — |
| compress image online | Smaller photos | `/tools/image-compress` | — |
| convert JPG PNG WebP | Format choice | `/tools/image-convert` + `/guides/jpg-vs-png-vs-webp` | — |
| resize image / remove EXIF | Dimensions / metadata | `/tools/image-resize`, `/tools/exif-cleaner` | — |
| OCR without uploading / browser OCR | Text from images privately | `/tools/ocr` + `/guides/browser-ocr-without-uploading` | — |
| scanned PDF OCR / Hindi Bengali Tamil OCR | Language + scans | OCR tool + Premium copy | Do not publish language landing pages until accuracy is measured |

## Top 3 to publish next (not in this phase)

1. `/guides/compress-pdf-what-actually-changes` — object streams vs image recompression. Unique, prevents failed expectations.
2. `/guides/split-pdf-without-uploading` — extract ranges, password-protected failure. Complements merge guide.
3. `/guides/remove-exif-before-sharing` — what EXIF cleaning does and does not prove.

Do not auto-publish these. Each needs original steps, limits, and a tool CTA.
