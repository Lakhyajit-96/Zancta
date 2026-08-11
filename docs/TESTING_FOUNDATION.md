# Testing Foundation — Bootstrap

## Stack (planned, not yet installed)

- **Unit:** Vitest + Testing Library
- **Integration:** Vitest + Supertest (for API routes) + test DB
- **E2E:** Playwright (`@playwright/test`)
- **Visual:** Playwright screenshots + optional Chromatic/Percy
- **A11y:** axe-playwright
- **Perf:** Lighthouse CI

## Structure (to be created in Phase 1)

```
tests/
  unit/
  integration/
  e2e/
    fixtures/
playwright.config.ts
vitest.config.ts
```

## Gates

CI will run: `lint` → `typecheck` → `unit` → `integration` → `build` → `e2e` → `a11y` → `lighthouse`.

No gate currently passes because no code exists — this is expected at bootstrap. Baseline is `BLOCKED — REQUIRES INSTALL`: `npm install -D vitest @playwright/test`.

## Browser Matrix

- Desktop: Chromium (primary), Firefox, WebKit (where feasible)
- Mobile: Chromium emulated Pixel + iPhone

## Verification

- `npx playwright --version` → not installed (verified 2026-08-11)
- `npm test` not runnable until deps installed.

## Policy

- Every user-facing flow gets an E2E test before merge to `main`.
- No `test.skip` to hide failures; failures are blockers.
