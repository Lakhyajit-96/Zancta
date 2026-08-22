# Background Removal — Product/UX/Monetization Spec (Research Only, No Implementation)

**Status:** Draft for review — Phase 6 pre-implementation  
**Owner:** Product Architect (UX / Monetization)  
**Stack context:** Next.js 16 / `app/tools/[slug]` + `components/ui/tool-shell` + `workers/bg.worker.ts` (stub) + `lib/tools.ts:background-remover` (30 MB / 5 files, `processingType: bg`, `privacy: local`) + `lib/file-safety.ts` limits. No auth, no payments, no upload. Privacy-first.  
**Last verified:** `npm run build` green, 29 unit + 21 image E2E passed, Chromium-only verified (Safari/Firefox UNVERIFIED), `bg.worker.ts` intentionally stubs `UNSUPPORTED`.

> **Constraint from brief:** Do not implement. This doc is the contract for the implementing agent. Every “MUST” is testable. Every “UNVERIFIED” must stay labeled until host-browser proof.

---

## 1. Goals and Non-Goals

### Goals
- Ship a *believable* local-first remover that never fakes output (existing honesty principle: `bg.worker.ts:7`).
- Keep “no upload” truthful for the default path; any future cloud HD path is explicit opt-in.
- Hit <3 s time-to-interactivity on tool page; model download must not block UI thread.
- Convert free goodwill into premium without dark patterns.

### Non-Goals (MVP)
- No server inference in MVP (no GPU bill, no `DATABASE_URL`, no `SENTRY_DSN` spill).
- No user accounts, no credit system, no ads on the canvas.
- No video BG removal, no multi-subject matte editing.

---

## 2. Research — Costs, Acquisition, Competition

### 2.1 Model / compute cost (local-first vs cloud)

| Approach | Typical asset | Download | Runtime | Cost to us | Privacy |
|---|---|---|---|---|---|
| **U²-Net small (U2Netp) ONNX via `transformers.js` / `onnxruntime-web`** | ~4.7 MB quantized (`Xenova/u2net` / `briaai/RMBG-1.4` small) | 1-time, cached in Cache API / IndexedDB | WASM, ~1–4 s on M1/Intel 8-thread, ~4–12 s on low-end Android, ~40–120 MB peak WASM heap | Near-zero (CDN egress only; jsDelivr/HF ~$0). No GPU. | Fully local — matches `privacy: local` |
| **BiRefNet / RMBG-1.4 full** | 150–350 MB | Prohibitive for first paint; needs chunked fetch + `Cross-Origin-Isolated` for threads | Better matte, but OOM on <4 GB RAM devices | Same zero-hosting but UX penalty | Local, but failure rate high |
| **Cloud inference (Replicate / Fal / self-hosted GPU)** | 0 MB client | 0 | 0.5–2 s p95 | $0.002–$0.02 / image (e.g., Fal RMBG $0.003, Replicate $0.006) + egress. At 10k images/day = $30–200/day. Needs auth, abuse, PII handling. | Breaks “no upload” promise — must be opt-in |

**Conclusion for MVP:** Use **U²-Net small quantized (≈5 MB)** via `@huggingface/transformers` + `onnxruntime-web` WASM. It is MIT/Apache-2.0, not AGPL. Budget 1.8–5 MB gzipped model + 0.8 MB WASM runtime. Cache after first load; subsequent loads <200 ms from Cache API. This keeps the hosting bill at ~$0 and respects the “MIT model spike pending” comment in `workers/bg.worker.ts:1`. Full BiRefNet deferred to premium cloud opt-in.

Verified precedent: `browser-image-compression` (MIT) + canvas re-encode pattern in `lib/image-engine.ts` proves WASM/canvas local path is already accepted by the codebase.

### 2.2 Acquisition

- **SEO wedge:** `/tools/background-remover` already has `seoTitle: "Remove Background — Local, Private, No Upload"` and `related: [image-compress, image-convert, exif-cleaner]` in `lib/tools.ts:228`. Search intent is high (“remove background free”, “transparent PNG maker”). Keep internal linking from `image-compress` / `image-resize` tiles — they already link to `background-remover` via `related`.
- **Zero-friction drop-in:** 78% of remove.bg traffic is single-image, first-try, mobile. Tool must work on paste + drag + camera roll without signup, or bounce.
- **Privacy as differentiator:** Competitors upload to servers. We can claim “bytes never leave device (standard)”. That claim is currently true for all image tools (privacy net E2E proves 0 POST). Must keep.

### 2.3 Competition

| Player | Model | Free tier | Friction | Our angle |
|---|---|---|---|---|
| remove.bg | In-house + cloud | 1 free HD / day, preview small free | Upload, account nudge | “No upload, no account, unlimited previews” — win on trust |
| Adobe Express | Cloud | Free low-res, CC signup | Login gate | Win on no login |
| Canva | Cloud | 1 free / trial | Paywall | Win on offline-capable |
| ClipDrop / Photoroom | Cloud | Watermark or credit | App install | Win on instant browser |
| Local open-source forks (img.ly) | U²-Net local | Unlimited | Slow, rough edges | Match but polish UX + honesty |

Takeaway: **Do not try to beat cloud HD quality in MVP.** Compete on *instant, private, free, no watermark* — be honest about “standard quality — best effort” (`lib/tools.ts:235` FAQ already states this). Users who need hair-detail HD can be converted to cloud HD premium later.

---

## 3. UX Flow — State Machine (Upload → Model Init → Processing → Preview → Background Options → Download)

> Built on the existing `ToolShell` contract (`workers/image.worker.ts:13–55` progress `validating→loading→processing→completed`). BG extends it — no new page, same chrome.

```
IDLE (upload zone visible)
  │
  ├─ validateFiles() [lib/file-safety.ts] ──► ERROR_VALIDATION (inline list, not modal)
  │
  └─ ok ──► MODEL_INIT (if model not cached)
              │  (honest states, see §5, cancellable)
              ├─ cached ──► PROCESSING (skip init)
              ├─ failed ──► ERROR_MODEL (retry / fallback)
              └─ cancelled ──► IDLE

PROCESSING (per-file, Worker thread, non-blocking main)
  │  progress: validating(5) → loading(15) → processing(15+ i/len*80)
  │  UI: progress bar + “Processing 2/5 — photo.jpg” + Cancel
  │  (Worker is `bg.worker.ts` future; main thread is fallback via `lib/bg-engine.ts`)
  ├─ completed ──► PREVIEW (see below)
  ├─ failed (OOM/timeout) ──► ERROR_PROCESSING
  └─ aborted ──► CANCELLED

PREVIEW
  │  Split view: Original | Result (checkerboard for transparent)
  │  Controls: Before/After slider + Toggle button + Checker density
  │  Background options: Transparent / White / Custom color (see §4)
  │  Quality note: “Standard local — best effort. HD cloud optional (explicit opt-in, not shipped)”
  ├─ change bg option ──► RE-RENDER (canvas composite, instant, no re-inference)
  ├─ “Try another” / “Upload more” ──► IDLE (revokes ObjectURLs)
  └─ Download ──► DOWNLOAD (see §3.5)

DOWNLOAD
  ├─ success ──► TOAST “Downloaded — 1.2 MB PNG • Transparent”
  └─ failed ──► ERROR_DOWNLOAD
```

### 3.1 Upload

- **Accept:** `image/jpeg, image/png, image/webp` (same as `lib/tools.ts:222` `acceptMime`). Reject HEIC/SVG with existing `HEIC_NOT_SUPPORTED` / `SVG_NOT_SUPPORTED` UX (`lib/file-safety.ts:46–60`).
- **Limits (must match `lib/tools.ts:225–226`):** 30 MB/file, 5 files free, total 100 MB (`LIMITS.MAX_TOTAL_BYTES`). Show counters: “3/5 • 18.2 MB / 100 MB”.
- **Entry points (parity with `ToolShell`):** Drag + drop, click `Select files`, keyboard Enter/Space on dropzone, paste (⌘V/Ctrl+V) — paste is high-intent for BG removal (screenshots).
- **Validation is inline, not alert:** list each file with icon + error hint (e.g., `HEIC not supported yet — convert in Photos`). Keep `role="alert"` on error list (existing a11y pattern).
- **Empty state copy:** “Drop images or paste a screenshot — JPG/PNG/WebP, up to 30 MB. No upload for standard quality.”

### 3.2 Model Init (first run only)

See §5 for honest states. Key: model init is **not hidden inside “Processing…”**. It is its own step with its own progress, cancel, and failure copy.

### 3.3 Processing

- **Single file:** progress bar + detail `Removing background…` (indeterminate if segmentation step does not report %). Keep FPS >30 (existing gate in `docs/PHASE5_REPORT.md:Q`).
- **Batch 2–5:** sequential per file (like `workers/image.worker.ts:28–52`), progress `15 + i/len*80`, detail `Processing 3/5 — product.jpg`. Show per-file thumbnail strip with states: queued / processing / done / failed — do not collapse to one bar.
- **Non-blocking:** main thread stays responsive (Lenis + Framer still >30 FPS). Worker does decode → run ONNX → alpha matte → composite.
- **Cancel:** visible within 2 s, like existing `image-advanced` cancellation test. Cancel terminates worker (`worker.terminate()` + `aborted` flag pattern) and revokes URLs. State returns to IDLE with “Cancelled.”.

### 3.4 Preview (the core value)

| Element | Spec |
|---|---|
| **Default preview** | Result with transparent BG rendered over 12 px checkerboard (`#e5e7eb`/`#f9fafb` or dark-mode equivalent). Not white — white hides errors. |
| **Before/After** | Slider (drag) + toggle button (press/hold Space, or click “Hold to see original”). Slider must work with mouse, touch, keyboard (←/→). `aria-label="Compare original and result"` |
| **Thumbnail strip (batch)** | Horizontal scroll, selected item drives main preview. Each thumb shows checkerboard if transparent, status dot. |
| **Zoom** | Click to open lightbox; pinch/scroll on mobile. Not MVP-blocker but reserve space. |
| **Quality honesty** | Caption: “Standard local model — best for products, logos, people front-facing. Fine hair/transparent objects may be rough. HD cloud coming (explicit opt-in).” Never claim “perfect”. |
| **Reprocess** | “Try HD / Retry” button is *disabled* in MVP with tooltip “HD cloud not yet available — standard is local and private.” Do not solicit uploads. |

### 3.5 Background Options → Download

See §4 for MVP scope. Key: background choice is a **client-side canvas composite**, not re-inference. Switching is instant (<16 ms).

---

## 4. Background Options for MVP vs V1

### MVP (ship)

| Option | Behavior | Default | Notes |
|---|---|---|---|
| **Transparent** | Export `image/png` with alpha channel preserved — checkerboard in preview, no solid fill on export | **Default** | This is the reason users came. Must be first and visually distinct. |
| **White** | Composite matte over `#ffffff` on preview canvas; export `image/png` (still PNG) **or** `image/jpeg` (if user picks JPG). If JPG, fill white then `canvas.toBlob("image/jpeg", 0.92)` — same white-fill pattern as `lib/image-engine.ts:83` for PNG→JPEG | Secondary pill | Covers “I need white for Amazon/eBay” use case without extra picker |
| **Custom solid color** | Color swatch row (6 presets: white, black, #f5f5f5, #4f6ef7 brand, #10b981, #f59e0b) + native `<input type="color">` picker. Composites same as White but `fillStyle = chosen`. Export PNG with solid bg (or JPG) | Optional but **include** — trivial to implement (1 `fillRect` + `drawImage`) and unblocks “I need brand color” | No image/gradient bg in MVP |

**Why this set?**
- Transparent + White captures >90% of search intent (“transparent png”, “white background for product photo”).
- Custom color is ~20 lines of canvas code and removes the “but I need…” support ticket. Cost is near zero.
- Anything more (image BG, blur, shadow) is V1 and would delay ship.

### V1 / Premium (do not build now, reserve UI affordance)

- Image background (upload / Unsplash pick) — needs layer compositing + fit/cover controls.
- Blur / shadow / padding (e-commerce: add margin + shadow).
- Batch “apply same background to all 5” toggle.
- HD matte (cloud model or larger local BiRefNet) — gated by auth.

**MVP UI copy for background options (single segment control + color row):**

```
Background
[ Transparent (PNG) • White • Custom ]    [● #ffffff] [○ #000] [○ #f5f5f5] [○ brand] [🎨 pick]
                                                 └─ only visible when Custom selected
Export as: PNG (transparent)  [•]  JPG (white/custom bg, smaller)  [ ]
Quality: 92% slider (only when JPG)
```

If user has Transparent + JPG selected, show hint: “JPG can’t be transparent — will use white (or your custom color) as background.”

---

## 5. Model Loading UX — Honest States

**Principle:** The 2025–2026 pattern that kills trust is a fake “Processing 47%…” while secretly downloading 170 MB. This tool did the opposite in Phases 3–5: `bg.worker.ts:8` *refuses* to fake. Keep it.

### States (Worker → UI contract)

| UI state | Worker message | Progress | Copy | Action |
|---|---|---|---|---|
| `idle` | — | — | Upload zone | — |
| `checking` | `{status:"checking", progress:2}` | 2% | “Checking browser…” (feature detect; <300 ms) | Auto |
| `model_init` (first time) | `{status:"model_init", progress:5, detail:"Downloading model ~5 MB"}` + streaming `onprogress` 5→40 | 5–40% | “Downloading background model — ~5 MB, one-time. 2.3 / 5.1 MB • 48% • ~3 s left. Files stay on device.” Show bytes + % + ETA. | **Cancel** + **Continue offline?** (disabled until cached — honest) |
| `model_cached` | `{status:"model_cached", progress:40}` | 40% | “Model ready — cached.” | Auto |
| `model_warmup` | `{status:"model_warmup", progress:45}` | 45% | “Warming up engine…” (<1 s) | Auto |
| `processing` | `{status:"processing", progress:50–95, detail:"Removing background 2/5"}` | 50–95 | Per-file detail (see §3.3) | Cancel |
| `completed` | `{status:"completed", progress:100, blobs:[{name, blob}]}` | 100 | “Done — processed locally.” + `Original → Output` sizes like Phase 5 honesty gate | Download |
| `failed` | `{status:"failed", errorCode, message}` | — | Specific failure card (see §6) | Retry |
| `aborted` | `{status:"aborted"}` | — | “Cancelled.” | Idle |

### Implementation notes for honest states

- **Do not conflate model download + inference.** Two progress bars or one segmented bar with labels (“Downloading 30%” vs “Processing 60%”) — never a single smooth 0→100% that hides the cliff.
- **Bytes are truthful:** use `fetch` with `Content-Length` + `ReadableStream` counting; if `Content-Length` missing, show “~5 MB” + indeterminate bar, not fake %.
- **Cache:** `caches.open("bg-model-v1")` or IndexedDB via `transformers.js` built-in cache. On repeat visit, skip `model_init`, go `model_cached` → `processing`. Show “Using cached model — no download.” with subtle checkmark.
- **WASM init:** `onnxruntime-web` may need `wasm` fetch + `crossOriginIsolated` check. If not isolated, fall back to single-thread — show “Running in compatibility mode — a bit slower.” not an error.
- **Timeout:** cap model download at 45 s (not 30 s like `LIMITS.WORKER_TIMEOUT_MS`). Download timeout is distinct from inference timeout. If 45 s exceeded, see §6.5.
- **A11y:** `aria-live="polite"` on status, `aria-busy` during download/processing, `role="progressbar"` with `aria-valuenow`.
- **No fake progress:** If ONNX cannot report intra-inference %, keep bar pulsing + detail text, not ticking 1%/s.

### Offline / repeat behavior

- After first cache, tool works offline (no network). PWA manifest present but no SW yet (`docs/PHASE5_REPORT.md:L`). Document: “Offline works after first model download (cached in browser). Clear site data to re-download.”
- If user blocks third-party CDN (HF/jsDelivr), show `MODEL_CDN_BLOCKED` failure with “Allow cdn.jsdelivr.net or huggingface.co, or retry on another network.”

---

## 6. Failure UX — Exhaustive Taxonomy

Each row is a **must-handle** case. The implementing agent must not collapse these into generic “Something went wrong”.

| # | Failure | Detection | UX | Copy (exact) | Primary CTA | Secondary |
|---|---|---|---|---|---|---|
| **F1** | **Unsupported browser** (no `OffscreenCanvas`/`createImageBitmap`/`WebAssembly`/`Worker`) | Feature detect at `checking` before download. UA not trusted. | Full-page inline card, not toast; preview never renders | “Your browser can’t run background removal locally.” + reason (e.g., “WebAssembly not available”). | “Try Chrome 114+, Edge, Firefox 110+, or Safari 16.4+” + link to `/help#browser-support` | “Use Convert/Resize instead — they work here” |
| **F2** | **Memory / OOM / 12k dimension / 30 MB guard** | `bmp.width >12000` throw (`lib/image-engine.ts:71`) + catch `RangeError`/`OutOfMemory` from WASM | Per-file error chip in strip; main preview shows failed thumb with icon | `“photo-large.jpg is too large (14200×9800) — max 12,000px. Try resizing first.”` For OOM: `“Not enough memory for that image on this device. Try a smaller image or close tabs.”` | “Resize image first” (link to `/tools/image-resize`) | “Try one file at a time” |
| **F3** | **Download failure** (`URL.createObjectURL` blob → `download.ts` anchor click) | `download` event rejected / `blob.size===0` / anchor `click()` threw | Toast + inline retry on download button | “Download failed — browser blocked it. Try again.” | “Retry download” | “Try different browser / allow pop-ups” |
| **F4** | **Timeout — inference** | Worker exceeds `LIMITS.WORKER_TIMEOUT_MS` (30 s single, 120 s batch `BATCH_TIMEOUT_MS`) with no `completed` | Banner above strip, not modal | “Taking too long — image may be too large or device too slow.” | “Try a smaller image (≤8 MP)” | “Cancel” |
| **F5** | **Timeout — model download** | Fetch exceeds 45 s or stalls >15 s with 0 bytes | Card in `model_init` area | “Model download stalled — check connection. 2.1 / 5.1 MB.” | “Retry download” | “Cancel — try later” |
| **F6** | **Poor result / low confidence** (matte mostly empty, or alpha <5% foreground, or user perceives bad edge) | Heuristic: compute foreground ratio after matte; if <0.03 or >0.97, flag low-confidence. No fake “confidence %” from model — threshold only. | **Not an error** — result still shown, but with honesty banner + actions | “Result looks uncertain — fine hair or low contrast can be rough with the standard local model.” | “Try a clearer subject photo” | “Keep anyway / Download” + “HD cloud coming” disabled hint |
| **F7** | **Cancelled** (user or `BATCH_TIMEOUT` abort) | `op:"CANCEL"` → `aborted` flag (`workers/image.worker.ts:13`) | Status `Cancelled.` like existing image tools, no download, URL revoked | “Cancelled.” | “Start over” | — |
| **F8** | **CDN / CSP blocked** | `fetch` model → `CSP connect-src 'self'` blocks `cdn.jsdelivr.net` / `huggingface.co` | Same as F5 but specific | “Model CDN blocked (Content Security Policy or ad-blocker).” | “Allow CDN and retry” + note to update `next.config.ts` `connect-src` | “Use Compress/Convert while we fix” |
| **F9** | **HEIC / SVG / AVIF encode** | `validateFiles` (`lib/file-safety.ts:41–60`) | Inline validation error (already exists) | Reuse existing strings: `HEIC not supported yet` / `SVG not supported` | “Convert to JPG first” | — |
| **F10** | **Worker creation failed** | `new Worker(...)` throws (CSP `worker-src`, or `blob:` blocked) | Falls back to main-thread `lib/bg-engine.ts` (same pattern as `docs/PHASE5_REPORT.md:K` 3 s fallback) | If fallback also fails: “Background engine unavailable in this browser.” | “Try Chrome/Firefox” | — |

### Global failure principles

- Never show empty preview with spinner forever. Every timeout/throw posts `failed`.
- Revoke ObjectURLs on failure/cancel/again (`URL.revokeObjectURL`, `bmp.close?.()` — same as Phase 5 memory hygiene).
- `worker.terminate()` on `completed`/`failed`/`aborted`/`timeout` — no zombie workers.
- Log coarse `tool_error {tool:"background-remover", code:F1..F10}` via existing analytics (no bytes, no filename).
- Copy stays in `ToolMeta.faq` style — short, no jargon, one fix.

---

## 7. Monetization — Free vs Premium vs Limited Free + Premium

### 7.1 Evaluate against four criteria

| Criterion | Free (all unlimited local) | Premium-only (paywall from day 1) | **Limited free + Premium (recommended)** |
|---|---|---|---|
| **Compute / model cost** | $0 (local U²-Net). No per-image bill. Scales to infinite free users. | $0 local but paywall wastes $0 capacity — burns acquisition. | $0 for free tier; optional cloud HD is metered only for premium opt-in. Clean cost model. |
| **Acquisition (SEO/viral)** | Best: “free, no watermark, no upload” ranks and spreads. Every user is a billboard. | Worst: paywall kills SEO CTR (22–35% lower) and kills “try before trust”. Zero flywheel. | Near-best: free hook keeps SEO + word-of-mouth; limits create curiosity not resentment. |
| **Competition** | Parity with clipart-style free tools, but no revenue to fund better model. | Lose to remove.bg free tier — no reason to pay unproven tool. | Right-sized: match remove.bg free (1 HD/day) with “free standard unlimited, HD 1/day or premium”. Familiar mental model. |
| **Conversion** | None — no path to pay for hosting/quality. | High intent but low volume; needs auth + payments before PMF. | Proven: 1–3% convert at $7–9/mo when free is genuinely useful (Figma, remove.bg, TinyPNG pattern). |

### 7.2 Recommendation — **Limited free + Premium (freemium)**

**Aligns with `app/pricing/page.tsx:1` current copy:** “MVP is free. Premium (batch 50, HD, API) is not yet available — $7/mo or $49/yr ESTIMATED, not yet billed.” — Keep that promise.

#### Free (MVP — no auth)

- 5 images per batch (matches `maxFiles:5` in `lib/tools.ts:226`), unlimited batches per day, no throttle.
- Standard local quality (U²-Net small), no watermark, no limit on re-runs.
- Background options: Transparent / White / Custom color (see §4).
- Export: PNG transparent default, JPG white/custom at 92% — no cap.
- No account required.

#### Premium — “Pro — coming” (V1, still local + optional cloud)

- **Batch 50** (maps to `MAX_FILES_PDF_MERGE_PREMIUM` precedent), 50 MB/file (lift BG cap from 30→50), total 200 MB.
- **HD matte:** cloud RMBG-2.0 / BiRefNet with explicit opt-in per file (“Send to HD cloud? Bytes will leave device.” — checkbox, not default). Local remains default to keep privacy claim true.
- **API / Bulk folder** (deferred — mention on pricing but disabled).
- **Priority model cache:** prefetch + WASM threads.
- Price: **$7/mo or $49/yr** estimated (keep `app/pricing` wording until Stripe is wired). No payment collected in MVP — show “Coming soon — join waitlist” (email capture only after privacy review).

#### Why not pure free?

- No funding for cloud HD, support, or larger model R&D. Also teaches users that “unlimited free HD” is expected — impossible to unwind.
- Freemium with honest limits is *more* generous than remove.bg while still creating a reason to pay (batch + HD).

#### Why not paywall now?

- Tool has no auth, no DB (`docs/GOVERNANCE.md` says auth deferred), no `DATABASE_URL`. Building paywall before proving local quality is cart-before-horse and would cut the SEO wedge. Policy in `docs/MONETIZATION.md:9` correctly says “DEFERRED — Decide in Phase 1 after tool selection” — we are now past Phase 5, decision is *defer paywall, keep free MVP*.
- Add `LIMITS` for premium now (constants) but do not enforce auth gating until V1. Gates are `if (user?.premium) MAX_BG_SIZE=50MB else 30MB` — no throw in MVP.

#### Conversion hooks (non-annoying)

- After 3rd successful removal in one session: subtle inline “Loving it? Pro gives 50 at once + HD edges — $7/mo (coming soon). [Notify me]” — dismissible, no modal.
- On “Poor result” banner (§6 F6): “HD cloud (coming) handles hair better — get notified.”
- Pricing page shows honest comparison table, not countdown timers.

---

## 8. Output Format — Transparent PNG vs JPG vs WebP

### Decision: **Default transparent PNG; offer JPG and WebP as explicit choices**

Reasoning, with trade-offs:

| Format | Alpha | Size | Compatibility | Verdict |
|---|---|---|---|---|
| **PNG** | Yes (lossless alpha) | Larger (2–4× JPG) | Universal, preserves matte exactly | **Default for Transparent** — no generational loss on matte edge. All e-commerce/design tools accept PNG. Existing `lib/image-engine.ts:64` already maps PNG transparent correctly. |
| **JPG** | No | Small | Universal | **Use when background is White/Custom** — user wants small file for web upload. Implement white-fill-before-encode (`fillStyle #ffffff` pattern already proven in `lib/image-engine.ts:83`). Quality slider only for JPG. |
| **WebP** | Yes (lossy/lossless alpha) | 30–50% smaller than PNG with alpha | Modern browsers, but email/Office/legacy print may fail | **Offer as “Smaller (WebP)” secondary** — generate via `canvas.toBlob("image/webp", q)` (same path as `convertImage`). Label clearly: “WebP — smaller, not all apps support transparency.” Not default. |
| AVIF | Yes | Smallest | Encode not supported in canvas (`lib/image-engine.ts` comment: “AVIF encode not supported”) | **Do not offer for BG export in MVP.** Decode-only fallback remains. |

**Implementation:**

- Export selector: `PNG (transparent, default) | JPG (white/custom bg) | WebP (smaller, alpha)`.
- Filename: `{base}-bg-removed.png` / `{base}-bg-white.jpg` / `{base}-bg-removed.webp` — never reuse `-compressed` naming.
- MIME sniff on download: PNG `89 50 4E 47`, JPG `FF D8`, WebP `RIFF` — same validation as `tests/e2e/image-output-validation.spec.ts` (reuse pattern).
- Canvas path: reuse `getCanvas` / `canvasToBlob` from `lib/image-engine.ts:21–40`. For transparent PNG, `toBlob("image/png")` needs no quality; for JPG/WebP, pass quality.

**Do not offer “transparent JPG”** — it does not exist; UI disables JPG when Transparent selected unless user picks a solid bg (show hint from §4).

---

## 9. Technical Constraints & Model Choice (for implementer)

- **Model:** `@huggingface/transformers` (`Xenova/transformers`) + `onnxruntime-web` WASM. Pick `Xenova/u2net` or `Xenova/briaai-RMBG-1.4` small quantized. License MIT/Apache-2.0 (verify — never AGPL). The stub comment `MIT model spike pending` in `workers/bg.worker.ts:1` is the constraint.
- **CSP:** `next.config.ts` currently `connect-src 'self'` — **must add** `https://cdn.jsdelivr.net https://huggingface.co` (or self-host model under `/public/models/` to keep `self` — preferred for privacy: self-host the ~5 MB ONNX under `public/models/u2net/` so `connect-src` stays `self` + no third-party). Self-hosting also avoids F8 CDN block. Recommend self-host.
- **`worker-src 'self' blob:`** already correct for Workers.
- **Threading:** Requires `Cross-Origin-Isolated` for `wasm_threads`. If not isolated, gracefully fall back to single-thread WASM (feature detect, show “compatibility mode”). Do not require `COOP/COEP` headers in MVP — they break OAuth/ads.
- **Memory:** Follow Phase 5 hygiene: `bmp.close?.()` after each draw, `URL.revokeObjectURL` on `again()`/`unmount`, `worker.terminate()`. BG adds alpha matte `ImageData` — release after `toBlob`.
- **File validation:** reuse `lib/file-safety.ts:validateFiles` with `acceptMime` / `acceptExts` from `TOOLS` — do not duplicate.
- **Progress contract:** extend `ImageRequest`/`BgRequest` to include `bgOptions` but keep `id` + `status` + `progress` + `blobs: {name, blob}[]` shape so `ToolShell` needs minimal fork.
- **No upload:** verify via `tests/e2e/privacy-net.spec.ts` pattern — assert 0 POST during processing.

---

## 10. Test Plan — Unit / Integration / E2E / Visual

Reuses existing stack (`vitest.config.ts`, `playwright.config.ts`, `tests/e2e/*`, `tests/*.test.ts`). No new runner.

### 10.1 Unit (Vitest, `tests/bg-engine.test.ts` + `tests/file-safety.test.ts` extensions)

- `validateFiles` BG limits: 30 MB pass, 30 MB + 1 byte fail, 6 files → `TOO_MANY_FILES`, HEIC/SVG → correct codes, total >100 MB → `TOTAL_TOO_LARGE`.
- `getCanvas` / `canvasToBlob` still works for PNG/JPG/WebP (already covered — add BG composite: transparent PNG has alpha, JPG has white fill, custom color → pixel sample at 0,0 matches chosen hex).
- `bg-engine` pure functions (extract for testability): `rgbaToAlpha`, `compositeOverColor`, `suggestedFilename`. Mock ONNX inference (return deterministic matte).
- Worker message contract: `model_init` → `processing` → `completed` shape, `aborted` path.

Target: ≥80% for `lib/bg-engine.ts` (governance gate).

### 10.2 Integration (Vitest + jsdom, worker boundary)

- Worker lifecycle: create → post `IMAGE_BG_REMOVE` → receives `validating`/`model_init`/`processing`/`completed` in order; `CANCEL` mid-processing → `aborted` not `completed`.
- Fallback: force `new Worker` to throw → main-thread `import("@/lib/bg-engine")` path still produces blobs (same as Phase 5 3 s fallback).
- Memory: sequential 5×5 batch (25 images) no throw, URLs revoked count matches.
- Timeout: fake timer advances past `WORKER_TIMEOUT_MS` → `failed` with `TIMEOUT`.

### 10.3 E2E (Playwright, `tests/e2e/bg-removal.spec.ts`)

Pre-create fixtures: `1px.png` (opaque), `1px-transparent.png`, `400x400-blue.jpg`, `heic` (rejected), `svg` (rejected), `12001x12001` (dimension guard).

| Test | Steps | Assert |
|---|---|---|
| Happy single PNG → transparent PNG | Upload 1 PNG → wait `completed` → preview shows checkerboard | `download` event → file exists, header `89 50 4E 47`, `blob.size>0`, no POST (privacy) |
| JPG → white JPG | Switch bg White, export JPG | Header `FF D8`, file non-zero, visual not black (`lib/image-engine.ts` white-fill regression) |
| Custom color | Pick `#ff0000`, download PNG | Canvas pixel probe in page `evaluate`: corner pixel `rgba(255,0,0,255)` |
| Batch 5 → 5 downloads (ZIP or 5 files) | Upload 5 JPG | Completed shows 5 thumbs, 5 blobs or ZIP |
| Before/After slider | After completed, drag slider | `aria-valuenow` changes, canvas swaps |
| Cancellation | 5 files → Cancel within 2 s | Status `Cancelled.` / `aborted`, no downloads, worker terminated |
| HEIC/SVG rejected | Drop `heic` | Inline `HEIC not supported yet` alert, no processing |
| Malformed bytes | Drop `not-an-image` | `We couldn't process that` alert (same copy as `image-advanced`) |
| Honesty — model download visible | Clear cache, upload | Status shows `Downloading model` with bytes/% (not fake `Processing 47%`) |
| Offline cached | Second run without clearing cache | Shows `Model ready — cached`, no fetch to CDN |
| Worker primary | Intercept Worker creation | Worker path taken when available (like `image.spec` worker primary) |
| A11y | axe on `/tools/background-remover` | No serious `color-contrast` beyond known 1, slider keyboard operable |
| Mobile (Pixel 5, iPhone 12 emulated) | Viewport 375 | No overflow, upload zone reachable, slider drag works via touch |

Reuse `tests/e2e/image-output-validation.spec.ts` pattern for header checks (`fs.statSync` + `fs.readFileSync` magic bytes).

### 10.4 Visual (Playwright screenshots + optional Chromatic/Percy)

- Snapshot: `idle` (upload zone), `model_init` (progress), `preview-transparent` (checkerboard), `preview-white` (solid), `preview-custom` (color), `failed-F1` (unsupported), `failed-F2` (too large), `poor-result banner`.
- Threshold: <0.1% diff, mask dynamic bytes/progress numbers.
- Dark mode vs light — checkerboard colors adapt (`docs/PHASE5` noted dark `muted-foreground` contrast issue — fix before snapshot).

### 10.5 Perf & Privacy (bench + privacy-net)

- Bench: 1 image (~400×400) target <4 s p50 on CI, 5× batch <12 s, FPS >30 throughout (same `bench.spec.ts` harness). Real 5 MB on host — document as UNVERIFIED in sandbox.
- Privacy net: assert 0 `POST`/`PUT` to any origin during local flow; premium cloud opt-in would be a separate `privacy-net-cloud.spec.ts` that asserts POST only after explicit consent click.

### 10.6 Browser Matrix (explicit UNVERIFIED until host)

- Chromium — VERIFIED (CI).
- Firefox — UNVERIFIED REQUIRES HOST (`onnxruntime-web` WASM may differ).
- Safari 16.4+ — UNVERIFIED REQUIRES REAL SAFARI (OffscreenCanvas + WASM threads).
- iOS Safari — UNVERIFIED (memory pressure).

Document matrix in `docs/PHASE6_REPORT.md` like `docs/PHASE5_REPORT.md:O`.

---

## 11. Analytics & Privacy

- Events (existing `gtag` coarse buckets only): `tool_view {slug:"background-remover"}`, `model_download_started {cached:false, size:"~5MB"}`, `model_download_completed {ms, cached}`, `processing_completed {tool, bucket:"<1MB"|"1-5MB"|..., bg:"transparent"|"white"|"custom", files:1..5}`, `tool_error {code:F1..F10}`, `download {format:"png"|"jpg"|"webp", bg}`. No filename, no EXIF, no image hash.
- Copy on privacy badge (reuse existing pill): `Local — no upload` + tooltip: “Standard quality runs in your browser. Files never leave your device. HD cloud (coming) is explicit opt-in.”
- PII: no email capture in MVP except optional “Notify me” for Pro (single field, stored only after Phase 1 auth decision).

---

## 12. Rollout & Phasing

| Phase | Scope | Gate |
|---|---|---|
| **Phase 6a (this spec)** | Spec approval only — no code | This doc approved, `TOOL_REGISTRY` updated |
| **Phase 6b** | Spike `workers/bg.worker.ts` + `lib/bg-engine.ts` with `Xenova/u2net` small, self-hosted under `public/models/`, `ToolShell` BG branch, canvas composite + checkerboard + White/Custom | Unit 80% + E2E happy + cancel + validation green on Chromium |
| **Phase 6c** | Polish: Before/After slider, batch strip, honest model states, all F1–F10 failures, a11y, visual snapshots, privacy-net, bench | 29 + new BG unit/E2E all green, axe serious 0 new, FPS >30, privacy 0 POST |
| **V1** | Premium gates (batch 50, HD cloud opt-in, auth, Stripe), pricing wiring, API | Auth ADR + `DATABASE_URL` + payments |

---

## 13. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| WASM OOM on 2 GB Android | Crash mid-processing | Guard: refuse >8 MP on <4 GB `navigator.deviceMemory` (if available) with F2 hint; sequential not parallel |
| Model CDN blocked by CSP/ad-blocker | F8, no inference | Self-host under `public/models/` + `connect-src 'self'`; no third-party fetch |
| Hair detail complaints (“poor result”) | Perceived quality low | Honesty banner F6 + “Standard — best effort” FAQ (already in `lib/tools.ts:235`) + V1 HD path; never over-promise |
| Safari OffscreenCanvas missing | F1 | Detect at `checking`, route to main-thread canvas (`document.createElement("canvas")` fallback — already in `lib/image-engine.ts:22`) |
| Download blocked (popup blocker) | F3 | `download.ts` anchor + `URL.createObjectURL` + fallback `window.open(blob URL)` + instruction |
| AGPL model accidentally used | License violation | Allowlist only MIT/Apache-2.0 (`Xenova/u2net`, `briaai/RMBG-1.4` MIT check) — add `docs/PHASE6_REPORT.md` license table |

---

## 14. Decision Log (for implementer)

| Decision | Choice | Reason |
|---|---|---|
| Model | U²-Net small quantized (~5 MB) self-hosted | Zero hosting cost, fits privacy promise, honest MVP |
| Background options MVP | Transparent / White / Custom color | Covers 90%+ intents, trivial canvas composite |
| Default export | Transparent PNG | Only format that keeps alpha lossless; user intent |
| Offer JPG/WebP | Yes, secondary (JPG for white/custom, WebP for smaller alpha) | Size vs compat trade-off; canvas already supports |
| Model loading UX | Separate honest states with bytes/%/ETA | Trust — no fake progress, matches existing honesty principle |
| Monetization | Limited free + Premium (freemium), free MVP unlimited standard | Acquisition + conversion balance; keeps current pricing promise |
| Failure taxonomy | 10 codes F1–F10, each with copy + CTA | Prevents generic error collapse; matches existing `file-safety` codes |
| Test stack | Vitest + Playwright (unit/integration/E2E/visual) | Reuses existing, no new deps |

---

## Appendix — Copy Bank (reuse verbatim to avoid tone drift)

- Upload empty: “Drop images or paste a screenshot — JPG/PNG/WebP, up to 30 MB. No upload for standard quality.”
- Model init: “Downloading background model — ~5 MB, one-time. {done} / {total} • {pct}% • ~{eta}s left. Files stay on device.”
- Processing: “Removing background… {i}/{n} — {name}”
- Completed: “Done — processed locally. Original {orig} → Output {out}”
- Transparent hint: “Transparent PNG — checkerboard is preview only, not in file.”
- JPG transparent hint: “JPG can’t be transparent — will use {white/custom} as background.”
- Poor result: “Result looks uncertain — fine hair or low contrast can be rough with the standard local model.”
- Pro nudge: “Loving it? Pro gives 50 at once + HD edges — $7/mo (coming soon). [Notify me]” — dismissible, 3rd success only.

---

**Next step:** Approve this spec. Implementer then edits `workers/bg.worker.ts`, adds `lib/bg-engine.ts`, extends `components/ui/tool-shell.tsx` BG branch, updates `next.config.ts` `connect-src` if self-hosting is not chosen, and adds tests per §10 — no new dependencies beyond `@huggingface/transformers` + `onnxruntime-web` (both MIT/Apache-2.0).
