# Local development

See the root [CONTRIBUTING.md](../../CONTRIBUTING.md) for the short path.

## Commands

| Script | Purpose |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run test:db:up` | Docker Postgres on port 54329 |
| `npm run migrate:bootstrap` | Empty local Postgres: apply PostgreSQL baseline + record migration history |
| `npm test` | Vitest (uses Docker/GHA Postgres on port 54329; never Production) |
| `npm run build` | Prisma generate + Next.js production build |
| `npm run test:e2e` | Playwright against a local production server |
| `npm run test:e2e -- -c playwright.prod.config.ts` | Small production-host checks against zancta.tech |

## Tests

Vitest **overrides** `DATABASE_URL` to the Docker test database and forces `PAYMENTS_LIVE_ENABLED=false`. Do not point tests at production Postgres.

E2E uses `playwright.config.ts` (local) or `playwright.prod.config.ts` (live site). Prefer Chromium for routine work; Firefox/WebKit are optional.

## Environment

Copy `.env.example` to `.env`. Full inventory: [environment.md](../operations/environment.md).
