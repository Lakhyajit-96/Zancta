# Releases and rollback

## Current production (inspection 23 August 2026, Phase 13A still live until 13B Git push)

| Item | Value |
|---|---|
| Deployment | `dpl_ERZYJCurpbWRApBJzn1mmHZfRHaN` |
| Inspector | [vercel.com/…/zancta/ERZYJCurpbWRApBJzn1mmHZfRHaN](https://vercel.com/lakhyajitchangmai77s-projects/zancta/ERZYJCurpbWRApBJzn1mmHZfRHaN) |
| Git commit | `564535d` |
| Branch | `main` |
| Message | isolate Vercel Preview from production data and mail. |
| Aliases | `zancta.tech`, `www.zancta.tech`, default `*.vercel.app` hosts |
| Ready state | READY / PROMOTED |

This row is a snapshot. After the next production deploy, the live deployment ID changes; use Vercel → Deployments.

## Phase 13B (Preview credential scoping)

Vercel Preview targets no longer include Resend, Dodo, Upstash, GA4, or `PAYMENTS_PROVIDER`. Production copies were not deleted. Preview still shares Production `DATABASE_URL` (Supabase) and Auth.js secrets.

## Rollback target (do not promote unless production is broken)

Promote `dpl_ERZYJCurpbWRApBJzn1mmHZfRHaN` / `564535d` if a later 13B deploy fails.

Older READY production (legal name): `dpl_6DD8umTZtun5HsqFxzuPfnCn8LDh` / `31244e79`.

Older READY production (UI polish): `dpl_5Tuk6fnAcmuTMWKh5StxPCxrEbWD` / `d043058`.

## Rollback procedure

1. Confirm `GET https://zancta.tech/api/payments/checkout` still matches policy (`{"live":false}` unless live checkout was authorized).
2. In Vercel → Deployments, open the known-good READY production deployment.
3. Use **Promote to Production** / Instant Rollback.
4. Verify `https://zancta.tech` canonical host, tools, and checkout JSON.
5. If the bad change is in Git, revert the commit on `main`.

## Release path

1. GitHub Actions CI on `main` / PRs (Node 24).
2. Vercel builds `main` on Node 24.x.
3. Production aliases assign only after READY.
