# Security notes

Public policy: [SECURITY.md](../../SECURITY.md).

## In production today

- HTTPS via Vercel; `zancta.tech` on the Edge Network
- CSP, `X-Frame-Options: DENY`, `nosniff`, HSTS on production builds (`next.config.ts`)
- Auth.js with Secure cookies when `VERCEL_ENV=production`
- Rate limiting via Upstash (fail-closed in production if misconfigured)
- File-type and size limits in tool metadata
- Account deletion and OAuth resurrection controls
- Encrypted Vercel environment variables
- Deployment Protection: Vercel login required on `*.vercel.app`; custom domain public
- GitHub fork protection on the connected repository
- Protected sourcemaps

Vercel Firewall custom rules are **not** configured. That is intentional until there is evidence of abuse. Do not block Googlebot, Bingbot, or ordinary browsers.

Platform notes: [operations/vercel.md](../operations/vercel.md).

## Not claimed

No SOC 2, ISO, pentest report, or “zero vulnerability” statement is published.

Sentry is optional and inert without a DSN. Do not put a secret DSN in `NEXT_PUBLIC_SENTRY_DSN`.

## Secrets

`.gitignore` excludes `.env`, `.env.local`, `.env.production`, and `.env.*` except `.env.example` and `.env.production.example`.
