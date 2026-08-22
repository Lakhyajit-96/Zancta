# Email Production — Resend

**Provider:** Resend. Transactional sending domain: `mail.zancta.tech`. Display name: `ZANCTA`.

**Canonical From (verified sender):** `ZANCTA <noreply@mail.zancta.tech>`

Do not send From `support@zancta.tech` until that exact mailbox is a verified Resend identity. Hostinger owns apex receiving mail; Resend owns `mail.zancta.tech` sending.

**Reply-To (operational, owner-tested Hostinger mailboxes):**
- Default / support: `support@zancta.tech`
- Security events: `security@zancta.tech`
- Billing events: `billing@zancta.tech`
- Privacy requests: `privacy@zancta.tech`

Override default Reply-To with `EMAIL_REPLY_TO` only if a different proven mailbox is required.

**Env vars:**
```
RESEND_API_KEY=re_... (server secret, never NEXT_PUBLIC)
EMAIL_FROM=noreply@mail.zancta.tech
EMAIL_REPLY_TO=support@zancta.tech
NEXTAUTH_URL=https://zancta.tech
```

**Email body logo (not inbox avatar):**
- `https://zancta.tech/assets/zancta-brand/email/zancta-email-mark.png`
- HTML cannot force Gmail/Proton sender avatars. Inbox logos require BIMI + DMARC enforcement + usually a VMC/CMC.

**BIMI:**
- Hosted SVG Tiny PS: `https://zancta.tech/assets/zancta-brand/bimi/zancta-bimi.svg`
- Do not publish `default._bimi.zancta.tech` while apex DMARC is `p=none`.
- Do not buy a VMC/CMC without explicit owner authorization.
- Full diagnosis of the inbox sender-avatar gap (why the working HTML logo does not
  control it, current SPF/DKIM/DMARC state, exact DNS/certificate path, and current
  VMC/CMC cost ranges): see `docs/EMAIL_SENDER_IDENTITY_BIMI.md`.

**DNS (do not overwrite working Hostinger MX):**
- Apex MX: Hostinger (`mx1.hostinger.com`, `mx2.hostinger.com`)
- Apex SPF: Hostinger include
- Sending SPF/DKIM: Resend records on `mail.zancta.tech`
- Apex DMARC: currently `p=none` (monitoring). Do not move to quarantine/reject until all legitimate senders are aligned.

**Architecture:**
- `lib/email/layout.ts` — one HTML/text design system
- `lib/email/templates.ts` — copy for real events
- `lib/email/index.ts` — Resend/Console/Test adapters
- Wired events: verification, password reset, password changed, welcome after verify, account deleted, Dodo subscription.active / renewed / cancelled, payment.failed, refund.succeeded, contact-form internal notification, contact-form user acknowledgement
- Contact form routes to existing Hostinger mailboxes. No inbound email webhook. No invented business mailbox.

**Security:**
- HTTPS CTAs only; localhost and `*.vercel.app` rejected
- Tokens only in one-time URLs, never passwords or secrets in body
- Password reset: 60 minutes, one-time, session invalidation
- Verification: 24 hours, one-time
