# PHASE 9C-1 — Dodo Sandbox Credential, Environment & Connectivity Diagnostic

**Status:** BLOCKED — DODO NETWORK/WAF (Cloudflare 1010; credentials present but provider edge rejects before auth)
**Date:** 2026-08-11 (diagnostic)
**Prerequisite:** Phase 9C resume BLOCKED (DODO_API_KEY present 65 chars `sDqE…`, products `pdt_…` present, DODO_WEBHOOK_SECRET now SET length 38, but `test.dodopayments.com` → 403)
**Rule obeyed:** No redesign unless defect, no WAF bypass, no weakening signature verification, no fabrication, no manual PREMIUM, no secrets printed (presence/length/prefix only).

---

## A. Credential Presence Check

| Variable | Presence | Safe metadata | Result |
|----------|----------|---------------|--------|
| `DODO_API_KEY` | **SET** | len 65, prefix `sDqE1Wp8` (8 chars, no `dod_` prefix shown) | Present |
| `DODO_WEBHOOK_SECRET` | **SET** (was NOT SET in prior resume, now SET) | len 38, prefix not `whsec_` (38 chars suggests base64 without prefix) | Present (now) |
| `DODO_PAYMENTS_WEBHOOK_SECRET` (alias) | NOT SET | — | Alias not used, but `DODO_WEBHOOK_SECRET` is primary |
| `DODO_PRODUCT_MONTHLY_ID` | **SET** | `pdt_0NlB…` (24 chars, correct `pdt_` prefix) | Present |
| `DODO_PRODUCT_ANNUAL_ID` | **SET** | `pdt_0NlB…` (24 chars) | Present |
| `DODO_ENVIRONMENT` | SET | `test` | Test mode |
| `PAYMENTS_PROVIDER` | SET | `dodo` | Correct |

Method: `python3` parse of `.env` (strip quotes/comments, check `len>0`, no secret print). No `echo $DODO_API_KEY` / `printenv` / `env` dump.

---

## B. Credential Type Verification

**Against official docs:** Dodo docs (all languages) show:

```python
from dodopayments import DodoPayments
client = DodoPayments(bearer_token=os.environ.get("DODO_PAYMENTS_API_KEY"))
```

and header `Authorization: Bearer <token>` where `<token>` is your auth token. Example env in `dodo-agent-plugin` README: `DODO_PAYMENTS_API_KEY="dodo_test_..."`, webhook `DODO_PAYMENTS_WEBHOOK_KEY="whsec_..."`.

**Our `.env` observations:**
- `DODO_API_KEY` = 65 chars `sDqE1Wp8…` — does **not** start with `dod_test_`, `dod_live_`, `whsec_`, or `sk_`; looks like raw base64 token (43+ chars base64 is plausible for API key internal part). Could be that dashboard displays the key without `dod_test_` prefix in some views, or the value was copied without prefix. **Cannot independently verify** from docs whether `sDqE…` is a valid Bearer token without the prefix — docs show prefix-included examples but do not state prefix is mandatory for validity (some providers hide prefix).
- `DODO_WEBHOOK_SECRET` = 38 chars, not `whsec_`-prefixed in `.env` (code handles both `whsec_` and raw, so 38-char raw base64 is accepted — our `verifyStandardWebhook` strips `whsec_` if present, else uses raw). Length 38 is short for 32-byte base64 (43–44 chars), but could be 28 bytes.

**Verification outcome:** From redacted metadata alone we **cannot prove** whether `sDqE…` is a correct active Test API key for the same Business as `pdt_…` products. Dodo dashboard is required to confirm: `Business → Developer → API Keys → Test → Active` and that the key shown matches the `sDqE…` value and belongs to same Business that owns `pdt_0NlB…` products. Since we cannot open dashboard from sandbox, classify:

**BLOCKED — CREDENTIAL TYPE/ACCOUNT REQUIRES USER VERIFICATION** for the `DODO_API_KEY`↔`pdt_…` Business linkage. The provider edge `403` gives no account-specific message, so we cannot distinguish `wrong account` vs `network block` from credentials alone.

---

## C. Dodo Environment Verification

| Config | Code | Official | Match |
|--------|------|----------|-------|
| `DODO_ENVIRONMENT=test` | `lib/payments/providers/dodo.ts getBaseUrl()`: `if env in ("live","production","live_mode") → https://live.dodopayments.com else → https://test.dodopayments.com` | Docs: `DODO_PAYMENTS_ENVIRONMENT=test_mode` / `live_mode` or `test`/`live` per adapter — both map to same hosts (`test.dodopayments.com` vs `live.dodopayments.com`). Our code treats `test`, `test_mode`, `""` as test (fallback). For `test_mode` explicitly, our check would fallback to test (correct, since not `live`), so `test_mode` would still map to test. | **Match** — configured `test` correctly targets `https://test.dodopayments.com`. No mismatch. |

No secret printed. Code does not mistakenly target live when `test`.

---

## D. Product Ownership Verification

**Attempted:** `GET /products`, `GET /products/{id}`, `GET /v1/products`, `POST /checkout_sessions {product_cart:[{product_id:pdt_…}]}` with `Authorization: Bearer [REDACTED 65]` to `test` base.

**Result:** All `403` with same `403 Forbidden - Dodo Payments` HTML or `error code: 1010` — **before product lookup**. Cannot verify product exists/accessible/same-business/test-mode/monthly-vs-annual/price ₹199/$5 vs ₹999/$39.

**If API were reachable, expected verification would be:** `GET /products/pdt_…` → 200 `{"id":"pdt_…","name":…,"is_recurring":true,"recurring_interval":"month"/"year","price":19900,"currency":"INR"}` etc. No such JSON received.

**Result:** `BLOCKED — API unreachable` — not `ACCOUNT/PRODUCT CONFIGURATION ISSUE` (that would be 401/404 with JSON `product not found` / `unauthorized`). Separate from Cloudflare problem (see F).

---

## E. API Authentication Test

**Official mechanism:** `Authorization: Bearer <DODO_PAYMENTS_API_KEY>` (verified across `dodopayments-node`, `dodopayments-python`, `docs/api-reference` headers: `Bearer token header of the form Bearer <token>`). Our `dodo.ts` sends exactly `Authorization: Bearer ${apiKey}` — correct per docs. No need for `X-API-Key`.

**Test performed (minimal, no brute-force):** One `GET /products` and one `POST /checkout_sessions` with correct `Bearer` (above) to `test` base — both `403`. Also tried `live` base with same key — same `403`. Tried without auth and with dummy token — **also same `403 error code: 1010`** (no differentiation).

**No hammering:** Only 5–6 endpoints tried in this diagnostic (listed), not enumeration.

**Result:** Authentication format is **correct** (`Bearer`), but provider edge rejects before evaluating it (see F). No fix to auth header needed.

---

## F. Cloudflare/WAF Diagnosis

**Evidence to distinguish A–H:**

| Hypothesis | Evidence | Verdict |
|------------|----------|---------|
| **A invalid credential** | Would return `401 Unauthorized` JSON with `invalid token` and would differ between no-auth (403 1010) vs real vs dummy (401). Observed: **no difference** — no-auth, dummy, real all `403 error code: 1010` identical. | **Excluded** as sole cause (would show 401). |
| **B wrong endpoint** | Tried `/products`, `/v1/products`, `/api/products`, `/checkouts`, `/checkout_sessions` — all `403`. `live` base also `403`. If wrong path, some paths would 404, not all 403. | **Excluded** |
| **C wrong environment** | `test` correctly maps to `test.dodopayments.com` (see C). Switching to `live` still 403 with same key (expected if test key used on live). | **Excluded** as primary (env correct) |
| **D blocked source IP / WAF** | All paths + all auth variants → same Cloudflare `403 Forbidden` HTML `error code: 1010` (Cloudflare 1010 = "The owner of this website has banned your IP" / Access Rules). Sandbox egress via `tbh-linux-sandbox` `ALL_PROXY=http://127.0.0.1:46223` → Cloudflare sees sandbox proxy IP, not dashboard IP. This matches uniform 403 before auth. | **Included — primary** |
| **E Cloudflare sandbox restriction** | Same as D — sandbox egress is a NAT/proxy used by many sandboxes; may be in Dodo's Cloudflare blocklist (untrusted browser automation egress). | **Included** |
| **F malformed request** | Request is `application/json` POST with valid JSON body — same as SDK. No malformed. | Excluded |
| **G account/business restriction** | Would be 403 with JSON `account suspended` / `business not verified`, not Cloudflare HTML 1010. | Excluded until network fixed |
| **H other provider-side** | Could be Dodo test environment requires allowlisted dashboard business verification completed before API works (new merchant `Business not verified` may also be 403 HTML, but usually JSON). However uniform 403 even without auth suggests network before account check. | Secondary possible, but D is primary |

**Conclusion:** `D/E` is primary — **provider edge WAF/network block** from sandbox egress IP, not credential or endpoint. Credential validity is **unverifiable until network unblocked** (so B above remains `REQUIRES USER VERIFICATION`).

---

## G. Checkout Connectivity

**Attempted:** Real `POST /checkout_sessions {product_cart:[{product_id:pdt_…}]}` to `test` (as E) → `403` HTML, no `checkout_url`. Local `POST http://localhost:3000/api/payments/checkout` not reachable from sandbox proxy (`upstream connection failed / exit:28`).

**Safe diagnostics captured:** HTTP 403, provider HTML `403 Forbidden - Dodo Payments` + `error code: 1010`, endpoint `test.dodopayments.com/checkout_sessions`, timestamp `2026-08-11T23:xxZ` (diagnostic time), no secret.

---

## H. Webhook Configuration

- Local endpoint intended: `https://<test-or-public-domain>/api/payments/webhooks/dodo` (code `app/api/payments/webhooks/dodo/route.ts` — Standard Webhooks `webhook-id`/`timestamp`/`signature` + raw body + HMAC + `timingSafeEqual` + 5-min window).
- Required: HTTPS public endpoint registered in Dodo Test Dashboard `Developer → Webhooks` with exact URL matching `DODO_WEBHOOK_SECRET`.
- Current: **No public URL registered** (dev server was `http://localhost:3000` inside sandbox net, not public). So even if checkout succeeded, webhook could not be delivered.
- Needed: `https://<tunnel-or-staging>/api/payments/webhooks/dodo` with HTTPS only, signature verification stays enabled, no auth bypass.

**Result:** `BLOCKED — PUBLIC HTTPS ENDPOINT REQUIRED` (separate from API 403).

---

## I. Webhook Secret Verification

- `DODO_WEBHOOK_SECRET` present len 38, `DODO_PAYMENTS_WEBHOOK_SECRET` not set — code checks `process.env.DODO_WEBHOOK_SECRET || process.env.DODO_PAYMENTS_WEBHOOK_SECRET`, so 38-char value is used.
- Format: Dodo docs show `whsec_…` (base64) — 38 chars without prefix is plausible if copied without `whsec_` prefix (our verifier strips prefix if present, else uses raw, so both work). However 38 is shorter than expected 43–44 for 32-byte secret; could be truncated.
- Cannot verify against dashboard without opening `Developer → Webhooks → [REDACTED endpoint] → Signing secret`.

**Result:** Presence `SET`, correctness **REQUIRES USER VERIFICATION** (compare exact `whsec_…` shown for the endpoint's secret).

---

## J. Event Subscription Verification

**Required (per 9A/9C):** `payment.succeeded`, `payment.failed`, `subscription.active`, `subscription.updated`, `subscription.renewed`, `subscription.on_hold`, `subscription.cancelled`, `subscription.failed`, `subscription.expired`, `refund.succeeded`/`failed`, `dispute.*`/`chargeback`.

**Official Dodo event guide (`docs/developer-resources/webhooks/intents/webhook-events-guide`):** `payment.succeeded/failed/processing/cancelled`, `subscription active/updated/on_hold/renewed/plan_changed/cancelled/failed/expired`, `refund succeeded/failed`.

**Current subscription:** Not verified — needs Dashboard `Webhooks → Test → Events` to confirm subscribed. Cannot be verified without dashboard access.

**Result:** `UNVERIFIED — DASHBOARD CHECK REQUIRED`.

---

## K. Public HTTPS Endpoint Status

- **Local:** `http://localhost:3000/api/payments/webhooks/dodo` exists (route `ƒ`), but not public HTTPS, not reachable from Dodo edge (sandbox `localhost` timeout `exit:28`).
- **Needed:** `https://<public>/api/payments/webhooks/dodo` with HTTPS only, Cloudflare Tunnel or Vercel Preview or similar approved tunnel. No custom tunnel currently approved/running.

**Result:** `BLOCKED — PUBLIC HTTPS ENDPOINT REQUIRED`.

---

## L. Environment Separation

| Environment | Expected | Actual | Result |
|-------------|----------|--------|--------|
| Development | Local `NEXTAUTH_URL=http://localhost:3000`, `DATABASE_URL file:./prisma/dev.db` | As `.env` | Valid |
| Dodo Sandbox (test) | `DODO_ENVIRONMENT=test` + Test API key + Test `pdt_…` + Test webhook + `whsec_…` test | `test` set, but key/secret/product linkage unverified due WAF | Env `test` correct, mixture risk low (no live key in `.env`) |
| Production (live) | `live` + Live key + Live `pdt_` + Live webhook | Not present in `.env` (correct) | Safe |

No cross-mix: no `live` key in dev `.env`, `test` products not live.

---

## M. Security Findings

- No weakening: `verifyStandardWebhook` still does `HMAC SHA256` + `timingSafeEqual` + 5-min window + `whsec_` prefix handling + raw body (see `lib/payments/providers/dodo.ts:35–80`). No bypass added for WAF.
- Secrets never printed: only `SET`/`NOT SET`/len/prefix `sDqE`/ `pdt_` prefix.
- No `any` introduced, no new deps.

**Regression security headers preserved** (CSP `script-src 'self' 'unsafe-inline'` prod, `worker-src blob`, `connect-src 'self'`, HSTS etc. — same as 9A).

---

## N. Privacy Findings

- Payment layer still `PaymentProvider` abstraction — no file bytes in checkout/webhook. `Payment` stores `providerPaymentId/amount/currency/status` only; no card data; `WebhookEvent` stores `payloadHash sha256` not raw.
- Workers (`pdf.worker.ts`/`image.worker.ts`/`bg.worker.ts`) never import `lib/payments`.

**Status:** Preserved.

---

## O. Regression Results (after diagnostic, no code change except report)

| Suite | Result |
|-------|--------|
| `typecheck` | **PASS 0** |
| `lint` | **PASS 0 errors**, 1 warning `redisFailedAt` (pre-existing) + 1 wish `TEST_SECRET_RAW` (test-only) |
| `prisma validate` | **PASS** `valid` |
| `Vitest` | **40/40 PASS** (payments 11: valid sig, modified body → 401, bad sig → 401, wrong secret → 401, expired → 401, idempotency unique, PREMIUM+canShowAds, cancel-at-period-end, out-of-order stale) |
| `build` | **PASS** 40 pages (3 payment `ƒ`) |
| `Playwright` | **53/53 PASS** prior (not re-run in this diagnostic to avoid sandbox net) — previous `PHASE9C` resume still valid |
| `npm audit` | 4 high `GHSA-p6gq-j5cr-w38f nodemailer` no fix (mitigated) |
| `license` | MIT/Apache — no AGPL |

---

## P. Exact External Action Required

**Priority order (safe, no secrets in chat):**

1. **Do not change code yet** — auth format `Bearer` and base `test.dodopayments.com` are correct per docs.
2. **Dashboard → Verify Business/Test account** — ensure Test Business is `Verified/Active` (not `Pending`) — `403` HTML can mean unverified merchant blocked at edge before API. If pending, complete KYC even for test (some providers require).
3. **Dashboard → Developer → API Keys → Test** — copy the **entire** `DODO_API_KEY` (including prefix if shown, e.g., `dod_test_…` or `sk_…`). In `.env` replace `DODO_API_KEY` exactly as shown (no truncation). Confirm its Business matches the `pdt_…` products' Business (product listing should show same Business ID).
4. **Dashboard → Developer → Webhooks → Test** — create or select `https://<public>/api/payments/webhooks/dodo` (must be public HTTPS). Copy its **exact** `Signing secret` (full `whsec_…` including prefix) to `DODO_WEBHOOK_SECRET` (or `DODO_PAYMENTS_WEBHOOK_SECRET`). Ensure secret belongs to that exact endpoint.
5. **Subscribe events** — enable `payment.succeeded/failed`, `subscription.*` (active/updated/renewed/on_hold/cancelled/failed/expired), `refund.*`, `dispute.*`.
6. **Expose webhook endpoint** — provide public HTTPS via approved tunnel (`cloudflared --url http://localhost:3000` or Vercel Preview `https://<preview>.vercel.app/api/payments/webhooks/dodo`) — HTTPS only, keep signature verification enabled, no auth bypass.
7. **Allowlist / network** — if `test.dodopayments.com` still `403 error code: 1010` after key is proven correct, contact Dodo support with Business ID + `error code 1010` + sandbox egress IP (ask support to allowlist) or run checkout test from **outside sandbox** (local terminal without `tbh-linux-sandbox` proxy: `curl --noproxy '*' https://test.dodopayments.com/products -H "Authorization: Bearer $DODO_API_KEY"`). If outside sandbox returns `200` JSON, then WAF is sandbox-egress-specific; use public deployment for provider tests.

**Do not ask user to paste secret into chat** — only replace in `.env` locally and restart `npm run dev`.

---

## Q. Primary Blocker/Status

**BLOCKED — DODO NETWORK/WAF** (primary) + **BLOCKED — WEBHOOK CONFIGURATION** (secondary)

- Credentials present (`DODO_API_KEY` SET len 65, `DODO_WEBHOOK_SECRET` SET len 38, `pdt_…` SET), environment `test` correctly targets `https://test.dodopayments.com`, and auth format `Bearer` is correct per docs — yet **all** `test.dodopayments.com` requests (with/without auth, dummy, real, all paths) return **uniform Cloudflare `403 error code: 1010` HTML** before auth evaluation. This matches **WAF source-IP block** (`D`), not invalid credential (`A`) which would differentiate `401` vs `403`.
- Separate block: no public HTTPS webhook endpoint (`K`).
- So even if credentials are valid, lifecycle cannot proceed until network/WAF and webhook endpoint are resolved. This is **not** `BLOCKED — INVALID DODO CREDENTIAL` (cannot prove invalid, since 403 uniform) and not `BLOCKED — DODO ACCOUNT/PRODUCT CONFIGURATION` (cannot test product access until WAF passes).

---

## R. Whether Phase 9C Lifecycle Testing May Proceed

**No** — lifecycle `FREE → CHECKOUT → PAYMENT → SIGNED WEBHOOK → DATABASE → PREMIUM ACTIVE` cannot proceed until `P` steps 2–7 are done and `test.dodopayments.com` returns `200` JSON instead of `403`. Next run of `PHASE 9C` should first re-run §E single `GET /products` — if `200`, then proceed to full lifecycle §4–§40; if still `403`, remain at `9C-1` diagnostic.

---

## STOP CONDITION

**STOP.** Do not move to advertising, Background Removal, public API, or deployment. Payment architecture unchanged, verification still enabled, no premium fabricated. Fix exactly per §P, then re-run diagnostic.

