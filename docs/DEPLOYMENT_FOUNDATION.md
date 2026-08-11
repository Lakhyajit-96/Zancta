# Deployment Foundation — Bootstrap

## Recommended Stack

**Primary: Vercel** (Next.js native, edge, preview deployments, instant rollback, env management)
**Alternatives:** Cloudflare Pages/Workers (if edge-heavy), AWS (if complex backend), DigitalOcean (if VM needed)

Criteria: reliability > cost > latency > maintainability. Vercel wins for tool sites (SSR/ISR, image optimization, analytics).

## CI/CD (planned)

- **GitHub Actions** (when repo connected):
  - `ci.yml`: lint → typecheck → test → build → e2e → audit
  - `deploy.yml`: Vercel deploy on `main` (prod) and PR previews
- No CI exists yet — `BLOCKED — REQUIRES USER ACTION`: `gh auth login` + repo creation + Vercel project link.

## Environments

- `development` — local `.env.local`
- `preview` — Vercel preview (per PR)
- `production` — Vercel prod, custom domain, env vars in dashboard

## Domain & Prod Readiness Checklist (all BLOCKED until Phase 1+)

- [ ] Domain purchased
- [ ] DNS configured (A/CNAME or Vercel NS)
- [ ] HTTPS (auto via Vercel/Cloudflare)
- [ ] www → apex redirect strategy
- [ ] `robots.txt` + `sitemap.xml`
- [ ] Legal pages (`/privacy`, `/terms`, `/cookies`)
- [ ] Analytics connected
- [ ] Ads.txt (if AdSense)
- [ ] Health endpoint `/api/health`
- [ ] Monitoring (Sentry, uptime)

## Health Endpoint (to be implemented)

`GET /api/health` → `{ status: "ok", version, uptime, db: "connected"|"n/a" }`

## Verification

- `vercel --version` → not installed (verified)
- `docker ps` → daemon not running (Docker Desktop not started)
- No `vercel.json`, no `Dockerfile` yet — intentional for bootstrap.
