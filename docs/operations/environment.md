# ZANCTA environment configuration

Authoritative inventory of environment variables used by the ZANCTA codebase.  
This document does not contain secrets. Fill real values only in gitignored files and Vercel.

**Do not** set `PAYMENTS_LIVE_ENABLED=true` unless live checkout is explicitly authorized.  
**Do not** set `NEXT_PUBLIC_ADS_ENABLED=true`.  
**Do not** prefix IndexNow variables with `NEXT_PUBLIC_`.

---

## 1. Complete variable inventory

| VARIABLE | PURPOSE | REQUIRED? | ENVIRONMENT | PUBLIC OR SECRET | DEFAULT | CODE USAGE | EXTERNAL SERVICE | CONFIGURE IN | NOTES |
|---|---|---|---|---|---|---|---|---|---|
| `DATABASE_URL` | Postgres connection for Prisma | YES (prod, local app, tests override) | all | SECRET | `file:./prisma/dev.db` in `lib/db.ts` (incompatible with current schema) | `lib/db.ts`, `prisma.config.ts` | Postgres | local `.env`, Vercel Production/Preview | Production must be Postgres. Tests force Docker URL. |
| `DATABASE_SSL` | Disable TLS for local Postgres | NO | local | neither (flag) | hosted TLS on; loopback TLS off | `lib/db.ts` | Postgres | local `.env` only | `disable` / `false` only. |
| `AUTH_SECRET` | Auth.js / HMAC (OCR lang tokens, OAuth intent, deleted-identity) | YES (prod) | all | SECRET | none (tests inject a test-only value) | `lib/auth.ts` (Auth.js), `lib/oauth-intent.ts`, `lib/ocr-lang-token.ts`, `lib/deleted-identity.ts`, `lib/production-config.ts` | Auth.js | local `.env`, Vercel | Preferred over `NEXTAUTH_SECRET`. |
| `NEXTAUTH_SECRET` | Alias for `AUTH_SECRET` | NO if `AUTH_SECRET` set | all | SECRET | none | same as `AUTH_SECRET` | Auth.js | local / Vercel | Keep in Vercel if already set; prefer one canonical secret. |
| `NEXTAUTH_URL` | Auth canonical URL, email links, origin fallback | YES (prod) | all | PUBLIC URL | production canonical `https://zancta.tech` in `lib/seo.ts` when `NODE_ENV=production` | `lib/seo.ts`, email, Auth.js | Auth.js | local / Vercel | Production: `https://zancta.tech`. |
| `AUTH_URL` | Auth.js origin alias | NO | all | PUBLIC URL | none | `lib/seo.ts` fallback only | Auth.js | optional | Unused elsewhere. |
| `AUTH_TRUST_HOST` | Trust `X-Forwarded-Host` on Vercel | YES on Vercel | preview / production | neither | `trustHost: true` is hard-coded in `lib/auth.ts` | `lib/production-config.ts` warning if unset | Auth.js / Vercel | Vercel | Set `true` on Vercel. |
| `AUTH_USE_SECURE_COOKIES` | Force non-Secure cookies | NO | local / test | neither | unset (production Vercel forces Secure) | `lib/auth.ts`, `lib/oauth-intent.ts` | Auth.js | local only | `false` only for http localhost e2e. |
| `GOOGLE_CLIENT_ID` | Google OAuth | NO (OAuth optional) | local / production | PUBLIC ID | none | `lib/auth.ts`, signin/signup pages | Google | local / Vercel | Buttons hidden if pair incomplete. |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | NO with ID | local / production | SECRET | none | `lib/auth.ts` | Google | local / Vercel | Must pair with ID. |
| `GITHUB_CLIENT_ID` | GitHub OAuth | NO | local / production | PUBLIC ID | none | `lib/auth.ts`, signin/signup | GitHub | local / Vercel | |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth secret | NO with ID | local / production | SECRET | none | `lib/auth.ts` | GitHub | local / Vercel | |
| `RESEND_API_KEY` | Transactional email | YES (prod) | production; optional local | SECRET | none (console transport locally) | `lib/email/index.ts`, `lib/production-config.ts` | Resend | local / Vercel | |
| `EMAIL_FROM` | Verified From address | YES (prod) | production | PUBLIC mailbox | none | `lib/email/index.ts` | Resend | local / Vercel | Use `noreply@mail.zancta.tech`. |
| `EMAIL_REPLY_TO` | Support Reply-To override | NO | all | PUBLIC mailbox | `support@zancta.tech` via `lib/legal-public.ts` | `lib/email/contacts.ts` | Hostinger mailbox | local / Vercel | |
| `PAYMENTS_PROVIDER` | Payment adapter name | NO | all | neither | `dodo` | `lib/payments/index.ts` | Dodo | local / Vercel | Only `dodo` is implemented. |
| `DODO_API_KEY` | Dodo REST API | YES when checkout/webhooks run | preview / production | SECRET | none | `lib/payments/providers/dodo.ts` | Dodo | local / Vercel | Required at call time, not at boot. |
| `DODO_WEBHOOK_SECRET` | Webhook HMAC | YES for webhooks | preview / production | SECRET | none | `lib/payments/providers/dodo.ts` | Dodo | local / Vercel | Preferred name. |
| `DODO_PAYMENTS_WEBHOOK_SECRET` | Alias of webhook secret | NO | all | SECRET | none | `lib/payments/providers/dodo.ts` | Dodo | optional | Legacy alias. |
| `DODO_ENVIRONMENT` | `test` or `live` API host | YES (prod should be explicit) | all | neither | `test` | `lib/payments/live.ts`, Dodo client, checkout route | Dodo | local / Vercel | Keep `test` while checkout is off. |
| `DODO_PRODUCT_MONTHLY_ID` | Premium monthly product | YES for live checkout | production | SECRET-ish ID | none | `lib/payments/live.ts`, checkout | Dodo | Vercel | |
| `DODO_PRODUCT_ANNUAL_ID` | Premium annual product | YES for live checkout | production | SECRET-ish ID | none | same | Dodo | Vercel | |
| `DODO_PAYMENTS_PRODUCT_MONTHLY_ID` | Alias monthly | NO | all | SECRET-ish ID | none | live.ts, checkout, dodo.ts | Dodo | optional | Legacy alias. |
| `DODO_PAYMENTS_PRODUCT_ANNUAL_ID` | Alias annual | NO | all | SECRET-ish ID | none | same | Dodo | optional | Legacy alias. |
| `PAYMENTS_LIVE_ENABLED` | Live charge switch | YES in production (must be `false` until authorized) | production | neither | not `true` → checkout `{live:false}` | `lib/payments/live.ts` | Dodo | Vercel Production | Live only if `true` **and** `DODO_ENVIRONMENT=live` **and** both product IDs. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 measurement ID | NO | all | PUBLIC | none | `components/consent-and-analytics.tsx`, `lib/analytics/tracker.ts`, `next.config.ts` CSP | Google Analytics | local / Vercel | Format `G-…`. Consent-gated. |
| `NEXT_PUBLIC_APP_URL` | Public origin helper | NO in prod (canonical hard-coded) | local / preview | PUBLIC | `https://zancta.tech` in production code path | `lib/seo.ts` | none | local / Vercel | |
| `NEXT_PUBLIC_APP_NAME` | Display name | NO | — | PUBLIC | none | **not read by application code** | none | unused | Present in some Vercel env; unused. |
| `NEXT_PUBLIC_ADS_ENABLED` | Ad slot flag | NO | all | PUBLIC | not `true` → ads off | `components/marketing/ad-slot.tsx` | none | Vercel / local | Keep `false` or unset. |
| `SENTRY_DSN` | Server Sentry | NO | all | SECRET | none | `instrumentation.ts`, `lib/observability/sentry.ts`, CSP | Sentry | optional | Inert if empty. Do not purchase for this phase. |
| `NEXT_PUBLIC_SENTRY_DSN` | Browser Sentry | NO | all | treat as sensitive | none | `next.config.ts`, sentry helper | Sentry | avoid | Prefer server DSN only. |
| `INDEXNOW_KEY` | IndexNow ownership key | YES for IndexNow | production | SECRET (also hosted as `/{key}.txt` by protocol) | none | `lib/indexnow.ts`, `proxy.ts`, `scripts/submit-indexnow-direct.mjs` | IndexNow / Bing | Vercel Production (and operator shell for submit) | Never `NEXT_PUBLIC_`. CLI `vercel env run` currently injects empty for Encrypted vars. |
| `INDEXNOW_NOTIFY_SECRET` | Internal `POST /api/indexnow` bearer | YES if using that API | production | SECRET | unset → 503 | `app/api/indexnow/route.ts` | none (ZANCTA) | Vercel Production | **Not** the IndexNow protocol key. Official submit script does not need it. |
| `UPSTASH_REDIS_REST_URL` | Distributed rate limit | YES (prod, warned if missing) | production | SECRET | memory fallback (fail-closed in prod if URL set but token missing) | `lib/rate-limit.ts` | Upstash | Vercel | |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash token | YES with URL | production | SECRET | none | `lib/rate-limit.ts` | Upstash | Vercel | |
| `TEST_DATABASE_URL` | Isolated test Postgres | NO (has default) | test | SECRET (local test creds in repo compose file) | `postgresql://zancta:zancta@127.0.0.1:54329/zancta_test` | `tests/postgres-url.ts`, `tests/apply-test-schema.mjs` | Docker Postgres | optional local | `tests/setup.ts` assigns this to `DATABASE_URL`. |
| `NODE_ENV` | Node environment | YES (set by runtime) | all | neither | `development` | many files | Node / Next | do not hand-set on Vercel | |
| `VERCEL_ENV` | `production` / `preview` / `development` | platform | Vercel | neither | unset off-Vercel | auth cookies, rate limit, contact schema, production-config | Vercel | automatic | |
| `VERCEL` | Present on Vercel | platform | Vercel | neither | unset | `lib/production-config.ts` | Vercel | automatic | |

Platform-only variables (`NODE_ENV`, `VERCEL`, `VERCEL_ENV`) are not owner-filled secrets.

---

## 2. Production-required variables

Must be set on **Vercel Production** for the live app to function as designed:

- `DATABASE_URL`
- `AUTH_SECRET` (or `NEXTAUTH_SECRET`)
- `NEXTAUTH_URL` (`https://zancta.tech`)
- `AUTH_TRUST_HOST` (`true`)
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `PAYMENTS_LIVE_ENABLED` = `false` until live checkout is authorized
- `DODO_ENVIRONMENT` (keep `test` while checkout is off)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (if Google sign-in should appear)
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` (if GitHub sign-in should appear)

Required for IndexNow (distribution), not for serving tools:

- `INDEXNOW_KEY`
- `INDEXNOW_NOTIFY_SECRET` (only for `POST /api/indexnow`)

Required when checkout/webhooks are exercised (even in test mode):

- `DODO_API_KEY`
- `DODO_WEBHOOK_SECRET`
- `DODO_PRODUCT_MONTHLY_ID`
- `DODO_PRODUCT_ANNUAL_ID`

---

## 3. Local-development variables

Minimum to run `next dev` against Postgres:

- `DATABASE_URL` (local or remote Postgres; not the SQLite default)
- `AUTH_SECRET` or `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` = `http://localhost:3000`
- `NEXT_PUBLIC_APP_URL` = `http://localhost:3000`
- `AUTH_TRUST_HOST=true`
- `PAYMENTS_LIVE_ENABLED=false`

Optional locally: Resend, Dodo test keys, OAuth, Upstash, GA4, IndexNow.

`AUTH_USE_SECURE_COOKIES=false` only if an http localhost browser cannot store Secure cookies.

---

## 4. Test variables

Vitest (`tests/setup.ts`, `tests/global-setup.ts`):

- Forces `DATABASE_URL` to `TEST_DATABASE_URL` (Docker `127.0.0.1:54329`)
- Forces `PAYMENTS_LIVE_ENABLED=false`
- Injects a test-only `AUTH_SECRET` if missing
- Defaults `NEXT_PUBLIC_APP_URL` / `NEXTAUTH_URL` to `https://zancta.tech` if unset

Playwright (`playwright.config.ts`) sets `PAYMENTS_LIVE_ENABLED=false` and test secrets for the local server.

Do not point tests at production `DATABASE_URL`.

---

## 5. Public vs secret classification

**Public (safe in `NEXT_PUBLIC_*` or as a known URL/mailbox):**

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `NEXT_PUBLIC_ADS_ENABLED` (keep false)
- `NEXTAUTH_URL`
- `EMAIL_FROM` / `EMAIL_REPLY_TO` (mailboxes, not API keys)
- `GOOGLE_CLIENT_ID` / `GITHUB_CLIENT_ID` (OAuth client IDs)

**Secret (never `NEXT_PUBLIC_`, never git, never logs):**

- `DATABASE_URL`
- `AUTH_SECRET` / `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_SECRET` / `GITHUB_CLIENT_SECRET`
- `RESEND_API_KEY`
- `DODO_API_KEY` / `DODO_WEBHOOK_SECRET` (+ aliases)
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
- `INDEXNOW_KEY` / `INDEXNOW_NOTIFY_SECRET`
- `SENTRY_DSN` (and avoid `NEXT_PUBLIC_SENTRY_DSN`)

**Protocol note:** IndexNow requires hosting `INDEXNOW_KEY` at `https://zancta.tech/{key}.txt`. That file is fetchable by search engines by design. It must still not appear in client JS, Git, or operator logs.

---

## 6. Where each value comes from

| Variable | Source |
|---|---|
| `DATABASE_URL` | Postgres provider dashboard |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` | `https://zancta.tech` in production |
| OAuth | Google Cloud Console / GitHub Developer Settings |
| `RESEND_API_KEY` / `EMAIL_FROM` | Resend dashboard; verified domain `mail.zancta.tech` |
| `EMAIL_REPLY_TO` | Hostinger mailbox `support@zancta.tech` |
| Dodo keys / product IDs | Dodo Payments dashboard |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 Admin → Data stream |
| `INDEXNOW_KEY` | Bing IndexNow key generator |
| `INDEXNOW_NOTIFY_SECRET` | Generate separately (`openssl rand -hex 32`) |
| Upstash | Upstash Redis REST credentials |
| `PAYMENTS_LIVE_ENABLED` | Operator policy; keep `false` |

---

## 7. Values the owner must enter manually

Do not invent these. Paste into local `.env` and Vercel Production (names only listed here):

1. `DATABASE_URL`
2. `AUTH_SECRET` (if rotating; otherwise keep existing Vercel value)
3. `RESEND_API_KEY`
4. `DODO_API_KEY`
5. `DODO_WEBHOOK_SECRET`
6. `DODO_PRODUCT_MONTHLY_ID`
7. `DODO_PRODUCT_ANNUAL_ID`
8. `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
9. `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
10. `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
11. `NEXT_PUBLIC_GA_MEASUREMENT_ID`
12. `INDEXNOW_KEY`
13. `INDEXNOW_NOTIFY_SECRET`

Confirm in Vercel (do not change in this phase): `PAYMENTS_LIVE_ENABLED=false`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `NEXTAUTH_URL`, `AUTH_TRUST_HOST`.

---

## 8. Local / Vercel mismatch matrix

Snapshot: names and presence only (no values). Recovery date: 2026-08-23.  
Re-run locally with `node scripts/report-env-presence.mjs` (prints `PRESENT` / `EMPTY` / `MISSING` only).

### What happened to `.env`

The working-tree `.env` was **deleted** by an earlier agent session after a Vercel CLI env run; it was **not** removed by Git. Git never tracked `.env` or `.env.production` (only `.env.example`). No stash contained them.

**Newest original snapshot** was restored to gitignored `.env` and `.env.production` from local editor history (August 2026). Public URL class in that snapshot is the canonical `zancta.tech` host. IndexNow keys are owner-filled; they must never be committed.

Older leftover: `.env.bak12c` (19 Aug 2026) — same auth/database/OAuth/Resend/Upstash secrets as the restored file; older public URLs were the legacy `vercel.app` host; Dodo fields differed (`test` vs restored `live`). Not used for restore.

`.env.vercel-check` is an empty Encrypted CLI dump. Not used for restore. Vercel Production values were **not** downloaded (Encrypted pull does not yield usable local values).

### Local files after 12H-17E restore

| File | Status |
|---|---|
| `.env` | **PRESENT** (restored original + additive `PAYMENTS_LIVE_ENABLED=false`, ads off, empty IndexNow slots) |
| `.env.local` | **MISSING** (not required) |
| `.env.development` | **MISSING** |
| `.env.production` | **PRESENT** (same restored content as `.env`) |
| `.env.test` | **MISSING** |
| `.env.bak12c` | present, gitignored older backup |
| `.env.vercel-check` | present, gitignored empty Encrypted dump |

### Vercel scopes (`vercel env ls`)

**Development (Vercel):** no environment variables.

**Preview:** names present (Encrypted): `NODE_ENV`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_NAME`, `DATABASE_URL`, `NEXTAUTH_SECRET`, `AUTH_SECRET`, `AUTH_TRUST_HOST`, `RESEND_API_KEY`, `EMAIL_FROM`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `PAYMENTS_PROVIDER`, `DODO_API_KEY`, `DODO_WEBHOOK_SECRET`, `DODO_ENVIRONMENT`, `DODO_PRODUCT_MONTHLY_ID`, `DODO_PRODUCT_ANNUAL_ID`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`.

**Production:** Preview set **plus** Production-only: `EMAIL_REPLY_TO`, `PAYMENTS_LIVE_ENABLED`, `INDEXNOW_NOTIFY_SECRET`, `INDEXNOW_KEY`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.

Values were not read. Encrypted names exist; emptiness in the dashboard is an owner check.

| Check | Finding |
|---|---|
| PRESENT BOTH | Core production names: `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `AUTH_TRUST_HOST`, OAuth pairs, `RESEND_API_KEY`, `EMAIL_FROM`, Dodo canonical keys, Upstash, GA4, `PAYMENTS_PROVIDER`, `NODE_ENV`, `NEXT_PUBLIC_APP_URL` |
| LOCAL ONLY | `AUTH_USE_SECURE_COOKIES`, `NEXT_PUBLIC_ADS_ENABLED` |
| VERCEL ONLY | `EMAIL_REPLY_TO` |
| EMPTY (do not commit) | Never put `INDEXNOW_KEY` or `INDEXNOW_NOTIFY_SECRET` in Git. Configure them in Vercel Production. |
| UNUSED/LEGACY | `NEXT_PUBLIC_APP_NAME` (both). `DODO_PAYMENTS_*` aliases unused. `SENTRY_DSN` unset both |
| Value mismatch (flagged, not overwritten) | Restored local `DODO_ENVIRONMENT=live`; Vercel Encrypted value unknown. Checkout remains off because `PAYMENTS_LIVE_ENABLED=false`. Do not change Vercel. |
| Missing from Vercel Development | All names |
| Missing from Vercel Preview vs Production | `NEXTAUTH_URL`, OAuth pair, `EMAIL_REPLY_TO`, `PAYMENTS_LIVE_ENABLED`, `INDEXNOW_KEY`, `INDEXNOW_NOTIFY_SECRET` |
| Public/secret mismatch | None observed. Public `NEXT_PUBLIC_*` in restored files: `APP_URL`, `APP_NAME`, `GA_MEASUREMENT_ID`, `ADS_ENABLED`. IndexNow is not public. |
| Duplicate | Both `AUTH_SECRET` and `NEXTAUTH_SECRET` locally and on Vercel |

---

## 9. Deprecated / unused / alias variables

| Name | Status |
|---|---|
| `NEXT_PUBLIC_APP_NAME` | Unused by application code. Safe leftover on Vercel. |
| `AUTH_URL` | Optional Auth.js alias; only a `lib/seo.ts` fallback. Prefer `NEXTAUTH_URL`. |
| `NEXTAUTH_SECRET` | Alias of `AUTH_SECRET`. Not deprecated; keep if already populated. |
| `DODO_PAYMENTS_WEBHOOK_SECRET` | Alias of `DODO_WEBHOOK_SECRET`. |
| `DODO_PAYMENTS_PRODUCT_MONTHLY_ID` | Alias of `DODO_PRODUCT_MONTHLY_ID`. |
| `DODO_PAYMENTS_PRODUCT_ANNUAL_ID` | Alias of `DODO_PRODUCT_ANNUAL_ID`. |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional; prefer `SENTRY_DSN`. Do not put a secret in a public var. |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | Historical docs name. **Not read by code.** |
| `NEXT_PUBLIC_ENABLE_*` | Historical docs name. **Not read by code.** |
| `GA_ID` | Historical name. **Not read by code.** Use `NEXT_PUBLIC_GA_MEASUREMENT_ID`. |
| SQLite `DATABASE_URL=file:…` | Default in `lib/db.ts` is incompatible with current Prisma Postgres schema. Do not use. |

Leftover local files (not variables): `.env.bak12c`, `.env.vercel-check` — gitignored copies. Do not commit. Treat as obsolete backups, not as the live template.

---

## 10. Safe setup instructions

### Local

1. Keep `.env` and `.env.production` gitignored. Do not commit them. Copy `.env.example` if you need a fresh local file.
2. Optionally copy the same into `.env.local` if you use Next.js local overrides. This repo does not require `.env.local`.
3. Fill secrets. Never copy production secrets into git or chat logs.
4. `PAYMENTS_LIVE_ENABLED=false`.
5. Start Postgres (or use a remote **non-production** database).
6. `npx prisma generate` then `npm run dev`.
7. Optional: `node scripts/report-env-presence.mjs` to confirm names are `PRESENT` without printing values.

Tests: `docker compose -f docker-compose.test.yml up -d --wait` then `npm test`. Do not reuse production `DATABASE_URL`.

### Vercel Production

1. Open the project → Settings → Environment Variables.
2. Use `.env.production.example` as the checklist.
3. Mark secrets as Sensitive / Encrypted.
4. Never add `NEXT_PUBLIC_` to IndexNow, Dodo, Resend, database, or auth secrets.
5. After changing Production env, **redeploy** so runtime and the IndexNow key file pick up values.
6. `vercel env run -e production` may still inject **empty** Encrypted values in this CLI; that does not prove Production runtime is empty. Confirm in the Vercel dashboard (reveal once).

---

## 11. Rotation procedure for secrets

| Secret | Rotate by | After rotate |
|---|---|---|
| `AUTH_SECRET` | Generate new; set Vercel Production; redeploy | Existing sessions/JWTs invalidate. OCR lang tokens and OAuth intent cookies break until refresh. |
| `NEXTAUTH_SECRET` | Same as `AUTH_SECRET` if that alias is the live one | Keep one source of truth. |
| `DATABASE_URL` | Provider rotate password; update Vercel; redeploy | Brief downtime if the old URL is revoked first. |
| `RESEND_API_KEY` | Resend dashboard → new key → Vercel → revoke old | Mail stops until redeploy. |
| Dodo API / webhook | Dodo dashboard → Vercel → redeploy | Webhooks 401 until the new secret is live. |
| OAuth client secrets | Google/GitHub consoles → Vercel → redeploy | Sign-in fails until both ID and secret match. |
| Upstash | New token → Vercel → redeploy | Rate limit fail-closed in production if URL remains without a valid token. |
| `INDEXNOW_KEY` | Bing generator → Vercel `INDEXNOW_KEY` → redeploy so `/{key}.txt` matches → one IndexNow submit | Old key file path 404s. Tell Bing by hosting the new file before submitting. |
| `INDEXNOW_NOTIFY_SECRET` | Generate new → Vercel → redeploy | Operator `POST /api/indexnow` must use the new bearer. Official `api.indexnow.org` submit does not use this secret. |

Never rotate by committing the new value. Never paste secrets into issue trackers or chat if a dashboard reveal is enough.

---

## 12. Deployment checklist

- [ ] `PAYMENTS_LIVE_ENABLED` is `false`
- [ ] `NEXT_PUBLIC_ADS_ENABLED` is unset or `false`
- [ ] `DATABASE_URL` is production Postgres, not Docker test
- [ ] `AUTH_SECRET` or `NEXTAUTH_SECRET` set
- [ ] `NEXTAUTH_URL=https://zancta.tech`
- [ ] `AUTH_TRUST_HOST=true`
- [ ] Resend key + `EMAIL_FROM`
- [ ] Upstash URL + token
- [ ] OAuth pairs complete or intentionally omitted
- [ ] Dodo test credentials present; environment `test`
- [ ] `INDEXNOW_KEY` set and, after deploy, `/{key}.txt` is 200 `text/plain`
- [ ] No secret in `NEXT_PUBLIC_*` except GA measurement ID / ads flag / public URL
- [ ] Checkout `GET /api/payments/checkout` → `{"live":false}`
- [ ] `/ads.txt` remains unpublished until ads are reviewed

---

## Classification summary

**A. Required production** — §2  
**B. Required local development** — §3  
**C. Required testing** — §4 (mostly injected)  
**D. Optional production** — Sentry DSNs, IndexNow (until distribution), ads flag, `DATABASE_SSL`  
**E. Public `NEXT_PUBLIC_*`** — `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_ADS_ENABLED`; unused `NEXT_PUBLIC_APP_NAME`  
**F. Third-party** — Resend, Dodo, Google, GitHub, GA4, Upstash, IndexNow/Bing, Sentry  
**G. Deprecated/unused** — §9
