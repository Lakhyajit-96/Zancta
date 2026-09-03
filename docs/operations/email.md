# Email Production — Transactional Providers

**Providers:** Hostinger Mail API or Resend. Set `EMAIL_PROVIDER=hostinger` to send through Hostinger Mail API, or `EMAIL_PROVIDER=resend` to send through Resend. Display name: `ZANCTA`.

**Hostinger sender mailbox:** `support@zancta.tech`

Hostinger Mail API sends from a managed mailbox resource, not an arbitrary `From` header. Use the mailbox resource ID from Agentic Mail/API access, or discover it with `GET https://api.mail.hostinger.com/api/v1/me`.

**Resend canonical From (verified sender):** `ZANCTA <noreply@mail.zancta.tech>`

Do not send a Resend `From` of `support@zancta.tech` until that exact mailbox is a verified Resend identity. Hostinger owns apex receiving mail; Resend owns `mail.zancta.tech` sending when Resend is selected.

**Reply-To behavior:**
- Hostinger Mail API sends from the managed mailbox and its `V1.Send.Request` has no custom `replyTo` field. In Hostinger mode, replies go to the managed sender mailbox (`HOSTINGER_MAIL_FROM`); role-specific and reporter Reply-To addresses are not sent.
- Resend supports custom Reply-To. Defaults are support, security, billing, and privacy according to the message role; `EMAIL_REPLY_TO` overrides the support Reply-To only.
- Hostinger's `inReplyTo` field is for threading an existing message, not for selecting a Reply-To address, and is not used here.

**Hostinger env vars:**
```
EMAIL_PROVIDER=hostinger
HOSTINGER_MAIL_API_TOKEN=... (server secret, never NEXT_PUBLIC)
HOSTINGER_MAIL_API_URL=https://api.mail.hostinger.com (optional; this is the default)
HOSTINGER_MAIL_MAILBOX_RESOURCE_ID=AC...
HOSTINGER_MAIL_FROM=support@zancta.tech
NEXTAUTH_URL=https://zancta.tech
```

**Resend env vars:**
```
EMAIL_PROVIDER=resend
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
- `lib/email/index.ts` — Hostinger Mail/Resend/Console/Test adapters
- Wired events: verification, password reset, password changed, welcome after verify, account deleted, Dodo subscription.active / renewed / cancelled, payment.failed, refund.succeeded, contact-form internal notification, contact-form user acknowledgement
- Contact form routes to existing Hostinger mailboxes. No inbound email webhook. No invented business mailbox.

**Security:**
- HTTPS CTAs only; localhost and `*.vercel.app` rejected
- Tokens only in one-time URLs, never passwords or secrets in body
- Password reset: 60 minutes, one-time, session invalidation
- Verification: 24 hours, one-time
