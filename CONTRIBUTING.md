# Contributing to ZANCTA

ZANCTA is a privacy-first PDF and image suite at [https://zancta.tech](https://zancta.tech). The application source is **proprietary** ([LICENSE](LICENSE)). You may run an unmodified copy privately for evaluation. Opening a pull request does not grant you a license to operate a competing service or to reuse the brand.

This is a small project. There is no large contributor community and no SLA for review.

## Prerequisites

- Node.js 20 or newer (see `package.json` `engines`)
- npm 10+
- Docker, for the Vitest Postgres database (GitHub Actions provides a Postgres service)

## Setup

```bash
npm install
cp .env.example .env
npx prisma generate
npm run test:db:up
npm run migrate:bootstrap
npm run dev
```

If the local Postgres is empty, use `npm run migrate:bootstrap` rather than `prisma migrate deploy` (the first two historical SQL files are SQLite and must not be replayed). Details: [docs/operations/migrations.md](docs/operations/migrations.md).

Fill only the variables you need. Never commit secrets. Authoritative names and classification: [docs/operations/environment.md](docs/operations/environment.md).

Keep `PAYMENTS_LIVE_ENABLED=false` unless the owner has authorized live checkout.

## Workflow

1. Create a branch from `main`.
2. Make a focused change.
3. Run checks locally:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Chromium E2E (optional, slower):

```bash
npm run test:e2e -- --project=chromium
```

## Pull requests

- Describe **why** the change exists.
- Do not enable payments, ads, or IndexNow submission in a PR unless that is the explicit task.
- Do not add fake testimonials, traffic, or SEO doorway pages.
- Do not commit `.env`, credentials, or Windows user paths.
- Match existing TypeScript style. Prefer small diffs over drive-by refactors.

## Security

Report vulnerabilities to **security@zancta.tech** as described in [SECURITY.md](SECURITY.md). Do not file public issues for unfixed security bugs.

## Code of conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
