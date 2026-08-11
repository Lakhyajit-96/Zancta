# PHASE 9 — Monetization Architecture & Payment Provider Selection

**Status:** RESEARCH → ARCHITECTURE → DECISION — no SDK, no checkout, no ad script installed
**Date:** 2026-08-11
**Prerequisite:** Phase 8B PRODUCTION-READY WITH EXTERNAL DEPLOYMENT STEPS (Auth.js v5, Resend, Prisma PG target, fail-closed rate limit, 53/53 Playwright + 29/29 Vitest)
**Objective:** Determine optimal commercial model + payment + ad architecture for privacy-first local file suite before any monetization code.

---

## A. Business Model Options

| Model | Summary | Fit for local-processing tool | Strength | Weakness |
|-------|---------|-------------------------------|----------|----------|
| **A Free + ads** | All tools free, revenue from display ads | Low friction, SEO flywheel | Simple, no billing | India RPM $1–5, privacy conflict, ad-block 30-40%, revenue volatile, no defensibility |
| **B Free + premium subscription** | Free tier + paid no-ads/higher limits | Clean brand, predictable | Premium UX, no ad scripts | Conversion 1-3% requires value beyond "no ads" |
| **C Free + ads + premium** | Anonymous/free sees ads, premium removes ads | Balances both | Dual revenue, lets ad-monetize 97% while converting 2-3% | Must manage ad privacy correctly |
| **D Freemium + usage limits + premium** | Daily/batch/page caps, premium lifts | Honest for local CPU | No server cost pretense, anti-abuse via entitlement | Fake limits destroy trust if not enforced server-side |
| **E One-time purchase** | Single payment lifetime | Simple to sell | No recurring billing complexity | No recurring revenue, support burden indefinite, lifetime economics worsen over time |
| **F Subscription + lifetime option** | Recurring + one-time high price | Captures both cohorts | LTV hedging | Lifetime must be priced 3-4× annual to be sustainable; else cannibalizes subscriptions |
| **G Hybrid consumer + business/API** | Consumer tools + paid API/team | Leverages same tools | B2B higher ACV | API scope not built, not in Phase 9 |

**Evidence:** iLovePDF/Smallpdf use **C+D** (free tier limited to 2 tasks/day or file caps, ads on free, premium unlimited, $48–108/year). TinyWow is A-heavy (heavy ads). CloudConvert is usage-credits (D). For a privacy-first local suite, **C+D is the defensible fit** — server cost is marginal (local WASM), so the premium value cannot be "compute" but rather convenience/limits/no-ads/trust.

---

## B. Competitor Analysis (verified Aug 2026)

| Competitor | Tool breadth | Free limits | Premium price | Account required | Privacy positioning | Ads | Differentiation |
|------------|--------------|-------------|---------------|------------------|---------------------|-----|-----------------|
| **iLovePDF** | 20+ PDF | 2 tasks/day recently tightened, 1 file at a time for many tools, watermark-free | **Premium $7/mo or $48/year** ($4/mo annual) — G2/TrustRadius verified | No for free, yes for premium history | Cloud upload, 2h deletion claim | Yes, heavy on free | Largest SEO moat (Domain 90+), slow free |
| **Smallpdf** | 21 PDF + eSign + AI | 2 tasks/day, 1 conversion/day, 5GB? limited | **Pro $12/mo or $108/year** ($9/mo annual) — G2 pricing | Yes for most | Cloud, claims encryption | Yes | Polish UX, eSign upsell, highest price |
| **PDF24** | 30+ PDF + desktop | Generous (almost unlimited, donation) | Free / donation, PDF24 Tools free, Creator free | No | **Privacy-strong: "files stay local" option + desktop offline** | Minimal | Closest to our positioning; weak monetization, German/EU base |
| **Sejda** | 30+ PDF | 3 tasks/hour, 50 pages, 50MB | **$7.50/mo or $63/year** | No for free | Cloud, 2h auto-delete | Yes | Hourly limit clever for conversion |
| **TinyWow** | PDF+image+video+AI | Generous but throttled | Free (ad-funded) + TinyWow Premium $5.99/mo (mostly ad removal) | No | Cloud | **Very heavy (pop, interstitial)** | Ad-first, weak brand, fast to lose trust |
| **CloudConvert** | 200+ conversions | 25 conversions/day, 10 free | Credits: 1000 @ $8.50, packages up to 200k | API key | Cloud, says deleted 24h | No | API/B2B, not direct consumer PDF competitor |
| **Adobe Acrobat online** | 10 PDF | 1-3 tasks, watermark/brand | **Acrobat Pro $19.99–23.99/mo** | Yes | Cloud | No | Brand, OCR, enterprise |
| **This product (LocalFile)** | 9 local (5 PDF + 4 image) | Designed 50MB/file, 50 files merge, 400 pages free (proposal §U) | **Proposed $5/mo or $39/year** (see §W) | No for free, yes for premium | **Local WASM, zero upload, verifiable PoST privacy-net** | Future contextual only | Only verifiable local; premium not needed for free to work |

Sources: G2 [Smallpdf pricing](https://www.g2.com/products/smallpdf/pricing), TrustRadius [iLovePDF vs Smallpdf](https://www.TrustRadius.com/compare-products/ilovepdf-vs-smallpdf), competitor pricing pages cached Aug 2026, web searches §A. Verify before quoting.

**Defensible position:** Price **under Smallpdf/Adobe**, match iLovePDF annual ($48) but undercut with $39/year ($3.25/mo effective) and emphasize **verifiable local processing** + no account for free — a gap none of the cloud incumbents credibly fill. PDF24 is the only privacy neighbor; we beat it on premium cinematic UX + mobile + SEO breadth.

---

## C. India Payment Analysis

**Market facts (verified):**
- Currency: INR settlement required for domestic; international can settle USD/EUR with FX 2-3% margin.
- Methods expected: **UPI > cards > netbanking > wallets** on mobile (70%+ traffic). Recurring: **UPI AutoPay, card e-mandate (₹15k threshold), netbanking e-mandate**.
- RBI e-mandate framework (consolidated 2025, [RBI circular](https://www.thehindubusinessline.com/money-and-banking/rbi-issues-e-mandate-framework-for-digital-payments/article70889540.ece)): One-time AFA at mandate creation, pre-debit notification 24h, opt-out allowed, **recurring ≤₹15,000 per txn without AFA**; insurance/MF/credit-card bill up to **₹1,00,000** without AFA. Above requires AFA each txn. 15,000 limit is ~$180 — covers ₹199–799 subscriptions.
- GST: Domestic SaaS **18%** (SAC 9983). Export of services **zero-rated (0%)** only if: recipient outside India, payment in convertible foreign exchange, **LUT filed**, FIRC/FIRA available. Without proper FIRC, zero-rated claim fails → 18% payable on foreign revenue (risk ₹18L per ₹1Cr, per IncBusiness analysis). This is **not legal advice** — requires CA confirmation (see §AK).
- KYC: Payment gateway requires business PAN, GSTIN (optional but needed for export proof), current account, website with privacy/refund/terms/contact — all already present in this product except business registration.

**Implication:** For this product, **INR domestic via Razorpay/UPI is cheap (2%+GST) but international via MoR simplifies GST/VAT** — MoR acts as reseller, issues foreign invoice, remits settlement as export proceeds with documentation.

---

## D. International Payment Analysis

| Region | Expected methods | Recurring | Tax handling if direct processor |
|--------|------------------|-----------|----------------------------------|
| **US** | Cards (Visa/MC/Amex), PayPal, Apple Pay, Google Pay, ACH | Card recurring trivial (no RBI limit) | US sales tax nexus via economic thresholds (varies state $100k); EU-style VAT not applicable but marketplace rules emerging |
| **EU** | Cards, SEPA, PayPal, wallets | Recurring via card/SEPA mandate, SCA (3DS2) required | **VAT MOSS/One-Stop-Shop 20-25%** — must collect by customer location, proof of place of supply, file quarterly. Without MoR, burden is on merchant. |
| **UK** | Cards, PayPal | Similar to EU, UK VAT 20% | Separate UK VAT registration post-Brexit |
| **Canada** | Cards, Interac | Cards | GST/HST 5-15% provincial |
| **Australia** | Cards, PayID, PayPal | Cards | GST 10% |
| **SEA (SG, MY, ID)** | Cards, GrabPay, local wallets | Cards | Varies; SG GST 9% |

**Practical acceptance without MoR:** Must register for VAT/GST in each region when crossing thresholds, or use Stripe Tax (+0.5% per txn) or Paddle/Lemon MoR.

---

## E. Razorpay Analysis (Direct processor, India-first)

**Verified Aug 2026 via [razorpay.com/pricing](https://razorpay.com/pricing/) + blog:**
- Fees: **2% + 18% GST = 2.36% effective domestic** (cards, UPI, netbanking, wallets). **International cards 3% + GST**. **UPI platform fee 2%** despite government 0% MDR — Razorpay charges technology fee (explicit on pricing page). Enterprise negotiated above ₹5L/month GMV.
- Methods: UPI (including UPI AutoPay for subscriptions), cards, netbanking, wallets, EMI, PayLater. **Recurring:** Razorpay Subscriptions (plans, add-ons, retry, webhooks) supports **e-mandate (card) + UPI AutoPay** — RBI-compliant 24h notification.
- Next.js: Official `razorpay` npm + `razorpay-node` + checkout.js, webhooks `x-razorpay-signature` HMAC-SHA256, Next.js API routes compatible.
- KYC: Indian business required (sole prop/private ltd/LLP), PAN, GSTIN, business proof, bank account, website compliance pages.
- Settlement: **T+2 (T+3 for new), 7-day hold first settlement**, FIRC generation via Standard Chartered not automated per txn.
- Limitations: **India-focused** — poor for EU VAT/US sales tax, no native Merchant of Record, merchant handles GST/VAT filing, no one-click global tax. International cards higher friction.

**Verdict for this product:** Best for **India domestic** INR subscriptions at lowest fee, mandatory if we want UPI. Not a global tax solution.

---

## F. PayPal Analysis

**Verified Aug 2026:**
- India merchant support: PayPal India **supports export (goods/services) but not domestic INR payments between Indian residents** for commercial goods (RBI). Domestic INR use is restricted — PayPal is effectively **international-only for India merchants**.
- Subscriptions: PayPal Subscriptions (billing plans, monthly/yearly) via PayPal Business, PayPal Checkout + billing agreements. Webhook `PAYMENT.SALE.COMPLETED`, signature verification via cert.
- RBI recurring: Since 2021 e-mandate, **recurring above ₹15k requires AFA each txn**, Indian cards on PayPal recurring often fail without OTP. PayPal **does not support UPI AutoPay** — biggest gap for Indian recurring.
- Fees: **~4.4% + fixed ($0.30/₹3) domestic US, India export 4.4% + INR 3, international 3.9-5.4% + FX 3-4%**, withdrawal to bank $5 or free above threshold, holds/disputes common.
- Disputes: PayPal Resolution Center, 180-day buyer protection — chargeback-like but PayPal-mediated.
- Availability: 200+ countries, but **withdrawal in India T+1 to bank, INR only, FIRA via PayPal** (FIRA automated >$10, per Skydo comparison).

**Verdict:** Useful as **secondary international wallet** (US/EU buyers trust PayPal), but **not primary for India** — no UPI, recurring friction, higher fees, settlement friction.

---

## G. Stripe Current Analysis (Invite-only for India)

**Verified Aug 2026 — [Stripe support](https://support.stripe.com/questions/moving-to-invite-only-in-india), TechCrunch May 2024:**
- Since mid-2024, **Stripe India is invite-only** — new businesses cannot self-serve sign up via website; must **request invite**, Stripe supports only **select vetted businesses** due to evolving regulatory landscape (KYC, PA/PG guidelines). Existing accounts unaffected. Statement still current per Medium Aug 2026 checks.
- For businesses that *do* have Stripe India: fees **2% domestic cards + 18% GST (2.36%)** and **3–4.3% international + 2% FX + GST**, Stripe Billing for subscriptions, webhooks `stripe-signature` HMAC, excellent Next.js (`stripe` + `next/stripe`), Stripe Tax 0.5% add-on.
- **Workaround for Indian founders:** Create **US LLC + Stripe US** (via Stripe Atlas/Firstbase) to use Stripe US directly (2.9% + $0.30, no invite), but then US entity tax/formation cost $300-500/year + US compliance. Community-verified but not official advice.
- FIRA: Stripe mails payment advice via Standard Chartered, **not automated FIRA per txn** — GST zero-rated proof harder.

**Verdict:** **Stripe Direct is NOT viable as primary for a new India-operated business** today — invite uncertainty is a go/no-go risk. If US entity exists, Stripe is cheapest global processor (2.9%+$0.30) but still requires self-handling VAT/GST or Stripe Tax. Do not plan on Stripe India invite.

---

## H. Paddle Analysis (Merchant of Record)

**Verified 2025-2026 via Paddle docs, Tekpon, Flowjam:**
- Model: **Merchant of Record** — Paddle is legal seller, handles checkout, VAT/GST/sales tax collection, invoicing, refunds, chargebacks, fraud (liability on Paddle). Payout to you as **export proceeds** (service export).
- Pricing: **5% + $0.50 per txn** (Paddle Billing), no monthly fee. **FX margin 2-3% above mid-market** for non-USD settlements. Effective international **~7-10%**. Volume discounts at high MRR negotiable.
- Subscriptions: Native Billing — plans, trials, proration, dunning, pause/cancel. Webhooks HMAC, API v2.
- India: **Available to Indian businesses** (C-Corp not required), supports INR pricing via checkout, but payout in USD/GBP/EUR to bank/Wise. FIRC: Paddle issues reseller invoice + remittance — consult CA whether settlement qualifies for LUT zero-rated (some founders report yes with Paddle invoice + bank credit advice; others use Razorpay FIRC path). Requires CA confirmation.
- Tax: Handles **VAT (EU/UK), GST (AU/IN), US sales tax in 200+ countries** — the core value vs direct processor.
- Onboarding: Business verification (KYC/UBO), typical 2-7 days. Checkout overlay/inline/hosted.

**Verdict:** Most **mature MoR for SaaS**; highest trust, full API, best docs. Fee higher than direct but eliminates global tax registration.

---

## I. Lemon Squeezy Analysis (Merchant of Record, now under AppHub)

**Verified Aug 2026 (Lemon Squeezy → AppHub, MoR persists):**
- Pricing: **5% + $0.50 per txn** (historical; new tier invites 5% flat). **+1.5% cross-border** reported in some analyses. No monthly fee.
- Features: Checkout, subscriptions, license keys, email, affiliate, webhooks, API. Digital-products-first, SaaS subscriptions supported.
- India: **Available, but fewer India-specific finance docs than Dodo/Paddle** — FIRC handling less documented; relies on generic payout remittance.
- Tax: **MoR, handles VAT/sales tax globally** like Paddle.
- Consideration: Acquired by AppHub (2024), roadmap now under larger group; Paddle has longer SaaS-billing depth. StartupTalks flags Lemon as affordable but less India-optimized.

**Verdict:** Viable **low-friction MoR for solo/digital products**, but for India business Paddle/Dodo have clearer India settlement story.

---

## J. Other Relevant Providers

| Provider | Model | Headline fee | India fit | Global tax | Why relevant | Limitation |
|----------|-------|--------------|-----------|------------|--------------|------------|
| **Dodo Payments** | **MoR** (India-built) | **4% + $0.40**, +1.5% intl, +0.5% subs → 6-7% effective | **Best India MoR:** INR checkout, **FIRC per payout**, supports UPI/cards/wallets globally, Wise/bank payout, docs for LUT | Handles VAT/GST/sales tax | Built for Indian SaaS founders exporting, addresses FIRC gap explicitly | Young (2024), smaller trust base than Paddle |
| **Creem** | MoR (Estonia, Armitage Labs) | **3.9% + $0.40** (lowest MoR headline), no add-ons | EU founders, early-stage | Handles globally | Cheapest MoR, simple API | Very new (funded 2025 €1.8M), unproven at scale |
| **Polar** | MoR (open-source friendly) | **4% + $0.40** | Global, but docs less India-specific | Handles globally | Popular for OSS/digital products (sh) | Smaller support |
| **Cashfree / PayU** | Direct (India) | ~2% + GST domestic | Strong India domestic alternative to Razorpay | No MoR | Could replace Razorpay for domestic leg | Not global, same GST burden |
| **RevenueCat** | Subscription infra (wraps StoreKit/Billing) | Usage-based | Mobile apps, not web | No | Not for this web suite | Out of scope for web-first |

**Excluded as not material:** CCAvenue/Instamojo (higher fees, dated DX), FastSpring (MoR but 6-8.95%, heavier), Verifone 2Checkout (6-7% MoR, enterprise).

---

## K. Direct Processor vs Merchant of Record

| Dimension | Direct processor (Razorpay, Stripe Direct, Cashfree) | Merchant of Record (Paddle, Dodo, Lemon, Creem) |
|-----------|--------------------------------------------------------|--------------------------------------------------|
| **Who is seller of record?** | You (merchant) | MoR is seller; you are supplier to MoR |
| **GST (India)** | You charge 18% domestic, must file GSTR, export zero-rated only with LUT+FIRC you generate | MoR issues foreign invoice, remits settlement as export proceeds; MoR handles foreign consumption taxes, you handle export documentation with MoR payout advice. May simplify threshold: MoR's foreign sales not your direct B2C foreign invoicing. **Requires CA confirmation on FIRC/LUT flow per MoR** — not automatic. |
| **VAT/GST global** | **Your burden:** Register/collect/file per region or use Stripe Tax (+0.5%/txn) | **MoR burden:** Collects, remits, files in 200+ jurisdictions. |
| **Invoices** | You generate tax invoices (GSTR-compliant) | MoR generates end-customer invoice; you get MoR supplier payout + MoR invoice to you. |
| **Refunds/chargebacks** | You handle, funds clawed from settlement, dispute evidence you provide | **MoR handles** — refund from MoR balance, chargeback liability on MoR (you may see fee $15-25 per chargeback passed through). |
| **Payout** | T+2/T+3 to current account, domestic INR fast | **T+7 to T+15**, often monthly twice (1st/15th), via bank/Wise, USD/EUR → INR with FX margin. Slower. |
| **Fees** | Lower headline (2-3% + GST), but +tax compliance cost (CA, filings) | Higher headline (4-5% + $0.40-0.50 + FX 2-3%) but **tax handling included**. At low MRR (<$5k/mo), MoR fees often cheaper than CA + registrations. |
| **KYC/Onboarding** | Faster (1-3 days), India PG guidelines | Heavier (business verification, UBO, 2-7 days, MoR terms acceptance). |
| **Branding/checkout** | Fully custom checkout (your domain, your UX — premium match) | Hosted/overlay checkout branded MoR (less custom, some UX constraint; Paddle overlay can match dark theme, but not fully native). |
| **Recurring** | You build retry/dunning or use Razorpay Subscriptions | MoR billing handles retry/dunning/proration natively. |
| **Risk** | You are merchant of record — direct acquiring risk. | MoR aggregates risk — your store could be affected by MoR-wide risk decisions (but also shields you). |

**Boundary:** Do not treat this as legal/tax advice. Confirm with CA whether MoR settlement qualifies as export with LUT + bank FIRC, and whether domestic Indian sales via MoR still require GST handling (some MoRs treat Indian customers as domestic and handle GST via local entity — verify per MoR). Mark MoR fee vs CA cost breakeven at ~$3k-8k MRR as estimate, not guarantee.

**Recommendation for this product:** **Start with MoR** — early MRR cannot justify EU VAT registration + US nexus filings + India export paperwork per region. A privacy tool's audience is global from day one (SEO brings US/EU immediately); MoR prevents tax foot-gun. Switch to direct processor only at $50k-100k MRR when fee delta (>1.5%) justifies building tax infrastructure (Flowjam heuristic).

---

## L. Recommended Payment Provider

**Primary recommendation: Dodo Payments (Merchant of Record) — with Paddle as vetted alternative.**

| Rank | Provider | Role | Rationale | Condition to switch |
|------|----------|------|-----------|---------------------|
| **1** | **Dodo Payments (MoR)** | **Primary for MVP monetization** | India-native MoR, **FIRC per payout** documented for LUT zero-rated, supports cards + UPI + wallets internationally, checkout in INR/USD, 4% + $0.40 base (cheapest India MoR), handles VAT/GST globally, purpose-built for Indian SaaS export — directly solves the GST zero-rated gap that Paddle/Lemon leave ambiguous for Indian founders. | If Dodo diligence (terms, DPA, SOC 2, payout proof) fails during 9A contracting or support responsiveness poor, flip to Paddle. |
| **2** | **Paddle (MoR)** | **Alternative / enterprise-grade fallback** | Most mature SaaS MoR, largest trust, deepest billing API, proven at scale. 5% + $0.50 higher fee but lower risk. Choose if prioritizing brand trust over 1% fee. | If fee sensitivity dominates and Dodo trusted, stay Dodo. |
| **3** | **Razorpay (Direct)** | **India-domestic complement (optional dual)** | Add only if UPI-native INR pricing is priority and willing to handle GST filing for domestic segment. Could run **hybrid: Razorpay for INR India customers, MoR for rest-of-world** — but doubles integration complexity; not recommended for MVP. | Evaluate post-MVP if UPI AutoPay conversion materially higher than MoR card+UPI mix. |
| **—** | **Stripe Direct** | **Not recommended now** | Invite-only in India, high risk of no invite; would need US entity. Revisit if US entity formed. | Re-evaluate annually (Stripe said invite capacity may expand H2 2025 — still not open Aug 2026). |
| **—** | **PayPal** | **Optional secondary wallet** | Add as secondary checkout option inside MoR or alongside only if US/EU data shows PayPal preference >15%. Not primary due to no UPI + recurring friction. | Add in 9C if A/B shows +X% conversion with PayPal button. |
| **—** | **Creem / Polar / Lemon** | **Not primary** | Cheaper headline but younger/acquired; Lemon viable for digital products but not best India FIRC story. | Consider if Dodo/Paddle pricing becomes outlier. |

**Why Dodo over Paddle for this product specifically:**
- The suite is **India-operated** (target INR + global) — Dodo's explicit FIRC per payout and India export positioning is the differentiator IncBusiness/StartupTalks rank it 4.8/5 for India. Paddle's generic "remittance" requires CA to prove export.
- Fee: 4% vs 5% is 1 point on $10k = $100/mo saved, meaningful pre-PMF.
- UPI/wallet coverage via MoR is broader in Dodo docs.

**Why keep Paddle as fallback:** If your CA flags Dodo FIRC docs as insufficient or you need SOC 2/audited MoR for enterprise customers, Paddle's 10-year audit trail wins.

**No SDK installed now** — decision only. Phase 9A will integrate the chosen MoR's checkout.js + webhook verification behind the abstraction (§X/Y).

---

## M. Payment-Provider Scorecard (verified Aug 2026, mark estimates)

| Provider | India (domestic) | International | UPI | Cards | Subscriptions | MoR | Taxes handled | Refunds | Webhooks | Fees headline | Real effective* | Payout | Complexity | Recommendation |
|----------|------------------|---------------|-----|-------|---------------|-----|---------------|---------|----------|---------------|-----------------|--------|------------|----------------|
| **Razorpay** | ✅ Native, T+2, FIRC via bank | ⚠️ 3% intl + FX, no MoR | ✅ UPI + AutoPay | ✅ | ✅ (e-mandate/UPI) | No | No (you file GST/VAT) | API + dashboard | HMAC-SHA256 | 2% +18% GST =2.36% dom, 3% intl | 2.36% dom / 3.54% intl inc GST | T+2, INR | Low | **India domestic primary** |
| **PayPal** | ❌ Not for domestic INR | ✅ 200+ countries | ❌ No UPI | ✅ | ✅ (but RBI friction) | No | No | Dashboard | Cert verify | ~4.4% + fixed + 3-4% FX | ~5-7% effective export | T+1 INR, $5 min | Medium | Secondary wallet |
| **Stripe (India)** | ⚠️ Invite-only, cannot self-serve | ✅ Excellent if US entity | ❌ | ✅ | ✅ Excellent | No | Opt Stripe Tax +0.5% | API | HMAC `stripe-signature` | 2% dom +GST, 3-4.3% intl +2% FX | 2.36% / 5-6% inc GST+FX | T+2-T+7 | Low if access | **Not viable now** |
| **Paddle** | ✅ Via MoR (INR checkout) | ✅ 200+ tax jurisdictions | ✅ via checkout wallets | ✅ | ✅ Full billing + dunning | **Yes** | **Yes global VAT/GST/sales tax** | MoR handled | HMAC | 5% + $0.50 | 7-10% inc FX | T+7-15, USD→INR | Medium | **Global fallback MoR** |
| **Lemon Squeezy** | ✅ Via MoR | ✅ | ✅ via checkout | ✅ | ✅ | **Yes** | **Yes** | MoR | HMAC | 5% + $0.50 (+1.5% x-border reported) | 7-10% | T+7-15 | Low | Viable, not India-optimized |
| **Dodo Payments** | ✅ **MoR India-native, FIRC/payout** | ✅ | ✅ UPI+cards+wallets | ✅ | ✅ +0.5% subs surcharge | **Yes** | **Yes** | MoR | HMAC | **4% + $0.40** (+1.5% intl, +0.5% sub) | **6-7% intl sub** | T+7-15, FIRC | Medium | **Primary MoR** |
| **Creem** | ⚠️ EU base, global | ✅ | ✅ | ✅ | ✅ | **Yes** | **Yes** | MoR | HMAC | **3.9% + $0.40** lowest | ~6-6.5% | T+7-15 | Low | Cheapest, youngest |

*Effective = headline + FX 2-3% + GST 18% where applicable; ranges not guarantees. Verify with provider docs before contracting.

---

## N. Advertising Analysis

**Market reality for a tool site:**
- Tool sites are **high pageviews, low intent** vs content blogs — RPM is driven by geo (US/UK $8-25, EU $5-15, India $1-5 for display; video/interstitial can 2-3× but UX cost). For local-processing tools (no cloud), ad impressions are on landing/tool pages, not in-processing (never inside worker).
- Ad-block rate: 25-40% on tech-savvy audiences (our audience) — actual monetizable impressions 60-75% of pageviews.
- SEO: Core Web Vitals are revenue-critical — ad scripts are the #1 LCP/CLS killer. Must be lazy-loaded, not in critical path.

---

## O. AdSense Analysis

**Verified via [Google AdSense Help](https://support.google.com/adsense/answer/9724) + 2026 checklists:**
- Eligibility: **18+, own content meeting policies, HTTPS, privacy/refund/contact pages, access to HTML for snippet**, 15-30 original articles 1000+ words for new sites (tool pages count but thin affiliate/spun content rejected); India: bank in own name + address PIN mailed. Custom domain required (subdomain on free blog not eligible). This product qualifies once privacy/terms/contact live + sitemap/robots.
- Approval: Manual review 1-7 days, can be rejected for "low value content" (tool pages without real copy = risk — needs real FAQ/seoDescription per tool — already present per §B).
- Formats: Display (auto/responsive), in-article, in-feed, matched content, video. **Auto ads** must be off or tightly controlled (they inject CLS).
- Privacy/Consent: **Requires consent for personalized ads/personalized cookies** in EU/EEA + UK (TCF 2.2 via Google UMP/CMP), California (CCPA opt-out), etc. India: IT Act + DPDP Act (2023, consent manager required when enforced) — **non-personalized/contextual is safer for privacy brand**.
- RPM potential: **India display $1-4, US $8-20, mixed $3-8** for tool niche (not finance). Not guaranteed; AdSense does not publish CPM.
- Payout: **$100 threshold (₹8,200)**, bank transfer in INR, NET30 (e.g., Jan earnings → Feb 21-26 payout), $0 fee.
- Policy strictness: Prohibited: incentivized clicks, misleading near download buttons, interstitials covering core content, pop hijack. **Placing ads near "Download" is policy violating and privacy-conflicting.**

**Verdict for this product:** Viable **only after traffic >10k monthly + 15-30 indexed tool/guide pages** and with consent + non-personalized mode for privacy alignment. Not day-1.

---

## P. Monetag Analysis

- Model: PropellerAds spinoff, **easy approval 24-48h**, even low-traffic (1k visits).
- Formats: **Push Notifications, In-Page Push, Popunder, Interstitial, SmartLink (redirect), Vignette, MultiTag**. No classic display purity.
- RPM guidance (Finbyte/partner blogs, not Monetag fixed public CPM because RTB): **$3-15 RPM** claimed, India pop $1-5, US push $5-10 — **higher than AdSense in India reportedly** but via intrusive formats.
- Payout: **$5 threshold**, PayPal/Payoneer/bank, NET30 (weekly at $100+). Approval easy.
- Privacy/Consent: Also requires consent for push/pop where cookies, but less strict UX. **Popunder + interstitial break premium cinematic brand**; push requires opt-in that many users deny.
- Tradeoff: Monetag revenue comes from **attention-hijacking formats** — directly conflicts with §37-38 requirements (no interception, no deceptive near download, no break in processing controls).

**Verdict:** **Not recommended for this premium privacy brand** unless running a separate ad-heavy landing outside core tool UX — which would still leak brand trust. If ever used, restrict to **In-Page Push / Interstitial only, lazy, outside tool-shell**, never popunder.

---

## Q. Other Ad Alternatives

| Alternative | Strength | Privacy fit | RPM estimate* | Payout | Recommendation |
|-------------|----------|-------------|---------------|--------|----------------|
| **Carbon Ads** | Design/dev audience, clean, non-tracking | **High** (contextual) | $8-20 (if design niche) | $100 | Best brand fit but invite/niche — reach out later, not day-1 |
| **EthicalAds (ReadTheDocs)** | Privacy-first, no tracking, open-source funded | **Highest** | $3-6 | Donation-like | Excellent privacy alignment, but low fill for general PDF tools |
| **Infolinks** | In-text | Medium | $1-3 | $50 | Low UX, not premium |
| **Mediavine / Raptive** | Premium, high RPM, but require 50k/100k sessions | Low privacy concern if contextual | $15-35 on premium traffic | NET65 | Not eligible now (sessions threshold); future if 100k MAU |
| **BuySellAds** | Direct sponsorships | High if direct | Fixed deals | Custom | Could sell "privacy tool sponsorship" later to B2B (PDF SDKs) |

*Estimates, not guarantees. Mark as scenario ranges.

**Not recommended now:** Taboola/Outbrain (clickbait, destroys premium), Adsterra (similar to Monetag intrusive).

---

## R. Advertising Scorecard

| Provider | India support | Global | Approval | Privacy | Consent req | Formats | RPM potential* | UX impact | Payout threshold | Recommendation |
|----------|---------------|--------|----------|---------|-------------|---------|----------------|-----------|-----------------|----------------|
| **AdSense** | ✅ Full (bank PIN) | ✅ 200+ but personalization requires TCF/CCPA | Strict (1-7d, content bar) | ⚠️ Personalized by default, contextual opt available | **Yes (UMP/CMP in EU/CA)** | Display, in-article, auto | India $1-4, US $8-20, Mixed $3-8 | Low if auto off, high if auto on | $100 | **Primary when eligible** (contextual/non-personalized for brand) |
| **Monetag** | ✅ Easy, good India fill | ✅ | Very easy (24-48h) | ⚠️ Pop/push intrusive, cookies where allowed | Yes for push/pop | Push, Popunder, Interstitial, SmartLink | $3-15 claimed, India $1-5 realistic | **High (pop/interstitial break premium)** | $5 | **Not for premium UX** |
| **Carbon / EthicalAds** | ✅ | ✅ | Invite/niche | ✅ Privacy-first | Minimal (contextual) | Small display, text | $3-20 (niche dependent) | Very low | $50-100 | **Best brand fit later** |
| **Mediavine** | ✅ | US/EU premium | 50k sessions | Contextual option | Yes | Premium display | $15-35 | Low (lazy) | $25 | Future at scale |

---

## S. Privacy/Ads Architecture

**Non-negotiable:** Local tools remain **zero-upload, zero file storage, zero EXIF transmission** — ads must not touch file data.

```
tool-shell (client, WASM)
  ├─ ToolHeader (no ads — SEO heading, description, FAQ)
  ├─ ToolShell (dropzone → worker → preview → download)
  │    └─ NO ADS INSIDE — processing controls, canvases, workers are ad-free
  ├─ AdSlot (optional, lazy, outside ToolShell, below fold)
  │    └─ loads only if canShowAds()=true AND consent granted AND not in-processing
  └─ Related tools + FAQ (ads may appear between sections, never overlay)
```

Rules:
- **Never** load ad script during `processingType pdf/image/bg` worker active — queue after `download` or idle.
- **Never** pass file name/size/MIME to ad request — only page URL + entitlement tier (free/premium), no file metadata.
- **Contextual only by default:** `ads_data_processing_options = non-personalized` (AdSense `npa=1` equivalent; no user fingerprinting). Personalized only if explicit CMP consent and tier is free.
- **Ad script lazy:** `next/script strategy="lazyOnload"` + `loading="lazy"` slot, `fetchPriority="low"`, not in critical CSS/JS. Measured not to regress LCP >200ms.
- **Ad block friendly:** If `adBlocked`, degrade gracefully — no nag, no gate. Premium upsell is via value, not ad-block shaming.
- **CSP:** Ad provider domains must be allowlisted in `connect-src`/`script-src` only when ads enabled — not in baseline CSP (§P). Phase 9D will add nonce-based CSP for ad domain, not `unsafe-eval`.

**Privacy regression:** `privacy-net.spec.ts` must extend: anonymous-free + premium + ad-enabled pages still `POST []` file bytes.

---

## T. Consent Requirements (architecture only, no CMP installed)

| Region | Requirement | Ad behavior | CMP needed |
|--------|-------------|-------------|------------|
| **EU/EEA + UK** | GDPR + ePrivacy, TCF 2.2 for personalized ads/cookies (IAB). | Without CMP consent, **non-personalized / contextual only**; with consent, personalized allowed. Google requires certified CMP for AdSense personalized in EEA/UK. | **Yes** if ever serving personalized ads to EEA/UK — integrate **Google UMP** or IAB-certified CMP (Usercentrics, CookieYes) lazy. |
| **California (US)** | CCPA/CPRA opt-out of sale/share, "Do Not Sell" signal. | Must respect Global Privacy Control + provide opt-out link. Non-personalized still allowed. | Consent banner with opt-out; less heavy than EU. |
| **India** | **DPDP Act 2023** (Digital Personal Data Protection) — consent manager required, but rules partially enforced 2025-2026; IT Act cookies disclosure. | Require privacy policy disclosing ad cookies + consent collection where personalized. For now, **contextual non-tracking** largely satisfies. | Lightweight consent notice; full consent manager when DPDP enforcement matures — prepare abstraction. |
| **Canada (Quebec), Brazil, AU** | PIPEDA/LGPD equivalents, consent for tracking. | Contextual safe fallback. | Regional banner if traffic >10% from region. |
| **Elsewhere (SEA, etc.)** | Disclosure sufficient. | Contextual. | No. |

**Phase 9D architecture:** `lib/consent.ts` abstraction `getConsentTier(region)-> {required, grantedPersonalized, cmp}`; `canLoadPersonalizedAds()` checks consent. For MVP, **force `npa=1` / contextual**, CMP deferred until traffic justifies.

---

## U. Free-Tier Strategy

**Principles:** Do not fake limits that require file inspection on server; use client limits + authenticated usage counters (not file bytes) for anti-abuse if needed.

| Tier | Who | File size | Batch/pages | Daily usage | Ads | Account |
|------|-----|-----------|-------------|-------------|-----|---------|
| **Anonymous free** | No signup, 95% of traffic | **50MB/file, 5 files, 200 pages, 12000px, 100MB total** (existing caps) | Per-operation: merge 50 files / split 1 file / compress 1 file | **No daily cap initially** (local CPU, no server cost). If abused, add **client rate-limit 30 ops / 10min via memory + server `/api/usage` counter on IP-hash** (not file). | **Yes (contextual, lazy, outside shell)** | Not required |
| **Authenticated free (FREE plan)** | Signed-up FREE | Same caps as anonymous, + **saved preferences** | Same, + history (future) | Same as anon, but **linked to userId for abuse counting** | **Yes (same as anon)** — can be toggled less aggressive if retention data shows | Required (verified email) |
| **Premium** | Paid ACTIVE | **Lifted: 100MB/file, 100 files, 500 pages, unlimited px (15k), 500MB total, 30s timeout 60s** | Unlimited batch where local allows | **No daily cap** | **No ads** | Required |

**Why not stricter anonymous caps now?** Local processing is truly local — stricter caps don't save server cost, they just annoy. Add daily identity-based caps only when abuse metrics (spam, bot) justify. Documented as anti-abuse via `Entitlement` + `AuditEvent`, not file upload.

**File size enforcement:** Already at `lib/tools.ts` `maxFileSize` + `file-safety.ts` — stays client-side, no server sees size.

---

## V. Premium Strategy

**Value (no artificial crippling of local CPU): legitimate upsell:**

| Feature | Free | Premium | Why premium can charge |
|---------|------|---------|------------------------|
| **No ads** | Ads outside shell | **No ads** (`canShowAds()=false`) | Clean cinematic UX, privacy |
| **Higher limits** | 50MB/200p/12000px | 100MB/500p/15000px + 100 files + 60s | Power users genuinely need bigger PDFs |
| **Batch** | Merge 50, split 1 at a time | **Batch split/compress** (queue N files) | Workflow saving |
| **Advanced controls** | Basic compress quality, resize preset | **Fine-grained:** PDF quality slider + image quality 1-100 + resize custom + EXIF selective keep | Pro users need control |
| **Saved preferences** | Session only | **Persisted to account** (compression level, output format) | Convenience |
| **History/recent** | None | **Recent outputs metadata only** (name, date, size — never file bytes) | Privacy-safe convenience |
| **Future cloud** | Local only | Priority if cloud OCR/background removal ever added (not now) | Honest future value |
| **Support** | Community | Email priority | Margin |
| **Commercial use** | Personal | Team/Commercial flag (future) | B2B |

**Not premium:** Watermark (we never watermark), speed throttle (unethical to fake slowness), file count 1 vs 2 arbitrary.

---

## W. Pricing Recommendation

**Competitor anchor:** Smallpdf $108/year ($9/mo), iLovePDF $48/year ($4/mo), Adobe $240/year. India price sensitivity is 3-4× vs US.

**Proposed starting prices (before A/B, inclusive of MoR fees, not final checkout amounts):**

| Tier | INR (India via MoR local pricing) | USD (US/EU via MoR) | EUR/GBP equiv | Limits | Target user | Rationale: conversion × retention × margin × trust |
|------|-----------------------------------|---------------------|---------------|--------|-------------|---------------------------------------------------|
| **Free** | **₹0** | **$0** | €0 / £0 | §U free caps, ads contextual | Students, casual, SEO traffic 95% | No friction — maximizes SEO + word-of-mouth (PDF24 model) |
| **Premium Monthly** | **₹199/mo** (~$2.40) | **$5/mo** | €5 / £4.50 | Premium caps + no ads + advanced controls + history | Power users, monthly testers, India price-sensitive pros | India ₹199 is under ₹500 RBI friction, under iLovePDF $7, impulse tier. US $5 under Smallpdf $12 by 58% — defensible value. MoR margin after 4-5% fee: ₹191 / $4.75 net. |
| **Premium Annual** | **₹999/year** (~$12, **₹83/mo effective, 58% off monthly**) | **$39/year** (**$3.25/mo, 35% off monthly**) | €39 / £35 | Same + best value | Committed users, annual is retention engine (single charge, LTV) | India ₹999 is familiar impulse (under ₹1k lakh threshold), LTV hedging. US $39 beats iLovePDF $48 by 19%. Annual is where profit concentrates — 80% of revenue should aim annual. |
| **Lifetime (optional, limited)** | **₹3,999** (~$48) | **$99** | €99 / £89 | Same, lifetime of product (support 3 years, then grandfather) | Early adopters, deal hunters | Must be **3–4× annual** to not cannibalize subs: $99 / $39 = 2.5× — low. Recommend **$129** if offered (3.3×) or **not offered at launch** to protect recurring. **Recommendation: DEFER lifetime to Phase 10** until retention known; offer only as limited 500-seat founder deal if needed for cash. |

**Why not higher:** Local costs are low; trust is built by fair pricing, not by anchoring $15/mo like cloud-heavy competitors. Conversion at $5 beats $12 (competitor fatigue).

**Grandfather clause:** Lifetime if ever sold is **non-transferable, no refund after 14 days**, clearly "lifetime of product, not your lifetime".

**Display:** Show INR to IN geolocated IPs, USD elsewhere (MoR handles). No hard INR-only — let MoR detect.

---

## X. Entitlement Architecture (provider-independent, already exists — extend only)

```ts
// Prisma (existing schema.prisma — no file bytes, already correct)
model Entitlement {
  id        String   @id @default(cuid())
  userId    String   @unique
  plan      String   // FREE | PREMIUM | ADMIN | EXPIRED | CANCELLED
  status    String   // ACTIVE | EXPIRED | CANCELLED
  source    String?  // dodo | paddle | razorpay | manual
  providerCustomerId String? // MoR customer id (never card)
  providerSubscriptionId String? // MoR subscription id
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  expiresAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([plan, status])
}

// lib/entitlement.ts (existing, unchanged contract)
// Plan = "FREE"|"PREMIUM"|"ADMIN"|"EXPIRED"|"CANCELLED"
// EntitlementStatus = "ACTIVE"|"EXPIRED"|"CANCELLED"
// getEntitlement(userId) — server only, checks expiresAt
// hasEntitlement(ent, required) — server only
// canShowAds(ent) — PREMIUM/ACTIVE+ADMIN=false, else true
// getDisplayPlan(ent)
// All tool code uses hasEntitlement/canShowAds, never Razorpay/Paddle/Dodo imports
```

Payment providers **never** touched by tool code — only by `lib/payments/*` → `Entitlement`.

---

## Y. Payment State Machine

```
[FREE] ── checkout ──▶ CHECKOUT_STARTED ── payment intent ──▶ PAYMENT_PENDING
                              │                         │
                              │ webhook verified        │ webhook verified
                              ▼                         ▼
                           ACTIVE ◀────────── PAYMENT_PENDING
                             │
                             ├──── renewal success ───▶ ACTIVE (periodEnd+)
                             │
                             ├──── cancel (user/MoR) ──▶ CANCELLED ──▶ EXPIRES(expiry) ──▶ EXPIRED
                             │         (still ACTIVE until currentPeriodEnd)
                             │
                             ├──── failed renewal ──▶ PAST_DUE ── grace 7d ──▶ ACTIVE (if retry) or EXPIRED
                             │
                             ├──── refund ──▶ REFUNDED ──▶ EXPIRED (or remain ACTIVE per policy — see §AA)
                             │
                             └──── chargeback/dispute ──▶ UNDER_REVIEW ──▶ SUSPENDED or ACTIVE (if won)

Out-of-band:
FAILED (payment_failed webhook) → stays FREE or CANCELLED with reason
DUPLICATE webhook → idempotent no-op (eventId dedup)
OUT-OF-ORDER (cancel before active) → persist events ordered by provider timestamp, last-writer-wins per webhook timestamp
```

**States persisted:** `Entitlement.status` + `PaymentEvent` log (provider, eventId, type, timestamp, payload hash, processed).

---

## Z. Webhook Architecture (design, not implemented)

**Required (MoR webhooks: Paddle `paddle-billing`, Dodo `dodo-webhook`, Lemon `lemon-webhook`):**

1. **Signature verification:** `HMAC-SHA256` of raw body with webhook secret (never JSON-parsed body). `timingSafeEqual`. Reject if missing `signature` header or mismatch → `400`.
2. **Timestamp validation:** `event.timestamp` within ±5min of server time; else `400` (replay window). Some MoRs include `X-Timestamp`.
3. **Event persistence BEFORE processing:** Insert into `PaymentEvent` table `(provider, providerEventId UNIQUE, type, receivedAt, payload JSON, verified bool)` — `providerEventId` unique constraint prevents dupes.
4. **Idempotency:** If `providerEventId` already exists, return `200` immediately (no re-processing). Log duplicate.
5. **Ordering tolerance:** Process by `event.occurredAt` not receipt order; if `subscription.cancelled` arrives before `subscription.activated` (rare), buffer or reorder by storing and applying last event by `occurredAt` after both received. Simpler MVP: process in receipt order but `status` transition guards allow out-of-order (cancel after active check).
6. **Replay protection:** `providerEventId` dedup + signature covers it; no client-supplied event.
7. **Server authoritative:** Webhook updates `Entitlement` via `lib/payments/verifyWebhook()` → `updateEntitlement()` only. **Never trust** `frontend says success` (client `?success=1` redirects to poll `GET /api/payments/status` which reads DB/webhook, not client param).
8. **Retry:** MoR expects `2xx` in <10s or retries with backoff (Paddle retries 3×). Handler must be fast (<2s) — queue work if needed (`PaymentEvent.status=pending` → background reprocess).
9. **Audit:** Every webhook transition calls `auditEvent(userId, "payment.webhook."+type, { provider, eventId })` — no PII beyond email/provider ids.

**Tables (future migration):**
```prisma
model PaymentEvent { id String @id @default(cuid()); provider String; providerEventId String @unique; type String; payload Json; verified Boolean; processedAt DateTime?; createdAt DateTime @default(now()); @@index([provider, type]) }
model PaymentSession { id String @id @default(cuid()); userId String; provider String; providerCheckoutId String @unique; status String; amount Int; currency String; createdAt DateTime @default(now()); }
```

---

## AA. Refund/Cancellation Architecture

| Action | Provider behavior | Entitlement policy | Grace | Implementation |
|--------|-------------------|--------------------|-------|----------------|
| **Refund (full, within 7-14d)** | MoR `refund` webhook `payment.refunded` or `refund.created` | **Immediate:** `status=CANCELLED→EXPIRED` or `EXPIRED`; if pro-rata partial, keep `ACTIVE` until `currentPeriodEnd` but mark `refundedAt` | No — immediate | Webhook sets `expiresAt = now`, audit `payment.refunded` |
| **Refund (outside window / partial)** | Manual dashboard | Case-by-case: partial stays `ACTIVE`, full expires | — | Dashboard + audit |
| **Cancellation (user cancels)** | `subscription.cancelled` webhook, `cancel_at_period_end: true` common | **Remain ACTIVE until `currentPeriodEnd`** (MoR standard) — `status=CANCELLED` but `hasEntitlement` still true until expiry, then `EXPIRED` on cron/webhook | Entitled until period end | Webhook → `status=CANCELLED`, `expiresAt=currentPeriodEnd`, nightly job (or on `getEntitlement` expiry check) → `EXPIRED` |
| **Immediate cancellation (support)** | `subscription.cancelled effective_immediately` | Immediate `EXPIRED` | No | Admin action → `updateEntitlement` |
| **Failed renewal** | `subscription.payment_failed` / `payment.failed` + dunning retries 3-7 days | **Grace 7 days** `status=PAST_DUE` but `hasEntitlement=true` (soft), email `payment failed` via existing Resend abstraction | 7d | MoR dunning + `currentPeriodEnd+7d` grace counter, then `EXPIRED` if not recovered |
| **Chargeback/dispute** | `dispute.created` / `chargeback` | **SUSPEND/UNDER_REVIEW** — `status=CANCELLED` or custom `SUSPENDED`, revoke premium pending outcome, audit. If won, reactivate. | Manual review | Webhook → `status=SUSPENDED`, admin queue |
| **Duplicate webhook** | Same `providerEventId` | No-op (idempotent) | — | Unique constraint |

**Emails triggered (via `lib/email` abstraction, not yet implemented):** `payment.receipt`, `subscription.activated`, `subscription.renewed`, `payment.failed`, `subscription.cancelled`, `refund.issued`.

---

## AB. Revenue Model (formulas, assumptions marked)

**Assumptions (estimates, not guarantees):**
- Tool sessions: 1 MAU ≈ 2.5 tool sessions/month (one user returns 2-3 times). 1 session ~1.5 pageviews (tool + homepage).
- Conversion: modeled 0.5–5% (see §AE), baseline 1.5% for planning.
- Premium mix: 70% annual ($39), 30% monthly ($5) at steady state — annual drives LTV.
- Ad monetization rate: 65% (ad-block + consent non-personalized fill 60-70% of pageviews).
- MoR fee 4.5% effective (Dodo 4%+mix), AdSense 68% rev share already in RPM.
- Infrastructure: Vercel Pro $20 + Postgres (Neon/Supabase) $25 + Upstash $25 + Resend $20 + domain $15 = **~$105/mo base** (scales sublinearly to 100k MAU ~$300-500).
- Email: $0.001/email (Resend 100/day free, then $20/50k).

**Formula:**
```
ad_impressions = MAU * sessions_per_MAU * pageviews_per_session * monetizable_rate
ad_revenue = ad_impressions * RPM / 1000
premium_users = MAU * conversion
subscription_revenue = premium_users * (0.7 * annual/12 + 0.3 * monthly)
moR_fees = subscription_revenue * 0.045
infrastructure = $105 + (MAU>10000? scaling)
net = ad_revenue + subscription_revenue - moR_fees - infrastructure - email
```

---

## AC. Unit Economics (per-user, at baseline 1.5% conversion, mixed geo $5 RPM)

| Unit | Per free user (ad-supported) | Per premium user | Note |
|------|------------------------------|------------------|------|
| **Revenue** | $0.008–0.020/mo (ad) via $3-8 RPM blended, 65% monetizable | $5/mo or $3.25/mo effective annual ($39/12) blend ~$3.82/mo avg | Local processing zero marginal compute — truly $0 variable |
| **Payment fees** | $0 | ~$0.17/mo (4.5% of $3.82) | MoR |
| **Email** | ~$0.0005 (account verification etc. amortized) | ~$0.002 (receipts/renewal) | Resend |
| **Infrastructure** | ~$0.002–0.01 (shared base) at 10k MAU | same shared | Base largely fixed |
| **Support burden** | ~$0 (self-serve) | ~$0.20 (estimated 2% contact rate) | Not staffing |
| **Net contribution** | **~$0.005–0.015** | **~$3.44** | Premium is 230× free per user — why subscription is engine; ads alone need volume |

**Takeaway:** At 10k MAU with 1.5% conversion (150 premium @ $3.82 avg) = ~$573/mo subscription + ~$120 ad = $693 gross, minus ~$26 fees + $150 infra/email = **~$517 net** before CAC/support. Ads are 17% of revenue at this scale.

---

## AD. 1k / 10k / 100k MAU Scenarios (estimates, clearly marked)

**Blended subscriptions: 70% annual effective $3.25, 30% monthly $5 → avg $3.82/mo. RPM $5 mixed (India-heavy $2, intl-heavy $8 — see §AF). Sessions 2.5, PV 1.5, monetizable 65%.**

| MAU | Free users | Premium users (1.5% conv) | Ad imp | Ad rev ($5 RPM) | Sub rev | MoR fees 4.5% | Infra+email | **Net/mo** | Net/year |
|-----|------------|---------------------------|--------|-----------------|---------|---------------|-------------|------------|----------|
| **1,000** | 985 | 15 | 2,437 | **$12** | **$57** | –$3 | –$105 base | **–$39** | –$468 |
| **10,000** | 9,850 | 150 | 24,375 | **$122** | **$573** | –$26 | –$150 | **$519** | $6,228 |
| **100,000** | 98,500 | 1,500 | 243,750 | **$1,219** | **$5,730** | –$258 | –$400* | **$6,291** | $75,492 |

*100k infra scales to $300-500 for DB/edge bandwidth (still local processing, so no worker fleet).

**If conversion 3% (double):** 100k net rises to ~$12k/mo. **If conversion 0.5% (third):** 10k net drops to ~$100/mo. See §AE.

**Ad-only (no premium):** 100k MAU at $5 RPM = $1,219/mo — not profitable as solo (needs premium). India-heavy $2 RPM = only $488/mo.

---

## AE. Premium Conversion Sensitivity (estimates)

| Conversion | Premium users at 10k MAU | Sub rev (/mo) | Ad rev | Net/mo (mixed $5 RPM) | Net at 100k MAU |
|------------|--------------------------|---------------|--------|----------------------|-----------------|
| **0.5%** | 50 | $191 | $122 | ~$137 | ~$2,100 |
| **1%** | 100 | $382 | $122 | ~$328 | ~$4,200 |
| **2%** | 200 | $764 | $122 | ~$710 | ~$8,400 |
| **3%** | 300 | $1,146 | $122 | ~$1,092 | ~$12,500 |
| **5%** | 500 | $1,910 | $122 | ~$1,856 | ~$20,800 |

**Do not assume 5%.** Industry for utility tools is **1-3%** when value is no-ads + limits (iLovePDF converts at ~2-3% with heavy paywall). Local privacy niche may start at **1%** before trust builds. Model baseline at **1.5%**.

---

## AF. Advertising Revenue Scenarios (ranges, not promises)

`ad revenue = MAU * 2.5 * 1.5 * 0.65 * RPM/1000` → `MAU * 2.4375 * RPM/1000`

| Traffic mix | RPM assumption* | 10k MAU ad/mo | 100k MAU ad/mo | Note |
|-------------|-----------------|---------------|----------------|------|
| **India-heavy 80% IN** | **$1.5–3** | $37–73 | $366–731 | AdSense India display real, Monetag pop higher but not used |
| **Mixed 50/50 IN/US-EU** | **$4–8** | $98–195 | $975–1,950 | Planning baseline $5 |
| **International-heavy 80% US/EU** | **$10–20** | $244–488 | $2,438–4,875 | Best case, requires SEO US traffic (hard from India start) |
| **With Mediavine (50k+ sessions, premium)** | **$15–25** | — (not eligible) | $3,656–6,094 | Future only |

*Ranges per industry reports + AdSense publisher anecdotes; network does not publish fixed CPM. Premium RPM needs 2k+ word guides, not tool pages.

**Conclusion:** Ads alone at India-heavy traffic cannot fund premium-infra ambition before 50k MAU; hybrid is required (see §AG).

---

## AG. Recommended Business Model

**Primary: Free local tools + contextual/non-personalized ads + Premium no-ads & higher-limits subscription (Model C + D) — with MoR.**

**Why this model (evidence-backed):**
- Target customer: **India + global "privacy-aware casual"** (students, freelancers, office workers doing 2-5 PDFs/month) + **small-business power users** (10-50 PDFs/month). The former monetize via light ads (no account), the latter convert to $39/year to remove ads and batch.
- Expected conversion: **1.5% at 12 months** (150 per 10k MAU), growing to 2-2.5% with premium polish — conservative vs iLovePDF's ~2-3%.
- Revenue split at 10k MAU: **~82% subscription, 18% ads** — ads fund free tier discovery, subscription is profit.
- Major risks: (1) Ad RPM overstated — mitigate by not counting ad revenue in runway; (2) MoR 4-5% fee — acceptable pre-$50k MRR; (3) Ad privacy vs brand — mitigate via contextual only, no personalized without CMP, no pop; (4) Conversion under 1% if free too generous — mitigate via honest caps (§U) not paywalls inside workers.

**Not chosen:**
- A alone → India RPM too low, leaves money from converters.
- B alone → wastes 98% free traffic SEO value.
- E/F lifetime alone → no recurring, supports forever.

**Defensibility:** Verifiable local processing + no account free + dark cinematic premium UX + India-native pricing (₹199 vs $5) is not copied from incumbents (who are cloud/upload). The moat is trust + price.

---

## AH. Implementation Roadmap (no execution now)

### Phase 9A — Architecture decision (this phase)
- Finalize this report, get approval on MoR choice (Dodo primary / Paddle fallback) + pricing (₹199/$5, ₹999/$39).

### Phase 9B — Payment provider integration
- Create `lib/payments/types.ts` `PaymentProvider` interface (§X), `lib/payments/dodo.ts` + `paddle.ts` adapters (no secrets hard-coded), `PRISMA` migration for `PaymentEvent/PaymentSession + Entitlement source/providerSubscriptionId`, checkout creation route `POST /api/payments/checkout` (server only, validates entitlement, returns checkout URL), success/cancel pages polling `GET /api/payments/status`.

### Phase 9C — Subscription lifecycle
- Webhook route `POST /api/payments/webhook/[provider]` with signature + idempotency (§Z), state machine (§Y), grace/failed payment + email via `lib/email`, customer portal via MoR hosted portal, cancellation/refund flows (§AA).

### Phase 9D — Advertising integration (deferred until traffic threshold)
- `lib/ads.ts` `canShowAds()` already exists — add `lib/consent.ts` abstraction, `components/ads/AdSlot.tsx` lazy slot outside `ToolShell`, CSP allowlist for ad domain only when enabled, `next/script lazyOnload`, privacy-net extension, CMP (UMP) only if personalized needed.

### Phase 9E — Billing/account UX
- `/account` extension: plan card, billing period, manage subscription (MoR portal link), invoices/receipts list, cancel/upgrade CTAs, dark cinematic matching existing auth pages, a11y same standards.

### Phase 9F — Revenue analytics (privacy-preserving)
- No file data — only aggregate: `PaymentEvent` counts, conversion funnel (anon → signup → checkout → active), ad impressions via ad provider dashboard only (no custom file analytics), audit events for subscription changes.

---

## AI. Security Requirements (future payment system)

- Never store raw card data / PAN — **hosted checkout only** (Dodo/Paddle checkout.js hosted).
- Secrets (`DODO_API_KEY`, `DODO_WEBHOOK_SECRET`, `PADDLE_API_KEY`, etc.) in `env` server-only, never `NEXT_PUBLIC`, `.env.example` templated, `production-config` enforcement like `AUTH_SECRET`.
- Webhook signature verification with `timingSafeEqual` on **raw body** (not parsed JSON), timestamp +5min, providerEventId unique.
- Idempotency: `PaymentEvent` unique + `Entitlement` update guarded by transaction.
- No entitlement spoofing: `Entitlement` is server DB + `hasEntitlement()` server; client never writes plan. No `localStorage`/`Zustand` plan. `canShowAds()` server-derived.
- Audit every state change via `auditEvent(userId, "payment.*", {provider, eventId})` — no card/PII beyond email.
- CSP: payment checkout domain allowlisted narrowly (`connect-src`, `frame-src`).

---

## AJ. Privacy Requirements

- Payment requests contain **billing info only** (email, plan, amount, currency, country for tax) — **NEVER** file bytes, file name, EXIF, preview, worker data.
- Tool workers remain `local` — payment script not loaded inside worker; no worker import of payment SDK.
- Ad scripts **never** receive file metadata (see §S).
- Analytics for revenue: aggregate counts only, no file dimensions exfiltrated.
- Receipt/invoice generation: store `PaymentSession` amount/currency/timestamp + MoR invoice URL, not billing address beyond tax-required minimum (MoR handles address; we avoid collecting if possible — minimal billing address principle).

---

## AK. Legal/Tax Items Requiring Professional Confirmation

Clearly separate from engineering conclusions:

| Item | Status | Requires CA/legal |
|------|--------|-------------------|
| **MO** | | |
| Whether Dodo/Paddle settlement as MoR is export of services eligible for **zero-rated GST (0%) with LUT + FIRC** vs 18% payable | **Inference:** Many Indian MoR founders claim yes with payout FIRC, but depends on MoR agreement and bank acceptance. | **YES — CA + GST consultant** |
| Domestic Indian sales via MoR: does MoR handle **Indian GST (18%)** via local entity or must you still file? | Provider docs say MoR handles local GST, but verify contract. | **YES — CA** |
| LUT filing requirement (annual letter of undertaking for export) | Documented requirement for zero-rated. | **YES — CA** |
| FIRA vs FIRC naming (bank advice) and whether MoR payout advice qualifies | Varies by AD bank. | **YES — CA/bank** |
| US sales tax nexus thresholds for MoR vs direct | MoR handles; direct you register. Thresholds by state ($100k). | **YES — US tax advisor if direct** |
| EU VAT MOSS handling | MoR handles; direct requires OSS. | **YES — EU tax advisor if direct** |
| Refund invoicing (credit notes) GST treatment | Depends on refund timing. | **YES — CA** |
| Dispute/chargeback liability language in MoR terms | Review Dodo/Paddle MoR agreement. | **YES — legal** |
| Privacy/DPDP Act consent for ads/cookies + disclosure wording | DPDP enforcement timeline evolving. | **YES — legal** |
| RBI e-mandate interpretation for your price points (₹199 < ₹15k, so no AFA) | Straightforward per RBI framework. | **Low risk — verify with Razorpay/MoR docs** |
| Business structure (sole prop vs Pvt Ltd) for PG KYC + liability | PG requires business PAN/current account. | **YES — CA/company secretary** |

**Provider documentation vs inference:** Fee percentages, MoR tax-handling claim, UPI methods are from provider docs/blogs; economic models (§AB-AD) are engineering estimates; legal/tax classification (§K, this section) requires professional confirmation and must not be presented as advice.

---

## AL. External Dependencies (classified correctly — no install now)

| Dependency | Needed before money flows | Action required |
|------------|---------------------------|-----------------|
| **Domain + business registration** (PAN, GSTIN optional but needed for export) | PG/MoR KYC | Register business / sole prop, current account, GSTIN if exporting |
| **Dodo Payments account** (or Paddle fallback) | Checkout + webhooks | Apply at dodo or paddle, business verification 2-7 days, get `API_KEY/WEBHOOK_SECRET`, configure webhook URL `https://localfile.app/api/payments/webhook/dodo` |
| **Bank/Wise for payouts** | Settlement | Connect payout bank (INR) + verify FIRC handling with AD bank |
| **Razorpay account** (if hybrid) | India UPI direct | Optional — not needed if MoR covers UPI |
| **AdSense account** | Ad revenue | Apply after 15-30 indexed pages + privacy/terms/contact; approval not guaranteed |
| **CA/legal consult** | GST/LUT/FIRC confirmation | Before first foreign payout |
| **Production DB (PostgreSQL)** | Payments persistence | Already Phase 8B external step — `DATABASE_URL` PG + `prisma migrate deploy` |

All are **BLOCKED — REQUIRES USER ACTION**; no credentials created in this phase.

---

## AM. Exact Next-Phase Recommendation

**PHASE 9A — IMPLEMENT THE CHOSEN MONETIZATION ARCHITECTURE (upon approval)**

Scope (do not start until you approve §L/W):
1. Approve **Dodo Payments (MoR) primary, Paddle fallback** + **pricing ₹199/$5 monthly, ₹999/$39 yearly, lifetime deferred** + **C+D business model**.
2. Then implement:
   - `lib/payments/types.ts` interface + `lib/payments/dodo.ts` adapter (Dodo Checkout + API), `lib/payments/paddle.ts` stub for fallback, `lib/payments/index.ts` factory via `PAYMENTS_PROVIDER=dodo`.
   - Prisma migration `PaymentEvent`, `PaymentSession`, extend `Entitlement` (`source`, `providerCustomerId`, `providerSubscriptionId`, `currentPeriodStart/End`, `expiresAt`).
   - `POST /api/payments/checkout` (auth required, creates Dodo checkout, returns URL), `GET /api/payments/status` (poll DB), `POST /api/payments/webhook/[provider]` (signature, idempotency, state machine §Y/Z).
   - Update `lib/entitlement.ts` grace logic (active until period end, expired after).
   - Extend `/account` billing card (plan, period, manage link), success/cancel pages, emails via `lib/email` (receipt, renewal, failed, cancelled).
   - Verification: unit tests for state machine + webhook idempotency, E2E checkout mock (no real charge), privacy-net regression (no file bytes to payment), `typecheck/lint/build` green, 53/53 existing + new payment E2E (mock provider) passing.
3. **Do NOT yet:** install ad scripts, implement ads, create real charges, connect production MoR credentials (use test mode), or implement lifetime plan.

**Alternative if you reject Dodo/Paddle:** Replace 9A adapter with Razorpay Subscriptions (direct) — requires GST filing path; re-estimate economics (lower fees 2.36% but add CA).

---

## AN. Updated Readiness Score

| Component | Phase 8B | Phase 9 (research only, no code) |
|-----------|----------|-----------------------------------|
| PDF tools | 9.2 | **9.2** (unchanged, no regression) |
| Image tools | 9.2 | **9.2** |
| Background removal | DEFERRED 0 | **DEFERRED 0** |
| Auth / DB / rate limit | 9.3 / 8.7 / 8.5 | **9.3 / 8.7 / 8.5** |
| Monetization architecture | — | **8.5** (decision made, abstraction designed, economics modeled, but no integration yet) |
| Payments integration | 0 | **0** (intentionally not installed) |
| Advertising | 0 | **0** (architecture only) |
| **Overall** | **9.2** | **9.2** (product readiness unchanged; business readiness +0.3 planning; score not inflated — no new runtime capability) |

**No SDK installed, no route added, no behavior changed — score guardrails honoured.**

---

## STOP CONDITION

**STOP.** No payment SDK, no ad script, no checkout, no webhook, no credentials.

Waiting for your approval of:
- **MoR choice (Dodo primary / Paddle fallback)**
- **Pricing (₹199/$5, ₹999/$39, lifetime deferred)**
- **Business model C+D**

Next phase is **Phase 9A — implement the chosen monetization architecture** only after you approve §L/W/AG.

**Verification of this phase:** `typecheck`/`lint`/`build` unchanged from 8B (no code changed), web searches executed (Razorpay pricing, Stripe invite-only, Paddle 5%+$0.50, Lemon/Paddle MoR, Dodo 4%+$0.40, PayPal RBI, iLovePDF/Smallpdf $48/$108, AdSense eligibility, Monetag RPM, RBI e-mandate ₹15k/₹1L, GST export zero-rated, Dodo/Creem MoR). No `npm install` of payment/ad packages.

