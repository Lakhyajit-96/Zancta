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
EMAIL_FROM=noreply@localfile.app (verified domain sender)
NEXTAUTH_URL=https://localfile.app
```

**Sender requirements:**
- Verify domain in Resend dashboard (add DNS TXT for verification).
- Use `noreply@<verified-domain>` (not @gmail).

**DNS (future production, not yet configured):**
- **SPF:** `v=spf1 include:amazonses.com ~all` is SES; Resend uses `include:sendgrid.net` or Resend's SPF via `send` include — add TXT at root: `v=spf1 include:amazonses.com ~all` per Resend docs (Resend uses SES under hood). Check Resend dashboard for exact.
- **DKIM:** 3 CNAME records from Resend (e.g., `resend._domainkey` → `...`), provisioned after domain add.
- **DMARC:** `v=DMARC1; p=none; rua=mailto:dmarc@localfile.app` at `_dmarc`.
- Verification: Resend dashboard shows `Verified`, then test via `resend.emails.send` to personal inbox, check `Authentication-Results: dkim=pass spf=pass dmarc=pass`.

**Architecture:**
- `lib/email/index.ts` — `EmailAdapter { sendVerification(to,url), sendPasswordReset(to,url) }`, `ResendAdapter` (prod), `ConsoleAdapter` (dev), `TestAdapter` (test). `getEmailAdapter()` picks `Resend` if `NODE_ENV=production && RESEND_API_KEY`, else `Console`. No provider name in auth logic.
- Production never logs `token`/`url` (only `url` sent to Resend, no `console.log`). Dev `ConsoleAdapter` logs `Verification ${to}: ${url}` for local/manual.

**Prod flow:**
- Signup → `generateSecureToken()` → `hashToken()` store `tokenHash` → `ResendAdapter.sendVerification(to, url)` → user clicks `?token=plain` → `hashToken(plain)` lookup → `delete` one-time → `emailVerified`.
- Same for reset (60min, `usedAt`, session invalidation).

**Security:**
- `crypto.randomBytes(32).hex` (256-bit), `sha256` hash storage (not plain), `expires` 24h/60m, `delete`/`usedAt` one-time, `HTTPS` links via `NEXTAUTH_URL`, no token in logs/analytics, no password in logs.

**Checklist:**
- [ ] `RESEND_API_KEY` in Vercel env (Production)
- [ ] `EMAIL_FROM` verified domain
- [ ] DNS SPF/DKIM/DMARC added and `Verified` in Resend
- [ ] Test email to Gmail/Outlook → `pass`
- [ ] Remove `devToken` from signup response in prod (already `&& !RESEND_API_KEY`)

**Not yet configured** — dev still uses Console, prod checklist above. No real secrets in repo.
