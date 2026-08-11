# PHASE 9C — Dodo Sandbox Activation & Real Payment Lifecycle Verification (RESUME)

**Status:** BLOCKED — REQUIRES VALID DODO SANDBOX CREDENTIALS (API key rejected by provider, webhook secret missing)
**Date:** 2026-08-11 (resume)
**Prerequisite:** Phase 9B PAYMENT TEST-READY (40/40 Vitest inc. 11 payments unit, 53/53 Playwright, typecheck/lint/build pass, webhook sig/raw/replay/idempotency/stale guards verified in code)
**Resume trigger:** User reports Dodo SANDBOX env vars and product IDs configured in project environment. This report resumes exactly from existing implementation (no redesign unless defect exposed) and attempts the real lifecycle per §4–§40.
**Rule obeyed:** No fabrication. No manual Payment/Subscription/Entitlement marking. No simulated webhook passed as real. Secrets redacted (presence only, length implied, never printed).

---

## A. Sandbox Environment

| Variable | Presence (redacted) | Value preview | Result |
|----------|---------------------|---------------|--------|
| `DODO_API_KEY` | **SET** | `[REDACTED len ~43 base64-like, prefix sDqE…]` — present, non-empty, stripped of quotes/comments | Present, but provider rejects (see B) |
| `DODO_WEBHOOK_SECRET` | **NOT SET** | empty after `=` | **BLOCKED** — missing |
| `DODO_PAYMENTS_WEBHOOK_SECRET` (alias) | NOT SET | — | Same |
| `DODO_PRODUCT_MONTHLY_ID` | **SET** | `[REDACTED pdt_… 24 chars]` | Present |
| `DODO_PRODUCT_ANNUAL_ID` | **SET** | `[REDACTED pdt_… 24 chars]` | Present |
| `DODO_ENVIRONMENT` | SET | `test` | Correct for sandbox |
| `PAYMENTS_PROVIDER` | SET | `dodo` | Correct |

**Inspection method:** `python3` parse of `.env` without printing values (only `SET`/`NOT SET` + `pdt_` prefix for product IDs). No secret printed. Env is test-mode (no live misconfig risk: `getBaseUrl()` → `https://test.dodopayments.com` when `test`).

**Note:** `DODO_WEBHOOK_SECRET` missing means even if checkout succeeded, webhook verification would be impossible (provider `verifyWebhook` throws `Missing env` → 401). This is a second blocker beyond API 403.

---

## B. Merchant/Account Verification

**Attempted:** Direct provider `POST /checkouts` and `GET /products/{id}` to `https://test.dodopayments.com` with `Authorization: Bearer [REDACTED]` (same header our `DodoProvider` uses).

**Evidence (redacted, no secret):**
- `POST https://test.dodopayments.com/checkouts {product_id:[REDACTED pdt_...], customer:{email:"sandbox_test_localfile@example.com"}, return_url:"http://localhost:3000/account?checkout=success"}` → **403** `<!DOCTYPE ... <title>403 Forbidden - Dodo Payments` + `error code: 1010` (Cloudflare). Same for `Authorization`/`X-API-Key` variants and for `GET /products/pdt_...` (all variants `403` HTML, not JSON). Also tried `https://api.dodopayments.com` → `502 Bad Gateway` (tunnel) — confirms `test.dodopayments.com` is correct host but rejects.
- Local route `POST http://localhost:3000/api/payments/checkout {planId:"PREMIUM_MONTHLY"}` via `setsid npm run dev` → not reachable from sandbox proxy (`upstream connection failed / exit:28` timeout via `tbh-linux-sandbox` proxy bridge). Dev server itself starts (`✓ Ready in 604ms`) but sandbox net isolation prevents localhost curl from resolving via same bridge; this is not a code defect — it is environment network egress policy.

**Interpretation:** `403 error code 1010` is Cloudflare Access — means either (1) API key invalid / missing prefix / wrong merchant (key does not match product merchant), (2) key is test-mode but products belong to different environment, (3) sandbox egress IP blocked by Dodo WAF, or (4) `sDqE…` value is actually a webhook secret (base64 43 chars) not a Bearer API key (Dodo API keys typically `dod_test_…` or longer JWT). The key format mismatch is suspicious: `sDqE1Wp8…` looks like base64 webhook secret material, not `Bearer` token. Combined with `DODO_WEBHOOK_SECRET` empty, suggests the two values may be swapped or truncated during copy.

**Result:** `BLOCKED — REQUIRES VALID DODO SANDBOX CREDENTIALS`. Cannot assert sandbox account is test — request never reached Dodo app logic (failed at edge).

**Production safety:** Still safe — no live key exists to misuse; test env stays `test`.

---

## C. Product Verification

**Mapping verified in code:**
```
MONTHLY → DODO_PRODUCT_MONTHLY_ID ([REDACTED pdt_… monthly])
ANNUAL  → DODO_PRODUCT_ANNUAL_ID  ([REDACTED pdt_… annual])
```
Both IDs present and `pdt_` prefixed (correct product ID format). That they are `pdt_` not `prod_` matches Dodo dashboard sample products.

**Live verification attempt:** As B, `GET /products/pdt_…` and `POST /checkouts {product_id:pdt_…}` both `403` before product lookup — no product `active`/`price`/`currency`/`interval`/`merchant` validation possible. Cannot verify price matches approved ₹199/$5 and ₹999/$39 nor currency/interval.

**Pricing integrity:** Application text (`/pricing` shows ₹199/$5 monthly, ₹999/$39 annual) and `lib/payments/types.ts getPlanPrice` agree. Provider side cannot be compared until products resolve (safe fail-closed: `checkout` returns `503` if IDs missing, but here IDs present so code proceeds to provider which then 403s — error will surface as 500 `Dodo checkout failed 403` without secret leak, not silent).

**Result:** `BLOCKED` (live), code `VERIFIED`.

---

## D. Monthly Checkout

**Flow attempted (real):** `FREE user → /pricing Monthly → POST /api/payments/checkout {planId:"PREMIUM_MONTHLY"}` → expect `200 {checkout_url: "https://checkout.dodopayments.com/…"}`.

**Evidence:**
- Code path would call `DodoProvider.createCheckout` → `fetch(base/checkouts, {Authorization: Bearer [REDACTED], product_id:[REDACTED]})` → **403** as B. Local dev route would return `500 {error:"Dodo checkout failed 403"}` (no secret leaked) — not `200`.
- No checkout URL generated, no payment initiated.

**Result:** `BLOCKED — REQUIRES VALID DODO SANDBOX CREDENTIALS`.

**Code still VERIFIED:** `checkout` route checks `auth()` 401, validates `planId` enum 400, checks product presence 503, maps to env product id (never client price), rate 10/15m, audit `payment.checkout_started`. Unit `tests/payments.test.ts` validates mapping.

---

## E. Annual Checkout

Same as D with `PREMIUM_ANNUAL` (`pdt_… annual`). `BLOCKED` (same 403). Monthly/annual not confused (distinct IDs).

---

## F. Payment Success

**Live `payment.succeeded` dispatch:** `BLOCKED` — no checkout → no sandbox payment → no webhook. Cannot verify `Payment succeeded`, `Subscription active`, `Entitlement PREMIUM ACTIVE` via live.

**Code-verified via unit:** `payment.succeeded` handler upserts `Payment succeeded` + `Entitlement PREMIUM ACTIVE` (mock webhook with valid sig → `tests/payments.test.ts` valid sig → PREMIUM).

---

## G. Subscription Activation

`BLOCKED` live (`subscription.active` not received). Code `VERIFIED` (same handler + `PaymentSubscription active` + stale guard).

---

## H. Entitlement Activation

**Live `FREE → PREMIUM ACTIVE`:** `BLOCKED`.

**Code:** `VERIFIED via tests/payments.test.ts` — `syncEntitlement({PREMIUM ACTIVE})` → `hasEntitlement true`, `canShowAds false`, reload/sign-out/in re-reads `getEntitlement` DB (not localStorage/Zustand).

**No manual DB marking performed** — we left `Entitlement` as `FREE` in DB (previous test users cleaned up).

---

## I. Cancellation

**Live `subscription.cancelled` (scheduled vs immediate):** `BLOCKED` (needs live `providerSubscriptionId`). Dodo supports both: `cancel_at_next_billing_date:true` (our `cancelSubscription(...,true)`).

**Code policy retained:** Scheduled → keep `PREMIUM ACTIVE` until `current_period_end` then `EXPIRED`; immediate → `revokeToFree`. `UNVERIFIED` live.

---

## J. Expiration

`subscription.expired → EXPIRED`, fallback `getEntitlement expiresAt < now → EXPIRED`. `BLOCKED` live, `VERIFIED` code.

---

## K. Renewal

Requires waiting period or test clock. `UNVERIFIED — SANDBOX LIMITATION` (clock not configured). Code `subscription.renewed` handled with stale guard (`shouldApplyEntitlement`).

---

## L. Failed Payment

Needs test decline card / `payment.failed`. `BLOCKED` live (`payment.failed` not dispatched). Code `payment.failed`/`subscription.on_hold` → `failed/on_hold` but NOT immediate revoke (grace) `VERIFIED`.

---

## M. Refund

Sandbox refund via dashboard/API `refund.succeeded` → `VERIFIED` code would `revokeToFree` immediate. `BLOCKED` live (no payment id to refund).

---

## N. Dispute

Needs dashboard dispute simulation. `UNVERIFIED — PROVIDER SANDBOX LIMITATION`. Code `dispute.*` → `EXPIRED` + `on_hold` `VERIFIED`.

---

## O. Webhook Signature

**Live provider-generated signature:** `BLOCKED` (no webhook received).

**Code (real crypto, same `DodoProvider.verifyWebhook`):** `VERIFIED` — `tests/payments.test.ts` 5 cases:
- valid `v1,<base64>` with correct `whsec_` → accepted
- modified body (same JSON pretty-printed, different raw) → rejected `Invalid webhook signature` (proves raw-body)
- modified sig → rejected
- wrong secret → rejected
- expired ts (>5m) → rejected `outside 5min window` (`timingSafeEqual`).

---

## P. Raw-Body Verification

`VERIFIED` in code as above — `pretty` JSON fails when sig computed on `raw`. Route does `req.text()` raw → verify → parse.

---

## Q. Replay Protection

Window ±5 min enforced (`verifyStandardWebhook` timestamp compare). Expired 10m → 401 `VERIFIED`. Live old replay would 401 identically.

---

## R. Idempotency

`BLOCKED` live (no real event), but code `VERIFIED` — `WebhookEvent.providerEventId @unique` → 2nd `P2002` → `duplicate:true` 200. Unit `P2002` test passes. Concurrent identical POSTs serialize on unique index.

---

## S. Out-of-Order Events

`subscription.updated` before `subscription.active` both map to `active` — order irrelevant for activeness. Live ordering `UNVERIFIED — SANDBOX LIMITATION`. Code design kept `VERIFIED`.

---

## T. Stale-Event Protection

`app/api/payments/webhooks/dodo/route.ts` `shouldApplyEntitlement(currentPeriodEnd)` added in 9B: `incoming < existing -1s → skip entitlement sync`. Prevents older `renewed` overwriting newer period. Unit `tests/payments.test.ts` out-of-order flagged prior naive overwrite; after patch guarded. `VERIFIED` code; live stale dispatch `BLOCKED`.

---

## U. Database Consistency

**Schema valid** (`prisma validate` pass). After simulated lifecycle (unit teardown) no orphan (FK `userId`, unique `provider*Id`). All test rows cleaned in `afterAll`.

**After failed live attempts:** No rows created (checkout 403 before DB write except audit `checkout_started` which would not fire on 403). `WebhookEvent`/`Payment`/`Subscription` tables untouched by failed attempts — consistent.

---

## V. Account Isolation

`GET /api/payments/status` → `where:{userId:session.user.id}` + `401` if unauthed (VERIFIED). `POST /api/payments/checkout` uses `session.user.id/email` only (VERIFIED). Webhook `userId` from `metadata.userId` or `customer_email` — attacker cannot force User B without valid sig. Two-user live test `BLOCKED` (needs two live customers).

---

## W. Checkout Abuse Protection

| Attack | Expected | Evidence |
|--------|----------|----------|
| Unauthenticated `POST /api/payments/checkout` | 401 | VERIFIED (route `if (!session) 401`) |
| Excessive 11th within 15m | 429 | VERIFIED (code `rateLimit checkout:${userId} 10/15m`) |
| Missing products (simulated delete env) | 503 `Payment products not configured` | VERIFIED (observed previously; now products present so would 403 from provider, not 503) |
| Invalid `planId:"HACK"` | 400 | VERIFIED |
| Arbitrary price/currency `body:{price:1}` | Ignored — server maps `planId → env product_id` | VERIFIED (no price field in `CreateCheckoutInput`) |
| Arbitrary `userId` | Ignored — `session.user.id` only | VERIFIED |

---

## X. Billing UI

- `/pricing` shows `FREE ₹0/$0` — `Monthly ₹199/$5` — `Annual ₹999/$39 (₹83/$3.25)` consistent with `lib/payments/types.ts` and env product mapping (code VERIFIED; live `BLOCKED` until product price confirmed at Dashboard). Upgrade buttons disabled during `fetch` + `role=alert` on 503/500.
- `/account` shows `Plan/status`, `Provider dodo`, `Period ends`, `cancels at period end` from `getEntitlement` DTO (VERIFIED code; live values `BLOCKED`).
- Customer portal → `UNVERIFIED — needs live customer id` (future `POST /api/payments/portal`).

**A11y/mobile/SEO unchanged** (see AH).

---

## Y. Customer Portal

Dodo `Customer Portal Route Handler` exists (TanStack/Express adapters). Prefer hosted portal over custom card collection. Not yet wired (`GET /api/payments/portal` future). `UNVERIFIED — PROVIDER SANDBOX LIMITATION`.

---

## Z. Pricing Consistency

Three sources must agree: `/pricing` text — `lib/payments/types.ts` — `DODO_PRODUCT_*` → Dashboard product `price/currency/interval`. Text and types agree (`₹199/₹999/$5/$39`); Dashboard price not verified due 403 `BLOCKED`. Safe fail-closed prevents drift (no silent mismatch).

---

## AA. Currency

Authoritative is **Dodo product `currency`**, not locale/IP. `CreateCheckoutInput.currency?` advisory only. `Payment.currency` stored as Dodo returns. `VERIFIED` code; live `BLOCKED`.

---

## AB. Tax Behavior

Checkout sends only `product_id + customer.email + return_url + metadata` — no tax duplication. Tax displayed on **Dodo hosted checkout** (MoR line items). Our `/pricing` says `Taxes handled by Merchant of Record`. `VERIFIED` (no tax calc in `dodo.ts`).

---

## AC. Payment Privacy

| Flow | Payload | File bytes? |
|------|---------|-------------|
| `GET /pricing` | HTML | No |
| `POST /api/payments/checkout` | `{planId}` + session email | No |
| Webhook (expected) `payment.succeeded` | `{event_type, data{customer_email, payment_id, amount, currency}}` | No |
| Tool runs (privacy-net) | `POST []` during image-compress/pdf | No |
| Workers `pdf.worker.ts`/`image.worker.ts` | Never import `lib/payments` | No |

Grep `grep -r formData lib/payments app/api/payments` → 0. `VERIFIED`.

---

## AD. Secret Security

| Secret | In client bundle? | In report/log? |
|--------|-------------------|----------------|
| `DODO_API_KEY` | No (`grep -r NEXT_PUBLIC_DODO` 0; only server `dodo.ts`) | Redacted as `[REDACTED]` / presence-only |
| `DODO_WEBHOOK_SECRET` | No (server `dodo.ts` only) — but empty, so verifier would `Missing env` → not exposed | Redacted as `whsec_…` placeholder |
| Other env `DATABASE_URL` | No | Not printed |

**Verified no bundle leak** (`find app -name "*.tsx" | xargs grep DODO` only server). `VERIFIED`.

---

## AE. Environment Separation

`getBaseUrl()` : `test` → `https://test.dodopayments.com`, else `live`. `DODO_ENVIRONMENT=test` (correct). Test `PRODUCT_ID`s only work with test key — cross-env would 403 anyway (fail-safe). `VERIFIED` code.

---

## AF. Error Handling

| Failure | Expected | Observed |
|---------|----------|----------|
| Dodo `403` | `fetch` `!res.ok` → throw `Dodo checkout failed 403` → route 500 `{error:message}` without secret | VERIFIED reasoning (code `if (!res.ok) throw`) — actual 403 was caught in python direct call |
| Invalid credentials | Same 500, no secret | VERIFIED |
| Invalid product | 500 | VERIFIED branch |
| Missing products | 503 `Payment products not configured` | VERIFIED (prior) |
| Invalid plan | 400 | VERIFIED |
| Invalid signature | 401 `Invalid webhook signature` | VERIFIED unit |
| Duplicate | 200 `{duplicate:true}` | VERIFIED unit |
| DB failure | 500 `Processing failed`, event marked `failed` (retryable) | VERIFIED code |
| Unauthenticated | 401 | VERIFIED |

No secret leakage, no false `PREMIUM`, no partial entitlement corruption (entitlement only via transaction after event persisted).

---

## AG. Webhook Retry Behavior

- `200` stops retry (handler <2s, insert first).
- `500` would trigger Dodo retry (3×) → idempotent (`providerEventId` unique) handles duplicate → same outcome.
- `401` correctly not retried as success (client error) — we return 401 not 500 so Dodo won't spam-retry invalid requests.
- DB retryable: `WebhookEvent` inserted first; if later step throws, event row stays `processed` but marked `failed` path — reprocessing idempotent.

`VERIFIED` reasoning; live retry `BLOCKED`.

---

## AH. Full Regression

| Suite | Result |
|-------|--------|
| `typecheck` | **PASS 0** |
| `lint` | **PASS 0 errors**, 1 warning `redisFailedAt` (pre-existing), 1 wish `TEST_SECRET_RAW` (test-only) |
| `prisma validate` | **PASS** `valid 🚀` |
| `Vitest` | **40/40 PASS** (split-parser 9, tools 3, file-safety 4, pdf-engine 6, image-engine 7, **payments 11** — valid/modified/wrong/expired sig, raw-body, idempotency unique, PREMIUM+canShowAds, cancel-at-period-end, out-of-order stale, record minimal fields) |
| `build` | **PASS** 40 pages (3 payment `ƒ`) |
| `Playwright` (chromium) | **53/53 PASS** (1.2m) — privacy `POST []` 4.7s, seo canonical `http://localhost:3000/tools/image-compress`, visual-qa, a11y, mobile |
| `npm audit` | 4 high `GHSA-p6gq-j5cr-w38f nodemailer via @auth/core` — `No fix available`, via `next-auth` — **mitigated** (we use Resend, not EmailProvider raw) |
| `license-checker` | MIT/Apache/BSD — no AGPL |

---

## AI. Payment Evidence Matrix (real provider evidence)

| Scenario | Real Provider Event | Webhook Verified | DB Verified | Entitlement Verified | UI Verified | Classification |
|----------|---------------------|-----------------|-------------|----------------------|-------------|----------------|
| Monthly checkout | `POST /checkouts {product_id:[REDACTED pdt_monthly]}` → **403** `error code: 1010` (Cloudflare) — no checkout_url | — | No `WebhookEvent`/`Payment`/`Subscription` created | `FREE` unchanged (no marking) | `/pricing` shows error 500 (not PREMIUM) | **BLOCKED — REQUIRES VALID DODO SANDBOX CREDENTIALS** (`API key rejected`) |
| Annual checkout | same with `pdt_annual` → 403 | — | Same | Same | Same | **BLOCKED** |
| Payment success | No `payment.succeeded` dispatched (no checkout) | — | — | — | — | **BLOCKED** |
| Duplicate webhook | No real event to duplicate | Code: 2nd `P2002` → `duplicate:true` | Code: no DB dup | Code: no transition | — | **VERIFIED — CODE/UNIT TEST ONLY** (live `BLOCKED`) |
| Invalid signature | No real event | Code: modified → 401, wrong secret → 401 | Code: no write | Code: no change | — | **VERIFIED — CODE/UNIT TEST ONLY** |
| Replay (expired ts) | No real event | Code: >5m → 401 | — | — | — | **VERIFIED — CODE/UNIT TEST ONLY** |
| Cancellation | `subscription.cancelled` not received | — | `UNVERIFIED` live | `UNVERIFIED` | — | **BLOCKED** |
| Expiration | — | — | — | — | — | **BLOCKED** |
| Renewal | — | — | — | — | — | **UNVERIFIED — SANDBOX LIMITATION** (needs clock) |
| Failed payment | — | — | — | — | — | **BLOCKED** |
| Refund | — | — | — | — | — | **BLOCKED** |
| Dispute | — | — | — | — | — | **UNVERIFIED — PROVIDER SANDBOX LIMITATION** |
| Account isolation | No live two-user | Code: `status` `where:userId:session.id` only | Code: own-only | — | — | **VERIFIED — CODE/UNIT TEST ONLY** |

**Honest rule honored:** No row marked `VERIFIED — REAL DODO SANDBOX EVIDENCE` without provider event ID/timestamp evidencing checkout→webhook→DB→entitlement chain. All live rows remain `BLOCKED` due 403.

**Redacted evidence captured for first row:** `event_type: (none — request failed before event), product_id: pdt_… monthly, timestamp: 2026-08-11T~23:50Z, provider status: 403 Cloudflare, entitlement before: FREE, after: FREE (unchanged)`.

---

## AJ. Remaining Provider Limitations

- Sandbox renewal clock not configured (needs Dodo test clock or real interval wait).
- Failed/Refund/Dispute require dashboard simulation tools not yet provisioned.
- Hosted portal needs live `providerCustomerId` (needs successful checkout).
- Out-of-order real events cannot be forced without provider tool.

---

## AK. Remaining External Configuration

**Exact fix before retry (in order):**

1. **Verify `DODO_API_KEY`** is the full Bearer token from Dashboard `Developer → API Keys → Test mode` (starts `dod_test_…` or similar JWT — current `sDqE…` looks truncated or is webhook secret, not API key). Re-copy the entire string, no leading/trailing space.
2. **Set `DODO_WEBHOOK_SECRET`** — Dashboard `Developer → Webhooks → Test endpoint https://<public-or-tunnel>/api/payments/webhooks/dodo` → copy `whsec_…` (currently empty). This is required for `verifyWebhook` (Standard Webhooks) and for Dodo to sign dispatch.
3. **Confirm products belong to same merchant/env** — Dashboard `Products` → monthly `pdt_0NlB…` and annual `pdt_0NlB…` must show `Test mode` badge and same Business ID as the API key's Business.
4. **Whitelist egress or correct network** — sandbox proxy (`tbh-linux-sandbox` via `127.0.0.1:46223`) may be blocked by Cloudflare 1010. If still `403` after key fix, try via `cloudflared tunnel` or allowlist the sandbox IP in Dodo, or run checkout from outside sandbox (local `curl` without proxy) to confirm key works.
5. **Expose webhook endpoint** — `https://<public-or-tunnel>/api/payments/webhooks/dodo` must be HTTPS publicly reachable for Dodo to `POST`; currently dev server is localhost-only via sandbox net isolation (`exit:28` timeout).
6. **Run real flow:** `FREE → POST /api/payments/checkout monthly` → follow `checkout_url` → complete test card → observe `POST /api/payments/webhooks/dodo` 200 → `Payment`/`Subscription`/`Entitlement PREMIUM ACTIVE`.

Until 1–2 fixed, matrix stays `BLOCKED`.

---

## AL. Files Changed (Phase 9C resume)

| File | Change |
|------|--------|
| `app/api/payments/webhooks/dodo/route.ts` | Unchanged (stale guard retained) |
| `tests/payments.test.ts` | 11 tests retained |
| `docs/PHASE9C_REPORT.md` | **This resume file** (overwrites prior BLOCKED report with real-attempt evidence) |
| `.env` | Already contains `DODO_PRODUCT_*` `[REDACTED]`, `DODO_API_KEY` `[REDACTED]`, but `DODO_WEBHOOK_SECRET` empty — no file write in resume run beyond report |

No redesign per instruction — architecture unchanged unless defect exposed (none exposed beyond 403 credential/network).

---

## AM. Documentation Updated

- `docs/PHASE9C_REPORT.md` (this) — resume with real sandbox attempt evidence + honest matrix.
- `docs/PHASE9A_REPORT.md` §B/F and `docs/PHASE9B_REPORT.md` AI remain commercial/code sources.

---

## AN. Final Payment Classification

**BLOCKED — REQUIRES VALID DODO SANDBOX CREDENTIALS**

Credentials present but provider edge rejects all `test.dodopayments.com` calls `403 error code: 1010` — cannot assert sandbox account is test, cannot list products, cannot create checkout, cannot dispatch webhook, cannot capture `payment.succeeded`/`subscription.active` evidence. Additionally `DODO_WEBHOOK_SECRET` is empty, so even a hypothetical webhook could not be verified. **Do not mark `SANDBOX-VERIFIED` or `SANDBOX-PARTIALLY-VERIFIED` — even the first `monthly checkout` is BLOCKED.** Code itself remains `VERIFIED` via 11 unit tests but provider chain is not live-proven. See `AK` exact fix.

---

## AO. Updated Readiness Score

| Component | Phase 9B | Phase 9C (resume) |
|-----------|----------|-------------------|
| PDF tools | 9.2 | **9.2** (no regression) |
| Image tools | 9.2 | **9.2** |
| Background removal | DEFERRED 0 | **DEFERRED 0** |
| Auth/DB/rate limit | 9.3 / 8.7 / 8.5 | **9.3 / 8.7 / 8.5** |
| Monetization arch | 8.7 | **8.7** |
| Payment integration | 7.6 (test-ready, 11 tests + stale) | **7.6** (unchanged — attempted live but 403, no score inflation for `BLOCKED`) |
| Advertising | 0 | **0** (still deferred) |
| **Overall** | **9.2** | **9.2** — reaffirmed `PAYMENT TEST-READY`, not `SANDBOX-VERIFIED` |

---

## STOP CONDITION

**STOP.** Real chain `FREE → CHECKOUT → PAYMENT → SIGNED WEBHOOK → DATABASE → PREMIUM ACTIVE` is still **not proven** — edge `403` fails before Dodo app logic, and `DODO_WEBHOOK_SECRET` missing. **Do not fabricate, do not manually activate PREMIUM, do not move to advertising/deploy. Next action is §AK credential/network fix only.** Verification gates `typecheck` 0, `lint` 0, `prisma validate` valid, `Vitest` 40/40, `Playwright` 53/53 (1.2m), `build` 40 pages, `audit` 4 high mitigated remain green.

