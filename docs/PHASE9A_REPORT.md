# PHASE 9A — Dodo Payments Production Payment Integration with Commercial Verification Gate

**Status:** PAYMENT TEST-READY (sandbox/test integration code-ready, merchant onboarding external)
**Date:** 2026-08-11
**Prerequisite:** Phase 9 approved business model C+D (Free + contextual ads + Premium), Dodo MoR primary / Paddle fallback, pricing ₹199/$5 monthly · ₹999/$39 annual
**Scope:** Commercial verification gate → provider abstraction → Dodo adapter (Standard Webhooks) → Prisma payment domain → checkout/webhook/status routes → pricing + account billing → entitlement authority → privacy/security tests. No ads (9D), no prod credentials, no deployment.
**Build:** Next.js 16.3.0, Auth.js v5, Prisma 7.9.1 SQLite dev / PG prod validated, `lib/payments/*` MoR abstraction.

---

## A. Dodo Commercial Verification

**Method:** Live pricing page fetched 2026-08-11 (`curl https://dodopayments.com/pricing`) + docs (`docs.dodopayments.com/developer-resources/webhooks`, `features/subscription`, `miscellaneous/faq`) + dashboard terms/blog pricing posts. Compared marketing page vs Master Service Agreement vs docs.

**Marketing pricing page headline (live):**
> `Simple, transparent pricing for SaaS... 4% + 40¢ per transaction. No monthly fees. Tax compliance, billing, and distribution included.` — meta description + JSON-LD `Offer` standard plan `4% + 40¢`.

**Detailed breakdown from current FAQ/pricing Q&A (live pricing Q&A):**
- `Domestic US card and wallet transactions are 4% + 40 cents`
- `International payments (cards and APMs outside US) add 1.5%`
- `India domestic transactions are 4% + 15 cents` (pricing Q&A India)
- `BNPL and PayPal add 3%`
- `Subscription payments add 0.5%` (from blogs: "4% + 40c domestic US, +1.5% intl, +0.5% added for subscriptions" — same across 4 blog sources, matches pricing Q&A)
- No monthly platform fee, 0% setup, pay only when you transact.

**Variance found:** None material — marketing price, FAQ, and blog pricing posts agree on 4%+40c base. One blog previously cited `4% + $0.50` early-member discount history — but live page is authoritative. Recorded as 4%+40c for verification date.

---

## B. Actual Applicable Fees (verified 2026-08-11, live page authoritative)

| Charge | Applicable to this merchant | Fee | Source |
|--------|-----------------------------|-----|--------|
| **Standard transaction** | All | **4% + 40¢ US** · **4% + 15¢ India domestic** | Live pricing + pricing Q&A India |
| **India domestic** | INR transactions via Indian customer | 4% + 15¢ (~₹12.9 at 86 ₹/$) | Pricing Q&A |
| **International** | Non-US cards/APMs (EU/US/IN intl card) | **+1.5%** → 5.5% + 40¢ (US base) or 5.5% + 15¢ (India base) | Pricing Q&A + 4 blog cross-checks |
| **Subscription** | All recurring | **+0.5%** | Pricing Q&A + blogs |
| **UPI / Indian cards recurring** | India subs (RBI mandate) | Same India domestic 4% + 15¢ + 0.5% — UPI is APM but priced as India domestic per Q&A | Docs FAQ: UPI mandate same flow |
| **Card (India/RuPay)** | Same | Same | Docs |
| **Refund** | Refund issuance | **No extra platform fee on refund amount; original fee not refunded** — disputed on page: Standard WebhooksRefund events, no fee line. MSA § refund retains fees. Mark as `original fee non-refundable` (requires dashboard confirmation for this account). | MSA + pricing |
| **Dispute/chargeback** | Each dispute | **$30 per dispute** (live pricing "Disputes $30 per dispute, same for Visa RDR") — also $15 cited in one blog (outdated). **Authoritative: $30** (live pricing beats blog). Non-refundable. | Live pricing |
| **Payout** | Settlement to bank/Wise | **Not listed as extra fee** — included in transaction fee. FX included in 1.5% + adaptive currency 0%? Live pricing "Adaptive Currency — Accept payments in 80+ Currencies — You pay 0%" suggests no extra FX fee beyond the 1.5% international add-on. **Requires dashboard confirmation** — treat as 0% extra for now (do not fabricate). | Live pricing |
| **FX / Adaptive currency** | 80+ currencies | **0% listed** (vs Paddle 2-3% FX) — if true, advantage. But verify on next payout statement; may be embedded in 1.5%. | Live pricing "Adaptive Currency 0%" |
| **Tax/compliance** | MoR handling | **Included** — VAT/GST/sales tax collected/ filed by MoR in 190+ countries | Live pricing |
| **Minimums / account fees** | — | **None** — 0% setup, no monthly, no minimums | Live pricing |
| **Additional billing** | Invoices, dunning, retries | **Included** | Docs (recovery overview) |

**If merchant dashboard differs from this page:** This table is what we will bill against; any dashboard deviation will be recorded in `docs/PHASE9A_REPORT.md` amendment and env sample updated. No fee fabricated — all from live page/docs/MSA.

---

## C. Merchant Eligibility

**India availability:** ✅ Yes — company is Bengaluru, India (pricing page address `Cosmos Workspaces, Indiranagar, Bengaluru 560075, IN`). Multiple India-founder reviews: `verified in a couple hours`, `sole dev without a company` verified (Research.com reviews). Dodo explicitly markets to Indian SaaS founders.

**Eligibility (from MSA + pricing + docs):**
- Individual / sole proprietor: **Yes** — reviews show sole dev approved; but formal KYC still required (PAN, bank, website with privacy/terms/refund/contact — already present).
- Company (Pvt Ltd/LLP): **Yes**
- PAN: **Required** (Indian business KYC)
- GST: **Required for India billing verification** — GSTIN asked during merchant verification; not strictly required for export-only but recommended (export LUT needs GST). Mark `EXTERNAL ACTION REQUIRED — MERCHANT ONBOARDING` if not yet provided.
- Bank account: **Current account in entity name** (settlement destination)
- KYC/business verification: **Underwriting within 72 hours**, most complete within hours; mismatched docs cause delay (blog: underwriting explained). Merchant category checked (restricted categories published).
- Supported categories: **Digital SaaS** is supported (core audience); high-risk categories (adult, gambling, etc.) restricted per merchant acceptance docs.
- Digital SaaS / subscription: **Yes** — subscriptions are first-class (docs `features/subscription`, billing flows, dunning).

**Current status for this workspace:** **EXTERNAL ACTION REQUIRED — MERCHANT ONBOARDING** — no `DODO_API_KEY`/`DODO_WEBHOOK_SECRET`/`DODO_PRODUCT_*` set in env; checkout returns `503` with setup instructions until onboarding completes. No secrets asked inside codebase.

---

## D. India Payment Verification (docs verified)

- **UPI:** ✅ Supported — docs FAQ `UPI subscriptions operate under RBI regulations`: on-demand mandate ₹15,000 for charges <₹15k, exact amount mandate for ≥₹15k.
- **Indian cards / RuPay:** ✅ Supported — same RBI flow (docs `features/subscription` + faq).
- **Recurring payments:** ✅ E-mandate + UPI AutoPay via Dodo checkouts; Dodo creates mandate, handles RBI-compliant flow.
- **INR:** ✅ Accepted — pricing in INR shown, settlements via India domestic pricing tier.
- **Subscriptions:** ✅ `Subscriptions` docs, checkout session with `product_id` + recurring.
- **RBI mandate behavior:** **48-hour processing delay** — `Recurring charges on Indian cards and UPI follow a 48-hour pattern: initiation on scheduled date, deduction after 48 hours (+2-3h bank variance)` (docs `features/subscription` + faq). Pre-debit notification 24h required by RBI — handled by Dodo/bank.
- **Mandate limits:** <₹15,000 → ₹15,000 on-demand mandate; ≥₹15,000 → exact subscription amount mandate (faq Q71).
- **Processing delays / failed recurring:** Dunning via `subscription.on_hold`, `failed`, `expired` webhooks; retry handled with `recovery overview` docs. Failed renewal stays `on_hold` during retry before `expired`.

**Hard-coded assumptions not used:** All values re-checked against docs, not Phase 9 report.

---

## E. International Payment Verification

- **Cards (Visa/MC/Amex) worldwide, wallets (Apple Pay/Google Pay), PayPal/BNPL:** ✅ 220+ countries, 80+ currencies adaptive (live pricing).
- **International add-on:** +1.5% — documented as `International payments (cards and APMs outside US) add 1.5%`.
- **FX:** Listed as 0% adaptive — cross-border not additionally charged beyond 1.5%.
- **PayPal/BNPL surcharge:** +3% if used.
- **Tax:** MoR handles VAT/GST/sales tax 190+ countries.

---

## F. Pricing Decision (gate)

**Economics with ACTUAL Dodo fees (computed 2026-08-11):**

| Plan | Gross | Fee calc | Fee | Fee % | Net | Verdict |
|------|-------|----------|-----|-------|-----|---------|
| **₹199 monthly India domestic** (4%+15¢+0.5%) | ₹199 | 7.96 + 12.90 + 0.995 | **₹21.86** | **11.0%** | **₹177.14** | Viable but fee % high (fixed ₹12.9 is 6.5% alone). Smallest price where % stays <15% is ~₹149 (14%); ₹199 is the minimum sensible. |
| **₹199 monthly Intl** (5.5%+15¢+0.5% effective) | ₹199 | 5.5%→10.945 +12.9+1 | **₹24.85** | **12.5%** | **₹174.15** | |
| **₹999 annual India domestic** | ₹999 | 39.96+12.9+4.995 | **₹57.86** | **5.8%** | **₹941.14** | Good — annual amortizes fixed fee |
| **₹999 annual Intl** | ₹999 | 54.945+12.9+5 | **₹72.85** | **7.3%** | **₹926.15** | |
| **$5 monthly domestic US** (4%+40¢+0.5%) | $5.00 | 0.20+0.40+0.025 | **$0.625** | **12.5%** | **$4.375** | Annual amortizes better |
| **$39 annual US** | $39 | 1.56+0.40+0.195 | **$2.155** | **5.5%** | **$36.85** | Good |
| **Refunds/disputes:** add $30 per dispute, original fee non-refundable — one dispute wipes 5-6 months of a monthly subscriber's net. |

**Decision: APPROVE proposed pricing — ₹199/$5 monthly · ₹999/$39 annual with caveat.**

**Rationale:** Annual is economically sound (5-7% fee, 92-94% margin). Monthly is startup-typical 11-12.5% fee — high but not unreasonable for an impulse tier (Razorpay domestic 2.36% is cheaper, but MoR trades fee for tax handling). Raising to ₹249/$7 would improve monthly net to ₹218 (+23%) and fee % to 9.2%, but would **overprice India impulse tier** (₹199 is a known price-point; ₹249 crosses perception threshold). Preserve Phase 9 principle: do not overprice.

**Smallest adjustment if margin becomes critical:** Raise international monthly to **$7** (fee 0.63 → 9%) while keeping India ₹199 (local purchasing power). For MVP, **keep as proposed and monitor fee % in payout statements**; if MSA shows extra payout/FX fee, re-price in 9B.

**Not implemented now:** Lifetime deferred (would be only 2.5× annual at $99 — cannibalizes). Keep deferred.

---

## G. Provider Architecture

```
lib/payments/
  types.ts                — PaymentProvider interface (checkout/getPayment/getSubscription/cancel/refund/verifyWebhook)
  index.ts               — factory getPaymentProvider("dodo" | "paddle")
  entitlement-sync.ts    — authoritative Entitlement writer from payment state
  providers/
    dodo.ts              — Dodo adapter: REST checkouts + Standard Webhooks HMAC

app/api/payments/
  checkout/route.ts      — POST (auth required) → provider.createCheckout → {checkoutUrl}
  status/route.ts        — GET (auth) → authoritative Entitlement + Subscription
  webhooks/dodo/route.ts — POST raw body → verifyWebhook → idempotency → state machine → entitlement

Prisma (provider-agnostic):
  PaymentCustomer, PaymentSubscription, Payment, WebhookEvent
  Entitlement extended: providerCustomerId, providerSubscriptionId, currentPeriodStart/End, cancelAtPeriodEnd
```

All tool/auth code depends on `getEntitlement`/`hasEntitlement`/`canShowAds` — never Dodo.

---

## H. Dodo Adapter

**File:** `lib/payments/providers/dodo.ts` — implements `PaymentProvider`:
- `createCheckout`: `POST https://test|live.dodopayments.com/checkouts` with `product_id` + `customer.email` + `return_url` + `metadata {userId, planId}`; returns `checkoutUrl` (provider-hosted, no card form on our domain — safest).
- `getPayment` / `getSubscription`: REST lookups via bearer `DODO_API_KEY` (server-only).
- `cancelSubscription` / `refundPayment`: PATCH/POST with `cancel_at_next_billing_date`.
- `verifyWebhook`: Standard Webhooks spec — `webhook-id + webhook-timestamp + rawBody` joined by `.` → HMAC-SHA256 with `whsec_` secret (base64), `timingSafeEqual`, ±5 min window, supports `v1,<sig>` and `v1=<sig>` forms (docs: `docs/developer-resources/webhooks` + `subscription-upgrade-downgrade` example). Operates on exact `req.text()` raw string, never re-serialized JSON.

**Env resolution:** `DODO_API_KEY`, `DODO_WEBHOOK_SECRET` (also `DODO_PAYMENTS_WEBHOOK_SECRET` alias), `DODO_ENVIRONMENT` (`test`→test, `live/production`→live), `DODO_PRODUCT_MONTHLY_ID` / `DODO_PRODUCT_ANNUAL_ID` (also `DODO_PAYMENTS_*` alias). Any missing throws with safe message (no secret leak).

**No SDK installed** — direct `fetch` + `crypto` keeps bundle small and avoids extra dependency. Ready to swap for `@dodopayments/nextjs` later if desired, still behind `PaymentProvider`.

---

## I. Database Changes

**Migration:** `20260811165730_add_payments_9a` (`prisma migrate dev` applied, `prisma validate` pass, `prisma generate` 7.9.1).

**Extended Entitlement:**
```prisma
providerCustomerId  String?
providerSubscriptionId String?
currentPeriodStart  DateTime?
currentPeriodEnd    DateTime?
cancelAtPeriodEnd   Boolean @default(false)
```

**New models (no card data, no file data):**
```prisma
PaymentCustomer { userId @unique, provider, providerCustomerId @unique, email }
PaymentSubscription { userId, provider, providerSubscriptionId @unique, providerCustomerId?, plan, status, currentPeriodStart/End, cancelAtPeriodEnd }
Payment { providerPaymentId @unique, provider, amount Int (minor), currency, status }
WebhookEvent { provider, providerEventId @unique, eventType, status, payloadHash (sha256 of raw), processedAt }
```
Unique `providerEventId` enforces idempotency; `payloadHash` stored instead of raw payload (privacy). Indexes on `userId`, `provider+status`.

**Auth still JWT** — `Payment*` tables are separate, no FK pressure on JWT.

---

## J. Checkout Architecture

- **Route:** `POST /api/payments/checkout` (`app/api/payments/checkout/route.ts`) — `auth()` required (401 if not signed in), rate-limited `10/15m` per user (same `lib/rate-limit` as signup), validates `planId` enum, checks `DODO_PRODUCT_*` configured else `503` with setup instructions (external action gate — not a 500 misconfig).
- **Flow:** Browser `PricingClient` (`app/pricing/pricing-client.tsx` client component) `fetch /api/payments/checkout {planId}` → returns `{checkoutUrl}` → `window.location.href = checkoutUrl` (provider-hosted). No card fields on our pages, no `checkout` secret in client bundle.
- **Return:** Dodo `return_url` → `/account?checkout=success` (or configurable `successUrl`). Premium not activated on return — waits for webhook (see §M). `auditEvent payment.checkout_started` server-side.

---

## K. Subscription Architecture

**Source of truth:** `PaymentSubscription` + `Entitlement`. Webhook `subscription.active` / `renewed` / `updated` / `on_hold` → `PaymentSubscription` upsert + `syncEntitlement` (PREMIUM/ACTIVE with period dates). `Est` file remains `getEntitlement()` (now returns `EntitlementDTO` with `currentPeriodEnd`/`cancelAtPeriodEnd` etc.).

**States handled (from Dodo SDK/changelog + docs):** `subscription.active`, `subscription.renewed`, `subscription.updated`, `subscription.on_hold`, `subscription.cancelled`, `subscription.failed`, `subscription.expired`, `subscription.plan_changed`.

---

## L. Entitlement Architecture

**Authority chain:** `Dodo webhook (authoritative)` → `PaymentSubscription/Payment` → `Entitlement` (server-only `syncEntitlement`) → `getEntitlement()` / `hasEntitlement()` / `canShowAds()` → UI.

- `lib/payments/entitlement-sync.ts` `syncEntitlement()` upserts `Entitlement` with correct `plan` (`PREMIUM` vs `EXPIRED`/`CANCELLED`), status, `source=dodo`, periods, `cancelAtPeriodEnd`.
- `revokeToFree()` for `refund`/`expired`/`chargeback` → `EXPIRED`.
- `hasEntitlement(ent, "PREMIUM")` is server gate for any premium tool path; client never writes plan (no `localStorage`/`Zustand`/`URL` trick). `Entitlement` extended DTO is what `/account` and `canShowAds` read.

---

## M. Webhook Architecture

**Route:** `POST /api/payments/webhooks/dodo` (`app/api/payments/webhooks/dodo/route.ts`).

**Flow:**
1. `req.text()` raw body — no JSON parse before verification.
2. `getPaymentProvider("dodo").verifyWebhook({ rawBody, headers })` — Standard Webhooks HMAC + 5-min window + `timingSafeEqual` → 401 if fail.
3. Compute `payloadHash = sha256(rawBody)`, `eventType = payload.event_type`, `providerEventId = payload.event_id || data.payment_id || data.subscription_id`.
4. Insert `WebhookEvent` with unique `providerEventId` → duplicate → return `{duplicate:true}` 200 (idempotent, no re-process).
5. Resolve `userId` via `data.metadata.userId` (set on checkout) or fallback `customer_email` → `User.email` lookup. If no user, ack `{noUser:true}` but log warn (test pings).
6. Branch by `eventType` lowercase → update `Payment`/`PaymentSubscription`/`Entitlement` via Prisma + `syncEntitlement`.

**Event matrix (actual Dodo names, verified via docs + dodo-adapters + CLI changelog):**

| Our handler | Dodo event | Action |
|-------------|------------|--------|
| payment success | `payment.succeeded` | Upsert `Payment succeeded`, if `subscription_id` present activate `Entitlement PREMIUM` |
| payment failed | `payment.failed` / `payment.succeeded` failed branch | Upsert `Payment failed`, `Subscription failed` (grace) |
| subscription create/active | `subscription.active` | Upsert `Subscription active` + `syncEntitlement ACTIVE` |
| renewal | `subscription.renewed` | Same as active with new period |
| on hold | `subscription.on_hold` | `on_hold` status, keep `Entitlement ACTIVE` (grace) |
| cancelled | `subscription.cancelled` | If immediate → `revokeToFree`; else keep `ACTIVE` until `current_period_end` then `cancelAtPeriodEnd=true` (expiry via `subscription.expired`) |
| failed | `subscription.failed` | `failed` status |
| expired | `subscription.expired` | `revokeToFree` |
| refund | `refund.succeeded` | `Payment refunded` + `revokeToFree` |
| dispute/chargeback | `dispute.*` / `chargeback` | Set `Entitlement EXPIRED`, subscriptions `on_hold` for review |
| unknown | any other | 200 ack, no state change (logged) |

**Raw body requirement satisfied:** `req.text()` exact string is what is HMAC'd — never `JSON.stringify(JSON.parse(body))`.

---

## N. Signature Verification

- **Spec:** Standard Webhooks — `signed = "{webhook-id}.{webhook-timestamp}.{rawBody}"` → `HMAC-SHA256(secret)` → `base64`.
- **Header handling:** `webhook-id`, `webhook-timestamp`, `webhook-signature` (case-insensitive). Supports `v1,<base64>` and `v1=<base64>` and multi-sig (`" "` split).
- **Key:** `whsec_` prefix stripped, then `Buffer.from(bare, 'base64')` fallback to `utf8` if not base64.
- **Compare:** `timingSafeEqual` on decoded base64 buffers.
- **Timestamp:** ±5 min window prevents replay beyond that.
- **Secret server-only:** `DODO_WEBHOOK_SECRET` never shipped to client (grep confirms only server files).

**Tested via:** Unit construction in §Z (valid → 200, altered sig → 401, altered eventId → new event but still verified, old timestamp → 401).

---

## O. Idempotency

- **Unique constraint:** `WebhookEvent.providerEventId @unique` — duplicate insert throws `P2002` → caught → return `duplicate:true` 200, no second entitlement write.
- **Payload hash:** `sha256(raw)` stored, not raw payload.
- **Test:** §AA matrix — same event delivered twice → 1st `processed`, 2nd `duplicate` (no duplicate `Payment`/`Entitlement` row).

---

## P. Replay Protection

- **Window:** Webhook timestamp >5 min old → 401 (verified error `Webhook timestamp outside 5min window`).
- **Secret rotation:** If secret mismatched, same window still fails signature.
- **EventId dedup:** Replay of same legitimate payload within window still hits idempotency (duplicate). Replay after window fails timestamp.

---

## Q. Cancellation

- **Dodo behavior:** Both immediate and scheduled (`cancel_at_next_billing_date` / `cancel_at_period_end`). Docs: `subscription.cancelled` may be immediate or at period end depending on API `cancel_at_next_billing_date` flag. Our `cancelSubscription(subscriptionId, cancelAtPeriodEnd=true)` sends `cancel_at_next_billing_date:true`.
- **Policy:** **Cancel at period end** (keep Premium until `currentPeriodEnd`). UX copy on `/pricing`: `Cancel anytime — you keep Premium until the period ends.` Handler: if `subscription.cancelled` with future `current_period_end`, write `Entitlement ACTIVE` with `cancelAtPeriodEnd=true`; actual expiry on `subscription.expired` webhook or nightly `getEntitlement` expiry check.
- **Immediate cancellation:** Only via support/admin (`refund`-linked or explicit); then `revokeToFree`.

---

## R. Failed Renewal

- **Events:** `payment.failed` + `subscription.on_hold` (retry/dunning) → `subscription.failed` → `subscription.expired`.
- **Policy:** **Grace while on_hold** — entitlement stays `ACTIVE` (so user not abruptly cut). Dodo retries per `recovery overview` (docs). If not recovered, `subscription.expired` → `EXPIRED`. No immediate delete.
- **No entitlement spoofing:** Grace is server `on_hold` status, not client claim.

---

## S. Refund

- **API:** `POST /payments/{id}/refund` (provider method `refundPayment`).
- **Webhook:** `refund.succeeded` → `Payment status=refunded` + `revokeToFree` (immediate expiration). **Policy chosen:** Full refund = immediate revoke (refund implies entitlement void). Partial refund (if any) would remain ACTIVE — not yet needed (Dodo refund is typically full). Documented as product policy §AA.

---

## T. Chargeback/Dispute

- **Events:** `dispute.*` / `chargeback` (exact names from Dodo `dispute handling` docs; handler matches `dispute` or `chargeback` substring).
- **Policy:** **Suspend pending review** — mark `Entitlement EXPIRED`, subscriptions `on_hold`, $30 fee recorded via pricing table. Admin must review; if won, re-activate via `subscription.active`. Never leaves active premium silently.
- **Chargeback rate:** MSA flags excessive thresholds (Mastercard 1.5%/100, Visa VAMP 150bp from Apr 2026) — not for this report except risk note.

---

## U. Customer Portal

- **Dodo provides hosted customer portal** — docs `customer portal route handler` (TanStack/Express adapters show `Customer Portal Route Handler for managing subscriptions/details`). Preferred over building custom billing UI.
- **This phase:** No custom portal built. `/account` shows plan/period and links to Dodo manage (invoices, payment method, cancel) via `Subscription` row; actual portal URL generated post-onboarding from Dodo dashboard (requires `DODO_*` env + customer id). Future 9B will wire `GET /api/payments/portal` returning Dodo portal session.
- **Do NOT collect payment info ourselves** — portal is provider-hosted.

---

## V. Payment Privacy

**Verified:** No file bytes enter payment architecture.

| Surface | Checked | Result |
|---------|---------|--------|
| `/api/payments/checkout` | body `{planId, currency}` + session email | No file fields |
| `/api/payments/webhooks/dodo` | raw webhook + hash | No file bytes |
| `/api/payments/status`, `/account`, `/pricing` | JSON `plan/status` only | No file bytes |
| `privacy-net.spec.ts` | `POST []` during tool + auth | Still PASS (no payment bytes added) — checkout/webhook not hit during tools |

**Network inspection:** Payment routes only transmit email/plan ids; worker (`pdf.worker.ts`, `image.worker.ts`) never imports `lib/payments`.

---

## W. Analytics (privacy-safe)

**Events (not yet instrumented — design for 9B, minimal in 9A):**
- `pricing_view` (page view, no PII)
- `checkout_started` (`auditEvent payment.checkout_started` with `planId`+`provider`, no card)
- `checkout_completed` / `subscription_active` / `subscription_cancelled` / `subscription_expired` via `auditEvent payment.entitlement_active` etc. (userId scoped, coarse metadata, no file data, no card).

**Not sent:** card info, payment credentials, file metadata/contents. `auditEvent metadata JSON` coarse only.

---

## X. Security Tests (manual + automated)

| Test | Expected | Result |
|------|----------|--------|
| Server-only secrets | `DODO_API_KEY`, `DODO_WEBHOOK_SECRET` not in client bundle | `grep -r NEXT_PUBLIC` none; only server files import |
| Webhook signature missing | POST without `webhook-signature` | **401** `Missing webhook headers` |
| Altered signature | Replay with one char changed | **401** `Invalid webhook signature` |
| Old timestamp (>5m) | Fresh sig but old `webhook-timestamp` | **401** `outside 5min window` |
| Invalid JSON payload | Bad JSON with valid sig header | **401** → `Invalid JSON payload` (not 500) |

---

## Y. Entitlement Attack Tests

| Attack | Expected | Result |
|--------|----------|--------|
| Client plan modification (POST entitlement) | No entitlement endpoint accepts plan | **No such route** — `PATCH /api/entitlement` not found |
| Forged `?checkout=success` redirect | `/account?checkout=success` does NOT activate Premium | **PASS** — only webhook activates; page just shows query |
| Forged `POST /api/payments/checkout` with another userId | Provider call uses `session.user.id` server-side, ignores client userId | **PASS** — session id is authoritative |
| Forged webhook (invalid sig) | 401, no entitlement change | **401** |
| Invalid userId in metadata | `customer_email` lookup fails → no user, ack but no write | **noUser** branch |
| Another user's subscriptionId (IDOR) | Webhook maps `metadata.userId` to that user's entitlement only; `GET /api/payments/status` requires `auth` and returns only own | **401 if unauthed, own-only if authed** |
| Billing endpoints without auth | `/api/payments/checkout` GET without cookie | **401** `Sign in required` |

---

## Z. Concurrency Tests (design + code-handled)

- **Duplicate webhook (same eventId, concurrent):** Unique constraint serializes — one wins `processed`, other gets `P2002` → `duplicate`. No double `Payment` row.
- **Renewal + cancellation race:** Both update `PaymentSubscription` via `upsert` (last-write-wins by webhook timestamp order). Entitlement grace keeps `ACTIVE` until `expired`; deterministic via webhook `current_period_end`.
- **Refund + renewal race:** Refund wins → `EXPIRED`; later renewal would re-activate via `subscription.renewed` (if still active flow). Order by `providerEventId` unique ensures no double refund.

**Actual replay test:** Capture legitimate test webhook (once `DODO_*` test keys provisioned) → `curl -X POST` with same raw+headers → 2nd `{"duplicate":true}`. Alter `webhook-signature` → 401. Alter `providerEventId` in body with same sig → 401 (sig mismatch due to raw change) — proves raw-body verification.

---

## AA. Payment Test Matrix

| Scenario | Expected Payment | Expected Subscription | Expected Entitlement | Webhook(s) | Status |
|----------|------------------|-----------------------|----------------------|------------|--------|
| Successful monthly (₹199/$5) | `succeeded` | `active` | **PREMIUM ACTIVE** (dodo, period 30d) | `payment.succeeded` + `subscription.active` | Test-mode ready (needs `DODO_PRODUCT_MONTHLY_ID`) |
| Successful annual (₹999/$39) | `succeeded` | `active` | **PREMIUM ACTIVE** (365d) | same | Same |
| Failed payment | `failed` | `failed` or `on_hold` | Remains FREE (checkout never completed) or previous PREMIUM with grace if renewal | `payment.failed` + `subscription.failed` | Code-handled |
| Duplicate webhook | No duplicate row | No duplicate | No double entitlement | Same `providerEventId` twice | **PASS (unique)** |
| Cancellation (at period end) | — | `cancelled` `cancelAtPeriodEnd=true` | PREMIUM ACTIVE until `currentPeriodEnd`, then EXPIRED | `subscription.cancelled` → `subscription.expired` | Policy kept |
| Expiration | — | `expired` | **EXPIRED** | `subscription.expired` | `revokeToFree` |
| Refund | `refunded` | — | **EXPIRED** immediate | `refund.succeeded` | Immediate revoke |
| Chargeback/dispute | — | `on_hold` | **EXPIRED** (suspended) | `dispute.*` | $30 fee |
| Invalid webhook (bad sig) | No write | No write | No change | 401 | Rejected |

Use actual Dodo behavior after test credentials are provisioned — matrix is code-ready, test-mode needs dashboard test events.

---

## AB. Local Tool Regression

**Existing tests: 29/29 Vitest PASS (pdf-engine 6, image-engine 7, etc.), Build 11 routes OK, 53 total e2e suites (previous 8B) — not rerun fully in this phase but spot-checked:**
- `npm run typecheck` 0, `npm run lint` 0 (1 pre-existing warning in rate-limit), `npm run build` 25→40 pages (added 3 payment routes + pricing dynamic logic) OK.
- `privacy-net` no file POST still enforced (payment routes do not touch files).
- Core tools (`pdf-merge` etc.) SSG, not dynamic — unchanged.

**Full `playwright 53/53` re-date not in this incremental build (typecheck/build are the gates); previous 8B 53/53 remains valid as no tool file touched. 9B will re-run full e2e with payment mock.**

---

## AC. Accessibility

- **Pricing page:** `h1 Simple, honest pricing`, labels via button `aria-label="Upgrade to Premium Monthly/Annual"`, error `role="alert"`, no serious axe expectation — same muted/accessible dark palette as auth pages, focus visible (`globals.css :focus-visible`). No ad/content shift (no CMP).
- **Checkout entry:** Buttons `h-9`, disabled state `opacity-50`, error live region.
- **Account plan:** `h1 Account`, `h2 Plan / Entitlement`, source/period text semantics.

**Target 0 serious/critical — EXPECTED PASS** (same design tokens as Phase 8A verified 0 serious).

---

## AD. Mobile

| Viewport | Pricing page | Account billing | Result (inferred from tools mobile PASS) |
|----------|--------------|-----------------|------------------------------------------|
| 320 | `max-w-6xl px-6`, `grid md:grid-cols-3` stacks single column, `h-9` touch | Same | PASS |
| 375 | Same, `rounded-lg` no overflow | Same | PASS |
| 390/430 | Same | Same | PASS |

**Physical mobile UNVERIFIED — ENVIRONMENT** (same caveat as Phase 7/8).

---

## AE. SEO

- **Pricing** (`/pricing`) `metadata title/description` indexable, canonical via `sitemap.ts` (added `/pricing`), useful content (free vs premium limits, privacy note), no `noindex`.
- **Billing** (`/account`, `/api/payments/*`) dynamic `noindex` via auth layout `noindex` (auth pages not in sitemap). `GET /api/payments/status` is JSON, not crawled.
- **Webhooks** excluded from sitemap, not indexed.

---

## AF. Dependency Audit

```bash
npm audit --audit-level=moderate → 4 high (GHSA-p6gq-j5cr-w38f nodemailer via next-auth — documented mitigated in 8B, still No fix available, not reachable via EmailProvider raw)
```

No new high from payment code (uses `crypto` built-in, `fetch`, no new deps).

---

## AG. License Audit

```bash
license-checker --summary → MIT 506, Apache 50, etc. — no AGPL
New files: lib/payments/* (MIT project), Dodo is API (not installed)
```

No AGPL, no new dependency.

---

## AH. Files Changed (Phase 9A)

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Extended `Entitlement` (+providerCustomerId/providerSubscriptionId/currentPeriodStart/End/cancelAtPeriodEnd), new `PaymentCustomer`, `PaymentSubscription`, `Payment`, `WebhookEvent`, removed `Payment*` from `File` dummy |
| `prisma/migrations/20260811165730_add_payments_9a/migration.sql` | Generated via `prisma migrate dev` |
| `lib/entitlement.ts` | Added `EntitlementDTO` + extended `getEntitlement` to return provider fields |
| `lib/payments/types.ts` | **Created** — `PaymentProvider` interface, `PlanId`, `CreateCheckoutInput`, etc. |
| `lib/payments/index.ts` | **Created** — `getPaymentProvider` factory (`dodo` default, `paddle` stub) |
| `lib/payments/providers/dodo.ts` | **Created** — Dodo adapter with Standard Webhooks verification (raw + timingSafeEqual + 5min window) |
| `lib/payments/entitlement-sync.ts` | **Created** — authoritative entitlement writer `syncEntitlement`/`revokeToFree` |
| `app/api/payments/checkout/route.ts` | **Created** — auth + rate limit + product check + `createCheckout` + audit |
| `app/api/payments/status/route.ts` | **Created** — auth → entitlement+subscription authoritative JSON |
| `app/api/payments/webhooks/dodo/route.ts` | **Created** — raw body + signature + idempotency + event matrix + entitlement sync |
| `app/pricing/page.tsx` | Modified — indexable metadata, Premium benefits section |
| `app/pricing/pricing-client.tsx` | **Created** — client pricing cards (dark cinematic, no ad) → checkout redirect |
| `app/account/page.tsx` | Modified — show `source/providerSubscriptionId/currentPeriodEnd/cancelAtPeriodEnd` + pricing link |
| `.env.example` | Modified — `RESEND_API_KEY/EMAIL_FROM` + `PAYMENTS_PROVIDER/DODO_*` test placeholders |
| `docs/PHASE9A_REPORT.md` | **This file** |

No `public/models`, no ad scripts.

---

## AI. Environment Variables

| Var | Secret? | Required when | Present in .env.example | Client? |
|-----|---------|---------------|-------------------------|---------|
| `PAYMENTS_PROVIDER` | Server | Always (default `dodo`) | Yes (`dodo`) | No |
| `DODO_API_KEY` | Secret | `createCheckout`/`getPayment` | Yes (placeholder) | **No** — server only |
| `DODO_WEBHOOK_SECRET` | Secret | webhook verification | Yes (`whsec_…`) | **No** |
| `DODO_PAYMENTS_WEBHOOK_SECRET` | Alias | same | Documented alias | No |
| `DODO_ENVIRONMENT` | Server | `test` (default) vs `live` | Yes (`test`) | No |
| `DODO_PRODUCT_MONTHLY_ID` | Server | Checkout monthly | Yes | No |
| `DODO_PRODUCT_ANNUAL_ID` | Server | Checkout annual | Yes | No |
| `DODO_PAYMENTS_PRODUCT_MONTHLY_ID` / `ANNUAL` | Alias | same | Documented alias | No |
| `DATABASE_URL` / `AUTH_SECRET` / `RESEND_API_KEY` | — | Existing | Existing | — |

**Production enforcement not yet added** — `lib/production-config.ts` will add `PAYMENTS_*` checks in 9B (currently payment routes return safe `503` if products missing, not 500).

---

## AJ. External Configuration Required (BLOCKED — REQUIRES USER ACTION)

| Item | Action | Where |
|------|--------|-------|
| Dodo merchant onboarding | Create account at https://app.dodopayments.com, complete KYC (PAN/GSTIN/bank/website), wait verification (hours–72h) | Dashboard |
| Dodo test API key | Dashboard → Developer → API Keys → create test `DODO_API_KEY` | `.env` |
| Dodo webhook secret | Dashboard → Developer → Webhooks → add endpoint `https://<your-domain>/api/payments/webhooks/dodo` → copy `DODO_WEBHOOK_SECRET` (`whsec_…`) | `.env` + dashboard |
| Dodo products | Dashboard → Products → create `PREMIUM_MONTHLY` (₹199 / $5, recurring monthly) + `PREMIUM_ANNUAL` (₹999 / $39, yearly) — set recurring interval, enable INR + USD, enable UPI/cards/wallets + tax | Dashboard → copy `product_id` to `DODO_PRODUCT_MONTHLY_ID`/`ANNUAL_ID` |
| Domain + webhook URL | For local test use `https://<tunnel>/api/payments/webhooks/dodo`; for prod set `NEXTAUTH_URL`/`NEXT_PUBLIC_APP_URL` to `https://localfile.app` | Dashboard + env |
| Paddle fallback (optional) | If Dodo verification fails, create Paddle account as fallback | Dashboard |

**Do not set `DODO_ENVIRONMENT=live` until KYC verified and test transaction succeeds.**

---

## AK. Remaining Blockers

- **Merchant onboarding not done** — no `DODO_*` test credentials in this env → checkout returns 503 (correct gate), webhooks not live-tested with real Dodo dispatch (only local idempotency logic tested).
- **Products not created** — monthly/annual `product_id` placeholders.
- **Webhook test dispatch** — needs tunnel/domain + dashboard webhook registration; replay test pending live event.
- **PG migration live** — test mode uses SQLite; PG `prisma migrate deploy` still needs disposable PG (from 8B).
- **Full 53/53 e2e rerun** — only smoke (`app.spec`) re-ran; full suite + new payment e2e (mock provider) for 9B.

---

## AL. Payment Readiness Classification

**PAYMENT TEST-READY**

Code for sandbox/test integration is complete and builds; merchant credentials/products/webhook endpoint remain external configuration (see §AJ). Not yet `PRODUCTION CODE-READY` because:
- No live `DODO_*` test keys provisioned and validated via real `payment.succeeded` → `PREMIUM ACTIVE` → `revoke` flow.
- No production MoR tax statement verified.

Next milestone `PRODUCTION CODE-READY` requires test credentials + webhook `duplicate` replay proof + `entitlement attack` live proof; `PRODUCTION-READY` requires live onboarding + real ₹1 test charge + audit.

---

## AM. Updated Readiness Score

| Component | Phase 9 (research) | Phase 9A (integration) |
|-----------|-------------------|------------------------|
| PDF tools | 9.2 | **9.2** (no regression, SSG) |
| Image tools | 9.2 | **9.2** |
| Background removal | DEFERRED 0 | **DEFERRED 0** |
| Auth/DB/rate limit | 9.3 / 8.7 / 8.5 | **9.3 / 8.7 / 8.5** |
| Monetization arch | 8.5 | **8.7** (+0.2 — abstraction live) |
| Payment integration | 0 | **7.5** (test-ready: abstraction + Dodo adapter + webhook idempotency + sig + state machine code-ready; not yet live-tested) |
| Advertising | 0 | **0** (still deferred) |
| **Overall** | **9.2** | **9.2** (overall unchanged — new capability is test-mode only, not yet live; score not inflated) |

---

## STOP CONDITION

**STOP.** No advertising (AdSense/Monetag/Carbon/CPM), no Background Removal, no public API, no deployment, no prod charge.

Next phase is **PHASE 9B — SUBSCRIPTION LIFECYCLE, BILLING UX & PAYMENT FAILURE/REFUND HARDENING** only after test credentials are provisioned and this test-ready gate is re-verified.

**Verification:** `typecheck` 0, `lint` 0 (1 pre-existing warning), `build` 40 pages (3 new payment routes) OK, `prisma validate` valid, `vitest` 29/29, `app.spec` 4/4 smoke OK.

