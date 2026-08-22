# Production deployment

ZANCTA production is **Vercel** (Hobby) with the custom domain **https://zancta.tech**.

Project slug: `zancta`. Dashboard: [lakhyajitchangmai77s-projects/zancta](https://vercel.com/lakhyajitchangmai77s-projects/zancta).  
GitHub: `lakhyajitchangmai77/Zancta` → production branch `main`.  
Full platform notes: [operations/vercel.md](../operations/vercel.md). Rollback: [operations/releases.md](../operations/releases.md).

## What deploys

Pushes to `main` deploy Production (Node **24.x** on Vercel). GitHub Actions CI uses Node **20**. Preview deployments exist for other branches. `*.vercel.app` URLs require Vercel login (`all_except_custom_domains`); the custom domain is public.

There is no `vercel.json`. Next.js is auto-detected. Functions run in `iad1`. No cron jobs.

## Environment

Set Production variables in the Vercel dashboard. Do not commit secrets. Checklist: [environment.md](../operations/environment.md) and `.env.production.example`.

After changing Production env vars, **redeploy** so runtime (including the IndexNow key file) picks them up.

Encrypted Vercel variables may appear empty to `vercel env run` locally. That does not prove Production runtime is empty. Confirm in the dashboard or via public behavior (for example the IndexNow key file).

Preview currently shares production `DATABASE_URL` and Resend/Dodo/Upstash names. Do not treat Preview as a disposable copy of production data.

## Safety gates

- `PAYMENTS_LIVE_ENABLED` must remain `false` until live checkout is authorized.
- Do not set `NEXT_PUBLIC_ADS_ENABLED=true`.
- Do not put IndexNow, Dodo, Resend, database, or auth secrets in `NEXT_PUBLIC_*`.

## Verify after deploy

- `GET https://zancta.tech/api/payments/checkout` → `{"live":false}` until checkout is authorized.
- `/ads.txt` remains unpublished while ads are off.
- Canonical host in HTML is `https://zancta.tech`.
