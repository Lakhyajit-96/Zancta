# SEO / Growth Foundation — Bootstrap

## Technical SEO (to be implemented in Phase 1)

- `next/metadata` for per-page `title`, `description`, `openGraph`, `twitter`
- `sitemap.xml` (dynamic, from tool registry)
- `robots.txt`
- `canonical` URLs
- `schema.org` JSON-LD: `WebSite`, `SoftwareApplication` per tool, `BreadcrumbList`, `FAQPage`
- Semantic HTML, crawlability, `noindex` for internal pages

## Content Architecture (planned)

- `/` — landing
- `/tools/[slug]` — tool pages
- `/tools` — discovery
- `/blog` / `/guides` — educational (only original, useful content)
- `/docs` — tool documentation
- `/privacy`, `/terms`, `/cookies`, `/disclaimer` — legal

## Growth

- Programmatic SEO only where quality can be maintained; no spam.
- Internal linking between related tools.
- OG images per tool (dynamic via `next/og`).

## Verification

- No `app/` exists yet — no metadata to audit.
- No `sitemap.xml` or `robots.txt` yet — to be generated after tool list defined in Phase 1.
