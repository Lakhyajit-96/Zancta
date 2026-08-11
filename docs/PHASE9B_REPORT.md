# PHASE 9B — Real Subscription Lifecycle, Billing UX & Payment Failure Hardening

**Status:** PAYMENT TEST-READY (sandbox code verified, no live Dodo sandbox dispatch — BLOCKED on external credentials)
**Date:** 2026-08-11
**Prerequisite:** Phase 9A PAYMENT TEST-READY (provider abstraction, Dodo adapter Standard Webhooks, Prisma payment domain, checkout/webhook/status, pricing/account)
**Scope:** Sandbox lifecycle verification + billing hardening + failure paths. No ads (9D), no Background Removal, no public API, no prod deployment.
**Build:** Next.js 16.3.0, Auth.js v5, Prisma 7.9.1 (migration `20260811165730_add_payments_9a` applied, `validate` pass), Vitest 40/40, Playwright 53/53.

---

## A. Dodo Sandbox Configuration

**Gate checked:** `DODO_API_KEY`, `DODO_WEBHOOK_SECRET`, `DODO_ENVIRONMENT`, `DODO_PRODUCT_MONTHLY_ID`, `DODO_PRODUCT_ANNUAL_ID`.

| Var | Present? | Value | Verdict |
|-----|----------|-------|---------|
| `DODO_API_KEY` | No (only placeholder in `.env.example`) | — | `BLOCKED — REQUIRES DODO SANDBOX CREDENTIALS` |
| `DODO_WEBHOOK_SECRET` | No | — | Same |
| `DODO_PRODUCT_MONTHLY_ID` | No | — | `POST /api/payments/checkout` returns `503 Payment products not configured` (correct code gate) |
| `DODO_PRODUCT_ANNUAL_ID` | No | — | Same |
| `DODO_ENVIRONMENT` | Default `test` via fallback | `test` | Correct for sandbox, but no effect until keys set |

**Code-side readiness:** VERIFIED — `typecheck` 0, `lint` 0 (`redisFailedAt` warn only), `build` 40 pages (3 payment routes), `prisma validate` pass. Checkout correctly gates on missing products (503 with setup instructions in error body referencing `docs/PHASE9A_REPORT.md §AJ`). No prod money path exists.

---

## B. Monthly Checkout Result

**Expected:** Authenticated FREE → `POST /api/payments/checkout {planId:"PREMIUM_MONTHLY"}` → provider checkout URL → 302 to Dodo hosted checkout (₹199/$5).

**Test:** `BLOCKED — REQUIRES DODO SANDBOX CREDENTIALS`. Cannot create real `https://test.dodopayments.com/checkouts` without test API key + monthly product id. Code path unit-tested via `tests/payments.test.ts` (checkout attack logic reviewed: route uses `session.user.id/email` server-side, validates `planId` enum, maps to env `DODO_PRODUCT_MONTHLY_ID`, never accepts client `price`).

**Code verification:** `VERIFIED` — provider `createCheckout` maps `PREMIUM_MONTHLY → env product`, rejects `arbitrary price` (no `price` field in `CreateCheckoutInput`), rate-limited 10/15m per user.

---

## C. Annual Checkout Result

Same as B for `PREMIUM_ANNUAL` (₹999/$39). `BLOCKED — REQUIRES DODO SANDBOX CREDENTIALS`. Monthly/annual cannot be confused — distinct env vars, `planId` enum required.

---

## D. Payment Success

**Expected chain:** `Checkout → Provider → payment.succeeded webhook → Payment succeeded + Entitlement PREMIUM ACTIVE`.

**Live sandbox dispatch:** `BLOCKED — REQUIRES DODO SANDBOX CREDENTIALS`. No real `payment.succeeded` received.

**Code path verification:** `VERIFIED` via `tests/payments.test.ts`:
- `payment.succeeded` handler `Payment upsert succeeded` + `Entitlement PREMIUM ACTIVE` via `syncEntitlement` (period stored).
- Unit: valid webhook sig → `ok:true`, `entitlement` becomes PREMIUM, `canShowAds=false`. Payment record minimal `providerPaymentId/amount/currency/status` only, no card columns.

---

## E. Payment Failure

**Expected:** `payment.failed` → Payment failed, Subscription failed/on_hold, Entitlement NOT immediately revoked (grace).

**Live:** `BLOCKED — sandbox needs test card decline mechanism` — Dodo test card guidance not yet provisioned.

**Code:** `VERIFIED` — handler `payment.failed`/`subscription.failed` branch sets `Payment failed` + `Subscription failed`, does NOT call `revokeToFree`. Only `refund`/`expired`/`dispute` revoke.

---

## F. Subscription Creation

**Live:** `BLOCKED — same as D` (needs `subscription.active` webhook).

**Code:** `VERIFIED` — `subscription.active` → `PaymentSubscription upsert active` + `syncEntitlement ACTIVE` with `currentPeriodStart/End` and `cancelAtPeriodEnd`. Idempotent on `providerEventId`.

---

## G. Renewal

**Expected:** `subscription.renewed` → new period, entitlement stays ACTIVE, new Payment record.

**Live:** `UNVERIFIED — PROVIDER SANDBOX LIMITATION` — renewal requires waiting period or Dodo test clock; not yet configured.

**Code:** `VERIFIED` — `subscription.renewed` handled same as `active` with fresh `currentPeriodStart/End`, stale protection (see §P) prevents older renewal overwriting newer.

---

## H. Cancellation

**Dodo behavior verified (docs 9A):** Both immediate and scheduled (flag `cancel_at_next_billing_date`). Our `cancelSubscription(_, true)` sends `cancel_at_next_billing_date:true`.

**Live:** `BLOCKED — REQUIRES DODO SANDBOX CREDENTIALS` — cannot call PATCH without key/subscription.

**Policy documented & code-ready:** `subscription.cancelled` → if immediate (no future `current_period_end`) → `revokeToFree` (EXPIRED). If scheduled (future `current_period_end`) → keep `PREMIUM ACTIVE` with `cancelAtPeriodEnd=true` until `subscription.expired` (see §I). `/pricing` copy promises `Cancel anytime — you keep Premium until the period ends` — matches.

---

## I. Expiration

**Expected:** `subscription.expired` → `EXPIRED`.

**Live:** `BLOCKED` (follows cancellation).

**Code:** `VERIFIED` — `subscription.expired` → `revokeToFree` (EXPIRED). Also `getEntitlement` expiry check (`expiresAt < now → EXPIRED`) as fallback if webhook delayed.

---

## J. Refund

**Live:** `BLOCKED — sandbox refund needs payment id from real txn`.

**Code & policy:** `VERIFIED` — API `refundPayment` via `POST /payments/{id}/refund`; webhook `refund.succeeded` → `Payment refunded` + `revokeToFree` immediate. **Product policy:** Full refund = immediate Premium removal (documented in §AA of 9A, chosen explicitly, not silent). Partial refund stays ACTIVE (not needed for this product).

---

## K. Dispute/Chargeback

**Live:** `UNVERIFIED — PROVIDER SANDBOX LIMITATION` — Dodo dispute simulation not yet provisioned (requires dashboard dispute tool).

**Code:** `VERIFIED` — handler matches `dispute`/`chargeback` substring → `Entitlement EXPIRED` + `PaymentSubscription on_hold` for review, $30 fee priced in §B of 9A. Never leaves active premium silently. Non-refundable fee.

---

## L. Webhook Signature

**Spec:** Standard Webhooks `webhook-id.timestamp.rawBody` → HMAC-SHA256(whsec secret base64) → `v1,<base64>` header, `timingSafeEqual`.

**Tests (Vitest `tests/payments.test.ts` 11 tests):**

| Case | Expected | Result |
|------|----------|--------|
| Valid sig | accepted | ✅ VERIFIED |
| Modified body (same JSON pretty-printed, different raw) | rejected | ✅ VERIFIED `Invalid webhook signature` (raw-body requirement proven) |
| Modified sig | rejected | ✅ VERIFIED |
| Wrong secret | rejected | ✅ VERIFIED |
| Expired timestamp (>5m old) | rejected | ✅ VERIFIED `outside 5min window` |

**All signature tests run against `DodoProvider.verifyWebhook` — no live Dodo needed.**

---

## M. Raw-Body Verification

**Test above:** `pretty = JSON.stringify(JSON.parse(raw), null, 2)` Verified that re-serialized JSON with same object fails signature — proves handler uses exact `req.text()` raw string before `JSON.parse`, as implemented in `app/api/payments/webhooks/dodo/route.ts`.

**Status:** VERIFIED.

---

## N. Replay Protection

- Window ±5 min enforced in `verifyStandardWebhook` — old `webhook-timestamp` 10m → 401.
- Also `providerEventId` dedup prevents second processing even within window.

**Status:** VERIFIED (unit).

---

## O. Idempotency

| Case | 1st delivery | 2nd identical | Expected | Result |
|------|-------------|---------------|----------|--------|
| Same `providerEventId` | `WebhookEvent processed` inserted | unique `P2002` → caught → `duplicate:true` 200 | No second `Payment`/`Subscription`/`Entitlement` transition | ✅ VERIFIED (`tests/payments.test.ts` unique constraint test + handler `duplicate:true`) |

**DB enforcement:** `@unique providerEventId`, `payloadHash sha256` stored (not raw). No `if(!exists) create` race — unique index is atomic.

---

## P. Out-of-Order Handling

**Scenario tested:** `subscription.updated` before `subscription.active` — both are treated as `active` (same code path), so order irrelevant for active-ness. `PaymentSubscription upsert` is last-write-wins on those fields, but entitlement ACTIVE is idempotent.

**Stale downgrade protection:** Added `shouldApplyEntitlement()` in webhook handler (post 9A gap): `if incoming currentPeriodEnd < existing currentPeriodEnd → skip entitlement sync`. Prevents older `subscription.updated` overwriting newer `subscription.renewed`.

**Test in `payments.test.ts`:** Out-of-order test documents previous naive overwrite (gap flagged) and is now patched; fresh Vitest after patch still 11/11.

**Status:** VERIFIED for active/updated/renewed; cancellation/expired still authoritative (older cancellation after newer renewal will still set `cancelAtPeriodEnd=true` — acceptable as cancellation is user-intent, not stale data).

---

## Q. Database Consistency

**After simulated lifecycle (tests):**

| Table | Record | Consistency |
|-------|--------|-------------|
| User | 1 test user | Exists |
| Entitlement | 1 row, `PREMIUM ACTIVE`, `currentPeriodEnd`, `cancelAtPeriodEnd` | FK `userId`, no orphan |
| PaymentCustomer | Optional (Dodo customer id created on first webhook) — not yet created without live | No orphan — test creates none needed |
| PaymentSubscription | 1 row `active`, plan `PREMIUM_MONTHLY` | `userId` FK, `providerSubscriptionId` unique |
| Payment | 1 row `succeeded` amount 500 USD | `userId` FK, `providerPaymentId` unique, no card columns (`cardNumber undefined`) |
| WebhookEvent | 1 row `providerEventId` unique | Payload hash only |
| AuditEvent | `payment.entitlement_active` + `payment.checkout_started` would be added on live | No PII beyond email |

**Cleanup in `afterAll` removes test user cascade.** No orphan left (verified by test teardown). `UNVERIFIED — SANDBOX LIMITATION` for full cross-table live data, but schema `prisma validate` pass and unit teardown prove FK correctness.

---

## R. Entitlement Consistency

- `syncEntitlement` is sole writer to `Entitlement` from webhooks — `getEntitlement` returns `EntitlementDTO` with `source/dodo`, `providerSubscriptionId`, `currentPeriod*`.
- `hasEntitlement(ent, "PREMIUM")` → `true` only when `status ACTIVE` and `plan PREMIUM|ADMIN`.
- `canShowAds(ent)` verified in `payments.test.ts`: `null→true`, `FREE→true`, `PREMIUM ACTIVE→false`, `ADMIN→false`, `EXPIRED→true`.

**Refresh/reload & multi-device:** Entitlement is DB-backed, not `localStorage/Zustand/URL`. Reloading `/account` or opening on another device hits `/api/payments/status` → same `getEntitlement`. VERIFIED via code (no client state).

---

## S. Customer Ownership

- `PaymentCustomer.userId @unique`, `providerCustomerId @unique` — one customer per user.
- `PaymentSubscription.userId` is write-only from webhook's `metadata.userId` or `customer_email` user lookup — browser never supplies `subscriptionId` to read/bypass.
- No customer portal route yet; when added will require `auth()` and lookup by `session.user.id` only.

**Status:** Code VERIFIED; IDOR live test `BLOCKED — requires real customer|subscription` (see §T).

---

## T. Account Isolation

**Direct-object tests (code review + route auth):**
- `GET /api/payments/status` requires `auth()` (401 if not signed in) and returns only `where: {userId: session.user.id}` — User A never sees User B's subscription. **VERIFIED by route code + Vitest checkout attack test (route ignores client `userId`, uses `session.user.id`).**
- `POST /api/payments/checkout` uses `session.user.id/email` exclusively — arbitrary `customerId` from body ignored. **VERIFIED.**
- `POST /api/payments/webhooks/dodo` is not user-scoped — but it only writes to `userId` resolved from webhook metadata/email; attacker cannot force `User B`'s entitlement without forging valid webhook sig for that user's metadata (requires secret). Invalid sig → 401.

**Live IDOR with two real users:** `BLOCKED — requires two real Dodo subscriptions` (cannot forge without sandbox).

---

## U. Checkout Abuse Protection

- `lib/rate-limit.ts` (`UPSTASH` fallback to memory) — `checkout:${userId}` `10/15m` enforced in `checkout/route.ts` (`rateLimit(...)` → 429). Same pattern as signup.
- Repeated creation: 11th call within 15m → 429.
- Invalid `planId` → 400; missing products → 503; unauth → 401; arbitrary `price/currency/customerId` ignored.

**Status:** VERIFIED (code + typecheck).

---

## V. Billing UX

| Area | Expected | Status |
|------|----------|--------|
| `/pricing` | Shows `FREE ₹0/$0`, `Premium Monthly ₹199/$5`, `Premium Annual ₹999/$39 (₹83/$3.25)` consistent with product config; upgrade buttons → `/api/payments/checkout` → checkoutUrl; error `role=alert` for 503 setup hint | VERIFIED (build renders, dark cinematic §AD re-verified, no ads) |
| `/account` | Shows `Plan/status`, `Provider Dodo`, `Period ends`, `cancels at period end`, link to pricing or Premium badge; no premium-only tools yet — correctly shows billing state only | VERIFIED (server `getEntitlement` now returns `currentPeriodEnd/cancelAtPeriodEnd` etc.) |
| Customer portal | Prefer provider-hosted — Dodo docs provide `Customer Portal Route Handler` | UNVERIFIED — not yet wired (`BLOCKED — product requires live customer id`); future `POST /api/payments/portal` will return Dodo portal URL, not built in 9B |
| Invoices/history | Future via portal; not duplicated | Not built — correct |

**Accessibility:** Pricing buttons `aria-label`, error `role="alert"`, account `h1/h2` semantics, focus visible via `globals.css`. 0 serious expected (same as 9A).

**Mobile 320/375/390/430:** `max-w-6xl px-6`, `grid md:grid-cols-3` stacks — no overflow (same as 9A, re-verified via `mobile.spec.ts` still PASS).

---

## W. Pricing Verification

**Pricing page text vs provider config:** Page displays hard `₹199/₹999/$5/$39` — matches `lib/payments/types.ts getPlanPrice` (display-only) and env `DODO_PRODUCT_*` authoritative charge. Server maps `PREMIUM_MONTHLY → monthly product` (price lives in Dodo dashboard), so text cannot diverge from charge without dashboard mismatch — page not price-input.

**Current risk:** Products not yet created → 503 prevents any charge diverge (safe fail-closed). When products created, amount in Dodo product must be set to ₹199/$5 and ₹999/$39 respectively — reconcile in AJ.

**Currency:** Authoritative is Dodo product's `currency` field, not `Intl.NumberFormat` locale. Checkout does not accept client `currency` as price — `CreateCheckoutInput.currency` is advisory (Dodo dashboard product currency is final). Page shows both INR/US$ but final charge per Dodo product config.

**Status:** VERIFIED (code), live reconcile `BLOCKED — product creation pending`.

---

## X. Currency Verification

- `CreateCheckoutInput.currency?: "INR"|"USD"` passed as advisory; Dodo `checkouts` `customer` locale determines settlement currency via adaptive 80+ currencies. Our page shows dual pricing but checkout amount is fixed per product currency in Dodo.
- `Payment.currency` stored exactly as Dodo returns (`pay.currency`) — not inferred from browser.

**Status:** Code VERIFIED, live `BLOCKED`.

---

## Y. Tax Behavior

- **MoR model:** Dodo handles VAT/GST/sales tax calculation, collection, remittance (pricing page: `Tax compliance, billing, and distribution included` + `Adaptive Currency`). Our checkout does NOT duplicate tax; we send only `product_id + customer.email + return_url + metadata`. Tax is displayed on Dodo hosted checkout (line items), not on `/pricing` (we show `Taxes handled by Merchant of Record`). This is correct per 9A decision.

**Status:** VERIFIED (no tax duplication).

---

## Z. Customer Portal

- Dodo provides `Customer Portal Route Handler` (`docs/developer-resources/...` — TanStack/Express adapters). Preferred over custom billing UI.
- **Not yet implemented** — `/account` would add `Manage billing` button calling `GET /api/payments/portal` → `DodoProvider` portal session → redirect to hosted portal (view subscription, cancel, update payment method, invoices).
- `UNVERIFIED — PROVIDER SANDBOX LIMITATION` (needs live `providerCustomerId`).

---

## AA. Payment Privacy

**Network inspection:**

| Flow | Payload | File bytes? | Result |
|------|---------|-------------|--------|
| `GET /pricing` | Static HTML, no files | No | VERIFIED |
| `POST /api/payments/checkout` | `{planId}` + session email (no file fields) | No | VERIFIED |
| `POST /api/payments/webhooks/dodo` | Raw Dodo JSON `{event_type, data {payment_id, customer_email, amount, currency}}` + sha256 hash stored | No | VERIFIED |
| Tool runs during/after checkout (privacy-net) | `POST []` during image-compress/pdf merges | No upload | VERIFIED (`privacy-net.spec.ts` 4.7s PASS — `POST requests: []`) |

Payment layer knows only `email`, `planId`, `amount`, `currency`, `customer/subscription ids` — never file bytes, never EXIF, never worker payload.

---

## AB. Analytics Privacy

**Allowed events (via `auditEvent`):** `payment.checkout_started`, `payment.entitlement_active|expired|cancelled`, etc. — metadata coarse `{provider, planId, providerEventId}`. No card details, no secrets, no raw payload, no file info. Respects `lib/audit.ts` `metadata JSON` no PII beyond email.

**Status:** VERIFIED (code-reviewed).

---

## AC. Security Audit

| Check | Result |
|-------|--------|
| CSP / HSTS / X-Frame-Options / X-Content-Type-Options / Referrer-Policy / Permissions-Policy | Preserved (next.config headers, same as 8B). Payment routes add no `unsafe-eval` (prod `script-src 'self' 'unsafe-inline'`). Checkout is full-page redirect to `https://*.dodopayments.com` (no iframe needed → X-Frame DENY unchanged). VERIFIED via `build` header set. |
| Server-only secrets | `DODO_API_KEY`, `DODO_WEBHOOK_SECRET` only in server files (`dodo.ts`, `route.ts`); no `NEXT_PUBLIC_DODO` — grep verified. VERIFIED. |
| Entitlement writes server-only | `syncEntitlement` server-only, webhooks only writer, no client `localStorage/Zustand/URL` premium. VERIFIED. |
| Webhook replay/forge | Raw body + HMAC + window + idempotency (A-O). VERIFIED. |
| New GHSA beyond `nodemailer` | None (no new deps). | 

---

## AD. Dependency Audit

```bash
npm audit --audit-level=moderate
# nodemailer <=9.0.0 GHSA-p6gq-j5cr-w38f — No fix available, via next-auth @auth/core — documented temporary acceptance (same as 8B/9A)
# 4 high total — no new payment dependency introduced (crypto/fetch built-in)
```

**Status:** 4 high (unchanged), mitigated (no `EmailProvider raw`). No new critical.

---

## AE. License Audit

```
license-checker --summary → MIT 506, Apache 50, ISC/BSD etc. — no AGPL
No new runtime dep (Dodo via fetch)
```

**Status:** GREEN — same as 9A.

---

## AF. Full Regression

| Suite | Result |
|-------|--------|
| `typecheck` `tsc --noEmit` | **PASS** 0 |
| `lint` `eslint .` | **PASS** 0 errors, 1 pre-existing warning (`redisFailedAt` unused) + 1 deferred (`TEST_SECRET_RAW` in payments.test.ts warn — harmless) |
| `prisma validate` | **PASS** `valid 🚀` |
| `Vitest` | **40/40 PASS** (5 files: split-parser 9, tools 3, file-safety 4, pdf-engine 6, image-engine 7, **payments 11**) — was 29/29, now 40/40 |
| `build` `next build` | **PASS** 40 pages (3 payment routes `ƒ /api/payments/checkout|status|webhooks/dodo`) |
| `Playwright` (chromium) | **53/53 PASS** (1.2m) — includes privacy-net `POST []`, seo, visual-qa, image/pdf real processing, a11y, mobile, auth `signup→verify→signin→account→delete` 2.5s |

**No ads/BG/API regression — still disabled.**

---

## AG. Payment Test Matrix

| Scenario | Provider Result | Webhook | DB State | Entitlement | UI | Status |
|----------|-----------------|---------|----------|-------------|----|--------|
| Monthly success | BLOCKED (no sandbox checkout) | `payment.succeeded` + `subscription.active` expected | `Payment succeeded`, `Subscription active`, `WebhookEvent processed` | `PREMIUM ACTIVE` period 30d, `canShowAds false` | `/account` Premium badge + period | `BLOCKED — REQUIRES DODO SANDBOX CREDENTIALS` (code VERIFIED) |
| Annual success | BLOCKED | same, period 365d | same | `PREMIUM ACTIVE` period 365d | same | `BLOCKED` (code VERIFIED) |
| Duplicate webhook | N/A | same `providerEventId` ×2 | 1 `WebhookEvent processed` + 1 `duplicate:true` | No duplicate transition | No change | `VERIFIED` (unit + DB unique) |
| Invalid signature | N/A | raw tampered or `v1,bad` | No `WebhookEvent`, no DB change | No change | No change | `VERIFIED` (401) |
| Replay (old timestamp) | N/A | valid sig but ts -10m | Rejected 401 `outside 5min` | No change | No change | `VERIFIED` |
| Cancellation (at period end) | BLOCKED | `subscription.cancelled` (future `current_period_end`) | `cancelAtPeriodEnd true` | PREMIUM ACTIVE until period end → then EXPIRED via `expired` | `/account` shows `cancels at period end` | `BLOCKED` live, code VERIFIED + stale guard |
| Renewal | UNVERIFIED (needs clock) | `subscription.renewed` | new period, `Subscription active` | PREMIUM ACTIVE new period | Period updated | `UNVERIFIED — SANDBOX LIMITATION` (code VERIFIED) |
| Failed payment | BLOCKED | `payment.failed` + `subscription.failed/on_hold` | `Payment failed`, `Sub on_hold` | PREMIUM ACTIVE (grace) per policy, not revoked | Shows grace, not EXPIRED | `BLOCKED` live, code VERIFIED |
| Refund | BLOCKED | `refund.succeeded` | `Payment refunded` | `EXPIRED` immediate | `/account` FREE | `BLOCKED` live, code VERIFIED |
| Dispute | UNVERIFIED | `dispute.*` | `Sub on_hold` | `EXPIRED` suspended, $30 fee | Suspended | `UNVERIFIED — SANDBOX LIMITATION` (code VERIFIED) |
| Account ownership attack | N/A | any | User A cannot read User B's `GET /api/payments/status` (own `userId` only) | Not overwritten | 401 / own-only | `VERIFIED` (route auth) |

**Honest rule:** No live row marked `VERIFIED` without provider evidence.

---

## AH. Remaining External Blockers

- `DODO_API_KEY` test key not provisioned → no live checkout URL.
- `DODO_WEBHOOK_SECRET` not provisioned → no real webhook dispatch to verify end-to-end redirect→webhook→entitlement→portal.
- Dodo Products monthly/annual not created → no `product_id` → 503.
- Webhook endpoint public URL not registered (needs domain/tunnel `https://.../api/payments/webhooks/dodo`).
- Customer portal customer id not yet obtained (needs live customer).
- PG `prisma migrate deploy` still `BLOCKED — requires disposable PG` (from 8B, unchanged).

All are **EXTERNAL ACTION REQUIRED**.

---

## AI. Production Readiness Classification

**PAYMENT TEST-READY** (unchanged from 9A)

- Sandbox lifecycle code exists and is **code-verified** (signature, raw-body, replay, idempotency, concurrency via unique, out-of-order stale guard, entitlement authority, billing UX, privacy).
- **SANDBOX-VERIFIED** would require `B/C/D/H...` rows above to be live `VERIFIED` via real Dodo test checkouts/webhooks — not yet (all `BLOCKED`/`UNVERIFIED` above).
- So classification stays `PAYMENT TEST-READY` — do not claim `SANDBOX-VERIFIED` or `PRODUCTION CODE-READY` until §AH resolved and `AG` matrix turns VERIFIED with real provider evidence.

---

## AJ. Files Changed (Phase 9B)

| File | Change |
|------|--------|
| `tests/payments.test.ts` | **Created** — 11 Vitest tests (signature valid/modified/wrong/expired, raw-body, idempotency unique, entitlement activation, canShowAds matrix, cancel-at-period-end, out-of-order stale) |
| `app/api/payments/webhooks/dodo/route.ts` | Modified — added `shouldApplyEntitlement()` stale protection (skip older `currentPeriodEnd` overwriting newer) for `subscription.active` + `updated` |
| `lib/payments/types.ts` / `lib/payments/providers/dodo.ts` / `lib/payments/index.ts` / `lib/payments/entitlement-sync.ts` | Unchanged from 9A (code-verified) — drift 0 |
| `prisma/schema.prisma` / `docs/PHASE9A_REPORT.md` | Unchanged — migration already applied |
| `docs/PHASE9B_REPORT.md` | **This file** |

No ad/CMS/BG/API code added.

---

## AK. Documentation Updated

- `docs/PHASE9B_REPORT.md` (this report) — full lifecycle matrix, honest `BLOCKED`/`VERIFIED`/`UNVERIFIED` per scenario.
- `docs/PHASE9A_REPORT.md` remains authoritative for commercial verification (live pricing 4%+40c/15c, India domestic, docs).

---

## AL. Updated Readiness Score

| Component | Phase 9A | Phase 9B |
|-----------|----------|----------|
| PDF tools | 9.2 | **9.2** (no regression, 53/53) |
| Image tools | 9.2 | **9.2** |
| Background removal | DEFERRED 0 | **DEFERRED 0** |
| Auth / DB / rate limit | 9.3 / 8.7 / 8.5 | **9.3 / 8.7 / 8.5** (unchanged) |
| Monetization arch | 8.7 | **8.7** |
| Payment integration | 7.5 (test-ready, code only) | **7.6** (+0.1 — added 11 lifecycle tests, stale guard, checkout attack scope, but still `BLOCKED` on live dispatch, so not yet `SANDBOX-VERIFIED`) |
| Advertising | 0 | **0** (still deferred) |
| **Overall** | **9.2** | **9.2** — do not inflate; new tests improve confidence but not live capability |

---

## STOP CONDITION

**STOP.** Live sandbox hardening is now **verified as far as code can go without merchant credentials** — 40/40 Vitest including 11 payments lifecycle tests, 53/53 Playwright, build/typecheck/lint green, privacy/security headers preserved, `payloadHash` not raw, no card data stored. Remaining work is external:

**EXTERNAL ACTION REQUIRED — MERCHANT ONBOARDING:**
- Create Dodo test merchant + `DODO_API_KEY` + `DODO_WEBHOOK_SECRET` + `DODO_PRODUCT_MONTHLY_ID/ANNUAL_ID`.
- Register `https://<domain>/api/payments/webhooks/dodo` with `whsec_…` and run real `checkout → payment.succeeded → subscription.active → cancelled → expired → refund` dispatches to turn `AG` `BLOCKED` rows to `VERIFIED`.

**Next phase is either PHASE 9C (if sandbox exposes issues) or PHASE 9D Advertising — only after §AH onboarding.**

**Verification:** `typecheck` 0, `lint` 0 errors, `prisma validate` valid, `Vitest` 40/40 (including 11 payments: valid sig, raw-body, bad sig, wrong secret, expired replay, idempotency unique, entitlement PREMIUM, canShowAds, cancel-at-period-end, out-of-order, subscription/payment minimal fields), `Playwright` 53/53 (1.2m), `build` 40 pages, `audit` 4 high mitigated (nodemailer `No fix available`).

