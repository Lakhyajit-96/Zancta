# Releases and rollback

## Current production (inspection 23 August 2026, before 13B-final Git push)

| Item | Value |
|---|---|
| Deployment | `dpl_2G2YEAnqQ597zKX4qoho6Mowxkkz` |
| Inspector | [vercel.com/…/zancta/2G2YEAnqQ597zKX4qoho6Mowxkkz](https://vercel.com/lakhyajitchangmai77s-projects/zancta/2G2YEAnqQ597zKX4qoho6Mowxkkz) |
| Git commit | `9e61d538e0cda4102977e3cb1e943656a8b3f878` (`9e61d53`) |
| Branch | `main` |
| Message | keep Preview off Production mail, payments, and rate-limit stores. |
| Aliases | `zancta.tech`, `www.zancta.tech`, default `*.vercel.app` hosts |
| Ready state | READY / PROMOTED |

This row is a snapshot. After the next production deploy, the live deployment ID changes; use Vercel → Deployments.

## Phase 13B-final (Preview database split)

Preview `DATABASE_URL` is a separate Supabase project (`zancta-preview`). Production `DATABASE_URL` remains Production-only. Preview has its own `AUTH_SECRET` / `NEXTAUTH_SECRET`. `PREVIEW_ALLOW_PRODUCTION_*` stays unset.

## Rollback target (do not promote unless production is broken)

Promote `dpl_2G2YEAnqQ597zKX4qoho6Mowxkkz` / `9e61d53` if a later 13B-final deploy fails.

Older READY production (13A isolation): `dpl_ERZYJCurpbWRApBJzn1mmHZfRHaN` / `564535d`.

Older READY production (legal name): `dpl_6DD8umTZtun5HsqFxzuPfnCn8LDh` / `31244e79`.

Older READY production (UI polish): `dpl_5Tuk6fnAcmuTMWKh5StxPCxrEbWD` / `d043058`.

## Rollback procedure

1. Confirm `GET https://zancta.tech/api/payments/checkout` still matches policy (`{"live":false}` unless live checkout was authorized).
2. In Vercel → Deployments, open the known-good READY production deployment.
3. Use **Promote to Production** / Instant Rollback.
4. Verify `https://zancta.tech` canonical host, tools, and checkout JSON.
5. If the bad change is in Git, revert the commit on `main`.

## Release path

1. GitHub Actions CI on `main` / PRs (Node 24, PostgreSQL service, `prisma migrate` via `scripts/migrate.mjs`).
2. Operator applies pending Production migrations (`scripts/migrate.mjs deploy --confirm-production`) if the change includes SQL. Details: [migrations.md](migrations.md).
3. Vercel builds `main` on Node 24.x. The build is `prisma generate && next build` — it does not migrate.
4. Production aliases assign only after READY.
5. Smoke-test `GET https://zancta.tech/api/payments/checkout` (`{"live":false}` until live checkout is authorized).
