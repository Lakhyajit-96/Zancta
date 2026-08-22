# Releases and rollback

## Current production (inspection 23 August 2026)

| Item | Value |
|---|---|
| Deployment | `dpl_5Tuk6fnAcmuTMWKh5StxPCxrEbWD` |
| Inspector | [vercel.com/…/zancta/5Tuk6fnAcmuTMWKh5StxPCxrEbWD](https://vercel.com/lakhyajitchangmai77s-projects/zancta/5Tuk6fnAcmuTMWKh5StxPCxrEbWD) |
| Git commit | `d0430583d3962a2643dbdf40bb857c526bf46819` (`d043058`) |
| Branch | `main` |
| Message | feat: refine ZANCTA UI without changing brand identity. |
| Aliases | `zancta.tech`, `www.zancta.tech`, default `*.vercel.app` hosts |
| Ready state | READY / PROMOTED |
| Rollback candidate | yes |

This row is a snapshot. After the next production deploy, update it.

## Previous known-good production

| Item | Value |
|---|---|
| Deployment | `dpl_DNujRAQPV1iLhDiouNGc1jwEscZ1` |
| URL (deployment host) | `zancta-d0461czdg-lakhyajitchangmai77s-projects.vercel.app` |
| Git commit | `a5cb0744a2b61bf30562e20512d3f7e2c7a5c3ac` (`a5cb074`) |
| Message | chore(repo): finalize production repository quality |
| Ready state | READY (superseded; still a rollback candidate) |

Do **not** roll back unless production is broken. This document only identifies the target.

## Rollback procedure (do not run unless needed)

1. Confirm `GET https://zancta.tech/api/payments/checkout` still matches policy (`{"live":false}` unless live checkout was authorized).
2. In Vercel → Deployments, open the known-good READY production deployment.
3. Use **Promote to Production** / Instant Rollback on that deployment (Hobby supports promoting a previous READY production deployment).
4. Verify `https://zancta.tech` HTML canonical, tools homepage, and checkout JSON.
5. If the bad change is in Git, revert the commit on `main` so the next git deploy does not re-ship the failure.

`lastRollbackTarget` on the project was `null` at inspection (no prior rollback recorded).

## Release path

1. GitHub Actions CI on `main` / PRs (Node 20).
2. Vercel builds `main` on Node 24.x.
3. Production aliases assign only after READY.

Failed builds are not deleted for cosmetics. Recent inspected deployments were READY (including Dependabot previews).
