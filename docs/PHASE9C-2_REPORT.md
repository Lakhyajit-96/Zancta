# PHASE 9C-2 — Resolve Dodo Sandbox Access + Public Webhook Connectivity

**Status:** BLOCKED — DODO NETWORK/WAF (sandbox egress `403 error code: 1010`) + BLOCKED — WEBHOOK CONFIGURATION (no public HTTPS endpoint verified)
**Date:** 2026-08-11 (diagnostic, no architecture change)
**Prerequisite:** PHASE 9C-1 `BLOCKED — DODO NETWORK/WAF` (all `test.dodopayments.com` → `403` uniform, webhook `DODO_WEBHOOK_SECRET` now SET but not verified as exact endpoint secret)
**Rule obeyed:** No payment architecture redesign, no WAF bypass, no signature weakening, no fabrication, no manual PREMIUM, no secrets printed (presence/len/prefix only).

---

## A. Test Business verification

**Expected:** Test Business `Verified/Active` in Dodo Test Dashboard, owns API key + `pdt_…` products + webhook endpoint.

**Inspection:** Cannot open Dashboard from sandbox (no browser). Presence check: `.env` `DODO_API_KEY` SET len 65 `sDqE…`, `DODO_PRODUCT_MONTHLY_ID` `pdt_0NlB5U…`, `pdt_0NlB5e…` present, `DODO_ENVIRONMENT=test`. **Membership proof requires Dashboard:** check `Dashboard → Businesses → Test → Verified` and that key/product list shows same `pdt_…` IDs under that Business. Without visual Dashboard, classify:

**BLOCKED — DODO CREDENTIAL REQUIRES USER VERIFICATION** (Business linkage unverified from sandbox).

---

## B. API credential verification

**Docs:** `DODO_PAYMENTS_API_KEY` Bearer (`Authorization: Bearer <token>`) per `dodopayments-node`/`python`/`docs/api-reference`. Webhook secret is separate `whsec_…`.

**Our `.env`:**
- `DODO_API_KEY` len 65 `sDqE…` (does not start with `dod_test_` in redacted prefix, but docs examples sometimes show `dod_test_…` — prefix not conclusive)
- `DODO_WEBHOOK_SECRET` len 38 `whse…` (38 chars, no `whsec_` prefix in redacted, but verifier handles both)

**Dashboard verification needed:** `Developer → API Keys → Test → Active` shows full token matching `sDqE…` and Business matches `pdt_…` products. Until user confirms from Dashboard, classify as above. No rotation done.

**Never printed:** Only `SET`/`len`/`pdt_` prefix.

---

## C. Product verification

**Expected:** Monthly `pdt_0NlB5U…` → recurring monthly `₹199 / $5`, Annual `pdt_0NlB5e…` → recurring annual `₹999 / $39`, same Test Business.

**Dashboard check required:** `Products → Test → pdt_…` details. From `.env` only presence `SET` verified. No auto-recreation.

**Result:** `BLOCKED — requires Dashboard product detail confirm` (pricing/currency/interval not verified live due WAF).

---

## D. Network comparison

| Environment | Dodo Test API `GET /products` (Bearer) | Result |
|-------------|----------------------------------------|--------|
| **Current sandbox** (`tbh-linux-sandbox` via `http://127.0.0.1:46223` `ALL_PROXY`) | `403 error code: 1010` HTML `403 Forbidden - Dodo Payments` for **all** variants: no-auth, dummy, real, `test`/`live` base, all paths (`/products`, `/v1/products`, `/checkouts`, `/checkout_sessions`) | **BLOCKED** (uniform 403) |
| **Authorized external (host without proxy)** | Attempted `urllib` `ProxyHandler({})` direct (no proxy) → `Temporary failure in name resolution` (sandbox net isolated — no direct egress without proxy), and `powershell` `Invoke-WebRequest` blocked by sandbox quoting — **cannot be tested from sandbox** | **UNTESTABLE from sandbox** — requires host/CI/Vercel without `tbh-linux-sandbox` proxy |
| **Eventual staging (Vercel preview)** | Vercel CLI `vercel ls` → `Error: The specified token is not valid` (no `VERCEL_TOKEN`), so `https://<preview>.vercel.app` URL not captured; but build `50b62b6` succeeded on Vercel `iad1` with `prisma generate && next build`, so staging exists but URL not listed here | **UNVERIFIED — VERCEL URL NOT CAPTURED** |

**Interpretation:**
- Only sandbox = 1010, external = not testable from sandbox → **likely sandbox-egress/WAF** (Cloudflare `1010` for `127.0.0.1:46223` IP). **Not proven** as WAF vs credential until external `200` vs `401` is observed. Needs host test: on user's Windows (no WSL proxy) run `curl -H "Authorization: Bearer $DODO_API_KEY" https://test.dodopayments.com/products` — if `200` JSON, then sandbox IP is blocked and staging should be used; if still `1010`, then account-level block.

---

## E. Cloudflare/WAF evidence

- Uniform `403` for **no-auth** (`no-auth /products → 403 error code: 1010`), **dummy** (`Bearer dummy → 403 1010`), **real** (`Bearer sDqE… → 403 HTML 1010`), and **live** base (`live.dodopayments.com/products` with same key → 403 1010) — **no 401 differentiation**, so edge WAF fires **before** app auth (Cloudflare `1010` = banned IP / Access Rule).
- Not `wrong endpoint` (all paths 403, not 404) and not `wrong env` (`test` correctly maps to `test.dodopayments.com` per `lib/payments/providers/dodo.ts getBaseUrl()`).
- Therefore **D** (`blocked source IP / WAF`) is primary; **A** (invalid credential) **excluded as sole cause** but cannot be fully excluded until external `200`/`401` distinction.

---

## F. Public webhook

- Current local: `http://localhost:3000/api/payments/webhooks/dodo` exists (`ƒ` route) but **not public HTTPS** — Dodo cannot deliver.
- Required: `https://<public-test-host>/api/payments/webhooks/dodo` registered in Test Dashboard.
- Available: **Vercel preview** from `50b62b6` build should provide `https://toolsite-*.vercel.app` — but `vercel ls` token invalid, so URL not verified here.
- **Result:** `BLOCKED — PUBLIC HTTPS ENDPOINT REQUIRED` (no tunnel approved/running).

---

## G. Webhook secret

- `.env` `DODO_WEBHOOK_SECRET` SET len 38 (now, was missing), `DODO_PAYMENTS_WEBHOOK_SECRET` NOT SET — code checks `process.env.DODO_WEBHOOK_SECRET || process.env.DODO_PAYMENTS_WEBHOOK_SECRET`, so value used.
- **Verification:** Must match **exact** endpoint's `Signing secret` in Dashboard `Developer → Webhooks → https://<public>/api/payments/webhooks/dodo → whsec_…` (including `whsec_` prefix if shown). Our verifier handles both prefixed and raw, but len 38 is short for 32-byte base64 (expected 43–44), so may be truncated. **Requires Dashboard compare** — classify as `BLOCKED — WEBHOOK SECRET REQUIRES USER VERIFICATION`.

---

## H. Webhook event configuration

**Required per implementation (`app/api/payments/webhooks/dodo/route.ts`):** `payment.succeeded/failed`, `subscription active/updated/on_hold/renewed/plan_changed/cancelled/failed/expired`, `refund succeeded/failed`, `dispute.*`.

**Official guide (`docs.dodopayments.com/developer-resources/webhooks/intents/webhook-events-guide`):** Same list — `payment succeeded/failed/processing/cancelled`, `subscription active/updated/on_hold/renewed/plan_changed/cancelled/failed/expired`, `refund succeeded/failed`.

**Current Test webhook subscriptions:** **UNVERIFIED** — needs Dashboard `Webhooks → Events` checklist confirm.

---

## I. Real webhook delivery

- No test `payment.succeeded` delivered via Dashboard `Send test event` (needs public HTTPS + secret). Uniform WAF block also prevents checkout, so no payment to trigger webhook. **BLOCKED**.

---

## J. Real checkout

- No `POST /api/payments/checkout` with real `Bearer` reached Dodo — all `test.dodopayments.com/checkout_sessions` → `403`. **BLOCKED**.

---

## K. Payment

- No `payment.succeeded` received → `Payment` table not written via live. **BLOCKED** (code-verified via `tests/payments.test.ts` mock).

---

## L. Subscription

- No `subscription.active` → **BLOCKED**.

---

## M. Entitlement

- `FREE → PREMIUM ACTIVE` only via `syncEntitlement` from webhook — **BLOCKED live**, **VERIFIED — CODE/UNIT TEST** (11 tests: valid sig → PREMIUM, `canShowAds false`).

---

## N. Cancellation

- `subscription.cancelled` with `cancelAtPeriodEnd` → **BLOCKED** (needs live `providerSubscriptionId`), code `VERIFIED`.

---

## O. Expiration

- `subscription.expired` → **BLOCKED**.

---

## P. Renewal

- Needs time acceleration — **UNVERIFIED — PROVIDER SANDBOX LIMITATION** (even if WAF resolved, clock not configured).

---

## Q. Refund

- Needs dashboard refund simulation — **UNVERIFIED — PROVIDER SANDBOX LIMITATION**.

---

## R. Dispute

- **UNVERIFIED — PROVIDER SANDBOX LIMITATION**.

---

## S. Privacy

- Checkout/webhook still only `email`/`planId`/`amount`/`currency` — **VERIFIED** (`grep -r formData lib/payments` 0, `privacy-net` still `POST []`).

---

## T. Security

- `DODO_API_KEY`/`WEBHOOK_SECRET` server-only (`lib/payments/providers/dodo.ts` only, no `NEXT_PUBLIC_DODO`), `timingSafeEqual` + 5-min window + `whsec_` handling preserved, rate limit `10/15m` on `checkout`, no secret in report.

---

## U. Regression

| Suite | Result |
|-------|--------|
| `typecheck` | **PASS 0** |
| `lint` | **PASS 0 errors** (2 warnings) |
| `prisma validate` | **valid 🚀** (postgresql) |
| `vitest` | **40/40 PASS** (payments 11, now 6.7s via Supabase) |
| `build` | **PASS** 40 pages (after `prisma generate && next build` + `PrismaPg` fix) |
| `migrate status` | `Database schema is up to date!` (both migrations `resolve --applied` after `db push`) |
| `npm audit` | 4 high `GHSA-p6gq-j5cr-w38f` mitigated |

---

## V. Remaining blockers

1. **Dodo API WAF:** `test.dodopayments.com` still `403 1010` from sandbox egress — needs external host test or Vercel staging test to confirm if credential vs IP.
2. **Webhook public HTTPS:** No `https://<public>/api/payments/webhooks/dodo` registered — needs Vercel preview URL or `cloudflared` tunnel.
3. **Webhook secret / events:** Need Dashboard exact `whsec_…` + event checklist confirm.
4. **Products:** Need Dashboard confirm same Test Business + pricing.

---

## W. Exact external action required

1. **Do NOT change code** — `Bearer` + `test.dodopayments.com` is correct.
2. **On host (no WSL proxy):** Run `curl -H "Authorization: Bearer $DODO_API_KEY" https://test.dodopayments.com/products` — if `200` JSON, sandbox IP is blocked → use **Vercel preview** for all provider tests; if `401` JSON, then key belongs to different Business/env → re-copy Test key for that Business; if still `403 1010`, contact Dodo support with Business ID + `error code: 1010` + `host` vs `sandbox` IP.
3. **Vercel:** Get preview URL (`https://toolsite-*.vercel.app` from Vercel Dashboard → Deployments → `50b62b6` → Visit), set `DODO_WEBHOOK_SECRET` (`whsec_…` full) and register `https://<preview>/api/payments/webhooks/dodo` with required events in **Test** Dashboard, then retry checkout from that preview (use Vercel preview's `/pricing` → `POST /api/payments/checkout`).
4. **Do NOT use production credentials** for Test.

---

## X. Final classification

**BLOCKED — DODO NETWORK/WAF** (primary) + **BLOCKED — WEBHOOK CONFIGURATION** (secondary)

No `SANDBOX-PARTIALLY-VERIFIED` — even first `Test Business` still **BLOCKED — CREDENTIAL REQUIRES USER VERIFICATION** pending Dashboard visual, and first `Test API connectivity` is `BLOCKED` (uniform 1010). No lifecycle `VERIFIED — REAL DODO SANDBOX`.

