# Security notes

Public policy: [SECURITY.md](../../SECURITY.md).

## In production today

- HTTPS via Vercel
- CSP, `X-Frame-Options: DENY`, `nosniff`, HSTS on production builds (`next.config.ts`)
- Auth.js with Secure cookies when `VERCEL_ENV=production`
- Rate limiting via Upstash (fail-closed in production if misconfigured)
- File-type and size limits in tool metadata
- Account deletion and OAuth resurrection controls

## Not claimed

No SOC 2, ISO, pentest report, or “zero vulnerability” statement is published.

Sentry is optional and inert without a DSN. Do not put a secret DSN in `NEXT_PUBLIC_SENTRY_DSN`.

## Secrets

`.gitignore` excludes `.env`, `.env.local`, `.env.production`, and `.env.*` except `.env.example` and `.env.production.example`.
