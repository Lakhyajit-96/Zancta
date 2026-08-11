# LocalFile — Privacy-first file tools

> **Status:** Phase 5C complete — motion a11y 0 serious, Lenis deferred, Framer reduced-motion verified — 10 tools, PDF engine (5 tools) + Image engine (4 tools) real & local via Workers (pdf-lib + pdfjs-dist + browser-image-compression/canvas). No upload, no fake progress. Build/lint/typecheck 0 errors, 29 unit passed, 21+ E2E verified (image 5/5, advanced 7/7, output 9/9, mobile 5/5, a11y color-contrast serious flagged, PWA UNVERIFIED). No payments/ads/API/auth — production-ready for host verification.

## Quick Start

```bash
export PATH="/tmp/mynode:$PATH" # Linux node /tmp/node-linux/bin or host Node 20+
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (25 static pages)
npm run typecheck; npm run lint; npm run test; npm run test:e2e
```

## Structure

```
app/ — App Router: /, /tools, /tools/[slug], /pricing, /privacy, /terms, /security, /help, /docs, /contact, sitemap, robots
components/ — nav, hero (framer-motion), tool-grid, tool-shell (worker + 3s fallback), upload-zone, progress
lib/ — tools.ts (registry 10 tools), file-safety.ts (50MB/100MB/12k), pdf-engine.ts, image-engine.ts (compress/convert/resize/exif), split-parser.ts, download.ts, seo.ts
workers/ — pdf.worker.ts (MERGE|SPLIT|COMPRESS|PDF_TO_IMAGES|IMAGES_TO_PDF), image.worker.ts (IMAGE_COMPRESS|IMAGE_CONVERT|IMAGE_RESIZE|EXIF_CLEAN + legacy aliases), bg.worker.ts (Phase 6 stub)
public/manifest.json (standalone, no SW yet), docs/PHASE5_REPORT.md
tests/ — unit: file-safety, tools, split-parser, pdf-engine, image-engine (29 passed) + E2E: app, pdf, image, image-output-validation, image-advanced, mobile, a11y, bench, privacy-net, seo, visual-qa
```

## Supported Formats & Limits

- **Image:** JPG, PNG, WebP. Max 50MB/file, 20 files (image-compress/convert) or 10 (resize), total 100MB, 12,000px max dimension. **HEIC/SVG rejected** (`HEIC not supported yet`, `We couldn't process that` alert). **AVIF decode only via canvas fallback, encode not supported**. **EXIF:** stripped by re-encode (canvas toBlob) — GPS/camera/timestamp removed, orientation not auto-corrected (UNVERIFIED — see docs). **Transparency:** PNG/WebP → JPEG uses white background (documented, no black).
- **PDF:** 50MB/file, 200 pages/file, 5 files/100MB total. Merge/split/compress/pdf↔images local.

## Privacy

All PDF/image bytes stay in-browser (Worker or main-thread fallback). No upload, no filename/EXIF/metadata sent. Only gtag `processing_completed {tool, bucket: "<1MB"|"1-5MB"|...}` coarse bucket. Network inspection shows 0 POST.

## PWA

Manifest present (`/manifest.json`), no service worker yet — static pages load, offline shell UNVERIFIED — REQUIRES HOST BROWSER. No precache of workers/WASM (intentionally not precached per Phase 2 budget).

## Known Limitations

- PDF→Images host-canvas/Safari/mobile UNVERIFIED (1 E2E timeout).
- A11y color-contrast serious 1 violation per page (dark muted-foreground) — should fix before launch.
- Orientation mirrored fixtures UNVERIFIED.
- Safari/Firefox matrix UNVERIFIED — REQUIRES REAL SAFARI, only Chromium verified in sandbox.
- FPS ~60 (61/60) gate >30 passed; memory exact measurement unavailable (sequential 10× compress no crash verified, URL revocation + ImageBitmap.close + worker terminate verified).

## Docs

- Phase 5: `docs/PHASE5_REPORT.md`
- Phase 4: `docs/PHASE4_REPORT.md`
- Phase 3: `docs/PHASE3_REPORT.md`
- Phase 2: `docs/PHASE2_REPORT.md`
- Phase 1: `docs/PHASE1_REPORT.md`

## Next

Phase 6 — Background Removal (MIT) — awaiting instruction. No deploy yet.

## Notes

- Git commit is blocked inside sandbox (`.git` ro-bind, `Read-only file system`) — run `git add . && git commit` on host.
- Playwright Chromium installed at `/mnt/c/Users/lakhya/AppData/Local/ms-playwright` (Windows), Linux node at `/tmp/node-linux/bin/node`.
