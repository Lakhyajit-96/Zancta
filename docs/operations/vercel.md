# Vercel project

Inspection date: 23 August 2026.  
Dashboard: [vercel.com/lakhyajitchangmai77s-projects/zancta](https://vercel.com/lakhyajitchangmai77s-projects/zancta)  
CLI: Vercel 54.9.0, team `lakhyajitchangmai77s-projects`, user `lakhyajitchangmai77`.  
A second team project (`recoverly`) exists and must not be changed.

Do not enable paid Vercel products to fill the dashboard. Unused capabilities below are **intentional**.

---

## Identity

| Setting | Actual value |
|---|---|
| Project slug / API `name` | `zancta` (Vercel slugs are lowercase) |
| Public brand | ZANCTA |
| Product description (repository) | Privacy-first PDF and image tools that run in your browser. |
| Framework | Next.js (auto-detected). Repo has **no** `vercel.json`. |
| Root / install / build / output | `null` (platform defaults: `npm ci` / `npm run build`) |
| Node.js on Vercel | `24.x` (`nodejs24.x` lambdas) |
| GitHub CI Node | 24 (aligned with Vercel; engines still `>=20 <25`) |
| Production branch | `main` |
| Repository | `lakhyajitchangmai77/Zancta` (private GitHub) |
| Git connection | enabled (`createDeployments: enabled`) |
| Fork protection | `gitForkProtection: true` |
| PR comments | on; commit comments off |
| Plan | Hobby |
| Function region | `iad1` |
| Fluid compute | on |
| Default timeout / memory type | 300s / standard (inspect showed 2048 MB on lambdas) |
| Cron definitions | `[]` (cron feature timestamp present, **no jobs**) |
| Last rollback target | `null` |
| Protected sourcemaps | true |

There is no separate marketing “description” field on the project object. Do not rename the slug; it would break URLs and integrations.

---

## GitHub ↔ Vercel

Pushes to `main` create Production deployments. Other branches (including Dependabot) create Preview deployments (`STAGED`). Attribution uses GitHub login. Do not disconnect or recreate the integration.

---

## Domains and TLS

Canonical customer host: **https://zancta.tech**

| Host | Role |
|---|---|
| `zancta.tech` | Production |
| `www.zancta.tech` | Redirect host (308 → apex) |
| `zancta-lakhyajitchangmai77s-projects.vercel.app` | Default production alias |
| `zancta-git-main-….vercel.app` | Git `main` alias |
| Other `zancta-*-….vercel.app` | Preview / historical deployments |

Observed HTTP behavior:

- `http://zancta.tech` → **308** `https://zancta.tech/`
- `https://www.zancta.tech/` → **308** `https://zancta.tech/`
- HTTPS 200: HSTS `max-age=31536000; includeSubDomains; preload`, CSP, `X-Frame-Options: DENY`, `nosniff`, `Permissions-Policy`
- `Server: Vercel` is infrastructure. Do not try to remove it.
- HTML canonical and Open Graph URLs use `https://zancta.tech`

DNS (do **not** change nameservers; Hostinger mail depends on current DNS):

- Registrar: third party
- Current nameservers: `cosmos.dns-parking.com`, `nova.dns-parking.com` (Hostinger)
- Vercel “intended nameservers” empty — expected when **not** using Vercel nameservers
- Edge Network: yes for `zancta.tech`

---

## Deployment protection

`ssoProtection.deploymentType` = `all_except_custom_domains`

- `zancta.tech` / `www.zancta.tech` are public
- `*.vercel.app` deployment URLs require Vercel team login

That is preview protection for generated URLs. It does **not** isolate Preview from the production database (see environment).

---

## Environment (names only)

All Vercel values are Encrypted/sensitive. Development scope is empty.

**Production + Preview:** `NODE_ENV`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_NAME`, `AUTH_TRUST_HOST`

**Production only:** Production `DATABASE_URL`, Production `AUTH_SECRET`, Production `NEXTAUTH_SECRET`, `PAYMENTS_PROVIDER`, `EMAIL_REPLY_TO`, `PAYMENTS_LIVE_ENABLED`, `INDEXNOW_NOTIFY_SECRET`, `INDEXNOW_KEY`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `DODO_API_KEY`, `DODO_WEBHOOK_SECRET`, `DODO_ENVIRONMENT`, `DODO_PRODUCT_MONTHLY_ID`, `DODO_PRODUCT_ANNUAL_ID`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`

**Preview only:** Preview `DATABASE_URL`, Preview `AUTH_SECRET`, Preview `NEXTAUTH_SECRET`

`PAYMENTS_LIVE_ENABLED` is Production-only and not set on Preview, so checkout stays off (`lib/payments/live.ts`). Checkout must stay `{"live":false}` until authorized.

Preview isolation (23 August 2026, Phase 13B-final): Preview uses a separate Supabase project (`zancta-preview`). Production `DATABASE_URL` is Production-only. Resend, Dodo, Upstash, GA4, and OAuth remain Production-only. Mutating `/api/*` and OAuth callbacks still return 503 (`PREVIEW_ALLOW_PRODUCTION_*` unset). Do not set those flags.

Inventory: [environment.md](environment.md). Templates: `.env.example`, `.env.production.example`.

---

## Surface classification

| Surface | Classification | Evidence |
|---|---|---|
| Overview / production | ENABLED + CONFIGURED | READY production aliased to `zancta.tech` |
| Deployments | ENABLED + CONFIGURED | Git deploys; recent list all READY |
| Logs | ENABLED + CONFIGURED | Platform logs; app structured errors |
| Web Analytics (dashboard) | ENABLED + UNUSED in app | Project `webAnalytics` + `features.webAnalytics`; no `@vercel/analytics` in repo |
| Speed Insights | ENABLED + NO DATA | `enabledAt` set, `hasData: false`; no `@vercel/speed-insights`; **baseline not established** |
| Observability / Sentry | AVAILABLE BUT UNUSED | No `SENTRY_DSN` |
| Firewall custom rules | AVAILABLE BUT UNUSED | No `vercel.json` rules; no justified traffic-based WAF. Intentionally minimal pending real abuse. |
| CDN / Edge | ENABLED + CONFIGURED | Custom domain on Edge Network |
| Environment variables | ENABLED + CONFIGURED (Preview sharing is a risk) | See environment.md |
| Domains | ENABLED + CONFIGURED | apex + www |
| Connect / GitHub | ENABLED + CONFIGURED | `link.type: github` |
| Integrations (marketplace) | NOT OBSERVED / UNUSED | No Vercel Storage/KV/Blob/Postgres integration on the project object |
| Storage / Blob / KV | NOT CURRENTLY REQUIRED | Browser-local processing |
| Flags | NOT CURRENTLY REQUIRED | |
| Agent / AI Gateway | NOT CURRENTLY REQUIRED | Do not upload documents to AI providers |
| Sandboxes | NOT CURRENTLY REQUIRED | |
| Workflows | NOT CURRENTLY REQUIRED | Cron definitions empty |
| Images (Vercel Image Optimization) | NOT CURRENTLY REQUIRED | App does not use `next/image`; marketing assets are static files under `/public` |
| Usage | OWNER ACTION to monitor | Hobby plan; no invented cost figures |
| Support / billing | OWNER ACTION | Hobby; operational mailboxes are on the site, not in Vercel billing |

---

## Security (actual controls)

Present:

- HTTPS, HSTS (production builds), CSP, frame denial, nosniff, Referrer-Policy, Permissions-Policy
- Deployment Protection on `*.vercel.app`
- Encrypted env vars; IndexNow and OAuth secrets not `NEXT_PUBLIC_*`
- Upstash rate limits (fail-closed in Vercel Production when configured)
- GitHub fork protection
- Protected sourcemaps

Not claimed: SOC 2, WAF custom rules, bot-management beyond Vercel defaults, pentest.

Hobby Firewall: do not add global blocks for Googlebot/Bingbot or ordinary browsers. Revisit only with evidence of API abuse.

---

## Analytics vs GA4

Production CSP allows Google Tag Manager / GA because `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set. GA4 loads only after consent in `ConsentAndAnalytics`.

Vercel Web Analytics / Speed Insights dashboard toggles are **on**. The application does **not** include those packages. Do not add Meta, Ads, DoubleClick, or TikTok pixels.

---

## Cost control (Hobby)

Watch the Vercel **Usage** tab. Do not invent dollar estimates.

Flags if traffic grows:

- Fluid functions at 2048 MB / 300 s
- OCR language-pack lambdas (traineddata tracing)
- Bandwidth for WASM / fonts / marketing images
- Preview builds from Dependabot (many READY previews on 23 August 2026)

Do not add Image Optimization, KV, Blob, or cron “because the dashboard has them.”

---

## Future AI (not now)

Local processing → optional AI → explicit consent → controlled provider → Premium economics. Never silent document upload.

---

## Related

- [releases.md](releases.md) — current SHA, rollback target, procedure
- [observability.md](observability.md)
- [deployment/production.md](../deployment/production.md)
