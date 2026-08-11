# MCP Architecture — Verified 2026-08-11

> No MCP is installed merely because it exists. Every MCP below has a documented purpose and truthful status.

## Inventory

| MCP | Purpose | Desired Agent | Status | Auth | Verified | Decision |
|-----|---------|---------------|--------|------|----------|----------|
| Filesystem MCP | Workspace file ops | All | NOT INSTALLED | N/A | VERIFIED (no `mcp.json` found, no server running) | NOT NEEDED — Muse Code native `read_file/write_file/edit_file/search/bash` already covers filesystem; MCP would be redundant |
| Browser / Playwright MCP | Automation, screenshots, visual regression | QA, UX/UI | NOT INSTALLED | N/A | VERIFIED (no browser MCP) | RECOMMENDED for Phase 1 — enables headless testing and a11y audits. Blocked until Playwright installed |
| GitHub MCP | Repo, PR, issues | DevOps, Orchestrator | NOT INSTALLED | BLOCKED | VERIFIED (gh absent, no token) | RECOMMENDED — requires `gh auth login` or `GITHUB_TOKEN`. `BLOCKED — REQUIRES USER ACTION` |
| Git MCP | Local git ops | DevOps | NOT INSTALLED | N/A | VERIFIED | NOT NEEDED — native git via bash suffices |
| Postgres MCP | DB introspection | DB Engineer | NOT INSTALLED | BLOCKED | VERIFIED (no DB URL) | DEFERRED — enable only when DATABASE_URL exists |
| Documentation MCP (Context7 / etc.) | Framework docs lookup | Frontend, Backend | NOT INSTALLED | N/A | VERIFIED | OPTIONAL — useful for Next.js/Tailwind docs; can add in Phase 1 |
| Web Research MCP (Brave/Tavily) | Market/SEO research | Market Research, SEO | NOT INSTALLED | BLOCKED (API key) | VERIFIED | RECOMMENDED — `BLOCKED — REQUIRES USER ACTION`: provide BRAVE_API_KEY or TAVILY_API_KEY |
| Image Generation MCP | Asset pipeline | UX/UI | NOT AVAILABLE | N/A | VERIFIED (no local model, no API) | NOT NEEDED for bootstrap — asset pipeline will use code-generated SVGs + licensed assets; external API (e.g., Replicate) can be added later if desired |

## Configuration

No `mcp.json` exists in this workspace. When MCPs are adopted, create:

```
.muse/mcp.json  (per-user)  or  .mcp.json (project)
```

Example (do not commit secrets):

```json
{
  "mcpServers": {
    "playwright": { "command": "npx", "args": ["@playwright/mcp@latest"] },
    "github": { "command": "npx", "args": ["@modelcontextprotocol/server-github"], "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}" } }
  }
}
```

## Agent Assignment (when enabled)

- **Orchestrator** — GitHub MCP (repo coordination)
- **QA / Performance** — Playwright MCP (E2E, visual, Core Web Vitals)
- **Market Research / SEO** — Research MCP (competitor, keyword, pricing)
- **DB Engineer** — Postgres MCP (schema/migration verification)
- **UX/UI** — Browser MCP (design review, a11y)

## Verification

- Searched for `mcp.json`, `*mcp*` in workspace: none found (workspace empty before bootstrap)
- Checked `which` for `gh`, `docker`, `playwright`: absent/not running
- Checked env for `GITHUB_TOKEN`, `BRAVE_API_KEY`: not set (no `.env` existed)

## Policy

- No MCP is auto-installed. Each requires explicit purpose and verification test.
- Secrets for MCPs go in `.env.local`, never in `mcp.json` committed to git.
