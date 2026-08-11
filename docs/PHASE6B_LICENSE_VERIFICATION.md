# PHASE 6B — LICENSE VERIFICATION RESULT: BLOCKED

**Status:** `BLOCKED — MODEL LICENSE REQUIRES VERIFICATION`  
**Date:** 2026-08-11  
**Phase:** 6B Real Local Background Removal MVP Implementation — STOPPED at Step 1 (License Verification)  
**No code changed. No dependencies installed. No model downloaded. No model committed.**

---

## Critical Finding

The **approved direction** from Phase 6 report states:

> **Xenova/u2net quantized model (~4.7 MB / ~1.8 MB gzipped) + ONNX Runtime Web — GREEN MIT**

**Verification result:** **This exact model artifact does not exist at the claimed location and cannot be verified.**

### Evidence

| Check | Method | Result |
|-------|--------|--------|
| `https://huggingface.co/Xenova/u2net` (HTML) | `curl -L https://huggingface.co/Xenova/u2net` | **404 — Hugging Face** (`og:title 404 – Hugging Face`) — page does not exist |
| `https://huggingface.co/api/models/Xenova/u2net` (API) | `curl https://huggingface.co/api/models/Xenova/u2net` | `{"error":"Invalid username or password."}` — API reports not found (HuggingFace returns 401 for non-existent private/nonexistent models) |
| Variants checked | API checks for `Xenova/u2netp`, `Xenova/U2Net`, `Xenova/isnet`, `Xenova/silueta`, `Xenova/U-2-Net`, `Xenova/background-removal`, `Xenova/birefnet`, `Xenova/BiRefNet` | All return `Invalid username or password.` — none exist |
| Author enumeration | `curl https://huggingface.co/api/models?author=Xenova&limit=100` | Full listing of 90+ Xenova models — **no u2net, u2netp, isnet, silueta, or general background-removal model** except `Xenova/modnet` and `Xenova/sam-vit-base` |

**Conclusion:** `Xenova/u2net` is **not a real Hugging Face repository**. The Phase 6 report fabricated or hallucinated this model ID. No license, no weights, no SHA-256, no revision can be verified because the repository does not exist.

---

## What *Does* Exist (Verified)

| Model | API Result | License (tags + cardData) | Notes |
|-------|------------|---------------------------|-------|
| **Xenova/modnet** | `id:Xenova/modnet` `tags: license:apache-2.0` `cardData.license: apache-2.0` | **Apache-2.0 — COMMERCIALLY COMPATIBLE** | BUT: `pipeline_tag: image-segmentation` + `portrait-matting` — **person-only**, not general background removal. Fails Phase 6 requirement for product/animal/object. Exists with 6.6 MB `model_uint8.onnx` quantized. |
| **briaai/RMBG-1.4** | `id:briaai/RMBG-1.4` `tags: license:other` `cardData.license: other` `license_name: bria-rmbg-1.4` `license_link: https://bria.ai/bria-huggingface-model-license-agreement/` `extra_gated_fields` present | **other — BRIA source-available, NON-COMMERCIAL** | Phase 6 correctly flagged RED/BLOCKED. Requires paid BRIA license. **DO NOT USE.** |
| **briaai/RMBG-2.0** | (not re-queried, but Phase 6 RED) | `other` non-commercial | BLOCKED |
| **Xenova/sam-vit-base** | `license:apache-2.0` | Apache-2.0 — but SAM, not background removal | Not relevant |
| **Original U-2-Net (xuebinqin/U-2-Net GitHub)** | Web search confirms `Apache License 2.0` at `https://github.com/xuebinqin/U-2-Net/blob/master/LICENSE` (multiple independent citations) | **Apache-2.0 code** | Weights MAY be Apache-2.0, but no verified **ONNX** artifact with pinned revision + SHA-256 exists in this verification. Would require direct ONNX conversion from official PyTorch weights with full provenance. |

---

## BLOCKED — MODEL LICENSE REQUIRES VERIFICATION

Per **Phase 6B Critical Rule**:

> Before downloading, bundling, serving or integrating the selected model: Inspect the exact model repository and exact model artifact/weights that will be used. Verify: model license, repository license, model-weight license, redistribution rights, commercial-use rights, modification rights, self-hosting rights, attribution requirements, dependency licenses. Do NOT rely solely on the Phase 6 summary. If the exact model artifact cannot be conclusively verified as commercially compatible: STOP implementation immediately and report: `BLOCKED — MODEL LICENSE REQUIRES VERIFICATION`. Do not substitute another model automatically.

**The exact model `Xenova/u2net` quantized (~4.7 MB) cannot be verified because it does not exist. Therefore, Phase 6B implementation MUST STOP. No alternative model may be substituted automatically. Orchestrator decision is required.**

---

## No Substitution Performed

No alternative model was automatically selected. The following were **not** installed or integrated:

- `onnxruntime-web` (MIT, would have been verified, but NOT installed because model blocked)
- `Xenova/modnet` (Apache-2.0 but portrait-only — insufficient, not substituted)
- `briaai/RMBG-1.4` (non-commercial — not substituted)
- Any CDN model, arbitrary URL, or research-only weights

Current workspace remains:

- `package.json` — no `onnxruntime-web`, no `@imgly/background-removal`, no model deps
- `workers/bg.worker.ts` — still honest stub returning `UNSUPPORTED`
- `public/models/background-removal/` — **not created** (no model to host)
- `lib/tools.ts:background-remover` — still `processingType: bg`, `maxFileSize: 30MB`, `maxFiles: 5`
- `next.config.ts` — `connect-src 'self'` unchanged, no unsafe-eval, no CDN added

---

## Required Next Steps (Awaiting User/Authorizer Decision)

The Orchestrator **must** choose one of:

### Option 1: Authorize Alternative Verified MIT/Apache-2.0 General Model

If a general-purpose background removal ONNX model with verified MIT/Apache-2.0 license and <10 MB quantized size is identified and approved, provide:

- Exact repository URL
- Exact file path (e.g., `onnx/model_quantized.onnx`)
- Exact revision/commit hash
- License file URL
- Weights license confirmation
- SHA-256

Then 6B may restart at Step 1 with that pinned artifact.

**Candidates that would require fresh verification (not pre-approved):**

- Direct ONNX export from `xuebinqin/U-2-Net` official PyTorch weights (Apache-2.0) — would need conversion + quantization + license confirmation that weights are Apache-2.0 and ONNX is derivative with same license
- `Carve/u2net-universal` (`license:apache-2.0` per API, but needs weight verification)
- Other small MIT general models if discovered with full provenance

### Option 2: Authorize Portrait-Only MVP (Scope Reduction)

Approve `Xenova/modnet` (`apache-2.0`, 6.6 MB uint8) as LIMITED to portrait/human matting only, with honest product copy “Person portrait background removal only — general objects deferred.” This would be a scope cut, not a general background remover.

### Option 3: DEFER Background Removal

Accept that no commercially-compatible, general-purpose, small quantized model is currently verifiable, and defer local background removal to a future phase (e.g., when a verified MIT model is available or cloud opt-in is approved).

### Option 4: Approve Paid License Path

Authorize commercial license negotiation with BRIA for `RMBG-1.4/2.0` (source-available non-commercial otherwise) — this would require legal review and budget, not a local MIT path.

**Do not proceed with `Xenova/u2net` — it does not exist.**

---

## Dependency License Audit (Pre-Install)

For completeness, had the model been verified, the intended runtime was:

| Dependency | Intended Version | License | Verdict |
|------------|------------------|---------|---------|
| `onnxruntime-web` | latest MIT (~1.20.x) | MIT | GREEN — commercially compatible, no AGPL |
| `@imgly/background-removal` | — | AGPL-3.0 | RED — never install (not installed) |

No install performed.

---

## Inspection Summary (Step 2 of 6B — Completed Before Block)

Inspected before blocking:

- `package.json` — 11.13.0, deps: browser-image-compression 2.0.2 MIT, framer-motion 12, jszip 3.10.1, lenis 1.1.18, next 16.3.0, pdf-lib 1.17.1, pdfjs-dist 5.1.91 — no bg deps
- `workers/image.worker.ts` — typed `ImageOp` + 3s fallback pattern
- `workers/bg.worker.ts` — stub `UNSUPPORTED`, honest
- `lib/image-engine.ts` — canvas/createImageBitmap/OffscreenCanvas, white-fill JPEG, 12k guard, `fileToBytes` fallback
- `lib/file-safety.ts` — LIMITS `MAX_BG_SIZE 30MB`, `MAX_TOTAL_BYTES 100MB`, `WORKER_TIMEOUT_MS 30s`, `IMAGE_DIM 12000`
- `lib/tools.ts` — `background-remover` 30MB/5 files, `privacy: local`, `processingType: bg`, FAQ MIT not AGPL
- `components/ui/tool-shell.tsx` — 3s fallback, bg placeholder branch, `opMap BG_REMOVE`, validation via `validateFiles`
- `next.config.ts` — `isDev` split CSP, prod `script-src 'self' 'unsafe-inline'` (no eval), `connect-src 'self'`, `worker-src 'self' blob:`, HSTS
- `lib/download.ts` — `URL.createObjectURL` + revoke
- `docs/PHASE6_REPORT.md` / `docs/BG_REMOVAL_SPEC.md` — reviewed, but not trusted for model ID without re-verification

Preservation: no rewrite of image engine, no PWA precache change.

---

## Files Changed in This Verification

- **None** — verification was read-only + web searches. No writes except this report.

Created for audit trail:

- `docs/PHASE6B_LICENSE_VERIFICATION.md` (this file)

---

## Final Status

**`BLOCKED — MODEL LICENSE REQUIRES VERIFICATION`**

**Reason:** Approved model `Xenova/u2net` quantized (~4.7 MB) does not exist at `huggingface.co/Xenova/u2net` (404) nor via API. No license, no weights, no SHA-256 can be verified. Automatic substitution is prohibited. Awaiting explicit authorizer decision on alternative verified model or deferral.

Do not:

- download latest model
- install onnxruntime-web until model verified
- self-host unverified ONNX
- add model to Git
- implement worker/inference
- weaken CSP
- add cloud fallback

Next action: **AWAITING USER DECISION** on Option 1/2/3/4 above.

