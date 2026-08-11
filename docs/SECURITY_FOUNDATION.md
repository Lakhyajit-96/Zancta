# Security Foundation — Bootstrap

## Headers (to be enforced in next.config.js / middleware)

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options: DENY` (or `SAMEORIGIN` if embeds needed)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy` — start restrictive, allow `self`, `unsafe-inline` only for Next.js, explicit allowlist for GA/AdSense/Sentry when enabled.

## Auth

- Planned: NextAuth.js or Auth.js with secure cookies (`__Host-`, `SameSite=Lax`, `HttpOnly`, `Secure`).
- No credentials committed. `NEXTAUTH_SECRET` from `.env.example`.

## Input Validation

- Zod schemas for all API routes and tool inputs.
- File uploads (if any): type allowlist, size limits, virus scan consideration, storage outside webroot.

## Rate Limiting & Abuse

- Upstash Redis or Vercel KV for rate limiting on tool endpoints.
- CAPTCHA consideration for high-abuse tools.

## Secrets

- `.env` never committed. `.env.example` is documentation only.
- Prod secrets in Vercel env vars (or Doppler/Infisical if adopted).
- No secrets in memory docs, logs, or client bundles (`NEXT_PUBLIC_` only for public IDs).

## Dependency Scanning

- `npm audit` in CI; `dependabot` enabled after GitHub repo creation.
- No `npm install` has run yet (workspace empty); audit baseline is clean by virtue of no deps.

## Current Gaps (BLOCKED / TODO)

- No CSP implemented yet (no app).
- No rate limiting (no backend).
- No auth (no users yet — decision deferred to Phase 1).
- `BLOCKED — REQUIRES USER ACTION` for SENTRY_DSN, DATABASE_URL before security monitoring active.

## Verification

- Checked workspace: no `.env`, no secrets, no `package.json` before bootstrap (now created with no deps).
- `git` not yet initialized — no history to audit.
