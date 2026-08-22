# Email sender identity — why the inbox avatar is not the HTML logo (Phase 12H-9)

Owner-reported state: the ZANCTA logo renders correctly **inside** the email body
(`<img>` in the HTML template), but does **not** appear as the sender avatar **outside**
the email — the small circular/square icon Gmail and other clients show next to the
sender name in the inbox list. This document explains why those are different systems,
audits ZANCTA's current state against each one, and lays out the minimum real path to a
working sender avatar — stopping before any purchase or DMARC policy change, per this
phase's constraints.

## 1. Six different things that all look like "the logo"

| Mechanism | What it controls | Who reads it | Can an `<img>` tag fix it? |
|---|---|---|---|
| **HTML email logo** | The image inside the opened email body | The email client's HTML renderer | Yes — already working |
| **Favicon** (`favicon.ico`, PNG sizes, `apple-touch-icon`) | Browser tab icon, bookmarks, some search-result icons | Browsers, some search engines | Yes, and already correctly configured (see §5) |
| **Sender avatar (inbox list icon)** | The small icon next to the sender name in the message list, before the email is opened | Gmail, Apple Mail, Yahoo, some others | **No.** This is not derived from any HTML in the message |
| **BIMI** (Brand Indicators for Message Identification) | The open standard that lets a *verified* sender publish a logo for the inbox-list icon | Gmail, Yahoo, Apple Mail (via BIMI DNS + certificate) | No — BIMI is DNS + certificate, not HTML |
| **Gmail "profile image" / Google Workspace sender identity** | A per-*person* Google Account profile photo, used for individual Gmail/Workspace users, unrelated to transactional bulk mail from a domain like `mail.zancta.tech` | Gmail only, and only for that one Google Account | No, and not applicable here — `noreply@mail.zancta.tech` is not a Google Account |
| **DMARC** | An enforcement policy, not a logo mechanism at all — it decides whether unauthenticated mail is delivered, quarantined, or rejected, and is a **prerequisite** BIMI checks before showing any logo | Mailbox providers' authentication pipelines | No |

The owner's instinct that "the logo is already right" is correct for mechanism 1. The
missing piece is mechanism 3, which is gated by mechanisms 4 and 6 together — not by the
HTML template at all. No change to `lib/email/layout.ts` or the templates can affect this;
redesigning the email body would not help and is correctly out of scope for this phase.

## 2. Current verified state (from `docs/EMAIL_PRODUCTION.md` and DNS-facing docs in repo)

| Control | Current state | Needed for BIMI logo in Gmail |
|---|---|---|
| SPF | Configured for `mail.zancta.tech` (Resend) and Hostinger apex (receiving) | Must pass, aligned to the `From` domain |
| DKIM | Configured for `mail.zancta.tech` (Resend) | Must pass, aligned to the `From` domain |
| DMARC (`_dmarc.zancta.tech`) | **`p=none`** (monitor-only) | Must be **`p=quarantine` or `p=reject`, with `pct=100`** — `p=none` is explicitly rejected by Gmail's BIMI pipeline |
| BIMI SVG asset | Hosted at `https://zancta.tech/assets/zancta-brand/bimi/zancta-bimi.svg`, verified SVG Tiny PS 1.2 with no scripts (`tests/brand-assets.test.ts`) | Ready — no further work needed on the asset itself |
| BIMI DNS record (`default._bimi.zancta.tech` TXT) | **Not published** | Required, and must point at the certificate once one exists |
| VMC / CMC | **Not purchased** | Required by Gmail policy before it will render *any* BIMI logo (a bare BIMI record with no certificate is not enough for Gmail specifically, unlike some other mailbox providers) |

Every layer needed for the logo to appear beyond "the SVG file exists" is either a policy
change with real deliverability risk (DMARC enforcement) or a paid third-party purchase
(VMC/CMC) — both are explicitly excluded from autonomous action in this phase. Nothing
further can be "prepared" beyond confirming the SVG is valid and hosted, which it already
is.

## 3. The exact, minimum real-world path (for the owner to authorize)

1. **Confirm every legitimate sender is SPF/DKIM-aligned before enforcing DMARC.** Today
   that means: Resend (`mail.zancta.tech`, transactional mail) and Hostinger (apex, human
   mailboxes `support@`/`privacy@`/`security@`/`billing@zancta.tech`). Pull DMARC
   aggregate (`rua`) reports for at least 1–2 weeks at `p=none` and confirm 100% of
   legitimate volume already passes alignment. (This monitoring is exactly what `p=none`
   is for — do not skip it.)
2. **Move DMARC from `p=none` to `p=quarantine; pct=100`, then later `p=reject`.** This is
   a real deliverability-risk change (misaligned mail starts being quarantined/rejected)
   and is intentionally left for explicit owner action, not automated here.
3. **Choose VMC or CMC** (see comparison below) and purchase from an authorized Mark
   Verifying Authority. As of this research (mid-2026), Entrust exited the public VMC/CMC
   market in 2025; **DigiCert** is the primary active issuer, with **Sectigo** also selling
   certificates (confirm current BIMI Group issuer-list status before buying, since
   mailbox providers only honor certificates from listed issuers).
4. **Publish `default._bimi.zancta.tech` TXT** pointing `l=` at the existing hosted SVG and
   `a=` at the certificate's PEM file URL, once the certificate is issued.
5. **Verify in Gmail** (allow 24–48h after DNS propagation) and re-check periodically —
   certificates lapse annually and the logo silently disappears on expiry with no runtime
   warning, so a renewal reminder should be set once a certificate exists.

### VMC vs CMC

| | VMC (Verified Mark Certificate) | CMC (Common Mark Certificate) |
|---|---|---|
| Requires a **registered trademark** | Yes (USPTO/EUIPO/WIPO/etc.) | No — instead requires evidence the logo has been in **continuous public use on the domain for 12+ months** |
| Gmail blue verified checkmark | Yes | No — logo only |
| Apple Mail support | Yes | No (VMC-only per current CA guidance) |
| Approximate current annual list price (2026, subject to change — get a live quote before buying) | ~US $1,350–1,750/yr (DigiCert, Sectigo list pricing) | ~US $650–1,100/yr (reseller/list pricing) |
| Trademark-office filing cost if none exists yet | Additional filing fee (varies by jurisdiction; India trademark registration is a separate multi-month process with its own government fees) | Not required |
| Issuance time | Typically 2–6 weeks (trademark verification) | Typically faster — no trademark check |

**Trademark implication:** ZANCTA does not currently hold a registered trademark. A CMC
is the realistic near-term route because it only requires evidence of prior public use of
the logo on the domain, not a registered mark. A VMC (and the Gmail checkmark) would
require first filing and obtaining an Indian or other jurisdiction's trademark registration
for the ZANCTA wordmark/logo — a separate legal process with its own cost and timeline,
independent of the certificate purchase itself.

**Risks to flag before purchase:**
- DMARC enforcement can silently break any mail flow not yet aligned (e.g. a future
  marketing tool, a helpdesk auto-responder, or a CRM sending "from" `zancta.tech`) —
  hence the aggregate-report review step above before flipping the policy.
- Certificates expire annually with no in-inbox warning; a lapsed certificate makes the
  logo disappear until renewed.
- CA/issuer landscape changed materially in 2025 (Entrust's exit) — get a current quote
  and confirm current BIMI Group issuer-list membership immediately before purchasing,
  not from any cached price.
- A CMC will never produce Gmail's blue checkmark; only a VMC (which requires a
  registered trademark) does.

## 4. What was and was not done in this phase

- **Done:** this diagnosis; confirmed the BIMI SVG asset is valid, hosted, and unrelated to
  the actual blocker; confirmed current SPF/DKIM/DMARC state from existing configuration
  notes; documented the exact next steps and costs.
- **Not done (requires the owner):** DMARC policy change, VMC/CMC purchase, trademark
  filing, publishing the `default._bimi.zancta.tech` DNS record. These require a paid
  purchase, a deliverability-risk policy flip, and/or a legal trademark filing — all
  outside this phase's authorization.
