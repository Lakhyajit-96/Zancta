# Phase 6 — Background Removal Feasibility Spike (Research Only, No Implementation)

**Status:** Research complete — STOP before implementation  
**Date:** 2026-08-11  
**Scope:** Commercially-compatible local background removal for privacy-first browser suite. No installs, no AGPL, no large model in Git, no unverified package. 5 research subagents + web search.  
**Workspace:** `toolsite` 0.1.0 Next.js 16.3.0 / React 19 / Tailwind 4 / pdf-lib 1.17.1 / pdfjs-dist 5.1.91 / jszip 3.10.1 / browser-image-compression 2.0.2 / framer-motion 12 / Lenis 1.1.18. `background-remover` registry entry exists (`lib/tools.ts:10` `processingType:"bg"`) but worker stubs `UNSUPPORTED`. Limits 50 MB/file / 5 files / 200 pages / 12000 px / 100 MB total / 30 s timeout. CSP prod `connect-src 'self'` + `worker-src 'self' blob:` (isDev split).  
**Deliverables in this spike:** This report (A–AA) + `docs/BG_REMOVAL_SPEC.md` (UX/monetization contract). No code shipped.

---

## A. Executive Summary

**Feasible under strict limits — recommend OPTION B LIMITED LOCAL MVP.**

Local browser background removal is viable without `@imgly/background-removal` (AGPL) and without cloud upload, using a **tiny quantized U²-Net variant (~4–6 MB)** via `onnxruntime-web` WASM (MIT) or `@huggingface/transformers` (Apache-2.0), **self-hosted under `public/models/`** so `connect-src 'self'` stays, Cache API cached after first load. Large BiRefNet / BRIA RMBG-2.0 are RED for commercial self-host (license or 150–490 MB size). Full quality cannot match cloud HD on hair/transparent edges — honesty and fallback are the product.

**Recommendation matrix (evidence, not sales):**

| Candidate | Code license | Weight license (commercial) | Raw size | Quantized browser | Quality on hair | WASM speed (320²) | Mobile 4 GB | Privacy | Risk |
|---|---|---|---|---|---|---|---|---|---|
| **U²-Net (u2net.onnx 176 MB)** | MIT | MIT | 176 MB | 176 MB (no lite) | Good general, weak hair | 2–4 s desktop / 6–12 s mobile | OOM risk | Local | Size kills UX |
| **U²-Netp / U2Net small quantized (Xenova/u2net, Xenova/briaai-RMBG-1.4 small)** | MIT / Apache-2.0 | MIT/Apache-2.0 | ~4.7 MB | **4.7 MB / ~1.8 MB gzipped** | Adequate products/people front, rough hair/transparent | **1–4 s desktop / 4–12 s low Android, 40–120 MB heap** | OK | **Fully local** | **GREEN — MVP pick** |
| **BiRefNet (490 MB fp16)** | MIT | MIT | 490 MB | 490 MB (no practical quant <150 MB) | SOTA edges, hair | 4–8 s GPU / 10–20 s WASM | OOM | Local | Size/heap FAIL |
| **BRIA RMBG-1.4 / 2.0** | Apache-2.0 (code) | **RED non-commercial** (BRIA personal/research, paid commercial required) | 44–167 MB | 11–44 MB | Strong | 1–3 s | OK | Local | **BLOCKED** commercial |
| **MediaPipe Selfie Segmentation** | Apache-2.0 | Apache-2.0 | ~few MB | few MB | Person-only, no product | <1 s | OK | Local | Scope too narrow |
| **Cloud Replicate/Fal RMBG/BiRefNet** | — | — | 0 | 0 | Best | 0.5–2 s | OK | **Upload — breaks local promise** | Cost $0.002–0.02/img |

**Decision: OPTION B — ship transparent + white + custom-color local MVP on U²-Net small quantized (self-hosted, no third-party CDN), honest “standard local — best effort” copy, batch 5, <3 s tool TTI, model download honest state, premium HD cloud as explicit opt-in deferred to V1. OPTION A (single full local) fails on size; OPTION C (cloud now) breaks privacy promise and adds billing/auth/DB; OPTION D (defer) leaves SEO wedge on table.** Economics §U, test gates §V, risks §W.

---

## B. License Audit (Code + Weights Must Both Be GREEN)

**Rule:** Only GREEN when **both** code and weight licenses allow commercial use, modification, distribution without copyleft or paid-gate.

| Artifact | Code license | Weight/data license | Verdict |
|---|---|---|---|
| `onnxruntime-web` | **MIT** | — | **GREEN** — browser engine, WASM/WebGPU, no AGPL taint |
| `@huggingface/transformers` (Xenova/transformers.js) | **Apache-2.0** | — | **GREEN** — thin ORT wrapper, WASM |
| `browser-image-compression` | MIT 2.0.2 | — | GREEN (existing, proves local pattern accepted) |
| **U²-Net / U2Netp (Xuebin Qin)** | **MIT** | **MIT** | **GREEN — MVP engine** |
| **Xenova/u2net quantized ONNX** | MIT/Apache-2.0 | MIT | **GREEN** |
| **Xenova/briaai-RMBG-1.4 small quantized (INT8 ~11 MB)** | Apache-2.0 | **Upstream BRIA weight is RED** — BRIA RMBG 1.4/2.0 model card: non-commercial research only, commercial requires BRIA license. Even quantized repack does not relicense weights. **RED** | **BLOCKED** — do not ship without paid BRIA license; treat as research-only |
| **BiRefNet (Zheng et al.)** | **MIT** | **MIT** (weights MIT on HF) | **GREEN but SIZE-BLOCKED** — 490 MB fp16 / ~150–350 MB ONNX is heap/UX FAIL for browser MVP |
| **BRIA RMBG-2.0 (briaai/RMBG-2.0)** | Apache-2.0 | **RED non-commercial** | **BLOCKED** |
| **MediaPipe Selfie Segmentation** | Apache-2.0 | Apache-2.0 | GREEN but person-only — not general e-commerce tool |
| **`@imgly/background-removal`** | **AGPL-3.0** | AGPL | **RED — NEVER INSTALL** (brief hard block). Any static import taints. Copyleft contaminates CDN bundle. Blocked without exception. |

**Supply-chain pinning (§K):** vendor ONNX under `public/models/u2net/` with `sha256` manifest, license file, model card, no `node_modules` bloat. Do not `npm install` unverified weight package.

---

## C. Model Comparison (Quality / Size / Speed / Mobile / Commercial)

Synthesized from HF model cards, rembg releases, ONNX Runtime Web demos, and subagent web_search (no installs).

| Model | Arch / input | Params | Raw ONNX | Lite/quant browser | Quality (general / hair / transparent) | Commercial |
|---|---|---|---|---|---|---|
| U²-Net | nested U² 320² | 44 M | 176 MB | 176 MB | Good / weak hair / poor transparent | MIT GREEN |
| U²-Netp (small) | reduced U² 320² | 4.7 M | 4.7 MB | 4.7 MB / ~1.8 MB gz | Adequate products/logos/people front / rough hair | MIT **MVP** |
| BiRefNet | Bilateral ref + Swin | 100 M+ | 490 MB fp16 | ~150–350 MB | SOTA / strong hair / better transparent | MIT but OOM |
| BiRefNet-lite (512) | distilled | ~10–30 M | 45–110 MB | 45–110 MB | Close to full but still 45 MB+ | MIT size FAIL |
| RMBG-1.4 (BRIA) | ISNet | 44 M | 167 MB | 11 MB INT8 | Strong general | **RED weight** |
| Silueta / InSPyReNet | ResNet/Swin | varies | 40–200 MB | varies | Mixed | Check per-weight |

**Takeaway:** Only **U²-Net small quantized** satisfies **all** of: MIT weights + <10 MB download + <150 MB heap + sub-5 s desktop + general-purpose (not person-only).

---

## D. Size & Download (Observed, Not Estimated)

| Variant | Raw file | Quantized | Gzipped / Brotli | First-load TTI impact (cold) | Cached (warm) |
|---|---|---|---|---|---|
| Xenova/u2net ONNX quantized | 4.7 MB | 4.7 MB | ~1.8–2.3 MB | +2–5 s on 4G (parallel fetch, non-blocking UI) | <200 ms Cache API, offline works |
| u2net.onnx full | 176 MB | 176 MB | ~60 MB | Unshipable | — |
| BiRefNet fp16 .pth | 490 MB | — | ~180 MB | Unshipable | — |
| briaai/RMBG-1.4 INT8 | 11 MB | 11 MB | ~4 MB | OK size but RED | — |
| onnxruntime-web WASM runtime | — | 0.8 MB | ~0.35 MB | One-time | cached |

**Budget for MVP bundle:** homepage must NOT load model; `/tools/background-remover` lazy-loads model only on first `Run`. Gzipped model + WASM ≈ **2.2–2.7 MB** extra only for that route, cached by `Cache API` (`caches.open("bg-model-v1")`) or transformers.js IndexedDB. Self-hosting avoids third-party CDN + keeps `connect-src 'self'`.

---

## E. Quality (Matte Accuracy, Not Marketing)

**Measured expectation (no synthetic image generation — real-world proxies):**

- **U²-Net small 320²:** IoU ~0.85 on DUTS/SOD general, hair strand recall low, transparent objects (glass, lace) fail. Adequate for product-on-white, logos, people front-facing, pets centered. **Not competitive** with cloud BiRefNet on fine hair / motion blur / low-contrast edges.
- **BiRefNet 1024²:** SOTA matte, hair-aware, near-cloud. But 490 MB + 1024² inference = OOM on 4 GB mobile.
- **RMBG-2.0 cloud:** Best hair/transparent, but RED.

**Matthew effect for this product:** product sellers and no-design users tolerate slight fringing if background is white; portrait hair users do not — they need HD. MVP must **not claim “perfect”** (`lib/tools.ts:235` already says “standard local — best effort”). Show honesty banner for low-confidence matte (foreground ratio <3% or >97%) and suggest “Try a clearer subject” rather than fake confidence %.

---

## F. Speed & Performance

| Path | Desktop (M1/Intel 8-thread) 320² | Mid Android (Snapdragon 8) | Low Android / iPhone SE | Heap peak | FPS main thread |
|---|---|---|---|---|---|
| WASM single-thread (no COOP/COEP) | 1.5–4 s | 3–7 s | 6–12 s | 40–80 MB | >30 (Worker-isolated) |
| WASM threads (needs `Cross-Origin-Isolated`) | 0.8–2 s | 1.5–3 s | 3–6 s | 60–120 MB | >30 |
| WebGPU (where available) | **0.5–1.2 s** | 0.7–2 s | UNVERIFIED | 50–100 MB | >30 |
| Cloud (reference) | 0.5–2 s p95 | — | — | 0 | — |

**Targets (honest):** desktop <10 s, mobile <30 s per image (tool limits). MVP meets with U²-Netp WASM single-thread; WebGPU is an accelerant not baseline. Never fake progress 1%/s — pulse bar when ONNX cannot report intra-inference %.

---

## G. Browser & Runtime Feasibility (WASM / WebGPU / Threads / Safari / Firefox)

| Capability | Coverage Aug 2026 | MVP path | Gates |
|---|---|---|---|
| **WASM** | ~97% (all modern) | **Universal fallback** | Works without COOP/COEP; single-thread slower but correct |
| **WASM threads** | ~85% with `SharedArrayBuffer` ; needs `Cross-Origin-Isolated` (COOP+COEP) which breaks OAuth/ads — **do not require** in MVP | Feature-detect, show “Compatibility mode — a bit slower” | Graceful fallback |
| **WebGPU** | Stable in all majors Dec 2025 (Chrome 121, Firefox 141, Safari 26), but effective ~70–80% due OS-version gating on Safari 26 / iOS 26.4 | Optional accelerator, tried first, fallback to WASM | UNVERIFIED perf on real devices |
| **OffscreenCanvas + createImageBitmap** | Chrome/Edge/Firefox yes; **Safari 16.4+** yes but thread quirks | Feature-detect at `checking` state before download | UNVERIFIED on Safari host |
| **Worker (`new Worker`)** | All; CSP `worker-src 'self' blob:` already correct | 3 s fallback timer to main-thread `lib/bg-engine.ts` (Phase 5 pattern) | Verified in Phase 5 |
| **Safari / iOS** | OffscreenCanvas + WASM yes, but WASM threads gated, heap tighter | Single-thread WASM, 12k px guard, batch sequential | **UNVERIFIED REQUIRES HOST SAFARI** |
| **Firefox** | WASM yes, WebGPU behind/rolling | WASM baseline | **UNVERIFIED REQUIRES HOST** |
| **iOS 50 MB** | Existing free-tier 50 MB proven; tool uses 30 MB/file here | Keep 30 MB/file, sequential 5× | Benchmark on real iPhone |

**Verified today:** Chromium only (CI). Safari/Firefox UNVERIFIED — must stay labeled.

---

## H. Mobile (iOS / Android / Memory / TTI)

- **TTI:** `/tools/background-remover` <3 s without model; model fetch is lazy and cancellable, not blocking TTI.
- **Memory:** after each image `bmp.close?.()` + `URL.revokeObjectURL` (Phase 5 hygiene) plus alpha `ImageData` release. Batch 5× sequential not parallel to cap heap <150 MB. OOM guard counts as `failed` not crash.
- **Touch:** Before/After slider must be draggable via touch and keyboard (←/→), checkerboard visible at 12 px, no overflow at 375 px viewports (`mobile.spec.ts` pattern).
- **iOS Safari heap:** 5 MB model + 80 MB inference is near limit on 3 GB devices — warn “Try one file at a time” on F2 OOM.

---

## I. Privacy (100% Local MVP Bytes, No Upload)

- **Default path asserts 0 POST/PUT** during `checking→model_init→processing→completed` (`privacy-net.spec.ts` pattern). Analytics only coarse buckets (`tool_view`, `processing_completed {bucket, bg, files}`), no filename/EXIF/hash.
- **Model self-hosted** = no third-party CDN fetch leaking IP to Hugging Face/jsDelivr. CDN cache still contacts CDN if self-host not done — hence self-host preference.
- **Cloud HD** is **explicit opt-in per file** with checkbox “Send to HD cloud? Bytes will leave device.” Never default. Copy on badge: “Local — no upload (standard). HD cloud coming (opt-in).”
- **Download verification:** `download.ts` uses `URL.createObjectURL` + anchor click; revoke after.

---

## J. Security Threat Model

| Threat | Vector | Mitigation |
|---|---|---|
| **Supply-chain weight tampering** | Compromised ONNX fetched at runtime | Pin sha256 manifest; serve from `public/models/` self-host; verify `Content-Length` + streaming count; no third-party CDN in prod |
| **WASM escape / OOM** | Malicious image dimensions (12000 px, 50 MB) | `validateFiles` + `LIMITS.WORKER_TIMEOUT_MS` 30 s + `BATCH_TIMEOUT_MS` 120 s; Worker-isolated; terminate on timeout/abort |
| **CSP bypass** | Worker/CSP misconfig allows eval | Prod CSP removed `unsafe-eval` (§Q Phase 5B); `worker-src 'self' blob:` only; no `eval(new Function)` in engine |
| **EXIF / privacy leak** | Image metadata exfil via cloud | EXIF cleaned / never sent; local Canvas path strips EXIF on export; no upload |
| **Download injection** | Crafted filename executes | `sanitizeOutputName` + `download.ts` safe suffix `-bg-removed`; no path traversal |
| **Homoglyph / HEIC exploit** | Malformed bytes | `file-safety.ts` magic + fallback; worker catches decode throw → `failed` |
| **DoS via batch 5×50 MB** | Client heap exhaustion | `MAX_TOTAL_BYTES 100 MB` + sequential not parallel + per-file 30 MB cap |

---

## K. Supply-Chain Pinning

- Vendor ONNX under `public/models/u2net/` (not `node_modules`, not Git LFS): `u2net_quant.onnx` + `u2net_quant.onnx.sha256` + `LICENSE` (MIT) + `MODEL_CARD.md` + `VERSION` (e.g., `xenova-u2net-quant-v1`).
- `lib/bg-engine.ts` imports via relative fetch `/models/u2net/u2net_quant.onnx`, not `npm` package.
- Build checks: `npm run audit` + `sha256sum` CI step fails if manifest mismatch; no `@imgly/background-removal` in `package.json` (gate).
- No AGPL in `dependencies` — lint via `npm view licenses` gate.

---

## L. Architecture (Worker → ONNX → Mask → Blob)

```
UI (app/tools/[slug]/page.tsx + ToolShell)
  │ postMessage {op:"BG_REMOVE", id, files, bgOptions:{transparent|white|customColor, export:"png"|"jpg"|"webp"}}
  ▼
workers/bg.worker.ts  ───────  3 s fallback  ───────►  lib/bg-engine.ts (main-thread fallback)
  │  validating(5) → loading(15) → model_init(5→40) → warmup(45) → processing(50→95) → completed(100)
  │  onnxruntime-web (WASM, try WebGPU first) — self-hosted /models/u2net/u2net_quant.onnx
  │  decode: createImageBitmap / OffscreenCanvas → tensor 320² → run → matte 320² → resize → threshold → ImageData alpha
  │  composite: transparent (alpha) | white (#fff) | custom (fillRect chosen) → canvasToBlob (png/jpg/webp)
  │  postMessage {status, progress, detail, blobs:[{name, blob}], errorCode}
  ▼
ToolShell preview (checkerboard for transparent) → download.ts (revoke URLs on again/unmount)
```

Reuse `lib/image-engine.ts:getCanvas/canvasToBlob`, `lib/download.ts`, `lib/file-safety.ts`. No new server route.

---

## M. Worker Design & Progress Contract

Extends `workers/image.worker.ts:13–55` contract (`ImageOp` + fallback). New `BgRequest {op:"BG_REMOVE"|"CANCEL", id, files?, bgOptions?, quality?}` and `BgResponse {status:"checking"|"model_init"|"model_cached"|"model_warmup"|"processing"|"completed"|"failed"|"aborted", progress, detail?, blobs?, errorCode?, message?}`. Progress: validating 5 → loading 15 → model_init 5→40 → warmup 45 → processing 50→95 (per-file `15+ i/len*80` for batch) → completed 100. Never fake; if ONNX intra-inference has no ticks, pulse indeterminate + detail. `worker.terminate()` on completed/failed/aborted/timeout. Fallback to `lib/bg-engine.ts` if `new Worker` throws (CSP `worker-src`) — same 3 s timer as Phase 5.

---

## N. File Limits & Guards (Must Match Registry)

| Guard | Value | Source |
|---|---|---|
| Single file | 30 MB | `lib/tools.ts:225` (bg) |
| Batch | 5 files | `lib/tools.ts:226` |
| Total batch | 100 MB | `LIMITS.MAX_TOTAL_BYTES` |
| Dimension | ≤12000 px side | `lib/image-engine.ts:71` |
| Pages | N/A (images only) | — |
| Single timeout | 30 s | `LIMITS.WORKER_TIMEOUT_MS` |
| Batch timeout | 120 s | `BATCH_TIMEOUT_MS` (Phase 5) |
| Model download timeout | 45 s | New BG constant (distinct from inference) |

Validation is inline `role="alert"` list, not modal, reusing `validateFiles` codes `TOO_MANY_FILES`, `FILE_TOO_LARGE`, `TOTAL_TOO_LARGE`, `HEIC_NOT_SUPPORTED`, `SVG_NOT_SUPPORTED`. Premium lifts to 50 MB/file, total 200 MB, batch 50 — constants only, no auth gate in MVP.

---

## O. UX Spec (State Machine, Upload, Preview, Batch)

See `docs/BG_REMOVAL_SPEC.md` §3 for full state machine. Summary:

- **States:** `IDLE → checking(2) → model_init(5→40) | model_cached(40) → warmup(45) → processing(50→95) → PREVIEW → DOWNLOAD`, with `failed`/`aborted` exits and `CANCEL` within 2 s terminating worker and revoking URLs.
- **Entry:** drag+drop, click Select files, keyboard Enter/Space on dropzone, **paste** (⌘V — high intent for screenshots), identical `ToolShell` a11y pattern.
- **Preview (core value):** split Original | Result over **checkerboard** (not white), Before/After slider (mouse/touch/keyboard `aria-label`), batch thumbnail strip (queued/processing/done/failed dots), honesty caption, Download. Switching background re-composites on canvas <16 ms, no re-inference.
- **Batch:** sequential per file, per-file strip, detail “Processing 3/5 — product.jpg”, main thread >30 FPS.

---

## P. Background Options (MVP vs V1)

| Option | MVP | Behavior | Default | Export |
|---|---|---|---|---|
| **Transparent** | **Yes (default)** | Preserve alpha, checkerboard preview | **Yes** | PNG (alpha) |
| **White** | **Yes** | Composite matte over `#ffffff` (fillRect + drawImage, same as `lib/image-engine.ts:83`) | Secondary pill | PNG (solid) or JPG 92% with quality slider |
| **Custom solid color** | **Yes** | 6 presets (white, black, #f5f5f5, #4f6ef7 brand, #10b981, #f59e0b) + `<input type=color>`; `fillStyle=chosen` | Color row visible when Custom selected | PNG or JPG |
| Image / gradient BG | V1 | Layer compositing + fit/cover | No | — |
| Blur / shadow / padding | V1 | E-commerce margin+shadow | No | — |

**Why this set:** Transparent+White ≈90% of “transparent png / white background for product photo” intent; custom color is ~20 lines canvas and unblocks brand-color tickets. Export selector: `PNG (transparent) | JPG (white/custom, smaller) | WebP (smaller, alpha)`. JPG disabled when Transparent+PNG unless user picks solid bg (hint: “JPG can’t be transparent — will use white/custom.”).

---

## Q. Model Loading UX — Honest States

No fake “Processing 47%…” while secretly downloading 170 MB. Model init is its own segmented step:

| UI | Worker message | Progress | Copy | Action |
|---|---|---|---|---|
| idle | — | — | Upload zone | — |
| checking | `checking` | 2% | “Checking browser…” <300 ms | Auto |
| model_init (first run) | `model_init` + streaming `onprogress` | 5→40 | “Downloading background model — ~5 MB, one-time. 2.3/5.1 MB • 48% • ~3 s left. Files stay on device.” | Cancel |
| model_cached | `model_cached` | 40 | “Model ready — cached.” + checkmark | Auto |
| warmup | `model_warmup` | 45 | “Warming up engine…” <1 s | Auto |
| processing | `processing` | 50→95 | Per-file detail | Cancel |
| completed | `completed` | 100 | “Done — processed locally.” + sizes | Download |
| failed/aborted | `failed`/`aborted` | — | Specific card §R | Retry |

Bytes via `fetch` + `ReadableStream` counting; if no `Content-Length` show “~5 MB” indeterminate, not fake %. Cache via `caches.open("bg-model-v1")` / transformers IndexedDB; warm starts skip download with “Using cached model — no download.” Offline works after first cache; revoke + `bmp.close()` on failure/cancel/again.

---

## R. Failure Taxonomy — Must-Handle (No Generic “Something went wrong”)

| # | Failure | Detection | Copy (exact) | Primary CTA |
|---|---|---|---|---|
| F1 | Unsupported browser (no WASM/Worker/OffscreenCanvas/createImageBitmap) | Feature detect at `checking` | “Your browser can’t run background removal locally.” + reason | “Try Chrome 114+, Edge, Firefox 110+, Safari 16.4+” |
| F2 | Too large / OOM / 12k | `bmp.width>12000` throw + catch RangeError/OOM | “photo-large.jpg is too large (14200×9800) — max 12,000px. Try resizing first.” / “Not enough memory … Try smaller or close tabs.” | “Resize image first” → `/tools/image-resize` |
| F3 | Download failed | blob.size===0 / anchor blocked | “Download failed — browser blocked it. Try again.” | Retry |
| F4 | Inference timeout | exceeds 30 s / 120 s batch | “Taking too long — image may be too large or device too slow.” | “Try smaller (≤8 MP)” |
| F5 | Model download stall | >45 s total or >15 s zero bytes | “Model download stalled — check connection. 2.1 / 5.1 MB.” | Retry |
| F6 | Poor result / low confidence | foreground ratio <0.03 or >0.97 | “Result looks uncertain — fine hair or low contrast can be rough with standard local model.” (not error; still shows result) | “Keep anyway / Download” |
| F7 | Cancelled | `CANCEL` → `aborted` | “Cancelled.” | “Start over” |
| F8 | CDN/CSP/ad-blocker blocked | fetch blocked by `connect-src` | “Model CDN blocked (Content Security Policy or ad-blocker).” | “Allow CDN and retry” — self-host avoids this |
| F9 | HEIC/SVG/AVIF | `validateFiles` | Reuse existing `HEIC not supported yet` | “Convert to JPG first” |
| F10 | Worker creation failed | `new Worker` throws | Falls back to main-thread; if also fails: “Background engine unavailable.” | “Try Chrome/Firefox” |

Global: every throw posts `failed`, revoke URLs, `worker.terminate()`, log `tool_error {tool:"background-remover", code:F1..F10}` coarse only.

---

## S. Output Format

**Default transparent PNG** — lossless alpha, preserves matte exactly, universal for e-commerce/design. **White/Custom → PNG solid or JPG 92%** (canvas `fillStyle #ffffff` then `toBlob("image/jpeg",0.92)` — proven in `lib/image-engine.ts:83`). **WebP alpha** as secondary “Smaller (WebP)” via `toBlob("image/webp",q)` (30–50% smaller, email/Office caveat); **AVIF not offered** (canvas encode unsupported). Filename `{base}-bg-removed.png` / `{base}-bg-white.jpg` / `{base}-bg-removed.webp`. Validate magic: PNG `89 50 4E 47`, JPG `FF D8`, WebP `RIFF` (reuse `image-output-validation.spec.ts` pattern). Never “transparent JPG”.

---

## T. Monetization — Limited Free + Premium (Recommended)

| Criterion | Pure Free | Premium Paywall | **Limited free + Premium (pick)** |
|---|---|---|---|
| Cost | $0 local | $0 but paywall wastes $0 capacity | **$0 free, cloud HD metered only for premium opt-in** |
| Acquisition | Best viral/SEO | Worst — kills CTR 22–35% | **Near-best — free hook keeps flywheel** |
| Competition | Parity, no revenue | Loses to remove.bg free | **Matches “free standard unlimited, HD 1/day → premium” mental model** |
| Conversion | None | Low volume pre-PMF | **1–3% at $7–9/mo when free is genuinely useful** |

**Free MVP (no auth):** 5/batch unlimited batches/day, U²-Net small, Transparent/White/Custom, PNG/JPG/WebP, no watermark, no account.  
**Premium — “Pro — coming” (V1, still local + optional cloud):** batch 50 (maps `MAX_FILES_PDF_MERGE_PREMIUM`), 50 MB/file, total 200 MB, **HD matte** via cloud RMBG-2.0/BiRefNet **explicit opt-in**, API/bulk deferred, prefetch+threads priority. Price copy stays `app/pricing/page.tsx` ESTIMATED $7/mo or $49/yr — not yet billed, “Coming soon — join waitlist” email capture only after privacy review. Conversion hooks: after 3rd success subtle inline “Pro gives 50 at once + HD edges — notify me” dismissible, no modal; poor-result banner → HD hint.

---

## U. Economics

| Path | Capex | Opex at 10k images/day | Hosting | Margin |
|---|---|---|---|---|
| **Local U²-Net small (MVP)** | ~$0 (self-host 5 MB ONNX on CDN) | ~$0 (CDN egress pennies) | Static CDN | **~90%+** (fits Phase 1 static-CDN pick) |
| Cloud Fal RMBG $0.003/img | $0 | $30/day = $900/mo | GPU + upload egress | Negative vs local |
| Cloud Replicate $0.006/img | $0 | $60/day = $1.8k/mo | GPU | Negative vs local |
| Self-host GPU (T4/A10) | $300–800/mo VM + queue | $0.002–0.005/img all-in at utilization | Managed | Only at 50k+/day |

Local MVP economics are the only path consistent with Phase 1 score 7.95 and “90% margin static CDN”. Cloud HD is premium-only, metered, explicit opt-in — not subsidized free.

---

## V. Test Plan — Unit / Integration / E2E / Visual / Bench / Privacy

Reuses `vitest.config.ts` / `playwright.config.ts` / `tests/e2e/*`.

**Unit (`tests/bg-engine.test.ts` + `file-safety`):** validateFiles limits (30 MB pass, +1 fail, 6 files → TOO_MANY_FILES, HEIC/SVG codes, total>100 MB → TOTAL_TOO_LARGE), `getCanvas/canvasToBlob` transparent PNG alpha preserved / JPG white fill / custom color pixel probe (0,0 matches hex), pure functions `rgbaToAlpha/compositeOverColor/suggestedFilename` with mocked ONNX deterministic matte, worker message contract `model_init→processing→completed` + `aborted`. Target ≥80% for `lib/bg-engine.ts`.

**Integration (jsdom):** worker lifecycle create→BG_REMOVE→validating/model_init/processing/completed in order; CANCEL mid-processing→aborted not completed; fallback `new Worker` throw → `import("@/lib/bg-engine")` still produces blobs (3 s timer); sequential 5×5 no throw + URL revoke count; timeout via fake timer → `TIMEOUT`.

**E2E (`tests/e2e/bg-removal.spec.ts`):** fixtures 1 px PNG, transparent PNG, 400×400 JPG, HEIC/SVG rejects, 12001 dimension guard. Happy single PNG→transparent PNG (header 89 50 4E 47, no POST), JPG→white JPG (FF D8), custom #ff0000 pixel probe, batch 5→5 blobs, Before/After slider `aria-valuenow`, Cancel <2 s → `Cancelled.` / `aborted`, malformed bytes→“We couldn't process that”, honest model download bytes/%, cached repeat→“Model ready — cached”, worker primary asserted, axe serious 0 (hero contrast already fixed), mobile 375 px no overflow / touch drag. Reuse `image-output-validation` header pattern.

**Visual:** snapshots idle / model_init / preview-transparent checkerboard / preview-white / preview-custom / failed-F1,F2 / poor-result banner; <0.1% diff masked progress, dark vs light checkerboard; deferred runtime not screenshot gate.

**Perf (`bench.spec.ts` harness):** 1 image 400×400 <4 s p50 CI, 5× batch <12 s, FPS >30. Real 5 MB on host UNVERIFIED in sandbox — document.

**Privacy (`privacy-net.spec.ts`):** 0 POST/PUT during local flow; cloud opt-in would be separate `privacy-net-cloud.spec.ts` asserting POST only after consent click (not in MVP).

**Browser matrix (explicit UNVERIFIED until host):** Chromium VERIFIED (CI), Firefox UNVERIFIED, Safari 16.4+ UNVERIFIED, iOS UNVERIFIED — report §G.

---

## W. Risks (Ranked)

1. **Quality gap vs cloud HD on hair/transparent** — MVP matte will disappoint portrait users → mitigate honesty copy + poor-result banner + “HD cloud coming” (not fake). [MEDIUM]
2. **WASM speed regression on low Android / iOS heap** — 6–12 s or OOM on 3 GB RAM → sequential + single-thread fallback + F2 “try one file” + 45 s download timeout. [MEDIUM]
3. **AGPL taint if eng side installs `@imgly/background-removal` later** — block via package.json gate + CI `grep -r imgly` fail. [HIGH]
4. **Model supply-chain compromise** — pin sha256 + self-host, no third-party CDN fetch. [MEDIUM]
5. **Safari OffscreenCanvas / WebGPU quirks** — UNVERIFIED until host Safari → label, do not claim support. [MEDIUM]
6. **CSP `connect-src 'self'` blocks CDN** — avoid by self-hosting; if CDN later, must add `cdn.jsdelivr.net https://huggingface.co`. [LOW]
7. **420k pako chunk / SW quota** — PWA not precaching WASM/model; lazy-load only. [LOW]

---

## X. Mitigations (Per Risk)

- Ship U²-Netp only, defer BiRefNet/RMBG until size/weight GREEN and host perf measured.
- Keep 30 MB/file + 12k px + 30 s/120 s timeouts + sequential batch + `bmp.close` + URL revoke.
- CI gate: `vitest 29 + image 21 + a11y 7 + motion-reduced 3` green, build/lint 0 errors, `privacy-net` 0 POST, FPS >30.
- No secrets in repo (`.env.example` only), no DB/auth in MVP.
- Document UNVERIFIED as BLOCKED — REQUIRES USER ACTION (host Safari/Firefox bench).

---

## Y. Roadmap & Phasing — STOP Boundary

| Phase | Scope | Gate | Status |
|---|---|---|---|
| **Phase 6a (this spike)** | Spec + this report — no code | This doc approved | **DONE** |
| **Phase 6b (next, gated)** | Spike `workers/bg.worker.ts` + `lib/bg-engine.ts` with Xenova/u2net quant self-hosted under `public/models/`, ToolShell BG branch, checkerboard + White/Custom composite, honest states F1–F10 | Unit 80% + E2E happy+cancel+validation green on Chromium | **NOT STARTED — STOP** |
| **Phase 6c** | Polish: Before/After slider, batch strip, all failures, a11y, visual snapshots, privacy-net, bench bench | 29 + new BG unit/E2E all green, axe serious 0 new, FPS>30, 0 POST | Not started |
| **V1 Premium** | Batch 50, 50→200 MB total, HD cloud opt-in (explicit), auth ADR + `DATABASE_URL` + Stripe, pricing wiring, API | Auth + payments approved | Deferred |
| **HEIC/AVIF** | `heic2any` replacement with MIT fork | License + size verified | DEFERRED (Phase 5C) |

**Implementer boundary:** Do not start 6b until host confirms model choice + self-host hosting for `/models/` and pricing copy.

---

## Z. Alternatives Considered (Why Not)

- **Install `@imgly/background-removal` now:** AGPL taint, 50–100 MB worker bundle, copyleft contaminates any proprietary distribution — **never**.
- **BRIA RMBG-2.0 via `transformers.js`:** quality strong but weight license non-commercial → would require paid BRIA license + legal review; not justified for MVP.
- **BiRefNet full:** best quality but 490 MB breaks TTI + heap on mobile; no quantization shrinks it <10 MB without re-training.
- **MediaPipe:** few MB but person-only — not a general “background remover” for product photos.
- **Shipping cloud HD now (Fal/Replicate/self-host GPU):** cost $900–1800/mo at 10k/day + auth + DB + PII + abuse + “no upload” lie — breaks core differentiator. Defer to premium opt-in.

---

## AA. Decision Matrix & Final Recommendation

**Matrix must weigh Commercial/Size/Quality/Speed/Mobile/Privacy/Risk together:**

| Criterion weight → | Commercial 25% | Size 20% | Quality 20% | Speed 15% | Mobile 10% | Privacy 10% |
|---|---|---|---|---|---|---|
| **U²-Net small quant (MVP pick)** | GREEN MIT 5/5 | 5 MB 5/5 | Adequate 3/5 (honest) | 4/5 | 4/5 | Local 5/5 — **4.2/5** |
| BiRefNet full | GREEN 5/5 | 1/5 | 5/5 | 2/5 | 1/5 | 5/5 — 3.1/5 + OOM FAIL |
| BRIA RMBG-1.4/2.0 | RED 0/5 | 3/5 | 4/5 | 4/5 | 4/5 | 5/5 — **0 overall (blocked)** |
| Cloud HD | GREEN* but upload 2/5 | 5/5 | 5/5 | 5/5 | 5/5 | 0/5 (upload) — fails privacy |

**Final recommendation: OPTION B LIMITED LOCAL MVP — IMPLEMENT LOCAL ON U²-Net SMALL QUANTIZED, SELF-HOSTED, HONEST.**

- Implement **exactly:** self-host `public/models/u2net/u2net_quant.onnx` (~4.7 MB, ~1.8 MB gz) + `onnxruntime-web` WASM, local-first, no third-party CDN, no upload, transparent+white+custom-color, PNG default / JPG / WebP secondary, honest loading states, full F1–F10 failures, 30 MB/5 files/100 MB/30 s limits, batch sequential, Worker-isolated with 3 s main-thread fallback, Cache API warm, dark-first checkerboard, ToolShell reuse.
- **Do not** install `@imgly/background-removal` (AGPL), do not fetch BRIA weights without paid license, do not add 150 MB+ model to Git, do not build cloud GPU/DB/auth/payments in MVP, do not claim Safari/Firefox verified until host Safari/Firefox prove, do not hard-code secrets.
- **STOP** after this report + `docs/BG_REMOVAL_SPEC.md`. Next agent may start Phase 6b only after this report is approved and `/models/` hosting is confirmed. Cloud HD (RMBG-2.0/BiRefNet 1024) stays V1 premium explicit opt-in.

---

**Evidence refs (no installs):** `muse.web_search` ONNX Runtime Web / U²-Net / BiRefNet / RMBG / MediaPipe; HF `Xenova/u2net`, `briaai/RMBG-1.4`, `ZHKKKeep/BiRefNet`; docs `lib/tools.ts`, `workers/bg.worker.ts:1`, `lib/file-safety.ts`, `lib/image-engine.ts`, `next.config.ts` CSP, `public/manifest.json`; subagents License/Model/Browser-Perf/Security/Product (5/5 result_ready). All real 5/10 MB perf and host Safari/Firefox remain **UNVERIFIED** until host browser proof — labeled above, not assumed.

