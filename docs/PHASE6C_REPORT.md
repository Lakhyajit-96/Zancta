# PHASE 6C — Independent Background-Removal Model Provenance, License & Artifact Verification

**Status:** Verification complete — **NO GREEN CANDIDATE APPROVED FOR PRODUCTION**  
**Date:** 2026-08-11  
**Scope:** Research only, no implementation, no `onnxruntime-web` install, no model added to repo, no prod changes. Isolated scratch `/tmp/verify-u2net` only.  
**Previous Phase 6B:** Correctly blocked `Xenova/u2net` (404, hallucinated ID) — no code changed.

---

## A. Why the Previous Xenova/u2net Claim Was Wrong

The Phase 6 report claimed:

> **Xenova/u2net quantized model (~4.7 MB / ~1.8 MB gzipped) — GREEN MIT**

**Re-verification (independent, before any install):**

| Check | Method | Result |
|-------|--------|--------|
| `GET https://huggingface.co/Xenova/u2net` | `curl -L` + HTML parse | **404 — `og:title 404 – Hugging Face`** — page does not exist |
| `GET https://huggingface.co/api/models/Xenova/u2net` | HF API | `{"error":"Invalid username or password."}` — HF returns 401 for non-existent model |
| Variants | API for `Xenova/u2netp`, `Xenova/U2Net`, `Xenova/isnet`, `Xenova/silueta`, `Xenova/U-2-Net`, `Xenova/background-removal`, `Xenova/birefnet`, `Xenova/BiRefNet` | All `Invalid username or password.` |
| Author enumeration | `GET /api/models?author=Xenova&limit=100` (when API was reachable, pre-6C network block) | 90+ Xenova models listed — **no u2net, u2netp, isnet, silueta, or general background-removal** except `Xenova/modnet` + `Xenova/sam-vit-base` |
| `git ls-remote https://huggingface.co/Xenova/u2net` | Git | No refs (empty) |

**Conclusion:** `Xenova/u2net` is not a Hugging Face repository. The Phase 6 report fabricated the ID. Repository existence, license, and artifact were never verifiable. **Phase 6B correctly stopped** — this is the exact failure mode the Critical Rule was designed to catch (repository metadata alone is insufficient).

Evidence preserved in [docs/PHASE6B_LICENSE_VERIFICATION.md](docs/PHASE6B_LICENSE_VERIFICATION.md).

---

## B. Current Real Candidates (Existence Verified)

| Candidate | Repository Exists | Platform | Verified How |
|-----------|----------------|----------|--------------|
| **Heliosoph/u2net-onnx** | **UNVERIFIED — NETWORK BLOCK** | Hugging Face (per task description) | Task states it exists with `u2net.onnx` + `u2netp.onnx` Apache-2.0. Direct API `GET /api/models/Heliosoph/u2net-onnx` and `git ls-remote` **blocked by transient proxy failure** during 6C (see §Y). Web_search for `Heliosoph` returned only `Heliosoph/sam-onnx` (Apache-2.0) and no `u2net-onnx` indexing — **not disproof, but not independent confirmation**. **Must be re-verified with direct artifact fetch before GREEN.** |
| **xuebinqin/U-2-Net (upstream)** | **YES** | GitHub | Web_search + `api.github.com/repos/xuebinqin/U-2-Net` (when reachable) + multiple downstream citations. Repo exists, 5k+ stars. |
| **danielgatis/rembg** | **YES** | GitHub | Web_search: `danielgatis/rembg — Licensed under MIT License` (multiple forks confirm MIT). Conda-forge confirms `Package license: MIT`. |
| **tomjackson2023/rembg** | **YES** | Hugging Face | Web_search: `u2net.onnx · tomjackson2023/rembg at main` — exists, 176 MB. |
| **Xenova/modnet** | **YES — VERIFIED** | Hugging Face | `GET /api/models/Xenova/modnet` **succeeded before network block** (6B): `id:Xenova/modnet`, `tags: license:apache-2.0`, `cardData.license: apache-2.0`, `siblings: onnx/model.onnx, model_quantized.onnx, model_uint8.onnx` etc., `downloads:63774`. |
| **briaai/RMBG-1.4** | **YES — VERIFIED** | Hugging Face | `GET /api/models/briaai/RMBG-1.4` succeeded (6B): `tags: license:other`, `cardData.license: other`, `license_name: bria-rmbg-1.4`, `license_link: https://bria.ai/...`, gated `non-commercial`. |
| **Carve/u2net-universal** | **YES** | Hugging Face | `GET /api/models/Carve/u2net-universal` succeeded (6B/6C): `tags: license:apache-2.0`. |

---

## C. U2Net Upstream Verification — xuebinqin/U-2-Net

**Repository:** `https://github.com/xuebinqin/U-2-Net`

| Item | Evidence | Verdict |
|------|----------|---------|
| **Repo exists** | GitHub `xuebinqin/U-2-Net` (web_search, API, 5k stars) | YES |
| **License file** | `https://github.com/xuebinqin/U-2-Net/blob/master/LICENSE` cited by 4+ downstream projects | **Apache License 2.0** — verified via web_search citations: `u2net | xuebinqin | Apache 2.0 (https://github.com/xuebinqin/U-2-Net/blob/master/LICENSE)` [gombathegreat/gombas-sprite-sheet-cutter table, coreml-models table, rembg-trainer README]. Direct `curl` to `raw.githubusercontent.com/.../LICENSE` **blocked by network during 6C** (proxy timeout), but **multiple independent citations converge on Apache-2.0** — high confidence for **code**. |
| **Weights distribution** | Original weights via Google Drive (u2net.pth 176MB, u2netp.pth 4.7MB) linked in `U-2-Net/README.md` and redistributed by `danielgatis/rembg` (Google Drive `1tCU5MM...` etc.) | Weights are distributed **from the same repo** as code, but LICENSE file scope is ambiguous: does Apache-2.0 cover **code only** or **code + pretrained weights**? No explicit `weights license` field in repo. |
| **Commercial rights for weights** | **UNVERIFIED assumption** — Apache-2.0 for code does **not** automatically mean weights are Apache-2.0 (weights are data, not code). Downstream `rembg-trainer` states: `This work is based off U2Net repo, which is under Apache licence. The derivative work is licensed under MIT` — implying authors treat weights as Apache-2.0-derivable. But **no explicit statement from xuebinqin that pretrained .pth weights are Apache-2.0**. | **YELLOW — requires written confirmation or explicit weights license.** |
| **Modification rights (pth→onnx)** | Apache-2.0 permits derivative works if weights are covered. If weights not covered, ONNX conversion is unlicensed modification. | **YELLOW** |
| **Attribution** | Apache-2.0 requires license + notice preservation | Must preserve `LICENSE` + source link if GREEN |

**Commit pinning:** Not pinned in this verification (network block prevented `git ls-remote` + `raw` fetch). Would need `git rev-parse main` + artifact SHA if proceeding.

---

## D. Heliosoph Artifact Verification — Heliosoph/u2net-onnx

**Claimed repository:** `https://huggingface.co/Heliosoph/u2net-onnx` (per task description) containing `u2net.onnx` + `u2netp.onnx` + Apache-2.0, `u2netp.onnx` ~4.57 MB.

**Verification attempted:**

| Check | Method | Result |
|-------|--------|--------|
| `GET /api/models/Heliosoph/u2net-onnx` | HF API via `curl` and via `huggingface_hub` Python | **BLOCKED — proxy timeout** during 6C window (proxy `http://127.0.0.1:44605` and `34825` intermittently `Failed to connect` / `Proxy CONNECT aborted`). Earlier search `?search=Heliosoph` also returned empty (JSON decode error) after network degradation. |
| `GET https://huggingface.co/Heliosoph/u2net-onnx` (HTML) | `curl -L` + grep | Empty / timeout via proxy |
| `git ls-remote https://huggingface.co/Heliosoph/u2net-onnx` | Git | Empty (no refs) + `EXIT:124` timeout on `--heads` — inconclusive (could be auth required or network). |
| `huggingface_hub model_info('Heliosoph/u2net-onnx')` | Python `huggingface_hub` | **BLOCKED — `pip install` failed via proxy** (`ProxyError Cannot connect to proxy`, `timed out` on `/simple/huggingface-hub/`). Module not installed, cannot fetch. |
| Web search | `muse.web_search` for `Heliosoph u2net-onnx` and `"Heliosoph" huggingface` | **No direct hit** for `u2net-onnx` (only `Heliosoph/sam-onnx` Apache-2.0 found). Not disproof — Hugging Face model indexing in web search is sparse. |

**Available indirect evidence:**

- Task description states the repo exists — **not independent evidence** (must be verified, not trusted).
- Pattern: Heliosoph publishes `sam-onnx` (verified Apache-2.0 via cellsam-local table), so `u2net-onnx` naming is plausible for same owner.
- No `README`, `LICENSE`, `model.onnx` hash, `commit SHA`, or `provenance` could be retrieved due to network block.

**Classification:** **YELLOW — UNVERIFIED — NETWORK BLOCK**  
**DO NOT promote to GREEN until direct fetch succeeds and records:**

- `model_info` → `sha`, `cardData.license`, `tags`, `siblings`
- `README.md` + `LICENSE` content
- Exact `u2netp.onnx` SHA-256 + size + ONNX metadata (opset, input shape, producer)
- Stated source/conversion (rembg vs xuebinqin) + attribution

**Risk if assumed:** If Heliosoph republished `rembg` weights without explicit commercial grant, we would inherit any ambiguity in upstream weights license (see §E). Must verify.

---

## E. rembg Provenance Verification — danielgatis/rembg

**Repository:** `https://github.com/danielgatis/rembg`

| Item | Evidence | Verdict |
|------|----------|---------|
| **Software license** | Web_search: `danielgatis/rembg — Licensed under MIT License (./LICENSE.txt)` (multiple forks, conda-forge `Package license: MIT`) | **MIT — code** |
| **Weights redistributed** | `rembg` downloads `u2net.onnx` (176MB) + `u2netp.onnx` (4.7MB) on first use via `~/.u2net/`; `tomjackson2023/rembg` Hugging Face hosts `u2net.onnx` (verified via web_search `u2net.onnx · tomjackson2023/rembg`). Weights are **converted ONNX from xuebinqin/U-2-Net .pth** (per `rembg` docs + `neurozero/GIMP3-ML` weight links: `u2net (download ..., source https://github.com/xuebinqin/U-2-Net)`). | **Derived from upstream U-2-Net weights** |
| **Weights license** | `rembg` LICENSE is **MIT for code**, but **does not explicitly license the embedded .pth weights** — they are separate artifacts. `rembg-trainer` notes: `based off U2Net repo, which is under Apache licence` — implying weights inherit Apache-2.0. | **MIT (code) ≠ weights license.** Weights license **inherits upstream ambiguity** (see §C). No separate `weights LICENSE` in rembg. |
| **Commercial redistribution of weights** | `rembg` is MIT, widely used commercially (conda-forge, GIMP plugins). Practical evidence suggests commercial use is tolerated, but **no explicit `weights: Apache-2.0` statement** in rembg's LICENSE. | **YELLOW — plausible but not legally explicit.** |
| **Heliosoph link** | Task states Heliosoph docs reference `danielgatis/rembg` — **not independently verified** due to network block (no README fetched). Plausible that Heliosoph's `u2netp.onnx` is `rembg`'s 4.7 MB ONNX republished. | **YELLOW — assumed provenance matches rembg, but not proven.** |

**Conclusion:** `rembg` **software** is MIT GREEN, but **weights** are YELLOW (depends on upstream xuebinqin weights license). Commercial use of `rembg` weights likely intended to be permissive, but **not explicitly documented**.

---

## F. Xenova/modnet Verification

**Repository:** `https://huggingface.co/Xenova/modnet`

**Verification:** **GREEN — FULLY VERIFIED** (before network block, 6B)

| Item | Evidence |
|------|----------|
| **API** | `GET /api/models/Xenova/modnet` succeeded: `id:Xenova/modnet`, `tags: license:apache-2.0, transformers.js, onnx, modnet, vision, background-removal, portrait-matting`, `cardData.license: apache-2.0`, `downloads:63774`, `sha: fa2fa546052fba4c08921230a26cc69a333fca12`, `siblings: onnx/model.onnx, model_bnb4.onnx, model_fp16.onnx, model_q4.onnx, model_quantized.onnx, model_uint8.onnx` |
| **License** | `Apache-2.0` in both `tags` and `cardData` — **explicit**. No gating, not disabled. |
| **Artifacts** | Multiple quantized variants: `model_uint8.onnx` (reported 6.6 MB), `model_quantized.onnx`, `model_q4.onnx` — size/specs not directly measured in 6C due to network block on download, but sizes are documented in Phase 6B and Hugging Face. |
| **Scope** | Card `tags: portrait-matting` + `background-removal` — **portrait matting, not general**. Verified by card and README (when fetch succeeded earlier). **Person/people only** — fails general background removal (product, animal, object). |
| **Browser feasibility** | ONNX via `transformers.js` + `onnxruntime-web`, WASM — feasible. Quantized 6.6 MB is practical. |
| **Commercial** | Apache-2.0 permits commercial redistribution, modification, self-hosting with attribution. |

**Classification:** **GREEN for code + weights + commercial, BUT YELLOW for product scope** — cannot be marketed as general background remover without misleading users. Honest marketing would be `Portrait Background Remover`.

**SHA-256 / size not re-measured in 6C due to network block** — would need `hf_hub_download` + `sha256sum` for pinning if approved for portrait scope.

---

## G. BRIA Verification — briaai/RMBG-1.4

**Repository:** `https://huggingface.co/briaai/RMBG-1.4`

**Verification:** **RED — VERIFIED NON-COMMERCIAL** (before network block)

| Item | Evidence |
|------|----------|
| **API** | `GET /api/models/briaai/RMBG-1.4` succeeded: `tags: license:other, legal liability, custom_code`, `cardData.license: other`, `license_name: bria-rmbg-1.4`, `license_link: https://bria.ai/bria-huggingface-model-license-agreement/`, `extra_gated_heading: Fill in this form to get instant access`, `extra_gated_fields: Name, Company` |
| **License** | `other` + `bria-rmbg-1.4` = **source-available, non-commercial**. Card explicitly `non-commercial use` — commercial requires paid agreement with BRIA. |
| **Commercial redistribution** | **PROHIBITED** without commercial license purchase. |

**Classification:** **RED — DO NOT USE** unless commercial license purchased (not in scope). No download attempted.

---

## H. Other Candidates (Search)

**Search performed:** `muse.web_search` for `ONNX background removal`, `salient object detection`, `browser background removal`, `image matting MIT`, `Apache background removal`, etc., plus `GET /api/models?search=background+removal`, `?search=u2net+onnx`, `?search=rembg` (when API reachable).

| Candidate | Search Hit | Verification | Verdict |
|-----------|------------|--------------|---------|
| `aspis/detr-finetuned-car-background-removal` | `?search=background+removal` — `license:[]` | No license, car-only | RED/YELLOW — not general, no license |
| `service-victoria/idv-image-background-removal` | `license:mit` | No artifact verification (no siblings fetched) | YELLOW — needs artifact + provenance |
| `frodos/dis-background-removal` | `license:apache-2.0` | No artifact verification | YELLOW — DIS (xuebinqin) likely MIT/Apache but needs weight check |
| `dipteek11/u2net-background-removal` | `license:[]` | No verification | RED — no license |
| `Trendyol/background-removal` | `license:cc-by-sa-4.0` | CC share-alike — **commercial with attribution but viral** — not Apache/MIT, may be unsuitable for closed commercial product | YELLOW — CC-BY-SA requires share-alike |
| **No small (<10 MB) MIT general background removal** found in search with verified license + artifact + hash | — | — | **None GREEN general** beyond upstream U-2-Net family |

**No additional GREEN general candidate identified** in this sweep. All would require the same upstream weight-license verification as U-2-Net.

---

## I. License Matrix

| Candidate | Exists | Exact Artifact (pinned) | Code License | Weight License | Commercial | Redistributable | Self-Host | Modifiable (pth→onnx) | Status |
|-----------|--------|-------------------------|--------------|----------------|------------|-----------------|-----------|----------------------|--------|
| **xuebinqin/U-2-Net (upstream)** | YES | `u2net.pth` 176MB / `u2netp.pth` 4.7MB (Google Drive) — **not pinned to HF commit** | Apache-2.0 (verified via citations) | **YELLOW — Apache-2.0 assumed but not explicit for weights** | YELLOW | YELLOW | YELLOW | YELLOW | **YELLOW** |
| **danielgatis/rembg (derived)** | YES | `u2net.onnx` 176MB / `u2netp.onnx` 4.7MB (via `~/.u2net/` or `tomjackson2023/rembg` HF) | MIT (verified) | **YELLOW — inherits upstream** | YELLOW | YELLOW (practical) | YELLOW | YES (already ONNX) | **YELLOW** |
| **Heliosoph/u2net-onnx (claimed)** | **UNVERIFIED (network)** | `u2netp.onnx` ~4.57MB claimed, `u2net.onnx` ~? | **UNVERIFIED** — claimed Apache-2.0 | **UNVERIFIED** — claimed Apache-2.0 (depends on upstream) | UNVERIFIED | UNVERIFIED | UNVERIFIED | YES | **YELLOW — NETWORK BLOCK** |
| **Xenova/modnet** | YES (verified) | `onnx/model_uint8.onnx` 6.6MB + others | Apache-2.0 (verified) | Apache-2.0 (verified) | **GREEN** | **GREEN** | **GREEN** | GREEN | **GREEN (portrait-only)** |
| **briaai/RMBG-1.4** | YES (verified) | `model.onnx` etc. | `other` (bria) | `other` non-commercial | **RED** | RED | RED | RED | **RED** |
| **Carve/u2net-universal** | YES (verified via API `license:apache-2.0`) | Not verified (no siblings fetched) | Apache-2.0 | **UNVERIFIED** — likely same upstream YELLOW | YELLOW | YELLOW | YELLOW | YELLOW | **YELLOW** |

**No candidate is simultaneously GREEN for both code + weights + commercial + general scope + small size + verified artifact.**

---

## J. Commercial Redistribution Analysis

**Product intent:** Self-host model at `public/models/background-removal/`, serve to arbitrary commercial users, generate revenue via ads/subscriptions.

**Question:** *Can this exact binary model artifact be distributed from our web application to arbitrary commercial users?*

| Candidate | Answer | Evidence |
|-----------|--------|----------|
| **xuebinqin weights** | **YELLOW** — Apache-2.0 text permits distribution, but ambiguity whether weights are covered. No explicit `weights licensed under Apache-2.0` in repo. Risk: copyright holder could claim weights are separate data not covered by code license. | Apache-2.0 §2 Grant of Copyright License + §1 Definitions — “Work” vs “Derivative Works” — weights as binary data may not be “Source” or “Object” form. Needs legal opinion. |
| **rembg ONNX** | **YELLOW** — same inheritance | MIT for code, but weights same ambiguity |
| **Heliosoph ONNX** | **UNVERIFIED** — if Heliosoph republished rembg ONNX, same YELLOW; if Heliosoph contains original xuebinqin weights verbatim, same YELLOW. No independent weight license from Heliosoph to override upstream. | No HELIOSOPH LICENSE file fetched (network block) — cannot confirm Heliosoph grants `Apache-2.0` for weights vs just repo. |
| **Xenova/modnet** | **GREEN** — Apache-2.0 explicitly in `cardData` and `tags`, no gating. Commercial distribution permitted with attribution. | Verified |
| **BRIA** | **RED** — `bria-rmbg-1.4` license explicitly non-commercial gated. Commercial use requires paid agreement. | Verified |

**Conclusion:** Only **Xenova/modnet** is unambiguously GREEN for commercial redistribution. All general U2Net-family models are **YELLOW** due to weight-license ambiguity.

---

## K. Artifact Hashes

**Requested:** SHA-256, file size, file type, ONNX metadata, input shape, output shape, opset, producer, graph info.

**Results:**

| Artifact | SHA-256 | Size | Type | ONNX Metadata | Status |
|----------|---------|------|------|---------------|--------|
| Heliosoph `u2netp.onnx` | **NOT OBTAINED — NETWORK BLOCK** | Claimed ~4.57 MB (task) / 4.7 MB (upstream pth) | Claimed ONNX | Input `1x3x320x320` (inferred from U2Net), output `1x1x320x320` mask (inferred) — **not measured** | **BLOCKED** |
| Heliosoph `u2net.onnx` | **NOT OBTAINED** | Claimed ~176 MB | ONNX | Not measured | **BLOCKED** |
| Xenova/modnet `model_uint8.onnx` | **NOT OBTAINED — NETWORK BLOCK** (pip + HF hub blocked) | Claimed 6.6 MB (quantized) | ONNX | Not measured | **BLOCKED** |
| xuebinqin `u2netp.pth` | **NOT OBTAINED** | 4.7 MB (known) | PyTorch | Not ONNX | Not applicable |
| No authoritative published checksum exists for any candidate (per HF `siblings` no `sha256` exposed except `Xet` hash) | — | — | — | — | **`NO AUTHORITATIVE PUBLISHED CHECKSUM`** for plain SHA-256 (HF uses Xet). Our calculated hash would prove identity, not authenticity. |

**Method attempted:** `hf_hub_download` to `/tmp/verify-u2net` + `sha256sum` + `onnx` python `load` — **blocked by proxy** (`ProxyError Cannot connect to proxy`, `Failed to connect to 127.0.0.1:44605`). Direct `curl` to `resolve/main` also blocked.

**Record:** `NO AUTHORITATIVE PUBLISHED CHECKSUM` for file-level SHA-256 on HF (only git SHA + Xet). **Our hash not obtained due to network.**

---

## L. Repository Commits (Pinned Revision)

| Repository | Pinned Commit SHA | Method | Status |
|------------|-------------------|--------|--------|
| Heliosoph/u2net-onnx | **NOT OBTAINED** | `model_info(...).sha` or `git ls-remote` | **BLOCKED — NETWORK** — would be `fa2fa...`-style SHA if fetched |
| xuebinqin/U-2-Net | **NOT PINNED** | `git ls-remote https://github.com/xuebinqin/U-2-Net` | **BLOCKED — NETWORK** (proxy) + `git ls-remote` timeout `EXIT:124` |
| Xenova/modnet | `fa2fa546052fba4c08921230a26cc69a333fca12` | **VERIFIED** via earlier API `sha` field (6B, before block) | **PINNED** |
| briaai/RMBG-1.4 | Not pinned (RED) | — | — |

**Requirement:** Future production must pin `repo@commit` + `artifact path` + `SHA-256`. Not satisfied for Heliosoph/upstream due to network.

---

## M. Model Sizes

| Artifact | Raw Size | Compressed Transfer | Memory Footprint | Practical for Browser |
|----------|----------|---------------------|------------------|-----------------------|
| `u2netp.pth` (upstream) | 4.7 MB | — (not ONNX) | — | — |
| `u2netp.onnx` (rembg/Heliosoph) | Claimed 4.57–4.7 MB | ~1.8 MB gzipped (estimated, not measured) | ~40–120 MB heap (inferred, not measured) | **Practical** if verified |
| `u2net.onnx` | 176 MB | ~60 MB gzipped | ~60–120 MB heap | **Impractical** (too large for browser) |
| `Xenova/modnet model_uint8.onnx` | 6.6 MB (claimed) | ~2–3 MB gzipped | ~40–80 MB heap | **Practical** (portrait-only) |
| `BRIA RMBG-1.4` | 167 MB pytorch / 11–44 MB ONNX quantized | — | — | RED anyway |

**No direct measurement in 6C due to network block on download.**

---

## N. Model Input/Output Details

| Model | Input Shape | Output Shape | Opset | Producer | Preprocessing | Postprocessing |
|-------|-------------|--------------|-------|----------|---------------|----------------|
| U2Net (u2netp) | `1x3x320x320` RGB normalized (0–1, mean/std) | `1x1x320x320` saliency mask (sigmoid 0–1) | **UNVERIFIED — not loaded** (expected opset 11–14) | **UNVERIFIED — not loaded** | Resize to 320x320, normalize, transpose NCHW | Sigmoid + threshold + resize back to original + alpha |
| MODNet | `1x3x512x512` (?) — varies, portrait-specific | `1x1x512x512` alpha matte | UNVERIFIED | UNVERIFIED | Similar | — |

**No ONNX `load` + graph inspection performed due to network block on artifact download.** Details inferred from U-2-Net paper + rembg docs, **not measured**.

---

## O. Technical Spike Results (Scratch Only)

**Scope:** Only for GREEN candidates (none general GREEN). Attempted isolated `/tmp/verify-u2net` experiment for Heliosoph/u2netp (YELLOW) and Xenova/modnet (GREEN portrait) — **BLOCKED by network**.

**Attempts:**

- `pip install huggingface_hub onnx onnxruntime` → **BLOCKED — proxy `Failed to connect to 127.0.0.1:44605`**, `pip` cannot reach PyPI.
- `hf_hub_download('Heliosoph/u2net-onnx', 'u2netp.onnx', local_dir='/tmp/verify-u2net')` → **BLOCKED** (module not installed + network).
- `curl -L https://huggingface.co/Heliosoph/u2net-onnx/resolve/main/u2netp.onnx -o /tmp/verify-u2net/u2netp.onnx` + `sha256sum` + `python -c "import onnx; m=onnx.load(...); print(...)"` → **BLOCKED** (proxy timeout).

**No model loading, no ONNX runtime compatibility, no inference, no mask generation performed.**

**Conclusion:** **Technical spike not executed** due to external network block. **Cannot claim browser inference works** without measured `onnxruntime-web` WASM load + inference.

---

## P. Quality Benchmark

**Fixtures (intended):** person, hair, product, animal, fine edges, complex background, low contrast, shadows, semi-transparent object.

**Results:** **NOT MEASURED** — no inference spike executed (see §O). **Cannot evaluate** edge quality, hair, haloing, false/missed foreground, artifacts for Heliosoph/u2netp.

**Known from literature (not measured):**

- U2Net (general, 320x320) IoU ~0.85 on DUTS, weak on hair, poor on transparent — adequate for product/logos/people front, rough hair (Phase 6 report §E, not re-measured).
- U2Netp (small) — slightly lower, more haloing.
- MODNet — strong on portrait hair, but **person-only** (fails product).

**No synthetic fixture scores fabricated.**

---

## Q. Performance Benchmark

**Metrics intended:** model load, inference, output generation, total, memory.

**Results:** **NOT MEASURED** — network block prevented download + `onnxruntime-web` install in scratch.

**Expected (from Phase 6, not re-measured):** WASM single-thread 1.5–4s desktop, 6–12s low Android, 40–80 MB heap for 320x320 U2Net. **Not claimed as verified in 6C.**

---

## R. Security Analysis

| Risk | Assessment |
|------|------------|
| **Model file (ONNX)** | Static ONNX graph — **no `trust_remote_code`**, no Python. Risk: malicious ONNX with custom ops could exploit `onnxruntime-web` WASM. Mitigation: self-host pinned artifact, verify ONNX `opset` + `domain` (should be `ai.onnx` only), no custom ops. **Not inspected** (no file). |
| **Remote URLs / custom code** | Heliosoph repo should contain no Python custom code (static ONNX). **Not verified** (no file list beyond siblings). |
| **Dependencies (`onnxruntime-web`)** | MIT, no `eval` — CSP `worker-src 'self' blob:` + `connect-src 'self'` already in `next.config.ts`. WASM requires no `unsafe-eval` in prod (verified Phase 5B). |
| **Supply-chain tampering** | Xet + git SHA pinning required. **Not pinned** for Heliosoph due to network. |
| **Malicious image** | Existing `lib/file-safety.ts` + 12k guard + 30MB limit + Worker isolation + 30s timeout already mitigate. |

**No `trust_remote_code` required for any candidate (all static ONNX).**

---

## S. Supply-Chain Analysis

| Candidate | Source | Revision | Checksum | Download Source | License | Attribution |
|-----------|--------|----------|----------|-----------------|---------|-------------|
| Heliosoph/u2net-onnx | Hugging Face `Heliosoph/u2net-onnx` | **UNVERIFIED** (no SHA) | **NO PUBLISHED SHA-256** (HF Xet only) | `https://huggingface.co/Heliosoph/u2net-onnx/resolve/main/u2netp.onnx` (self-host after pin) | Claimed Apache-2.0 (unverified) | Apache LICENSE + xuebinqin citation if GREEN |
| xuebinqin/U-2-Net | GitHub `xuebinqin/U-2-Net` | **UNVERIFIED** | No SHA (Google Drive) | Google Drive (upstream) or `tomjackson2023/rembg` HF mirror | **YELLOW** Apache-2.0 (code) | Same |
| Xenova/modnet | HF `Xenova/modnet` | `fa2fa546052fba4c08921230a26cc69a333fca12` (verified) | No published SHA-256 (Xet) | HF `resolve/main/onnx/model_uint8.onnx` | Apache-2.0 (verified) | Apache LICENSE |

**Future production strategy (if approved):** Self-host pinned `u2netp.onnx` under `public/models/background-removal/` + `VERSION` + `LICENSE` + `ATTRIBUTION.md` + `sha256sum` check in CI. **Not done in 6C** (no file).

---

## T. Privacy Analysis

**Local-only architecture preserved:** All verification kept images local (no upload). Model downloads would be from `huggingface.co` (one-time) then self-hosted `self` origin. No cloud inference, no `POST` of image bytes.

**CSP:** `next.config.ts` already `connect-src 'self'` + `worker-src 'self' blob:` — **no change** (verified `public/models` not created). Model self-host keeps CSP simple — no `cdn.jsdelivr.net` or `huggingface.co` added.

**No production network interception test** (no inference spike).

---

## U. Final Candidate Matrix

| Candidate | Exists | Exact Artifact | Code License | Weight License | Commercial | Redistributable | Size | Scope | Browser Feasibility | Quality (general) | Risk | Status |
|-----------|--------|----------------|--------------|---------------|------------|-----------------|------|-------|---------------------|-------------------|------|--------|
| **Heliosoph/u2net-onnx `u2netp.onnx`** | **UNVERIFIED (claimed exists)** | `u2netp.onnx` ~4.57MB claimed, **no SHA/commit pinned (network block)** | **UNVERIFIED** claimed Apache-2.0 | **YELLOW — inherits upstream Apache ambiguity** | **YELLOW** | **YELLOW** | **4.57MB — practical** | **General** (product/person/animal) | **YELLOW** (not measured, but 320x320 WASM expected feasible) | **YELLOW** (adequate, not SOTA hair) | **YELLOW — license ambiguity + network unverified** | **YELLOW — DO NOT APPROVE AS GREEN** |
| **xuebinqin/U-2-Net `u2netp.pth`** | YES | `u2netp.pth` 4.7MB Google Drive, **no HF pin** | Apache-2.0 (code) | YELLOW (weights ambiguous) | YELLOW | YELLOW | 4.7MB | General | Requires ONNX conversion (not verified) | Same as above | YELLOW | **YELLOW** |
| **danielgatis/rembg `u2netp.onnx`** | YES | `u2netp.onnx` 4.7MB (via `~/.u2net/` or `tomjackson2023/rembg` HF) | MIT (code) | YELLOW (inherited) | YELLOW | YELLOW (practical) | 4.7MB | General | YES (already ONNX) | Same | YELLOW | **YELLOW** |
| **Xenova/modnet `model_uint8.onnx`** | **YES — VERIFIED** | `model_uint8.onnx` 6.6MB, **sha `fa2fa...` verified, but SHA-256 not measured** | **Apache-2.0 GREEN** | **Apache-2.0 GREEN** | **GREEN** | **GREEN** | **6.6MB — practical** | **Portrait-only** | **GREEN** | **GREEN for portrait** | **LOW** | **GREEN (portrait-only)** |
| **briaai/RMBG-1.4** | YES — VERIFIED | Multiple | `other` | `other` non-commercial | **RED** | RED | 11–44MB quantized | General | — | Strong | **BLOCKED** | **RED** |
| **Carve/u2net-universal** | YES (API `license:apache-2.0`) | **Not verified** | Apache-2.0 | YELLOW (inherited) | YELLOW | YELLOW | ~176MB? | General | Impractical (large) | Good | YELLOW | **YELLOW** |

**No general-purpose GREEN candidate is fully verified** (all YELLOW due to upstream weight-license ambiguity + Heliosoph network block). Only portrait-only `Xenova/modnet` is unambiguously GREEN.

---

## V. Final Recommendation

### **D — DEFER GENERAL BACKGROUND REMOVAL**

**Choose D (DEFER) for general background removal. Optionally B (APPROVE MODNET PORTRAIT SCOPE) as separate feature.**

**Rationale:**

1. **No general model is GREEN** for code **and** weights **and** commercial redistribution. The upstream xuebinqin weights lack explicit `weights are Apache-2.0` statement, and all derived ONNX (rembg, Heliosoph) inherit that YELLOW. Heliosoph artifact could not be directly verified (SHA, LICENSE, provenance, commit) due to **transient network block** — cannot promote YELLOW to GREEN without `sha256sum` + `LICENSE` file + explicit weights license.

2. **Heliosoph/u2net-onnx is the most plausible general candidate** (small, practical, likely derived from rembg/xuebinqin), but **evidence standard from Phase 6B failure requires exact artifact → provenance → revision → checksum → weight rights**. That chain is **incomplete** (no SHA, no LICENSE content, no producer graph, no pinned commit) due to network. **Do not choose A (APPROVE U2NETP) without completing that chain** — it would repeat the Xenova fabrication error with a different ID.

3. **Xenova/modnet is the only GREEN** (Apache-2.0, commercial, self-host, modifiable), but it is **portrait-only**. It **cannot** be marketed honestly as `Remove Background — Local, Private, No Upload` for general product/animal/object. It could be approved as **B — Portrait Background Remover** (narrowed scope: `Remove Portrait Background`) with honest copy, but that is a **different feature** than the Phase 6 spec.

4. **No small MIT general alternative was found** in search that beats U2Net-family on GREEN + size + quality.

**Therefore:**

- **General background removal (product/animal/object): DEFER** until (a) network recovers and Heliosoph `u2netp.onnx` is fetched + `sha256sum` + `onnx.load` metadata + `LICENSE` verified + legal confirms Apache-2.0 covers weights for commercial redistribution, **or** (b) a new MIT general model with explicit weights license is identified.

- **If portrait-only is acceptable:** **B — APPROVE MODNET PORTRAIT SCOPE** as separate tool `portrait-background-remover` (reuse `background-remover` slug with narrowed copy, or new slug). Requires same artifact pinning (`fa2fa546...` + `model_uint8.onnx` SHA-256) before implementation, but license is already GREEN.

- **Do NOT choose A (U2NETP) now** — it is YELLOW, not GREEN, and unverified due to network.

---

## W. Exact Implementation Authorization (if applicable)

**NONE — DEFERRED**

No general model authorization issued.

**If portrait scope is later authorized (B), the authorization would be:**

- **Repository:** `https://huggingface.co/Xenova/modnet`
- **Commit:** `fa2fa546052fba4c08921230a26cc69a333fca12` (verified SHA from API)
- **Artifact:** `onnx/model_uint8.onnx` (6.6MB) — **SHA-256 NOT YET MEASURED** (requires `hf_hub_download` + `sha256sum` after network recovers)
- **License:** Apache-2.0 (code + weights)
- **Commercial:** GREEN (explicit)
- **Attribution:** Apache LICENSE + `Xenova/modnet` + `ZHKKKe/MODNet` upstream
- **Size:** 6.6MB raw, ~2–3MB gzipped
- **Expected perf:** WASM 1–3s desktop, 3–6s mobile (not measured)
- **Limitations:** **Portrait/people only** — product/animal/object will fail; honesty banner required
- **STOP until SHA-256 + ONNX metadata measured** — authorization incomplete

**No general U2NETP authorization** — requires after network recovers:

- `Heliosoph/u2net-onnx@<commit>`, `u2netp.onnx`, SHA-256, Apache-2.0 LICENSE content, rembg provenance confirmation, ONNX input `1x3x320x320` + output `1x1x320x320` + opset + producer, performance/quality spike

**Then STOP — separate implementation prompt required.**

---

## X. Unverified Assumptions

- Heliosoph/u2net-onnx exists and contains `u2netp.onnx` ~4.57MB Apache-2.0 (task states this, but **not independently verified** due to network).
- `xuebinqin/U-2-Net` Google Drive weights are covered by same Apache-2.0 as code (assumed by downstream, but **not explicit**).
- `rembg` MIT covers weights redistribution (assumed, but LICENSE is code-only).
- Heliosoph artifact is a verbatim or quantized conversion of `rembg`/`xuebinqin` weights (assumed, not proven).
- U2Net input 320x320, output saliency mask 0–1, threshold 0.5 — inferred, not measured.
- Performance FPS/memory targets — not measured.
- No authoritative published SHA-256 exists (HF Xet) — assumed `NO AUTHORITATIVE PUBLISHED CHECKSUM` is correct.

---

## Y. External Blockers

| Blocker | Impact | Mitigation |
|---------|--------|------------|
| **Transient proxy/network failure** (`https_proxy http://127.0.0.1:44605` → `Failed to connect`, `Proxy CONNECT aborted`, `pip` cannot reach PyPI, `curl` to `huggingface.co` and `raw.githubusercontent.com` timeout) | **Blocked direct artifact verification:** `GET /api/models/Heliosoph/u2net-onnx`, `git ls-remote`, `huggingface_hub` install, `hf_hub_download`, `curl` to `LICENSE` | Retry after network recovers; use alternative mirror or local HF cache; verification must be re-run before GREEN approval |
| **No authoritative SHA-256 published by HF** (only Xet + git SHA) | Cannot verify authenticity via checksum alone | Record our `sha256sum` after download as pin, but authenticity remains via git SHA + provenance |
| **Upstream weight-license ambiguity** (xuebinqin Apache-2.0 code vs weights) | All U2Net-family general models YELLOW, not GREEN | Obtain written confirmation from xuebinqin or legal opinion that Apache-2.0 covers weights for commercial redistribution |

---

## Z. Files Created

| Path | Purpose | In Main Repo? |
|------|---------|---------------|
| `/tmp/verify-u2net/README.md` | Scratch verification dir marker | **NO — scratch only** |
| `docs/PHASE6B_LICENSE_VERIFICATION.md` | 6B blocked report (Xenova/u2net 404) | YES — created in 6B (no model) |
| `docs/PHASE6C_REPORT.md` | **This report** | YES — verification report only, no model/code |
| No `public/models/background-removal/` | **Not created** — no model to self-host | — |
| No `workers/bg-removal.worker.ts` | **Not created** — no implementation | — |

---

## AA. Dependencies Installed in Scratch Environment

| Environment | Packages | Status |
|-------------|----------|--------|
| **Main project** (`/mnt/e/Projects/New folder/package.json`) | **NONE** — no `onnxruntime-web`, no `onnx`, no `huggingface_hub` | **Verified unchanged** (`grep -E "onnx|rembg|u2net" package.json` → no match, `ls public/models` → `No such file`) |
| **Scratch `/tmp/verify-u2net`** | **NONE** — `pip install huggingface_hub` **failed** via proxy (`ProxyError`, `timed out`), no `onnx`, no `onnxruntime` installed | **No scratch deps installed** |

---

## AB. Main Project Changes

**NONE — VERIFIED**

```bash
grep -E "onnx|rembg|background|u2net" package.json → no match
ls public/models → No such file
git diff workers/bg.worker.ts → still stub "BG engine ships in Phase 5 — MIT model spike pending."
git diff next.config.ts → still connect-src 'self', no unsafe-eval, no CDN
git diff lib/tools.ts → still background-remover 30MB/5 files
```

**Checks:**

- No `onnxruntime-web` added to production `package.json` ✅
- No model in `public/models` ✅
- No background-removal dependency ✅
- No production worker implementation ✅
- No CSP changes ✅
- No production route changes ✅

---

## AC. Updated Readiness Score

| Component | 6B | 6C | Notes |
|-----------|----|----|-------|
| PDF tools | 9.0 | 9.0 | Unchanged |
| Image tools (compress/convert/resize/exif) | 8.9 | 8.9 | Unchanged |
| **Background removal (general)** | 0 (blocked) | **0 (deferred)** | No GREEN general model verified; YELLOW pending network + legal |
| **Portrait background removal** | — | **7.0 (GREEN if portrait scope approved)** | Xenova/modnet GREEN but narrow scope, needs SHA-256 + spike |
| **Overall readiness** | **8.9** | **8.9 (general BG deferred)** — **8.9 + 7.0 portrait optional** | Do not inflate general score |

**Do not implement general background removal until Heliosoph/u2netp artifact is directly verified (SHA, LICENSE, ONNX metadata) and weight commercial rights are confirmed, or alternative MIT general model is found.**

---

## STOP CONDITION

**STOP. Do not implement Background Removal. Do not install anything into production. Do not purchase BRIA license. Do not contact vendors. Do not add cloud processing. Awaiting next instruction.**

**If portrait-only scope is desired, await explicit authorization for `Xenova/modnet` portrait implementation (requires SHA-256 + spike before coding).**
