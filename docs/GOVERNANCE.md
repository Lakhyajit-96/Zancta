# Project Governance — Bootstrap

## Branch Strategy

- `main` — production-ready, protected, deploys to prod (Vercel auto-deploy when connected)
- `develop` — integration branch for Phase work
- `feat/*`, `fix/*`, `chore/*`, `docs/*` — short-lived feature branches from `develop`
- No direct pushes to `main`; PR required with 1 review + CI green.

## Commit Conventions (Conventional Commits)

```
feat: add tool execution engine
fix: correct CSP header for ads
chore: update deps
docs: add ADR for database choice
perf: optimize LCP
test: add E2E for converter flow
```

## Architecture Decision Records (ADR)

Stored in `docs/ADR/` as `ADR-001-title.md`. Template:

```md
# ADR-001: Title
- Date:
- Status: Proposed | Accepted | Deprecated
- Context:
- Decision:
- Consequences:
```

Every significant decision (framework, DB, auth, hosting, monetization) gets an ADR.

## Migration Rules

- DB migrations are versioned, forward-only, never edited after merge.
- `scripts/migrate.sh` runs `prisma migrate` or equivalent; prod migrations require backup snapshot first.
- Rollback is via new migration, not `down`.

## Code Ownership

- `CODEOWNERS` will define: `docs/*` → Orchestrator, `app/*` → Frontend, `lib/*` → Backend, `infra/*` → DevOps.
- No ownership enforcement until repo init; conceptual only for bootstrap.

## Test Requirements

- Unit tests for `lib/` and tool logic (Vitest, ≥80% for core)
- Integration tests for APIs/DB
- E2E for every user-facing flow (Playwright) before merge to `main`
- A11y checks (axe) and Lighthouse CI for perf.

## Review Requirements

- PR template: description, screenshots, test evidence, perf impact, security checklist.
- CI gates: `lint` → `typecheck` → `test` → `build` → `e2e` (when available) → `security audit`.

## Environment Rules

- `.env` never committed. `.env.example` documents all vars.
- `development` → `.env.local`, `staging` → Vercel preview env, `production` → Vercel prod env + secrets manager.
- Secrets rotation: document in `memory/operational.md`.

## Rollback Strategy

- Vercel instant rollback to previous deployment (1 click).
- DB: point-in-time restore from backup (when DB provisioned).
- Feature flags via env (`NEXT_PUBLIC_ENABLE_*`) for dark launches.

## Changelog

Maintain `CHANGELOG.md` (Keep a Changelog format) from Phase 1 onward.

## Change Log for Bootstrap

- 2026-08-11: Governance established; no code yet; awaiting Phase 1.
