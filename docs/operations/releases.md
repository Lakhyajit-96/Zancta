# Releases and rollback

## Current production (inspection 23 August 2026, before 13A deploy)

| Item | Value |
|---|---|
| Deployment | `dpl_6DD8umTZtun5HsqFxzuPfnCn8LDh` |
| Inspector | [vercel.com/…/zancta/6DD8umTZtun5HsqFxzuPfnCn8LDh](https://vercel.com/lakhyajitchangmai77s-projects/zancta/6DD8umTZtun5HsqFxzuPfnCn8LDh) |
| Git commit | `31244e79138766676ffeccf5082792d99f783a0f` (`31244e79`) |
| Branch | `main` |
| Message | Keep the operator legal name on Terms only, not on Contact or marketing surfaces. |
| Aliases | `zancta.tech`, `www.zancta.tech`, default `*.vercel.app` hosts |
| Ready state | READY / PROMOTED |

This row is a snapshot. After the next production deploy, the live deployment ID changes; use Vercel → Deployments.

## Rollback target (do not promote unless production is broken)

Promote `dpl_6DD8umTZtun5HsqFxzuPfnCn8LDh` / `31244e79` if a later deploy fails.

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
