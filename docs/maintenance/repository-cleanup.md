# Repository cleanup record (12H-17F)

Deletions below were unused by application code, tests, package scripts, Prisma, Next.js, and Vercel. Historical launch drafts were consolidated into CHANGELOG and `docs/growth/`.

| PATH | REASON | REFERENCE CHECK | SAFE TO DELETE |
|---|---|---|---|
| `host_dodo_products.ps1` | One-off host probe | No imports; not in package.json | YES |
| `host_dodo_test.ps1` | One-off host probe | No imports; not in package.json | YES |
| `host_full_verify.ps1` | One-off host probe | No imports; not in package.json | YES |
| `brand-export.mjs` | Local brand export helper | Only mentioned in eslint ignore | YES |
| `skills-lock.json` | Agent skill lockfile | Not used by the app | YES |
| `scripts/submit-indexnow-once.mjs` | Legacy wrapper | Superseded by `submit-indexnow-direct.mjs` | YES |
| `scripts/submit-indexnow-batch.mjs` | Duplicate submit path | Official path is `submit-indexnow-direct.mjs` | YES |
| `scripts/run-indexnow-from-envfile.mjs` | One-off envfile wrapper | Not referenced | YES |
| `scripts/verify-12h14-production.mjs` | Phase probe | Not referenced | YES |
| `docs/TOOL_REGISTRY.md` | Bootstrap machine inventory | Outdated; not product docs | YES |
| `docs/MCP_ARCHITECTURE.md` | Agent MCP notes | Not product architecture | YES |
| `docs/SECURITY_FOUNDATION.md` | Bootstrap (pre-app) | Replaced by SECURITY.md | YES |
| `docs/DEPLOYMENT_FOUNDATION.md` | Bootstrap | Replaced by docs/deployment | YES |
| `docs/TESTING_FOUNDATION.md` | Bootstrap | Replaced by docs/development | YES |
| `docs/OBSERVABILITY.md` | Bootstrap | Replaced by architecture/security docs | YES |
| `docs/MONETIZATION.md` | Bootstrap (ads/GA BLOCKED) | Inaccurate vs live GA4/consent | YES |
| `docs/GOVERNANCE.md` | Bootstrap branch fiction | Does not match current `main` workflow | YES |
| `docs/SEO_FOUNDATION.md` | Bootstrap | Live SEO is in code + architecture | YES |
| `docs/ENVIRONMENT_CONFIGURATION.md` | Moved | Now `docs/operations/environment.md` | YES |
| `docs/growth/12h12-*.md`, `12h13-*.md`, `12h15-discovery.md` | Phase drafts | Strategy + Show HN draft retained | YES |

Kept: `scripts/submit-indexnow-direct.mjs`, `scripts/report-env-presence.mjs`, `scripts/generate-ocr-fixtures.mjs`, `scripts/ocr-accuracy.mjs`.
