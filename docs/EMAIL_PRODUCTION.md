# Email Production — Resend

**Provider:** Resend (selected over Postmark, Amazon SES for Next.js DX, API, India deliverability, free tier 100/day, $20/3k, React Email).

**Why Resend:**
- **Next.js:** First-class React Email + `resend` SDK, Vercel integration, API not SMTP, no `nodemailer` vuln path.
- **India:** Global edge, no AWS region lock, SPF/DKIM via DNS, not via AWS SES region.
- **Postmark:** $15/1k, good deliverability but transactional separate infra, smaller free 100/mo.
- **SES:** $0.10/1k cheapest, but requires AWS, IAM, SNS, Deliverability Manager extra, not needed for MVP volume.

**Env vars:**
```
RESEND_API_KEY=re_... (server secret, never NEXT_PUBLIC)
EMAIL_FROM=noreply@mail.zancta.tech (verified Resend sender)
EMAIL_REPLY_TO=support@zancta.tech
NEXTAUTH_URL=https://zancta.tech
```

**Sender requirements:**
- Verify domain in Resend dashboard (add DNS TXT for verification).
- Use `noreply@<verified-domain>` (not @gmail).

**DNS:**
- Hostinger apex MX/SPF handles receiving `@zancta.tech` mail.
- Resend sends from the existing `mail.zancta.tech` domain; do not alter Hostinger apex MX to configure it.
- Add only the exact SPF/DKIM/DMARC records currently supplied by the Resend dashboard for `mail.zancta.tech`. Never copy records from this document into DNS without comparing them to the dashboard.
- Verification: Resend dashboard shows `Verified`, then test via `resend.emails.send` to an independent inbox and check `Authentication-Results: dkim=pass spf=pass dmarc=pass`.

**Architecture:**
- `lib/email/index.ts` — `EmailAdapter { sendVerification(to,url), sendPasswordReset(to,url) }`, `ResendAdapter` (prod), `ConsoleAdapter` (dev), `TestAdapter` (test). Production always selects Resend and fails closed if its key or sender is missing; development/test use local adapters. No provider name in auth logic.
- Production never logs `token`/`url` (only `url` sent to Resend, no `console.log`). Dev `ConsoleAdapter` logs `Verification ${to}: ${url}` for local/manual.

**Prod flow:**
- Signup → `generateSecureToken()` → `hashToken()` store `tokenHash` → `ResendAdapter.sendVerification(to, url)` → user clicks `?token=plain` → `hashToken(plain)` lookup → `delete` one-time → `emailVerified`.
- Same for reset (60min, `usedAt`, session invalidation).

**Security:**
- `crypto.randomBytes(32).hex` (256-bit), `sha256` hash storage (not plain), `expires` 24h/60m, `delete`/`usedAt` one-time, `HTTPS` links via `NEXTAUTH_URL`, no token in logs/analytics, no password in logs.

**Checklist:**
- [ ] `RESEND_API_KEY` in Vercel env (Production)
- [ ] `EMAIL_FROM=noreply@mail.zancta.tech` verified in Resend
- [ ] Exact Resend SPF/DKIM/DMARC records added for `mail.zancta.tech` and `Verified` in Resend
- [ ] `support@zancta.tech` is a real monitored mailbox; role aliases are tested before being called monitored
- [ ] Test email to Gmail/Outlook → `pass`
- [ ] Confirm production responses never expose `devToken` (local-host gating only)

**Not yet configured** — dev still uses Console, prod checklist above. No real secrets in repo.
