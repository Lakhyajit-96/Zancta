# Database migrations

ZANCTA Production is **Supabase PostgreSQL**. Historical Prisma SQL for the first two migrations is **SQLite** (`DATETIME`, `PRAGMA`). Those files are checksum-locked and must never be edited or replayed on PostgreSQL.

Never run `prisma db push`. Never `prisma migrate reset` against Production. Never run migrations inside `next build`.

## History

| Folder | Dialect | Role |
|---|---|---|
| `20260811160111_init` | SQLite | Recorded-as-applied on Production. Do not replay. |
| `20260811165730_add_payments_9a` | SQLite | Recorded-as-applied on Production. Do not replay. |
| `20260820200000_add_deleted_provider_identity` onward | PostgreSQL | Real SQL. Production `migrate deploy` applies only **pending** folders. |

`prisma/migrations/checksums.json` is the lockfile of every `migration.sql` SHA-256. Changing historical SQL fails CI.

`prisma/baseline/postgresql.sql` is the generated PostgreSQL schema for **empty** databases. It is not inserted as a fake Prisma migration. Regenerate with `npm run migrate:baseline`.

## Fresh PostgreSQL (contributors, CI, local tests)

Empty database only:

```bash
npm run test:db:up
npm run migrate:bootstrap
```

Bootstrap:

1. Applies the current PostgreSQL schema (`migrate diff --from-empty --to-schema`).
2. `prisma migrate resolve --applied` for each existing folder (records checksums; does not run SQLite SQL).
3. `prisma migrate deploy` (must report no pending historical replay).

`npm test` does this via `tests/apply-test-schema.mjs`.

## Existing Production

Production already has `_prisma_migrations` for all current folders; checksums match Git.

```bash
node scripts/operator-production-release.mjs --print-plan
node scripts/operator-production-release.mjs --verify-env
node scripts/operator-production-release.mjs --migrate --confirm-production
node scripts/operator-production-release.mjs --verify --confirm-production
# then git push / Vercel deploy (application only)
node scripts/operator-production-release.mjs --smoke
```

`scripts/migrate.mjs deploy`:

- Rewrites transaction-pooler port `6543` → session `5432` (Prisma migrate cannot hang on PgBouncer transaction mode).
- Applies **pending** PostgreSQL migrations only.
- Refuses to replay `20260811160111_init` / `20260811165730_add_payments_9a`.
- Refuses schema-without-history (no silent `db push` recovery).
- Requires `--confirm-production` when `DATABASE_URL` is not loopback.

Read-only history compare (never writes):

```bash
node scripts/inspect-migration-history.mjs --production-readonly
```

## Deploy order

1. Verify environment (`PAYMENTS_LIVE_ENABLED=false` until Phase 6D-7).
2. Apply pending migrations.
3. Verify `migrate status` and schema drift (`migrate.mjs verify`).
4. Deploy the application (`npm run build` is `prisma generate && next build` only).
5. Smoke-test `GET https://zancta.tech/api/payments/checkout` → `{"live":false}`.

## Rollback

- **App:** Vercel Instant Rollback / promote a previous READY production deployment. See [releases.md](releases.md).
- **Database:** do not reset. Additive migrations stay. A bad schema change needs a **new** forward migration. Do not edit or roll back historical SQL.
- **Failed `migrate deploy`:** stop. Do not push the app. Inspect `migrate status`. Use `prisma migrate resolve` only when an operator has confirmed the SQL already succeeded and the checksum matches Git.

## Adding a new migration

1. Write **PostgreSQL** SQL only (`TIMESTAMP(3)`, no `DATETIME` / `PRAGMA`).
2. Append its SHA-256 to `prisma/migrations/checksums.json`.
3. Run `npm run migrate:baseline` so `prisma/baseline/postgresql.sql` matches `schema.prisma`.
4. Apply on Production with `migrate deploy` **before** shipping app code that requires the new columns/tables, unless the change is fully backward compatible.
