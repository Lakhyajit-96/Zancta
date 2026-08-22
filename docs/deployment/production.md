# Production deployment

ZANCTA production is **Vercel** with the custom domain **https://zancta.tech**.

## What deploys

Pushes to `main` are intended to deploy Production. Preview deployments exist for other branches when Vercel is connected.

## Environment

Set Production variables in the Vercel dashboard. Do not commit secrets. Checklist: [environment.md](../operations/environment.md) and `.env.production.example`.

After changing Production env vars, **redeploy** so runtime (including the IndexNow key file) picks them up.

Encrypted Vercel variables may appear empty to `vercel env run` locally. That does not prove Production runtime is empty. Confirm in the dashboard or via public behavior (for example the IndexNow key file).

## Safety gates

- `PAYMENTS_LIVE_ENABLED` must remain `false` until live checkout is authorized.
- Do not set `NEXT_PUBLIC_ADS_ENABLED=true`.
- Do not put IndexNow, Dodo, Resend, database, or auth secrets in `NEXT_PUBLIC_*`.

## Verify after deploy

- `GET https://zancta.tech/api/payments/checkout` → `{"live":false}` until checkout is authorized.
- `/ads.txt` remains unpublished while ads are off.
