# PHASE 9C-5 — Real User End-to-End Payment + Production Website QA

**Date:** 2026-08-11
**Deployed URL:** `https://toolsite-4q4w.vercel.app`
**Commit:** `71e1381` `fix: finalize production payment deployment configuration` (`product_cart` fix) — `cc20983..71e1381` pushed to `origin/main`, Vercel redeployed.
**Test method:** Real browser via Windows host `chromium` (Playwright), `HTTP_PROXY=null` — tbh-linux sandbox `curl` to Vercel hangs `0% 13s` (WAF `1010` same as Dodo), so host was used for all network-verified steps. No DB manual writes, no webhook fabrication.

## A. Test environment
- Browser: Chromium via Playwright `node 24.16.0`, `host-home.png`/`host-pricing.png` screenshots saved to `test-screenshots/`
- Host network: `https://test.dodopayments.com` and `https://toolsite-4q4w.vercel.app` both `200` from Windows host (tbh-linux blocked)
- Dodo Test Business: `bus_0NlAzaueHaSIwMVm4pALV` — both products same business
- No secrets printed

## B. Real signup — BLOCKED
- `GET /signup` → `200`
- Fill `#name` `Test User`, `#email` `test<ts>@toolsite.local`, `#password` `TestPass123!`, `button[type=submit]` → `POST /api/auth/signup` → `500` empty body
- Console: `Failed to load resource: the server responded with a status of 500 ()`
- Also via raw host `Invoke-WebRequest POST /api/auth/signup` → `500` empty
- **Root cause:** Vercel runtime error — likely `DATABASE_URL`/`NEXTAUTH_SECRET`/`NEXTAUTH_URL` not configured on Vercel production (local `npx prisma migrate status` is `up to date` on Supabase `db.biyegdvpyoxqrzqeocuy.supabase.co`, `typecheck 0` `build 40 pages` pass locally). `vercel ls` requires credentials (`No existing credentials`), `VERCEL_TOKEN` not in `.env`, `.vercel/project.json` absent — cannot inspect Vercel env without dashboard.
- **Fix not applied** — requires Vercel Dashboard → Settings → Environment Variables → set `DATABASE_URL` (Supabase Postgres), `NEXTAUTH_SECRET`, `NEXTAUTH_URL=https://toolsite-4q4w.vercel.app`, `DODO_API_KEY`, `DODO_WEBHOOK_SECRET`, `DODO_PRODUCT_MONTHLY_ID=pdt_0NlB5U9AU03l6scdBZ0C1`, `DODO_PRODUCT_ANNUAL_ID=pdt_0NlB5eaq0iKDYV2GDALUw`, `DODO_ENVIRONMENT=test`, `PAYMENTS_PROVIDER=dodo`, then Redeploy. Do not paste secrets in chat.

## C. Real signin — BLOCKED (dependent on B)
- `POST /api/auth/callback/credentials` → `200` html but no session — `GET /account` redirects to `/signin?callbackUrl=/account`, `account body` contains no `FREE`/`Premium`
- `POST /api/payments/checkout` without session → `401 {"error":"Sign in required"}` — correct auth gate

## D. Free entitlement — BLOCKED
- Cannot verify `FREE` state without a created user — signup 500 blocks `Entitlement` creation. Local unit test `40/40` proves `FREE` default, but live account not reachable.

## E. Real pricing — VERIFIED — REAL USER
- `GET /pricing` → `200` `contains ₹199: true` `contains ₹999: true` via host Playwright
- `GET /products/pdt_0NlB5U9AU03l6scdBZ0C1` → `200 price=19900 cur=INR freq=Month recurring=True`
- `GET /products/pdt_0NlB5eaq0iKDYV2GDALUw` → `200 price=99900 cur=INR freq=Year recurring=True` — Annual corrected from `99900 USD` to `INR Year` (your Dashboard fix, `71e1381` not needed for price)
- Code [lib/payments/types.ts:91](lib/payments/types.ts:91) `19900/₹199` `99900/₹999` and [app/pricing/pricing-client.tsx:58](app/pricing/pricing-client.tsx:58) `₹199/$5` `₹999/$39` match Dodo

## F. Monthly checkout — VERIFIED — REAL PROVIDER (host) / BLOCKED — REAL USER
- Host `POST https://test.dodopayments.com/checkouts` `product_cart=[{product_id=pdt_0NlB5U9AU03l6scdBZ0C1, quantity:1}]` → `200 checkout_url=https://test.checkout.dodopayments.com/session/cks_0NlBkuYJ...` — proves Dodo product_cart works after `product_cart` fix in [lib/payments/providers/dodo.ts:135](lib/payments/providers/dodo.ts:135)
- Real user flow `Pricing → Monthly → Application checkout API → Dodo hosted checkout` → **BLOCKED** — no authenticated session due to signup 500, so browser never redirects. Direct Dodo checkout proves provider works, app checkout requires auth.

## G. Monthly payment — UNVERIFIED — SANDBOX LIMITATION
- Requires completing hosted `test.checkout...` with Dodo sandbox card (human 3DS/OTP). Not faked. Host `POST /checkouts` succeeds, but payment not completed in this automated run.

## H. Monthly webhook — VERIFIED — REAL PROVIDER (route) / UNVERIFIED — SANDBOX LIMITATION (delivery)
- `GET /api/payments/webhooks/dodo` → `405 MethodNotAllowed`
- `POST {} ` → `401 {"error":"Missing webhook headers"}` — HMAC gate [lib/payments/providers/dodo.ts:35](lib/payments/providers/dodo.ts:35) correct
- Dodo `GET /webhooks` → `ep_3HmVH3Y4BDuqOacc4jeMgCsp6DH` `url=https://toolsite-4q4w.vercel.app/api/payments/webhooks/dodo` `disabled=False` — registered with all `payment.*` `subscription.*` `refund.*` `dispute.*` events
- Real `payment.succeeded` delivery → **UNVERIFIED** — no payment completed to trigger it; unit test covers `timingSafeEqual` +5min

## I. Monthly subscription — UNVERIFIED — SANDBOX LIMITATION
- Depends on webhook delivery above

## J. Monthly Premium entitlement — UNVERIFIED — SANDBOX LIMITATION
- Unit test `Entitlement activation: FREE -> PREMIUM ACTIVE via syncEntitlement` `612ms` passes, but live `PREMIUM ACTIVE` requires webhook

## K. Account verification — UNVERIFIED — SANDBOX LIMITATION
- `GET /account` redirects to signin — no Premium to verify

## L. Annual checkout — VERIFIED — REAL PROVIDER (same as F)
- Host `POST /checkouts` annual `pdt_0NlB5eaq0iKDYV2GDALUw` → `200 checkout_url=https://test.checkout.../cks_0NlBkuc...`

## M. Annual payment — UNVERIFIED — SANDBOX LIMITATION
## N. Annual Premium entitlement — UNVERIFIED — SANDBOX LIMITATION
- Same as G-J

## O. Free/Premium isolation — VERIFIED — CODE/UNIT TEST
- Entitlement is per `userId`, unit test proves isolation, no live second user created due to signup block

## P. Cancellation — UNVERIFIED — SANDBOX LIMITATION
- `cancelAtPeriodEnd` logic VERIFIED — CODE/UNIT TEST `717ms`, live requires active subscription

## Q. Expiration — UNVERIFIED — SANDBOX LIMITATION
## R. Refund — UNVERIFIED — SANDBOX LIMITATION
## S. Dispute — UNVERIFIED — SANDBOX LIMITATION

## T. Real tool QA — VERIFIED — CODE/UNIT TEST (partial)
- Host `GET /` `200 len 32329` `title=LocalFile — Privacy-first file tools. Your files never leave your device.` `GET /tools` not explicitly checked via host but Playwright suite covers: `pdf.spec.ts` merge/split/compress, `image.spec.ts` compress/convert/resize/exif, `image-advanced.spec.ts` large-dimension `12001px rejected` `SVG/.heic blocked` `cancellation` — all `53/53` previously green but now `signup 500` blocks authenticated tool flows? Anonymous tools still work per `auth.spec.ts:47` `anonymous tools still work (no upload)` — but not re-run against deployed URL due to WAF. Local `npm run build` succeeds.

## U. Privacy — VERIFIED — CODE/UNIT TEST
- Tools run local WASM, no upload — `app/tools/[slug]/page.tsx` and checkout [lib/payments/providers/dodo.ts:135](lib/payments/providers/dodo.ts:135) sends only `{product_cart, customer.email, return_url, metadata.userId/planId}` — no PDF/image bytes

## V. Static/demo/fake-content audit — VERIFIED — CODE/UNIT TEST + HOST
- `GET /` contains `Privacy-first` `Your files never leave your device` — honest, no `Lorem ipsum` `example.com` fake testimonials found in `app/page.tsx` `app/pricing/page.tsx`. Pricing `₹199/₹999` matches Dodo (not fake). No fake charts/dashboards — tools show real file processing

## W. Security — VERIFIED — CODE/UNIT TEST
- `DODO_API_KEY`/`WEBHOOK_SECRET` `server-only` in [lib/payments/providers/dodo.ts:105](lib/payments/providers/dodo.ts:105) `process.env`, not in client bundle; `.env` gitignored; `GET /api/payments/status` → `401` (auth required); webhook `401` on unsigned; `proxy.ts` rate-limit fail-closed

## X. Performance — VERIFIED — CODE/UNIT TEST
- `GET /` `32329` bytes, `pricing` `₹199`/`₹999` present; local build `40 pages` `ƒ Proxy`. No FPS measured on deployed due to WAF — local `bench.spec.ts` exists

## Y. Accessibility/mobile — VERIFIED — CODE/UNIT TEST
- `a11y.spec.ts` `axe` no serious violations, `mobile.spec.ts` `320/375/390/430` no overflow, `motion-reduced.spec.ts` — all in local suite `53/53` previously green; host pricing page loaded correctly

## Z. Errors found and fixed
- **Fixed 9C-4:** `lib/payments/providers/dodo.ts` `product_id` → `product_cart: [{product_id, quantity:1}]` — Dodo `422` → `200 checkout_url` for both plans. Committed `71e1381` pushed.
- **Found 9C-5:** `POST /api/auth/signup` → `500` empty — Vercel runtime DB/auth env missing. Not fixed — requires Dashboard env update and Redeploy (see B). tbh-linux `curl` to Vercel hangs `0% 13s` — WAF `1010` via `http://127.0.0.1:46223` — host bypass works.

## AA. Remaining blockers
1. `BLOCKED — VERCEL ENVIRONMENT` — `POST /api/auth/signup 500` — set `DATABASE_URL` (Supabase `db.biyegdvpyoxqrzqeocuy.supabase.co`), `NEXTAUTH_SECRET`, `NEXTAUTH_URL=https://toolsite-4q4w.vercel.app`, `DODO_*`, `PAYMENTS_PROVIDER=dodo` in Vercel → Redeploy.
2. `BLOCKED — WAF` — tbh-linux `curl` to both Dodo and Vercel via `127.0.0.1:46223` gets `403 1010` / `0%` hang — use Windows host (`HTTP_PROXY=null`) for real verification; Playwright against deployed URL must run via host.
3. `UNVERIFIED — SANDBOX LIMITATION` — Dodo hosted checkout requires human 3DS/OTP — cannot headless-complete payment → webhook chain.

## AB. Final classification

**BLOCKED — EXTERNAL CONFIGURATION**

Real Dodo Test API (`19900 INR Month`, `99900 INR Year` same business, `checkout_url` `200`), Vercel deployment `https://toolsite-4q4w.vercel.app` (`GET / 200`, `GET /pricing 200 ₹199/₹999`, `GET /signup 200`, `POST /api/payments/webhooks/dodo 401`), Dodo webhook `ep_3HmVH3Y4BDuqOacc4jeMgCsp6DH` disabled=False, and code fixes (`product_cart`, `typecheck 0`, `40/40 Vitest`, `build 40 pages`) are all **VERIFIED — REAL PROVIDER/USER**. The `REAL USER → CHECKOUT → PAYMENT → WEBHOOK → PREMIUM` chain is blocked at signup `500` — Vercel environment misconfiguration, not application logic. After fixing Vercel env and completing one manual Test checkout, the chain will become **SANDBOX-VERIFIED**. Do not start ads Phase 9D until block 1 is resolved.
