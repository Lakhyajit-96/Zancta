# Legal & Commercial Research — Phase 12H-9

Internal audit only. Not legal advice. Not lawyer-reviewed. Prepared to support the
public-facing statements in `/terms`, `/privacy`, `/refund-and-cancellation`, `/contact`,
`/security`, and `/about`, which all read facts from `lib/legal-public.ts`.

Business model reviewed: ZANCTA, a browser-local PDF/image tool site operated by
**Lakhyajit Changmai** as an **individual, unincorporated operator** in **India**, offering
a free tier and an optional recurring INR subscription (₹199/month, ₹999/year) billed
through **Dodo Payments** as **Merchant of Record**. No company, LLP, GSTIN, CIN, or
registered office exists. Site is globally reachable; no active EU/US-specific marketing.

Classification scale used below: **APPLIES**, **LIKELY APPLIES**, **MAY APPLY**,
**DOES NOT APPEAR TO APPLY**, **PROFESSIONAL DETERMINATION REQUIRED**.

---

## 1. Consumer Protection (E-Commerce) Rules, 2020 (Dept. of Consumer Affairs)

**Source:** Consumer Protection (E-Commerce) Rules, 2020, Rules 2–7 (consumeraffairs.nic.in;
cross-checked against Mondaq's rule-by-rule commentary and the consumerhelpline.gov.in
INGRAM FAQ).

- **Rule 2 (scope):** applies to goods/services transacted over a digital network, but
  **excludes** "any activity of a natural person carried out in a personal capacity not
  being part of any professional or commercial activity undertaken on a regular or
  systematic basis." ZANCTA's recurring subscription business is commercial and systematic,
  so this personal-capacity carve-out **does not, by itself, exclude ZANCTA**.
- **Rule 4 (duties of e-commerce entities, incl. grievance officer):** the Rules define the
  entities these duties bind by requiring the entity to be **incorporated under the
  Companies Act, 1956/2013, a foreign company, or an Indian-resident-controlled foreign
  branch/office/agency**. An unincorporated individual sole operator does not meet this
  threshold definition of "e-commerce entity" for Rule 4 purposes.

**Conclusion:** The Rule 4 duties that would otherwise require appointing a named
"Grievance Officer," publishing a registered office address, and displaying a legal
entity name — **DOES NOT APPEAR TO APPLY** to ZANCTA's current unincorporated,
individual-operator structure, because the rule's own definition of a bound
"e-commerce entity" presumes corporate/company form. This is a structural finding, not a
"we are too small" argument — if the operator ever incorporates a company (Pvt Ltd,
LLP treated as covered, or otherwise) to run ZANCTA, this conclusion must be
revisited and likely flips to **LIKELY APPLIES**.

General Consumer Protection Act, 2019 consumer rights (District/State/National Consumer
Disputes Redressal Commissions, National Consumer Helpline 1915 / INGRAM, e-Daakhil
e-filing) remain available to any consumer regardless of the seller's corporate form —
those are **APPLIES** as general public infrastructure, and are safe to mention because
they are government-run channels, not a ZANCTA-invented promise.

## 2. Digital Personal Data Protection Act, 2023 & DPDP Rules, 2025 (MeitY)

**Source:** Gazette notification G.S.R. 843(E), 13/14 Nov 2025 (egazette.gov.in); DPDP
Rules 2025 full text (Rule 1(2)-(4)); law-firm summaries (Shardul Amarchand Mangaldas,
CADP) corroborating the same three-tier commencement schedule.

- Definitions and the Data Protection Board provisions: in force **immediately** (14 Nov 2025).
- Consent-manager registration and one Board power: in force **14 Nov 2026**.
- **The substantive obligations — Sections 3–17 (notice, consent, grounds for processing,
  general obligations of a Data Fiduciary), most of Section 27, and DPDP Rules 3 and 5–16
  (which include Rule 9, the contact-publication duty) — do not come into force until
  18 months after notification, i.e. 14 May 2027.**

**Conclusion:** As of this audit (Aug 2026), DPDP Rule 9's contact-publication duty and the
Act's general Data Fiduciary obligations are **DOES NOT APPEAR TO APPLY YET** — they are
not yet legally in force. This is a timing finding, not an exemption; it will become
**APPLIES** on 14 May 2027 and should be re-checked then. Publishing `privacy@zancta.tech`
as the contact for privacy questions today is a voluntary, good-practice step ahead of that
date, not a claim of present-day statutory compliance. Once Section 3–17 obligations commence,
re-audit consent language, retention-schedule Rule 8 requirements, and Rule 9 designation.

## 3. GDPR / UK GDPR (extraterritorial scope)

**Source:** GDPR Art. 3(2); EDPB Guidelines 3/2018 on territorial scope (final version).

Article 3(2) reaches a non-EU controller only where it **intentionally targets** EU-based
data subjects — evidenced by an EU-specific top-level domain, EU currency/language options,
EU shipping, or explicit mention of EU customers. Mere worldwide accessibility of a website
is expressly **not sufficient** (Recital 23; EDPB Example 12 contrasts this with a Turkish
site that explicitly priced in EUR/GBP and shipped to France/Germany/Benelux).

**Conclusion:** ZANCTA prices only in INR, has no EU-specific domain, language variant, or
marketing, and does not monitor EU visitor behavior beyond ordinary consent-gated analytics.
**DOES NOT APPEAR TO APPLY today** under the "intentional targeting" test. **MAY APPLY** in
the future if EU-directed marketing, EUR pricing, or EU-specific promotion begins — that
change should trigger **PROFESSIONAL DETERMINATION REQUIRED** before shipping it. UK GDPR
mirrors this analysis via the UK's equivalent Article 3(2).

## 4. California CCPA/CPRA

**Source:** Cal. Civ. Code §1798.140(d)(1); CPPA FAQ and 2025 CPI-adjustment notice.

CCPA/CPRA applies only to a "business" that is for-profit **and** meets one of: (a) gross
annual revenue over $26,625,000 (2025-adjusted threshold), (b) buys/sells/shares personal
information of 100,000+ CA consumers/households per year, or (c) derives 50%+ of revenue
from selling/sharing personal information.

**Conclusion:** **DOES NOT APPEAR TO APPLY** — ZANCTA is a pre-revenue/individual-scale
operation far below all three thresholds. Re-check if/when scale changes materially.

## 5. Dodo Payments — Merchant of Record & refunds

**Source:** Dodo Payments official docs — `features/mor-introduction`,
`features/transactions/refunds`, `api-reference/error-codes`, `miscellaneous/faq`.

- Dodo is the legal seller (Merchant of Record) for covered transactions: handles checkout,
  tax collection/remittance, fraud liability, invoices. **APPLIES** (this is the configured
  provider relationship).
- Refunds: merchant-initiated (full or partial) from the Dodo dashboard; **rule-gated to
  within 30 days of the original transaction** (`REFUND_WINDOW_EXPIRED` past that); refunded
  to the original payment method; customer typically sees funds in 3–5 business days
  depending on bank. **APPLIES** — this is the actual configured refund mechanism and is
  reflected verbatim (30-day window, provider-issued, no immediate in-app refund control) on
  `/refund-and-cancellation`.
- Dodo does not guarantee refund approval outside its rule set (e.g. already-refunded line
  items, zero-amount payments) — ZANCTA's copy correctly avoids promising a refund the
  configured system cannot always provide.

## 6. Email sender-identity standards (BIMI/VMC/CMC/DMARC)

See `docs/EMAIL_SENDER_IDENTITY_BIMI.md` for the full technical diagnosis. Summary
classification: Gmail/Apple Mail sender-logo display **APPLIES only after** DMARC is
enforced at `p=quarantine`/`p=reject` with `pct=100` **and** a paid VMC or CMC is obtained —
**PROFESSIONAL/OWNER DECISION REQUIRED** before any DMARC enforcement change or certificate
purchase (both are explicitly out of scope for autonomous action per this phase's
instructions).

## 7. Physical/postal address — is one legally required for this model?

See dedicated section in `/contact` and `/about`. Findings, cross-referencing items 1–4
above:

- Consumer Protection (E-Commerce) Rules Rule 4 office-address disclosure duty is scoped to
  incorporated "e-commerce entities" (see §1) — not triggered by the current unincorporated
  structure.
- DPDP Rule 9 requires *business contact information*, which an email mailbox satisfies; it
  does not specify a postal address, and in any case is not yet in force (see §2).
- No GDPR/CCPA representative-address duty is triggered because neither regime currently
  applies (see §3–4).

**Conclusion: a public physical/postal address is DOES NOT APPEAR TO APPLY as a legal
requirement for the current unincorporated, India-based, individually operated digital
subscription model.** No address is invented or published. If Dodo, a bank, or a future
incorporation step requires a private/verification-only address, that is separate from
public disclosure and does not change this conclusion. Re-run this determination if the
operator incorporates a company, or after 14 May 2027 when DPDP's substantive obligations
commence.

## 8. Governing law / dispute forum

No governing law or contractual jurisdiction clause is published because none has been
confirmed with professional review — asserting one without review risks binding the
operator to an unreviewed forum/law selection. **PROFESSIONAL DETERMINATION REQUIRED**
before publishing a governing-law clause. In the interim, `/terms` and
`/refund-and-cancellation` point users to the general, government-run consumer channels
(National Consumer Helpline / e-Daakhil) that exist independent of any ZANCTA-specific
clause.

## 9. What changed as a result of this audit

- `/privacy`: corrected the DPDP reference to state the accurate, staggered commencement
  timeline (Rule 9 not yet in force; commences 14 May 2027) instead of an undated "whether
  it applies" hedge, and added a short international-users section with the GDPR/CCPA
  classification above.
- `/contact` and `/about`: added the Consumer Protection (E-Commerce) Rules structural
  finding (§1) so the "no grievance officer" statement is backed by a reason instead of an
  open question, and linked the general National Consumer Helpline / e-Daakhil channel.
- `/terms` and `/refund-and-cancellation`: added the same consumer-redressal-channel
  reference; refund language re-verified against current Dodo documentation (§5) —
  no change needed to the substance, only wording precision.
- `lib/payments/types.ts`: removed the unused, stale `$5/$39` USD display branch that
  no product page or checkout path ever reads, to remove a latent mixed-currency
  inconsistency risk (Part 9).
- No physical address, company entity, GSTIN, CIN, DPO, or grievance-officer title was
  added or invented anywhere.
