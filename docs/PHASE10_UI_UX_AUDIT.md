# Phase 10: UI/UX Audit — Complete Product Assessment

**Audits Conducted:** August 12, 2026  
- **Nora:** Repository static analysis (code review, component inventory, design system gaps)  
- **Grace:** Live deployment inspection (https://toolsite-4q4w.vercel.app, DOM + visual inspection at 788×783px constrained viewport)

---

## Executive Summary — Top 10 Issues

| # | Severity | Issue | Source | File/Route Evidence |
|---|----------|-------|--------|---------------------|
| 1 | CRITICAL | JSON-LD canonical URL hardcoded to `example.com` on all 10 tool pages | Nora | `lib/seo.ts:33`, `app/tools/[slug]/page.tsx:84` |
| 2 | CRITICAL | Placeholder email addresses published live (`support@localfile.example`, `security@localfile.example`) | Both | `app/contact/page.tsx:3`, `app/security/page.tsx:3` |
| 3 | CRITICAL | Terms page ("MVP terms — no account") contradicts production reality (accounts + payments via Dodo live) | Both | `app/terms/page.tsx:3`, `/pricing` accepts payments |
| 4 | CRITICAL | `/docs` published as "coming soon" stub; `/contact` / `/help` / `/about` critically thin for production legal/trust expectations | Grace | `app/docs/page.tsx:3`, `app/about/page.tsx:3`, `app/help/page.tsx:3`, `app/contact/page.tsx:3` |
| 5 | CRITICAL | Pricing claims not backed by code: "higher limits", "advanced controls (selective EXIF)", "saved preferences" have no implementation | Nora | `app/pricing/page.tsx:28-38`; entitlement plumbing exists but never reads in runtime (`tool-shell.tsx`, `file-safety.ts`) |
| 6 | MAJOR | Touch targets <44px across nav links (~20px height), quality slider thumb, violating WCAG 2.1 AA | Both | `nav.tsx:11-14` (measured 32–43px), `tool-ui.tsx:155-165` (range thumb), Grace audit §7 & §10 |
| 7 | MAJOR | Non-functional "Keep aspect" checkbox; contradictory file-count limits (worker hardcodes 5, UI shows 20, docs say 20) | Nora | `tool-shell.tsx:24,352`, `workers/image.worker.ts:27`, `tool-ui.tsx:63`, `lib/tools.ts:199` |
| 8 | MAJOR | No ZIP download for multi-output tools (PDF→Images, Split) despite `jszip` installed and FAQ promises | Nora | `workers/bg.worker.ts` (ZIP claim), `lib/tools.ts:129`, `app/tools/pdf-to-images/page.tsx:76-77` |
| 9 | MAJOR | Background-remover published (`available: true`) but blocked at shell level (`bg.worker.ts` is stub); appears in hero/grid | Nora | `lib/tools.ts:232`, `hero.tsx:17`, `tool-shell.tsx:98-105` |
| 10 | MAJOR | No real fonts loaded (Geist/Inter declared in `globals.css:39-40` but nothing installed); all pages render `ui-sans-serif/system-ui` silently | Nora | `app/globals.css:39-40` vs `next/font` unused repo-wide |

**Cross-source confirmation:** Both audits agree on critical placeholder/email issues and accessibility violations. Nora provides exhaustive code-path evidence; Grace confirms visual presence of stub/thin pages and touch target concerns in production.

---

## Content Integrity Scan

*Placeholder and internal-language findings from Nora repository audit.*

| # | Severity | Finding | Evidence |
|---|----------|---------|----------|
| 1.1 | CRITICAL | JSON-LD canonical URL hardcoded to `example.com` for every tool page | `lib/seo.ts:33` — `url: \`https://example.com/tools/${tool.slug}\`` (inside `jsonLdSoftwareApp`, injected on all 10 tool pages via `app/tools/[slug]/page.tsx:84`) |
| 1.2 | CRITICAL | Contact page ships literal placeholder address | `app/contact/page.tsx:3` — "support@localfile.example (placeholder)" |
| 1.3 | CRITICAL | Security page ships literal placeholder address | `app/security/page.tsx:3` — "security@localfile.example (placeholder)" |
| 1.4 | MAJOR | User-facing error references internal phase report | `components/ui/tool-shell.tsx:102` — "See docs/PHASE6C_REPORT.md for verification details." |
| 1.5 | MAJOR | User-facing completion fallback mentions internal phase | `components/ui/tool-shell.tsx:419` — "No file output — this tool's image engine ships in Phase 5." |
| 1.6 | MAJOR | Pricing error bubble exposes env-var names + internal report section | `app/pricing/pricing-client.tsx:102` — "Set DODO_PRODUCT_MONTHLY_ID/ANNUAL_ID … See docs/PHASE9A_REPORT.md §AJ." |
| 1.7 | MAJOR | BG worker stub uses phase-report language (dead path today, but user-visible string) | `workers/bg.worker.ts:7` — "BG engine ships in Phase 5 — MIT model spike pending." |
| 1.8 | MAJOR | Internal MVP/phase vocabulary throughout user copy: "at MVP", "future premium", "coming with V1" | `components/marketing/nav.tsx:63`, `app/privacy/page.tsx:3`, `app/page.tsx:15,24`, `app/signup/page.tsx:29`, `app/signin/page.tsx:27`, `app/account/page.tsx:31`, `app/docs/page.tsx:3`, `components/ui/tool-ui.tsx:63`, `lib/file-safety.ts:85` ("HEIC cloud fallback coming in V1") |
| 1.9 | MAJOR | One-line stub pages shipped and indexed: about/contact/docs/help/security/terms are each a single paragraph; `app/docs/page.tsx` is literally "coming with V1 guides" | `app/about/page.tsx`, `app/contact/page.tsx`, `app/docs/page.tsx`, `app/help/page.tsx`, `app/security/page.tsx`, `app/terms/page.tsx` |
| 1.10 | MINOR | Analytics described in copy but not implemented: homepage/privacy promise "anonymized tool_view events", yet no analytics script is loaded anywhere; only a conditional `window.gtag?.()` call that can never fire | `app/page.tsx:24`, `app/privacy/page.tsx:3`, `components/marketing/hero.tsx:27` vs `components/ui/tool-shell.tsx:232` (gtag never injected) |
| 1.11 | MINOR | Footer tagline is defensive/meta copy, not brand copy: "No fake claims — processing is local at MVP." | `components/marketing/nav.tsx:63` |

**Hardcoded statistics/testimonials:** None found (no user counts, star ratings, or fabricated testimonials — good). The only "stats" are real limit numbers (50 MB, 10 tools) — but see consistency issues in pricing vs entitlements.

---

## Component Inventory & Design System Gaps

### Pages (`app/`)

Home (`page.tsx`), tools index, 10 tool pages (`tools/[slug]/page.tsx` — static params, per-tool metadata, breadcrumb, related tools, FAQ + JSON-LD), pricing (+`pricing-client.tsx`), about, contact, docs, help, privacy, security, terms, signin/signup/forgot-password/reset-password/verify-email (each with noindex `layout.tsx`), account (+`delete-form.tsx`).

### Components

- `components/marketing/nav.tsx` — exports `Navigation`, `MobileNav`, and `Footer` (footer lives inside nav.tsx, not its own file).
- `components/marketing/hero.tsx` — only framer-motion consumer.
- `components/marketing/tool-grid.tsx` — reused on home and `/tools` (good reuse).
- `components/ui/tool-shell.tsx` (435 lines) + `tool-ui.tsx` — core tool experience.
- **Dead/unused components (MAJOR)**: `components/ui/button.tsx` (`Button`), `components/ui/layout.tsx` (`Badge`, `Card`, `Container`, `Section`) — zero imports found repo-wide. `components/ui/tool-ui.tsx:71` `FileRow` is also unused because `tool-shell.tsx:358-368` inlines its own file rows (duplicated markup, and the inline version lacks the `aria-label` that `FileRow` has).
- Generic/template feel: `Badge/Card/Container/Section` are boilerplate; auth pages are bare forms with no `Navigation`/`Footer` chrome (no header on `/signup`, `/signin`, `/forgot-password`, `/reset-password`, `/verify-email`, `/account`) — inconsistent shell.

### Design Tokens (`app/globals.css`, Tailwind v4 `@theme`)

- Colors: OKLCH dark-first palette (background/surface/elevated, muted, accent/accent-soft/accent-foreground, success/warning/error). Radius scale 6/12/20/28px. No shadow tokens (only ad-hoc `shadow-lg` in mobile nav). Border convention: `border` + token color; a global `* { border-color }` rule.
- **Token violations**:
  - `hero.tsx:41,46,52,59` — inline hex styles (`#f8f8f8`, `#8ec2ff`) bypass tokens.
  - `app/account/page.tsx:35` — `text-green-600` instead of `text-success`.
  - `app/account/delete-form.tsx:23` — uses `text-error-foreground`, a token that does not exist in `globals.css` (class is inert; text falls back to body color).
  - `app/privacy/page.tsx` uses `prose prose-invert` but `@tailwindcss/typography` is not installed — classes are inert.
- **Typography (MAJOR)**: No `next/font` anywhere. `globals.css:39-40` declares `"Geist Sans", "Inter", …` but neither font is loaded or installed — every page silently renders in `ui-sans-serif/system-ui`. No type scale tokens (consistent ad-hoc use of text-xs/sm/base/2xl–5xl).
- Layout metadata has no `viewport`/`themeColor` export (`app/layout.tsx`).

---

## Tool Experience State Coverage Gaps

*State coverage audit from Nora code review.*

| State | Status | Evidence |
|---|---|---|
| Upload/drop-zone | EXISTS — drag-over highlight, click/keyboard (role=button, tabIndex, Enter/Space) | `tool-ui.tsx:23-68` |
| Validation | EXISTS — ext/MIME/size/count/total via `validateFiles`; split-range syntax check | `tool-shell.tsx:28-45,69-76`, `lib/file-safety.ts:52-128` |
| Processing states | EXISTS — idle/validating/loading/processing/completed/failed/aborted | `tool-shell.tsx:8` |
| Progress | EXISTS — bar + % + detail text, `aria-live="polite"` | `tool-ui.tsx:85-95` |
| Cancel | EXISTS — terminates worker, "Cancelled." error | `tool-shell.tsx:269-277` |
| Error | EXISTS — role=alert, recovery guidance, password-PDF note | `tool-shell.tsx:370-380` |
| Completed/download | EXISTS — per-file download buttons, size delta for compress | `tool-shell.tsx:395-426` |
| Retry/"Process another" | EXISTS | `tool-shell.tsx:279-287,421-424` |
| Timeouts | EXISTS — 30s hard timeout + 3s worker→main-thread fallback (duplicated ~70-line fallback block twice: lines 126-159 and 170-206) | `tool-shell.tsx:107-111,170-206` |

### Critical Gaps / Weaknesses

- **MAJOR — Non-functional "Keep aspect" checkbox**: state exists but is never used in the resize call (`tool-shell.tsx:24,352`; resize at 148-149/192-193 passes raw W/H). `lib/tools.ts:199` advertises "aspect lock".
- **MAJOR — No ZIP download** for multi-output tools (PDF→Images, Split): pages must be downloaded one-by-one; `jszip` is installed but imported nowhere.
- **MAJOR — No before/after preview** for image compress (FAQ promises one, §5.4).
- **MAJOR — Contradictory file-count limits**: `workers/image.worker.ts:27` hardcodes "max 5 free" while `lib/tools.ts` allows 20 image files and `UploadZone` shows "Max 20 files".
- **MINOR — UploadZone hardcodes "50 MB each"** (`tool-ui.tsx:63`) even though background-remover's limit is 30 MB (`lib/tools.ts:225`) and the shell footer computes limits dynamically (`tool-shell.tsx:429`).
- **MINOR — File list hides real filenames** (`file_1.pdf`, `tool-shell.tsx:362`) — privacy-positive, but inconsistent with worker detail text which shows truncated real names (`image.worker.ts:34`).
- Privacy messaging per tool: consistent and honest — `PrivacyIndicator` chip + "processed locally" sentence in shell (`tool-shell.tsx:291-293`), "Local — no upload" chip on every tool page (`app/tools/[slug]/page.tsx:40-43`), per-tool privacy copy in `lib/tools.ts`. Background-remover page carries an honest "deferred" disclaimer (`app/tools/[slug]/page.tsx:76-77`).
- **Background-remover is published** (`available: true`, `lib/tools.ts:232`) but cannot process: shell rejects BG_REMOVE (`tool-shell.tsx:98-105`); `workers/bg.worker.ts` is a stub. It still appears in the tools grid and hero copy ("remove background", `hero.tsx:17`).

---

## Auth/Account UX + Entitlement Visibility Gaps

*From Nora code review.*

Auth pages have consistently decent form UX: proper `<label htmlFor>`, `required`/`minLength`, loading-disabled buttons, `role=alert` errors, `role=status`/`aria-live` success, `autoComplete` attributes, Suspense fallbacks for `useSearchParams` pages, generic "if that email exists" response on forgot-password (`app/forgot-password/page.tsx:21`).

### Access & Legal Gaps

- **MAJOR — Signup legal consent has no links**: "you agree to our Terms and Privacy" is plain text, no `/terms` or `/privacy` links (`app/signup/page.tsx:47`).
- **MAJOR — Terms page contradicts product reality**: "MVP terms — no account, no storage" (`app/terms/page.tsx:3`) while accounts, DB storage, and payments all exist.
- MINOR — Auth pages render without `Navigation`/`Footer` (no site chrome, no way back except inline links); `app/account/layout.tsx` also returns bare children.
- MINOR — Signup redirects after 1500ms `setTimeout` with no cancel-on-unmount (`app/signup/page.tsx:21`); same pattern in reset-password (`:21`).
- Account page shows **real entitlement data** from DB (`app/account/page.tsx:16,30-35`) — plan, status, provider, subscription id, period end, cancel-at-period-end. But the PREMIUM-active line claims "higher limits" (`:35`) which do not exist (§5.1). Delete flow is confirm-by-typing-DELETE with clear danger-zone styling (`app/account/delete-form.tsx`).
- MINOR — Nav shows "Sign in" + "Account" identically for signed-in and anonymous users (no session-aware nav; `components/marketing/nav.tsx:20-21`).

---

## Pricing vs Real Entitlements Table

*Critical claims that code doesn't support — Nora code analysis.*

Entitlement plumbing is real (webhook → `syncEntitlement` → `lib/entitlement.ts` → account display; 11 passing unit tests per `docs/PHASE9C-1_REPORT.md`). But **nothing in the tool runtime reads entitlements** — grep confirms `getEntitlement/hasEntitlement/canShowAds` appear only in account/API code, never in `tool-shell`, `file-safety`, or engines.

| # | Sev | Claim (location) | Reality in code |
|---|-----|------------------|-----------------|
| 5.1 | CRITICAL | "Higher limits: 100 MB / file, 100 files merge, 500 pages, 15 000 px" (`app/pricing/page.tsx:30`); "no ads, higher limits" (`app/account/page.tsx:35`) | No premium limits exist anywhere. `lib/tools.ts` fixes 50 MB/file; `lib/file-safety.ts:1-13` defines `MAX_FILES_PDF_MERGE_PREMIUM: 50` (not 100) and it is referenced nowhere at runtime; `MAX_PDF_PAGES*` and `MAX_IMAGE_DIM` constants are never enforced (only `MAX_TOTAL_BYTES` used, `file-safety.ts:119`). ToolShell validates with `tool.maxFileSize/maxFiles` regardless of plan (`tool-shell.tsx:29-34`). |
| 5.2 | CRITICAL | "Advanced controls: quality sliders, custom resize, selective EXIF" (`app/pricing/page.tsx:31`) | Quality slider and resize exist **for free users**; "selective EXIF" does not exist — `exifClean` strips everything by re-encode (`lib/image-engine.ts:111-126`). |
| 5.3 | CRITICAL | "Saved preferences & recent metadata" (`app/pricing/page.tsx:32`) | No preference persistence exists anywhere (no localStorage/user-prefs schema/API found). |
| 5.4 | CRITICAL | Tool FAQ claims: pdf-compress "3 quality levels… Preview shows estimated size" (`lib/tools.ts:108`, also seoDescription `:104`); image-compress "Adjustable 0.6–0.9. Preview shows before/after" (`:171`); pdf-to-images "Choose DPI and output folder as ZIP" (`:129`) | `compressPdf(file)` takes no quality param (`lib/pdf-engine.ts:83`) and tool-shell has no PDF quality control; slider range is 0.5–0.92 not 0.6–0.9 (`tool-shell.tsx:329`); no previews, no DPI, no ZIP anywhere. |
| 5.5 | MAJOR | "No ads (free shows only contextual, outside the tool)" (`app/pricing/page.tsx:29`, `pricing-client.tsx:49`) | No ad rendering code exists; `canShowAds` (`lib/entitlement.ts:44`) is never consumed by any UI. |
| 5.6 | MAJOR | "9 local tools" free (`pricing-client.tsx:43`) vs "10 local-first tools" everywhere else (`app/layout.tsx:11`, `app/page.tsx:18,29`, `app/tools/page.tsx:5`, `app/privacy/page.tsx`, `hero.tsx:17`) | Actually 9 working tools; background-remover is published but non-functional (§3). Pick one number. |
| 5.7 | MINOR | "58% off monthly" annual badge (`pricing-client.tsx:82`) | True only in INR (₹199×12=₹2388 vs ₹999 = 58%); USD is $60 vs $39 = 35%. |
| 5.8 | MINOR | images-to-pdf FAQ "20 per batch free. Premium 50." (`lib/tools.ts:150`) vs pdf-merge FAQ "Up to 50 files" (`:61`) vs `file-safety.ts` `MAX_FILES_PDF_MERGE_FREE: 20` (unused) | Three contradictory sources of truth for merge limits; enforced value is `tools.ts` (50). |

**Verified OK** — Prices ₹199/$5 and ₹999/$39 match `getPlanPrice` (`lib/payments/types.ts:90-96`) and `.env.example:43-44`; Dodo MoR copy accurate (`app/pricing/page.tsx:42-43`); checkout flow real (`pricing-client.tsx:16-24` → `app/api/payments/checkout`).

---

## SEO/Metadata Failures

*Nora code review findings.*

| # | Sev | Finding | Evidence |
|---|-----|---------|----------|
| 6.1 | CRITICAL | Tool JSON-LD points to example.com (§1.1) — invalid rich-result data on all 10 tool URLs | `lib/seo.ts:33` |
| 6.2 | MAJOR | No Open Graph / Twitter images anywhere (no `og.png`, no `openGraph.images`); cards render text-only | `public/` contains only template SVGs + favicon; `app/layout.tsx:12-22`, `lib/seo.ts:18-19` |
| 6.3 | MAJOR | `metadataBase`, canonicals, sitemap and robots all fall back to `http://localhost:3000` if `NEXT_PUBLIC_APP_URL` unset — silent prod SEO break | `app/layout.tsx:5`, `lib/seo.ts:11`, `app/sitemap.ts:5`, `app/robots.ts:5` |
| 6.4 | MAJOR | PWA claims unsupported: no service worker exists (grep confirms), and `manifest.json` is not linked (no `manifest` in root metadata, no `app/manifest.ts`); manifest has only a 48x48 favicon icon | `app/page.tsx:21` ("PWA offline support"), `hero.tsx:12` ("PWA"), `public/manifest.json:9-11`, `app/layout.tsx` |
| 6.5 | MINOR | Sitemap includes thin stub pages (`/docs`, `/contact`, `/help`, `/about`, `/security`, `/terms`) and uses build-time `lastModified` | `app/sitemap.ts:8-12` |
| 6.6 | MINOR | No root WebSite/Organization JSON-LD; no JSON-LD on pricing; auth layouts correctly noindex | `app/layout.tsx`, `app/signup/layout.tsx` etc. |

**Per-page metadata** — Tools use `generateMetadata` + `buildMetadata` (`app/tools/[slug]/page.tsx:12-17`); static pages have titles (about/contact/docs/help/privacy/security/terms/pricing/tools); auth/account pages noindex ✅

**FAQ JSON-LD** — Per-tool `FAQPage` markup rendered (`app/tools/[slug]/page.tsx:86-99`) — but note FAQ content accuracy issues in pricing claims (§5.4).

---

## Accessibility Strengths/Weaknesses + WCAG Violations

*Nora code + Grace live observations merged.*

### Strengths (Evidence)

- Global `:focus-visible` outline (`globals.css:60-63`)
- Keyboard-operable dropzone (`tool-ui.tsx:26-33`)
- `aria-label="Primary"` nav and breadcrumb `aria-label`/`aria-current` (`nav.tsx:10`, `[slug]/page.tsx:30-33`)
- `role="alert"`/`role="status"`+`aria-live` on all auth + tool + pricing messages
- `aria-describedby` range hint (`tool-shell.tsx:306-308`)
- Decorative elements `aria-hidden`
- Reduced motion support (`globals.css:74-80`, `hero.tsx:7,32-34`)

### Weaknesses + Violations

| # | Sev | Finding | Evidence |
|---|-----|---------|----------|
| 7.1 | MAJOR | Progress bar is a styled div with no `role="progressbar"`/`aria-valuenow` (only the wrapper is live) | `tool-ui.tsx:85-95` |
| 7.2 | MAJOR | Inline "Remove" buttons in the active file list lack accessible names (the reusable `FileRow` with `aria-label` is dead code) | `tool-shell.tsx:364` vs `tool-ui.tsx:77` |
| 7.3 | MINOR | `text-green-600` on dark surface (~4.0:1) for "Premium active" instead of token `--color-success`; `.text-accent !important` overrides are a token-system smell | `app/account/page.tsx:35`, `globals.css:66-71` |
| 7.4 | MINOR | Mobile nav is `<details>/<summary>` — works, but no visible focus ring class on summary beyond default, and menu doesn't close after link selection | `nav.tsx:31-44` |
| 7.5 | MINOR | Footer link list lacks `aria-label`; uses raw `<a>` instead of `Link` (full reloads) | `nav.tsx:56-61` |
| 7.6 | MINOR | Reduced motion handled globally and in hero (good), but `scroll-behavior: smooth` is global | `globals.css:47-49,73-80`, `hero.tsx:7,32-34` |
| 7.7 | MAJOR | **Touch targets <44px across navigation** — nav links measured at 32×20px, 43×20px, 42×20px, 38×20px (Tools, Privacy, Pricing, About) | `nav.tsx:11-14`; Grace audit §7 (788×783px snapshot) |
| 7.8 | MAJOR | Quality slider thumb/control often under 44px hit box | `tool-ui.tsx:155-165`; Grace audit §10 |

**Mobile/responsive constraints (Grace):** Session limited to 788×783px; true mobile (<768px) breakpoint behavior unknown. Mobile nav collapse, card stacking, and touch target maintenance at device widths require actual device/emulator testing.

---

## Motion/Animation Assessment + Removable Dependencies

*Nora dependency analysis.*

- **Installed animation libs**: `framer-motion ^12.0.0` — used exactly once (`components/marketing/hero.tsx:4`, fade/translate entrance honoring `useReducedMotion`). No `gsap`, no `three`.
- **Removable dependencies (verified zero imports)**:
  - `lenis ^1.1.18` (smooth scroll) — completely unused.
  - `jszip ^3.10.1` — claimed ZIP feature never built (§3, §5.4).
- **Global `prefers-reduced-motion` kill-switch** present (`globals.css:74-80`) — good baseline for rebrand motion work.

---

## Live Route Visual Audit Summaries

*Grace live deployment inspection at https://toolsite-4q4w.vercel.app (788×783px constrained).*

### Home Page (`/`)

**Visual Hierarchy: GOOD**  
- Strong H1 "Your files never leave your device." anchors the hero
- Value props clearly grouped (LOCAL-FIRST • PWA • PRIVATE tagline, privacy section, tool grid)
- Hero CTAs visible above fold ("Start with Merge PDF", "Explore tools")

**Spacing/Structure: MIXED**  
- Good vertical rhythm in hero and privacy architecture section
- Tool grid shows 10 cards neatly organized into two categories (PDF/Image)
- Footer present with Privacy/Terms/Security/Help links ✅

**Touch Targets: MAJOR CONCERN**  
- Nav links measured: Tools 32×20px, Privacy 43×20px, Pricing 42×20px, About 38×20px — all under 44px minimum height
- CTA buttons appear adequately sized in snapshot but require verification on actual build

**Contrast: GOOD**  
- Sampled contrast ratios high (≥10:1 on body text) across homepage

### Tools Directory (`/tools`)

**Visual Hierarchy: EXCELLENT**  
- Single H1 "Tools", clear subhead "10 local-first tools — no upload, no watermark."
- Two distinct sections: PDF tools vs Image tools with headers
- Each tool card has title, description, and CTA arrow

**Touch Targets: SAME CONCERN**  
- Individual tool link titles have small heights (~20-21px based on DOM sampling)

### Critical Stub/Thin Pages (Confirmed Live)

| Route | Grace Observation | Severity | File Path |
|-------|------------------|----------|-----------|
| `/about` | Very thin content (single paragraph elevator pitch); lacks team/mission/contact/trust signals | MAJOR | `app/about/page.tsx:3` |
| `/docs` | Published placeholder ("coming soon"); undermines credibility when linked in sitemap/nav | CRITICAL | `app/docs/page.tsx:3` |
| `/help` | Insufficient (single sentence); repeats info already in tool footers; lacks FAQs/troubleshooting | MAJOR | `app/help/page.tsx:3` |
| `/contact` | Placeholder email exposed (`support@localfile.example`) + "no backend form at MVP" text visible | CRITICAL | `app/contact/page.tsx:3` |
| `/privacy` | Too thin for legal compliance; missing GDPR/CCPA statements, cookies, third-party disclosures | MAJOR | `app/privacy/page.tsx:3` |
| `/terms` | Critically insufficient for commercial site accepting payments (liability exposure) | CRITICAL | `app/terms/page.tsx:3` |
| `/security` | Adequate technical controls mentioned but placeholder email repeated | MAJOR | `app/security/page.tsx:3` |

---

## Top Priority Fix List

*Merged, severity-ranked, with file-path evidence from Nora and screenshot/file paths attempted from Grace.*

### CRITICAL (Ship-blockers)

1. **Replace `example.com` in `lib/seo.ts:33` with `NEXT_PUBLIC_APP_URL`** (CRITICAL, 1-line fix, affects all 10 tool pages JSON-LD)
2. **Delete/replace placeholder emails on `/contact` and `/security`** (CRITICAL)
   - `app/contact/page.tsx:3` — replace `support@localfile.example` with real email or deploy contact form
   - `app/security/page.tsx:3` — replace `security@localfile.example` with real email or `security.txt` resource
3. **Reconcile pricing claims vs code** (CRITICAL)
   - Either implement entitlement-gated limits/controls OR rewrite `app/pricing/page.tsx:28-38` and the FAQ copy in `lib/tools.ts` (§5.1–5.5)
   - Also fix the account page "higher limits" line (`app/account/page.tsx:35`)
4. **Publish real content or remove nav link for `/docs`** (CRITICAL)
   - Current: `app/docs/page.tsx:3` — "coming with V1 guides"
5. **Fix Terms page legal adequacy** (CRITICAL)
   - `app/terms/page.tsx:3` — currently "MVP terms — no account, no storage" while payments via Dodo live
   - Engage counsel for full ToS (payment terms, refunds, liability caps, arbitration, jurisdiction)

### MAJOR (Trust/Accessibility/Legal)

6. **Hide or relabel background-remover** (MAJOR)
   - `lib/tools.ts:232` (`available: true`), `hero.tsx:17`, but blocked at shell level (`tool-shell.tsx:98-105`)
   - Option A: set `available: false` and hide from grid/hero
   - Option B: build minimal bg.worker implementation
7. **Add ZIP download for multi-output tools** (MAJOR)
   - `jszip` installed but unused; FAQ promises ZIP on `pdf-to-images` (`lib/tools.ts:129`)
8. **Strip internal phase language from user surfaces** (MAJOR)
   - `tool-shell.tsx:102` ("See docs/PHASE6C_REPORT.md"), `tool-shell.tsx:419` ("Phase 5"), `bg.worker.ts:7`, `pricing-client.tsx:102`
9. **Load real fonts via `next/font`** (MAJOR)
   - Currently nothing loads Geist/Inter; purges `globals.css:39-40` fiction
10. **Implement entitlement-read in runtime** (MAJOR)
    - If "higher limits" promised, enforce via `lib/file-safety.ts` with `getEntitlement()` checks in `tool-shell.tsx` validation path

### MINOR (Polish)

11. **Remove dead weight** (Minor efficiency gain)
    - Unusable deps: `lenis`, `jszip` (or implement ZIP properly)
    - Dead components: `Button` (`button.tsx`), `Badge/Card/Container/Section` (`layout.tsx`), `FileRow` (`tool-ui.tsx:71`)
    - Duplicated fallback block in `tool-shell.tsx:126-159` and `170-206`
12. **Expand stub pages** (About, Help, Privacy)
    - `/about`: Team bios, mission statement, engineering choices
    - `/help`: Top 10 FAQs (limits, formats, browser compatibility, troubleshooting)
    - `/privacy`: Full GDPR-ready policy (data flows, cookies/analytics vendors, user rights, Dodo disclosure)
13. **Link Terms/Privacy from signup** (Minor trust improvement)
    - `app/signup/page.tsx:47` — add `<a href="/terms">` and `<a href="/privacy">` around words "Terms" and "Privacy"
14. **Fix touch targets** (WCAG AA compliance)
    - `nav.tsx:11-14` — increase padding to ensure ≥44px height tap boxes
    - `tool-ui.tsx:155-165` — slider thumb hit box ≥44px
15. **Implement "Keep aspect" functionality** (If advertised, must work)
    - `tool-shell.tsx:24,352` — connect checkbox to resize calculation
16. **Consolidate file limit sources of truth** (Merge vs Images limits)
    - `lib/tools.ts:61,150` vs `file-safety.ts:MAX_FILES_PDF_MERGE_FREE:20` (unused)
    - Enforce documented value everywhere

### Screenshot/File Path References

- **Viewport test screenshot (successful):** `e:\Projects\New folder\test-screenshots\phase10-audit-viewport-test.png` (788×783)
- **Failed screenshots (timeout):** `test-screenshots/phase10-audit-home-desktop.png`, `test-screenshots/phase10-audit-tools-desktop.png`
- All route evidence confirmed via DOM analysis + live inspection (Grace) + static code review (Nora)

---

## Appendix: Evidence Index

### Nora Repository Evidence (Static Code Analysis)

- `lib/seo.ts:33` — JSON-LD example.com
- `app/contact/page.tsx:3` — placeholder email
- `app/security/page.tsx:3` — placeholder email
- `components/ui/tool-shell.tsx:102,419` — internal phase language
- `app/pricing/pricing-client.tsx:102` — env var exposure
- `workers/bg.worker.ts:7` — phase language stub
- `lib/tools.ts:61,108,129,150,171,199,225,232` — contradictory limits, FAQ inaccuracies, BG availability
- `components/marketing/nav.tsx:63` — MVP tagline
- `components/ui/tool-shell.tsx:24,352` — non-functional keep aspect
- `workers/image.worker.ts:27` — hardcoded max 5 free
- `tool-ui.tsx:63` — hardcoded 50 MB each
- `lib/file-safety.ts:1-13,52-128,119` — MAX_FILES constants unused/not enforced
- `lib/entitlement.ts:44` — `canShowAds` never consumed
- `components/ui/tool-shell.tsx:8` — state machine
- `tool-ui.tsx:23-68,85-95,155-165` — upload zone, progress bar, range slider
- `globals.css:39-40,60-63,74-80` — phantom fonts, focus, reduced motion
- `app/account/page.tsx:35` — green-600 token violation
- `app/account/delete-form.tsx:23` — nonexistent error-foreground token
- `components/marketing/hero.tsx:41,46,52,59` — inline hex bypass
- `app/privacy/page.tsx` — prose classes without typographer
- `app/layout.tsx:5,11-22` — missing metadataBase/themeColor
- `public/manifest.json:9-11` — PWA claim without SW/linking
- `app/sitemap.ts:8-12` — stub pages indexed
- `components/marketing/nav.tsx:11-14,31-44,56-61` — nav/footer structure
- `components/ui/button.tsx` — dead Button component
- `components/ui/layout.tsx` — dead Badge/Card/Container/Section
- `components/ui/tool-ui.tsx:71` — dead FileRow

### Grace Live Deployment Evidence (DOM + Visual Inspection)

- Route: https://toolsite-4q4w.vercel.app
- Viewport: 788×783px (constrained; mobile breakpoints untested)
- Console: No errors on `/`, `/tools/pdf-merge`, `/pricing`
- Nav link measurements: Tools 32×20px, Privacy 43×20px, Pricing 42×20px, About 38×20px (all <44px)
- Quality slider thumb suspected <44px (requires computed style verification)
- Form UX verified on `/signup`, `/signin`, `/forgot-password` — clean labels, required, autoComplete, generic reset response
- Redirect logic correct: `/account` → `/signin?callbackUrl=/account`
- Pricing transparency excellent: dual currencies, cancellation clarity, Dodo MoR disclosed
- Stub pages confirmed live: `/about` (thin), `/docs` (placeholder), `/help` (insufficient), `/contact` (email), `/terms` (legally inadequate), `/privacy` (incomplete), `/security` (email)
- Positive: Strong visual hierarchy on home/tools pages, good conversion CTAs, consistent "local-first" messaging

---

**Audit Completed:** August 12, 2026  
**Analysts:** Nora (repo), Grace (live)  
**Status:** Findings ready for remediation sprint planning
