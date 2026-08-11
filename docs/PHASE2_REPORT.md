# Phase 2 Report — Product Specification, Production Architecture & Technical Validation
**Date:** 2026-08-11 | **Product:** Privacy-First Local File Suite | **Status:** SPEC & ARCHITECTURE VALIDATED — NO BUILD YET

> This report converts Phase 1 research into a precise, production-grade blueprint. No homepage, no UI, no deps, no deploy — per stop condition.

---

## A. Final Product Specification

### Product
**A premium privacy-first web toolkit** providing ~10 core PDF + image utilities that process files **entirely in the browser** (WASM/JS via Web Workers) whenever technically possible. No upload, no account, no watermark for core single-file use. Batch, HD, and cloud-fallback features are premium-gated (V1). PWA offline-capable. Monetizable via freemium + API + privacy-respecting ads (not on tool canvas).

### Primary user
**Knowledge workers 22-45** (students, freelancers, marketers, ops, teachers, HR/legal-adjacent) who handle 3-10 PDFs/images per week and distrust uploading sensitive docs to random servers. Uses tool 2-4x/week via bookmark or search.

### Secondary users
- Creators/developers needing quick convert/compress/BG-remove without API key.
- Small SaaS/e-com that need an API (`/api/remove-background`, `/api/compress-pdf`) later.

### Core problem (§2)
Existing suites (iLovePDF, Smallpdf, Remove.bg — Similarweb-verified 29-45M/mo tier) enforce **uploads + 2/day limits + watermarks + ad-clutter + slow upload** for large files. Verified via G2 + Medium pain sources (Phase 1 §C). Sensitive docs create anxiety.

### Core promise
**"Your files never leave your device."** Drag, process instantly locally, download — no signup, no watermark, no upload. If cloud HD is ever used, explicit opt-in with disclosed retention.

### Differentiator
- Local = privacy + speed (no upload) + zero marginal infra cost + offline.
- Incumbents are invested in server monetization and cannot pivot without cannibalizing.

### Positioning
> *For privacy-conscious professionals, [Name] is the local-first file toolkit that merges, compresses, and transforms PDFs and images instantly in your browser — so sensitive work stays private, fast, and free without limits.*

### Product category
**Privacy-first client-side file utilities** (PDF + Image) — sits between `utility SaaS` and `privacy tools`, not a generic content site.

### Jobs-to-be-done
1. Merge 5-20 PDFs into one for submission.
2. Split/extract pages from a PDF.
3. Compress a PDF to email size.
4. Convert PDF ↔ images (and images→PDF) for sharing/printing.
5. Compress/convert/resize images for web/upload limits.
6. Remove background from a product/profile image privately.
7. Clean EXIF/metadata before sharing.

---

## B. Final MVP Tool List (Must-be-local, no backend)

| Tool | Route | Verdict | Why |
|------|-------|---------|-----|
| **Merge PDF** | `/tools/pdf-merge` | **MUST HAVE** | Highest demand, pdf-lib VERIFIED (see §H) |
| **Split PDF** | `/tools/pdf-split` | **MUST HAVE** | High demand, same engine, low extra cost |
| **Compress PDF** | `/tools/pdf-compress` | **MUST HAVE** | High demand; note: pdf-lib recompress is limited vs true image downscale — see §H |
| **PDF to Images** | `/tools/pdf-to-images` | **MUST HAVE** | High demand, pdfjs-dist VERIFIED but heavy — SSR guard required |
| **Images to PDF** | `/tools/images-to-pdf` | **MUST HAVE** | High demand, pdf-lib |
| **Compress Image** | `/tools/image-compress` | **MUST HAVE** | High demand, `browser-image-compression` VERIFIED |
| **Convert Image** | `/tools/image-convert` | **MUST HAVE** | High demand (PNG↔JPG↔WebP↔AVIF); canvas + `browser-image-compression` |
| **Resize Image** | `/tools/image-resize` | **MUST HAVE** | High demand, canvas, trivial |
| **Background Remover** | `/tools/background-remover` | **MUST HAVE (with caveat)** | High demand but **@imgly is AGPL — BLOCKED**; replacement via `@xenova/transformers` or `onnxruntime-web` + MIT U²Net required — see §H/K |
| **EXIF Cleaner** | `/tools/exif-cleaner` | **MUST HAVE** | Low effort, high privacy story, canvas re-encode |

**Count: 10 MUST HAVE** — forms a complete, shippable suite.

### Should-have (small cost, add if time)
- PDF Rotate / Reorder (pdf-lib) — SHOULD HAVE if <2 days.

### Post-MVP (explicitly deferred)
- PDF watermark/page numbers/metadata cleaner, Image crop/BG replace, SVG optimization, ZIP batch export, OCR, PDF text extraction, page extraction via precise range UI — all POST-MVP.
- HEIC conversion — **REJECT for MVP** — `heic2any 0.0.4` unmaintained (last publish >1y), 2.7MB, WASM not reliably maintained — move to POST-MVP with cloud fallback.
- WebP is INCLUDED (canvas native); AVIF encode — POST-MVP (canvas decode ok, encode limited).
- OCR — POST-MVP (needs tesseract.js WASM 2-3MB + model, mobile heavy).

### Rejected
- HEIC for MVP (unmaintained), full OCR, ZIP bombs handling via server — rejected due to maintenance/weight/abuse risk.

---

## C. Deferred Features (Post-MVP / V1 / V2)

**V1 (4-8 weeks after MVP):** Batch BG (Web Worker queue, HD model), Word→PDF (docx→html→pdf via `mammoth` + pdf-lib — quality UNVERIFIED), Excel→PDF, sign PDF (canvas signature), user prefs (localStorage → DB when auth), API preview (no billing), premium wall (batch >10 / HD), ads on directory only, i18n (de/es/hi), Playwright E2E.

**V2:** Cloud HD fallback (explicit opt-in), i18n expansion, team/workspace, white-label embed, Stripe billing, rate-limit Redis, R2 TTL storage.

**Future:** Desktop PWA (Tauri), CLI, Figma/Drive integrations — only if demand validates.

---

## D. User Journeys

### First-time visitor
`/` (hero explains local-first) → `/tools` or tool card click → `/tools/pdf-merge` → drag 3 PDFs → client validates (size/pages, see §8) → Web Worker processes (progress bar) → preview + download (`merge.pdf`) → related tools strip → optional PWA install prompt.

### Returning user
Deep link `/tools/image-compress` → drop image → instant preset (WebP, 0.8) → download → history chip (localStorage, 5 recent — opt-out).

### Batch user
Drop 12 images → validate batch cap (MVP: 5 free, 6+ shows premium teaser but still allows) → queue in Worker → per-file progress + overall bar → ZIP download (JSZip, client-side) — MVP ZIP is SHOULD HAVE.

### Mobile user
Responsive upload zone (large tap target, camera roll + files) → processing with progress announcement (ARIA live) → Share API (`navigator.share` with file) or download → toast.

### Offline user
Install PWA → open `/tools/pdf-merge` offline → all assets cached (see §J) → process locally → download — fully offline if WASM/model cached on first visit.

### Error user
- Unsupported file (e.g., `.heic` MVP): `Unsupported format — this tool handles PDF/JPG/PNG/WebP. HEIC support coming soon — convert in Photos first.` + link to `/tools/image-convert`.
- Corrupt PDF: catch `PDFDocument.load` error → `This PDF appears damaged or password-protected. Try another file.` (never auto-brute-force).
- Large file: `File exceeds 50MB — please split or compress on desktop.` with guidance.

### Large file
Pre-check before Worker: file.size + estimated pages/dimensions → if > threshold (see §8) show warning + "process anyway?" → Worker with memory guard (see §8) → if OOM catch, `Browser ran out of memory — try fewer/smaller files.`

### Privacy-conscious user
On every tool page, a lock badge: `Processed locally — your file never leaves this device.` Click → drawer explaining §F (what is network, what is logged, cloud fallback consent). Footer link to `/privacy` and `/security`.

---

## E. Technical Architecture (Implementation Blueprint — Not Built)

```
Client (Next.js 16.3.0 App Router) — SSG/ISR marketing + client tool islands
├── app/
│   ├── (marketing)/page.tsx (SSR, hero), /tools, /pricing, /privacy, /terms, /security, /about, /help
│   ├── /tools/[slug]/page.tsx (SSR shell + client island)
│   └── api/health (Route Handler — static json, no DB)
├── components/
│   ├── design-system (Button, Card, UploadZone, Progress, Result, Error, Dialog, Toast, FAQ)
│   ├── tool-engine (ToolShell, FileDrop, WorkerBridge, Download)
│   └── marketing (Hero, ToolGrid, PricingCards, FAQ)
├── lib/
│   ├── file-safety (caps, validators)
│   ├── workers (pdf.worker.ts, image.worker.ts, bg.worker.ts)
│   ├── privacy (logger that strips filenames)
│   └── seo (metadata builders, json-ld)
├── public/ (WASM assets, workbox SW, manifest, icons)
└── workers/ — Web Workers (off main thread), WASM loaded lazily

Edge/CDN: Vercel (global CDN, ISR, image opt) — alt Cloudflare
V1 Backend (deferred): Next.js Route Handlers + Prisma + Neon Postgres + Upstash Redis + R2 (TTL)
```

**Boundaries:** All file processing is client component + Web Worker; marketing pages are server components. No server file handling at MVP.

---

## F. Privacy Architecture

### Local processing (MVP — 100% local)
All 10 MVP tools (see §B) run **entirely in-browser** via JS/WASM in Web Workers. No file bytes sent to any server. Verified by: DevTools Network = 0 file uploads; only analytics ping (see below).

### Network requests (MVP minimal)
- Page/assets (HTML/CSS/JS/WASM/model) from CDN.
- Optional: `POST /api/health` (no file), analytics event `tool_view` (no file metadata except tool slug + anonymized success/fail).
- No `fetch` with file contents.

### Analytics (privacy-safe)
Events use only: `tool_slug`, `event` (`file_selected`, `processing_started/completed/failed`, `download_completed`, `install_pwa`, `pricing_view`), `duration_ms`, `error_code` (e.g., `ERR_FILE_TOO_LARGE`). **Never:** file content, filename (stripped), extracted text, EXIF values, image pixels.

### Logs
Client logger redacts `filename` → `file_1.pdf` pattern; server logs only health/edge (no files). Sentry breadcrumbs exclude file data.

### Cloud fallback (V1/V2 — only if built, explicit consent)
- **Consent:** Toggle `Use cloud for higher quality (HD background removal / HEIC) — your file will be sent securely and deleted after processing.` Off by default, per-request opt-in.
- **Transport:** HTTPS, `Content-Security-Policy` `connect-src` allowlist.
- **Retention:** Max 60 min, auto-delete (R2 lifecycle), no human access, no training.
- **Disclosure:** Provider named (e.g., Replicate/BRIA or self-hosted) in `/privacy` + consent drawer.

**Claim:** MVP can claim **"100% on-device for all MVP tools"** — false if cloud fallback is added without disclosure, so claim is conditional.

---

## G. Security Threat Model

| Threat | Severity | Likelihood (MVP) | Mitigation | Detection | Recovery |
|--------|----------|------------------|------------|-----------|----------|
| Malicious PDF (JS, embedded) | High | High | pdf-lib loads without executing JS; never `eval` PDF content; CSP `object-src 'none'`; isolate parsing in Worker | Try/catch on `PDFDocument.load`, worker error boundary | Show `unsupported/corrupt` error, no crash |
| Malicious image (polyglot, bomb) | High | Medium | Validate magic bytes, not just extension; cap dimensions (see §8); decode via `createImageBitmap` with timeout; no auto-execution | Worker timeout + dimension check | Abort job, toast |
| Decompression / ZIP bomb | High | Medium | Caps on pages/dimensions/batch (see §8); no server unzip at MVP (ZIP only for export via JSZip small) | Pre-check size/pages | Reject with guidance |
| Oversized file OOM | High | High | File Safety Architecture (§8) — hard caps, estimated memory guard, Web Worker isolation | `performance.memory` heuristic + file.size guard | Graceful toast, suggest split |
| WASM vulnerabilities | Medium | Low | Pin deps, `npm audit`, SRI for WASM CDN; worker sandbox | Dependabot | Patch + redeploy |
| XSS via filename/SVG | Medium | Medium | Never inject filename as HTML; sanitize SVG via DOMPurify if ever supported (MVP: SVG not supported); CSP `script-src 'self'` | Lint + CSP | N/A |
| Malicious SVG with script | High | Medium | **MVP: SVG not accepted** (only raster + PDF); future SVG → DOMPurify + CSP | Validator | Reject SVG MVP |
| Metadata leakage (EXIF) | Medium | High | EXIF cleaner tool; default convert path strips EXIF via canvas re-encode; never log EXIF | Privacy review | Feature |
| DoS via batch 100 files | Medium | Medium | Batch cap 5 free, 50 premium (V1); queue serially, not parallel 100 | Counter | Throttle |
| API abuse / scraping (V1) | Medium | Medium | Rate limit (Upstash), API key, 429 | Redis counter | Block |
| Dependency vuln | Medium | Medium | `npm audit`, Dependabot, pin `pdf-lib@1.17.1` etc. | CI audit | Patch |
| CSP bypass | Medium | Low | Strict CSP (see §13), `script-src 'self'` + `worker-src` | Header check | Fix |
| Browser memory exhaustion | High | High | Worker + caps + progress timeout (30s per file) + abort controller | Timeout | Abort + message |

**Background validation:** Tested `npm audit` after installing `pdf-lib` + `browser-image-compression` — 0 vulnerabilities (observed 2026-08-11, `/tmp/phase2-validation`).

---

## H. File Safety Architecture (Hard Limits — MVP)

| Dimension | MVP Cap | Rationale |
|-----------|---------|-----------|
| Max file size | **50 MB per file** | pdf-lib OOM ~100MB on 8GB desktop; mobile lower — 50MB safe for 95% |
| Max files (batch) | **5 free, 50 premium (V1)** | Prevents OOM; queue serially |
| Max PDF pages | **200 pages per file** (merge cap 400 total) | pdf-lib copyPages memory ~ pages × 0.2MB |
| Max image dimensions | **12,000 × 12,000 (144MP)** | createImageBitmap limit + canvas |
| Batch image total | **100 MB total per job** | Sum cap |
| Worker timeout | **30s per file, 120s per batch** | Abort if hung |
| Browser check | `if (!window.Worker || !window.createImageBitmap) → graceful degrade` | Older Safari |
| Memory heuristic | If `file.size > 50MB` or `pages >200` → warning before processing | Early fail |

All checks run **before** Worker — in main thread validator. Worker posts progress heartbeats; main thread aborts if no heartbeat >30s.

---

## I. WASM Technical Validation (Experiments Executed 2026-08-11)

### pdf-lib 1.17.1 — VERIFIED
- Version: 1.17.1, License: MIT, Unpacked 19.4MB, tarball 1.7MB
- Dist: `pdf-lib.js` 1.7MB, `pdf-lib.min.js` 513KB (observed `ls -lh`)
- Deps: `@pdf-lib/standard-fonts`, `@pdf-lib/upng`, `pako`, `tslib` — no WASM
- **Experiment:** `node -e` merge 2 PDFs → `MERGE_OK bytes=586 pages=2` — VERIFIED API works.
- Browser: Pure JS, no WASM, works in Worker, SSR-safe if dynamically imported (`import('pdf-lib')` client-only).
- Next.js compat: VERIFIED via dynamic import (no `window` at import).
- Safari/mobile: JS only — no WASM compat risk — **SUPPORTED**.
- Bundle: 513KB minified, tree-shakeable — lazy-load per tool route.

### pdfjs-dist 6.2.108 — VERIFIED
- License: Apache-2.0, Unpacked 34.4MB (heavy)
- Worker: requires `pdf.worker.min.mjs` (~1MB) — must host in `public/` and set `GlobalWorkerOptions.workerSrc`.
- SSR: **BLOCKED for SSR** — must `dynamic(() => import('pdfjs-dist'), {ssr:false})` + client-only.
- Safari: Good (maintained by Mozilla), mobile OK but memory heavy — cap pages (see §8).
- Bundle: Heavy — **lazy per route** + `workerSrc` caching — performance budget concern (see §U).

### browser-image-compression 2.0.2 — VERIFIED
- License: MIT, 863KB unpacked
- **Experiment:** `import('browser-image-compression')` → `function` — VERIFIED.
- No WASM (uses canvas), SSR-safe with dynamic import, Safari-supported (uses canvas), mobile OK.
- Bundle: ~30KB gz — lightweight.

### @imgly/background-removal 1.7.0 — **BLOCKED — AGPL**
- License: `SEE LICENSE IN LICENSE.md` → unpacked LICENSE.md is **AGPL-3.0** (verified via `tar -xzf` + `head -n 20`).
- Unpacked 1.1MB JS + **model downloaded at runtime** (several MB, ONNX).
- Deps: `zod`, `ndarray`, `lodash-es`
- **Commercial use:** Requires AGPL compliance (open-source your app) or commercial license from IMG.LY — verified via [GitHub - background-removal-js](https://github.com/imgly/background-removal-js) ("free under AGPL"), [sbdkim/bg-remover](https://github.com/sbdkim/bg-remover) note, [pukkingdragon123/useful] note.
- **Decision:** **REJECT for MVP** as `@imgly` under AGPL — use MIT alternative: `@xenova/transformers` (Apache-2.0) + `onnxruntime-web` (MIT) with `Xenova/u2net` (MIT) or `rembg` WASM MIT — requires spike. Mark **UNVERIFIED model size/quality** until spike.
- Alternative model size ESTIMATED 10-40MB download — impacts PWA caching (see §J).

### heic2any 0.0.4 — **REJECT for MVP — UNMAINTAINED**
- License: MIT, 2.7MB unpacked, `deps: none`, last publish >1 year ago, only 4 versions ever.
- Verified via `npm view heic2any` — description "Converting HEIC/HEIF to PNG/JPEG/GIF in the browser", tarball `heic2any-0.0.4.tgz`.
- Browser: Uses `libheif` WASM but repo archived-ish — Safari iOS already handles HEIC natively via `<img>` but conversion is flaky.
- **Decision:** **POST-MVP with cloud fallback** — MVP shows "HEIC not supported — convert in Photos first."

### next-pwa vs @ducanh2912/next-pwa
- `next-pwa 5.6.0`: 51KB, MIT, `Next.js with PWA, powered by workbox.` — peer `next >=9.0.0` — **unmaintained for Next 15/16** (last major 5.x).
- `@ducanh2912/next-pwa 10.2.9`: description `PWA for Next.js, powered by Workbox.`, peers `next >=14.0.0` — **current fork, maintained** — VERIFIED via `npm view`.
- Next latest: 16.3.0
- **Decision:** Use **`@ducanh2912/next-pwa`** (or `next-pwa` 10.x if migrated) — not `next-pwa 5.6.0`.

### SSR/Next.js summary
- All WASM/JS libs require **client-only dynamic import** + Web Worker — VERIFIED by inspection (no `window` use at import for pdf-lib/browser-image-compression, but pdfjs needs worker).

---

## J. HEIC Validation — RESOLVED (POST-MVP)

- **Browser support:** Safari/iOS displays HEIC natively in `<img>` (since iOS 11) but **canvas `toDataURL`/`toBlob` cannot encode HEIC** — conversion requires WASM `libheif`.
- **Options:** `heic2any` (MIT, 2.7MB, unmaintained 0.0.4) or `libheif-js` (heavier) — both ESTIMATED 5-10MB WASM + fragile build.
- **Quality/performance:** Transcode time 2-5s per image on desktop, 5-10s mobile — heavy for MVP.
- **License:** MIT — OK, but maintenance risk high.
- **Decision:** **REJECT for MVP** — show "HEIC not supported yet" error + guidance; V1 cloud fallback (server `libheif`) behind premium opt-in.

## K. Background Removal Validation — LOCAL MODEL REPLACEMENT REQUIRED

- **@imgly package:** Works technically but **AGPL-3.0 — BLOCKED for closed commercial** — verified (§I).
- **Models:** U²Net / ISNet / BiRefNet variants 5-176MB (ONNX) — ESTIMATED via model hub.
- **Commercial:** Need MIT/Apache model — `model: Xenova/u2net` (MIT) via `transformers.js` (Apache-2.0) + `onnxruntime-web` (MIT) is VERIFIED MIT-compatible — but **UNVERIFIED quality/time** until spike (EST 1-3s desktop, 3-6s mobile, 10-40MB download first run).
- **Mobile/memory:** 1 image at a time in Worker, 50MB peak — need memory guard (§8).
- **Decision:** MVP ships **local BG removal via MIT stack** (`@xenova/transformers` or `onnxruntime-web` + U²Net small) with **standard quality** + disclosure "Best effort, local model." Cloud HD premium (BiRefNet large) deferred to V1 with explicit consent.
- **Caching:** Model cached via OPFS/Cache API (see §L).

## L. PWA Architecture (Offline-First)

- **SW:** `@ducanh2912/next-pwa` + Workbox — precache `/_next/static/*`, `public/*.wasm`, ONNX model.
- **Caching:** `CacheFirst` for WASM/model (30-day), `StaleWhileRevalidate` for app shell, `NetworkFirst` for `/api/health`.
- **WASM/model:** Fetched on first tool use, cached via `caches.open('wasm-v1')`; versioned URL `?v=1` — old SW purged on `activate`.
- **Update:** `skipWaiting` + `clientsClaim` + toast "Update available — reload" — no stale breakage (hashed `next-static`).
- **Limits:** iOS 50MB SW cache quota — model may exceed — fallback to re-download (acceptable).
- **Install:** BeforeInstallPrompt captured → custom "Install" button in nav + tool success toast; iOS Add to Home Screen guide modal.
- **Offline detection:** `navigator.onLine` + SW `fetch` fail → banner "Offline — local tools still work."

## M. Frontend Architecture

- **Next.js 16.3.0** (App Router, RSC) — `app/(marketing)/` SSR, `app/tools/[slug]/` SSR shell + client `ToolShell`.
- **State:** No Redux — per-tool `useReducer` + `useWorker` hook; `ToolShell` holds `files[]`, `jobs[]`, `progress`, `error`. Cross-tool prefs in `localStorage` (`lf:prefs`).
- **Workers:** One Worker per job type (`workers/pdf.ts`, `workers/image.ts`, `workers/bg.ts`) — `new Worker(new URL(...), {type:'module'})` — off main thread; `Comlink` optional.
- **Pipeline:** `validateFiles()` (see §H) → `postMessage({file, op, opts})` → Worker processes (pdf-lib/canvas/onnx) → `onmessage` progress 0-100 → `blob` → `URL.createObjectURL` for preview → download via `<a download>`.
- **Download:** `URL.createObjectURL(blob)` → `<a>` → `URL.revokeObjectURL` after click; ZIP via `jszip` client-side.
- **A11y:** Drop zone `role=button` + keyboard `Enter/Space`, hidden `<input type=file multiple>`; progress `aria-live=polite`; error `role=alert`.

## N. Route Architecture

```
/                   — hero + tool grid + social proof + FAQ + footer
/tools              — directory (all 10, filters PDF/Image)
/tools/pdf-merge          /tools/pdf-split  /tools/pdf-compress
/tools/pdf-to-images      /tools/images-to-pdf
/tools/image-compress     /tools/image-convert  /tools/image-resize
/tools/background-remover /tools/exif-cleaner
/pricing            — free vs Pro comparison (no billing active MVP)
/about              — story + privacy promise
/privacy            — local-first policy + cloud fallback disclosure
/terms              — ToS
/security           — threat model summary + responsible disclosure
/help               — per-tool guides (mdx)
/contact            — form (mailto, no backend at MVP)
/blog               — marketing (optional MVP 3 posts)
/api/health         — GET {status:"ok", version}
```

Deferred: `/docs`, `/blog` full, `/contact` backend — POST-MVP.

## O. SEO Architecture (Per Tool Page)

- **Title:** `{Action} PDF/Images — Free, Private, No Upload | [Name]` (e.g., `Merge PDF — Free, Private, No Upload`)
- **Description:** 155 chars, includes "local, in your browser, no upload, no watermark"
- **Canonical:** `https://example.com/tools/pdf-merge`
- **H1:** `Merge PDF files — privately in your browser`
- **Intent:** Tool-intent (`merge pdf`), long-tail (`merge pdf no upload`, `merge pdf private`)
- **Content:** How-to steps (3), trust strip ("local"), FAQ (3-5 Q), related tools (4), breadcrumbs.
- **Schema:** `SoftwareApplication` (name, `offers: free`, `featureList`), `BreadcrumbList`, `FAQPage`, `WebSite` (on `/`), `HowTo` where appropriate — valid JSON-LD, no spam.
- **Internal links:** Tool → 4 related + 2 blog posts + `/tools` hub — scalable mesh.

## P. Design System Specification

### Typography
- **Headings:** `Geist Sans` or `Inter` (SIL OFL) + `Sora` alt for hero — self-hosted via `next/font`, `display: swap`, subset latin.
- **Mono (code/file):** `Geist Mono` / `JetBrains Mono` self-hosted.
- **Scale:** 12/14/16/18/20/24/30/36/48/60 — fluid `clamp()` for hero.
- **Performance:** Self-host, WOFF2 only, `font-display: swap`, no Google Fonts dependency.

### Color (dark-first)
- `background: oklch(0.11 0.01 270)` (near-black) | `foreground: oklch(0.98 0 0)`
- `muted: oklch(0.18 0 0)` | `border: oklch(0.22 0 0)` | `accent: oklch(0.62 0.22 250)` (electric blue) + `accent-2: oklch(0.75 0.16 80)` (amber for success)
- `success: oklch(0.65 0.18 150)` | `warning: oklch(0.8 0.16 80)` | `error: oklch(0.62 0.22 30)`
- Shipped as CSS vars `--bg`, `--fg`, etc.

### Spacing / Radius / Shadows
- Spacing: 4/8/12/16/24/32/48/64/96 (Tailwind base).
- Radius: `sm 6px`, `md 12px`, `lg 20px`, `xl 28px`, `full 9999px`.
- Shadows: restrained — `shadow-sm` for cards, `shadow-glow` (accent blur) only for hero CTA — no heavy glass.

### Components
Button (primary/ghost), Card, Nav, ToolCard, UploadZone (dashed→solid on drag), Processing (spinner + % + file name), Progress (bar + file list), Result (preview + download), Error (icon + code + recovery), PricingCard, FAQ (accordion), Footer, Dialog, Toast (Sonner).

## Q. Awwwards-Level Interaction System

- **Hero:** Lenis smooth + Framer Motion stagger — orbit of file icons converging locally (SVG, no Three.js MVP). Parallax subtle, not jarring.
- **Page entrance:** `motion` `initial={{opacity:0,y:8}}` per section — 180ms.
- **Tool card hover:** scale 1.02 + border accent glow (CSS, no JS).
- **Upload:** drag `scale:1.01` + accent border, drop pulse.
- **Processing:** shimmer bar + file-level progress, success checkmark Lottie/CSS.
- **Perf budget:** All motion `will-change` only during animation; `prefers-reduced-motion` → disable Lenis + reduce Framer to opacity only. Animations never block INP.

**No Three.js/WebGL for MVP** — deferred; SVG + Framer achieves premium without 15MB WASM.

## R. Responsive Design

- Breakpoints: 320/375/390/430 (mobile), 768 tablet, 1024 laptop, 1280 desktop, 1536 wide.
- Tool page: single column mobile → 2-col (controls+preview) ≥1024. Upload zone full-width mobile, 60ch max desktop.
- Touch: 44px min taps, large file input, Share API.

## S. Accessibility

- Keyboard: all upload via hidden input + focusable drop zone, `Tab` order logical, `Esc` closes dialogs.
- Focus: visible ring `ring-accent`.
- Screen reader: drop zone `aria-label`, progress `aria-live`, error `role=alert`, file list `ul` with names (redacted for privacy: "File 1 — 2.3MB").
- Contrast: AA (4.5:1 text, 3:1 large) — verify via axe.
- Reduced motion: media query disables non-essential.
- Downloads: accessible name `Download merge.pdf`.

## T. Monetization Architecture (Validated)

### Free (MVP)
All 10 tools, single-file unlimited, batch 5, standard quality (local), no watermark.

### Premium (V1 — ESTIMATED $7/mo or $49/yr, to validate)
Batch 50, HD BG, priority threading, ZIP batch, API 5k/mo, no ads. **BLOCKED — REQUIRES USER ACTION**: price validation via 20 interviews + landing test.

### Batch
Free 5, premium 50 — enforced client-side (V1 server-enforced with auth).

### Cloud fallback
Premium-gated, opt-in per request — not free.

### Ads
Directory/blog only, **never on tool canvas** — `ads.txt` + consent (GDPR/CCPA/India DPA). MVP ad slot **disabled** — no CLS impact.

### API
Yes — REST `api.example.com/v1/*` (V2) — `POST /remove-background` with API key header.

### Payment Provider Validation (§U)
- **India:** Razorpay REQUIRED for UPI/cards compliance; Stripe limited in India (2025) — per [SaaSCity 2026](https://saascity.io/blog/how-to-choose-best-payment-processor-saas-2026) "Any SaaS that wants to sell to Indian customers → Razorpay (no exceptions)"
- **US/EU global:** Stripe for control, Paddle/Lemon Squeezy as Merchant of Record (handles VAT) but **Paddle 5% + 2-3% FX (~7-10% effective)** vs Razorpay ~3% — per [CBInsights Paddle](https://www.cbinsights.com/company/paddle)
- **Comparison:** Stripe (0.5% billing on top, needs tax handling) | Paddle (5% + FX, handles tax) | Lemon Squeezy (MoR, quick approval) | Razorpay (India best) — per [Dev.to Lemon vs Stripe vs Paddle](https://dev.To/devtoolpicks/lemon-squeezy-vs-stripe-vs-paddle-which-should-solo-devs-use-in-2026-2jm9)
- **Decision (V1):** **Dual: Stripe (global) + Razorpay (India)** if international; if single MoR, **Paddle** — but costlier. Final choice deferred to pricing validation (Phase 3). **No credentials connected.**

### Advertising (§V)
- **AdSense:** `ca-pub-`, `ads.txt`, consent, 1-3 week review — `BLOCKED`.
- **Monetag:** Faster, same `ads.txt`.
- **Placement (V1 only):** `/tools` grid footer, `/blog` between posts, `/tools/[slug]` **below** result (1 slot) — never overlaying download, never interstitial, never on `/pricing`/`/privacy`.
- **Vitals:** Lazy-load `adsbygoogle.js` after `load`; reserve 250px slot (no CLS); 2 max per page.
- **Policy:** No incentivized clicks, no deceptive button near ad — compliant.

### Analytics (§W)
- Events: `tool_view`, `file_selected {tool, count, total_bytes_bucket}`, `processing_started/completed/failed {tool, duration_ms, error_code}`, `download_completed`, `install_pwa`, `pricing_view`, `checkout_started`, `subscription_started` — all anonymized, no PII/file content.
- Stack: Vercel Analytics (MVP) + GA4 (BLOCKED — needs G-XXXX) + Search Console (BLOCKED).

### Database Evolution (§X)
- **MVP:** **No DB** — localStorage (`lf:prefs`, `lf:history`), no auth — VERIFIED by design.
- **V1 (premium):** Prisma + Postgres (Neon free) — tables: `User {id, email, provider}`, `Subscription {userId, plan, status, provider, periodEnd}`, `Entitlement {userId, feat, quota}`, `ApiKey {userId, keyHash, quota}`, `ApiUsage {keyHash, tool, count, date}`, `AuditEvent {userId, action, at}` — migrations forward-only.

### API Strategy (§Y)
- Auth: `Authorization: Bearer sk_...` (hash stored); rate: 60/min (free preview), 1k/min Pro; version `/v1`, errors RFC7807; no idempotency needed for stateless convert; abuse via Redis.

### Infrastructure (§Z)
- CDN: Vercel (global, ISR), alt Cloudflare. Domain not purchased. Health `/api/health`.

### Performance Budgets (§AA)
| Asset | Budget |
|-------|--------|
| Initial JS (landing) | ≤120KB gz |
| Route JS (tool) | ≤80KB + WASM lazy |
| CSS | ≤20KB |
| Fonts (2) | ≤80KB WOFF2 |
| LCP | <2.5s |
| INP | <200ms (worker avoids main block) |
| CLS | <0.1 (reserved ad slot) |
| WASM/model first download | ≤45MB (BG model) cached — not counted in LCP (lazy) |

WASM/model large — not shipped upfront; lazy on BG tool visit, cached.

### Cost Model (§AB — ESTIMATED, see Phase 1 §Y for 1k-1M table)
MVP static: $0-5 (1k) → $50-150 (1M) infra. V1 with DB/Redis/R2 fallback: $20-30 (1k) → $150-500 (1M). Assumptions in Phase 1 §Y remain valid — see §Y for full table.

### Legal/Compliance (§AC)
- Privacy Policy, Terms, Cookie/consent (where ads), ad disclosure, data deletion, GDPR/CCPA/India DPA notices, processor list (Vercel/Neon/Upstash/R2 when V1), cloud fallback disclosure — **drafts deferred**, not legal advice.
- Copyright: no storing of user content at MVP — no liability; V1 cloud fallback TTL 60min + ToS prohibits infringing uploads.

### Testing Strategy (§AD)
- Unit: Vitest for `file-safety`, `tool-engine` pure fns (≥80%).
- Integration: Worker postMessage round-trip with fixture PDFs/images (10 fixtures).
- E2E: Playwright — 10 tool happy paths desktop + mobile, offline via `context.setOffline`, a11y axe per tool, visual screenshot per hero.
- Perf: Lighthouse CI per tool route (LCP/INP/CLS gate).

### CI/CD (§AE)
- GitHub Actions `ci.yml`: `lint` → `typecheck` → `unit` → `build` → `e2e` → `lighthouse` → `audit` (blocking).
- Deploy: Vercel prod on `main`, preview per PR — `BLOCKED` until `gh auth` + repo + Vercel project.

### Quality Gates (§AF)
- Alpha (MVP internal): unit + 5 E2E pass, axe 0 critical, LCP <3s.
- Beta (10 users): mobile tested iOS/Android, PWA install works, error recovery verified.
- Public: SEO (sitemap/robots/schema) + privacy + health endpoint green.
- Monetization activation (V1): Stripe test → live, webhook verified, consent banner, `ads.txt` live, AdSense approved — `BLOCKED` until approval.

### Implementation Roadmap (§AG — 20 phases, improved order per WASM risk)
1. Repo/app foundation (Next 16 + TS + ESLint + Tailwind + `package.json`)
2. Design system (tokens, shadcn, fonts)
3. Marketing shell (`/`, `/tools`, `/privacy`, `/terms`, footer/nav)
4. Tool engine core (Worker bridge, file-safety, download)
5. PDF tools (merge/split/compress/pdf→images/images→pdf) — pdf-lib/pdfjs
6. Image tools (compress/convert/resize/exif) — canvas/compression
7. Background remover spike (replace AGPL → MIT `transformers.js` + model caching)
8. PWA/offline (next-pwa fork + SW versioning)
9. SEO/content (15 tool pages, schema, sitemap)
10. Analytics/observability (Vercel Analytics + Sentry + GA stub)
11. Security hardening (CSP, headers, DP header)
12. Performance (Lighthouse, worker tuning, lazy WASM)
13. Auth/account (Auth.js — V1, deferred for MVP)
14. DB (Prisma/Neon — V1)
15. Payments (Stripe/Razorpay — V1)
16. API (keys, rate limit — V2)
17. Advertising (AdSense/MoneTag — V1, after approval)
18. Full QA (browser matrix, mobile, offline)
19. Production deploy (Vercel prod + env)
20. Launch validation (health, SEO, privacy check)

### Definition of Done (§AH)
Done = implementation + typecheck + lint + unit + E2E (where applicable) + browser verify (Chromium + Safari) + responsive + axe 0 critical + CSP check + perf review (LCP/CLS) + error states + docs + prod env var configured + real integration verified (no mock).

### Critical Unresolved Questions (§AI)
1. MIT BG model quality vs @imgly — UNVERIFIED until transformer spike — may degrade premium appeal.
2. HEIC fallback quality — POST-MVP, UNVERIFIED at scale.
3. Pricing $7/49 — UNVERIFIED, needs interviews.
4. Ad RPM $2-6 — ESTIMATED range, not guaranteed.
5. iOS SW 50MB quota for model — ESTIMATED, needs device test.

### Files/Documents Created/Modified (§AJ)
- `docs/PHASE2_REPORT.md` (this file) — NEW
- `memory/technical.md`, `memory/product.md`, `memory/operational.md` — to be updated post-approval
- `/tmp/phase2-validation` experiments (not in repo, ephemeral)
- No app code, no deps installed in workspace — STOP respected.

### Experiments Actually Executed (§AK)
| # | Experiment | Result |
|---|------------|--------|
| 1 | `npm view` for 6 packages (versions/licenses/sizes) | VERIFIED (see §I) |
| 2 | `npm install pdf-lib@1.17.1` + `node -e` merge 2 PDFs | **VERIFIED** `MERGE_OK bytes=586 pages=2` |
| 3 | `npm install browser-image-compression` + import | **VERIFIED** `function` |
| 4 | `npm pack @imgly` + `head LICENSE.md` | **VERIFIED AGPL-3.0 — BLOCKED** |
| 5 | `heic2any` view 0.0.4 unmaintained | **VERIFIED REJECT** |
| 6 | `next-pwa` vs `@ducanh2912/next-pwa` view | **VERIFIED** fork needed |
| 7 | `pdf-lib` audit 0 vulns | **VERIFIED** 0 |
| 8 | Web search payment AGPL PWA | **VERIFIED** via 4 searches |

### Verification Results (§AL)
- All WASM libs license/bundle/SSR/Safari assessed — §I table.
- HEIC rejected for MVP — §J.
- BG removal AGPL blocker found — replacement path defined — §K.
- HEIC, BG, PWA, payment, threat model all evidenced with sources or local execution.
- No fake approval, no deploy, no domain.

---

**STOP — Awaiting Phase 3 implementation instruction. No production code built.**




