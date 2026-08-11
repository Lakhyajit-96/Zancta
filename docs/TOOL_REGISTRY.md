# Tool Registry — Verified 2026-08-11

> Truthful status only. `VERIFIED` means executed and observed. `BLOCKED` means requires user action. `NOT NEEDED` means no purpose for this project.

| Tool | Purpose | Agent | Status | Auth | Verified | Notes |
|------|---------|-------|--------|------|----------|-------|
| **Node.js 24.16.0** | Frontend/build | Frontend, DevOps | AVAILABLE (via Windows) / BLOCKED (native WSL) | N/A | VERIFIED (`/mnt/c/Program Files/nodejs/node.exe --version` → v24.16.0, shim at /tmp/mynode/node) | Native WSL `node` requires sudo (blocked by `no new privileges`). Shim works: `export PATH="/tmp/mynode:$PATH"` |
| **npm 11.13.0** | Package manager | Frontend | INSTALLED | N/A | VERIFIED (`npm --version` → 11.13.0) | Works via Windows interop |
| **npx 11.13.0** | Runner | Frontend | INSTALLED | N/A | VERIFIED |  |
| **pnpm 15.x** | Alt package manager | Frontend | AVAILABLE | N/A | BLOCKED | `pnpm` shim at `/mnt/d/Dev/global/npm/pnpm` fails: `exec: node: not found` — needs WSL node shim in PATH |
| **yarn** | Alt package manager | Frontend | NOT INSTALLED | N/A | VERIFIED (absent) | Not needed unless chosen |
| **bun** | Alt runtime | Frontend | NOT INSTALLED | N/A | VERIFIED (absent) | Not needed |
| **Python 3.12.3** | Scripts/AI tooling | AI/Tool, Backend | INSTALLED | N/A | VERIFIED (`python3 --version`) | pip 24.0 available but cache dir not writable |
| **Git 2.43.0** | VCS | Orchestrator, DevOps | INSTALLED | N/A | VERIFIED (`git --version`) | No repo initialized; no global config |
| **GitHub CLI (gh)** | Repo automation | DevOps | NOT INSTALLED | BLOCKED | VERIFIED (absent) | `BLOCKED — REQUIRES USER ACTION`: install `gh` and `gh auth login` |
| **Docker 29.7.2** | Containers | DevOps, DB | INSTALLED (client) | BLOCKED | VERIFIED (`docker --version`) | Daemon not running: `failed to connect to dockerDesktopLinuxEngine` — Docker Desktop not started on Windows |
| **Playwright** | E2E/Browser automation | QA, Performance | NOT INSTALLED | N/A | VERIFIED (absent via `npx playwright --version`) | Install via `npx playwright install --with-deps chromium` (requires sudo for deps — blocked) |
| **Chromium** | Browser engine | QA | AVAILABLE (Windows) | N/A | VERIFIED (`/mnt/c/Program Files/Google/Chrome/Application/chrome.exe` exists) | WSL Chromium not installed; Windows Chrome can be used via interop but not headless WSL |
| **Chrome (Windows)** | Manual verification | QA | AVAILABLE | N/A | VERIFIED (file exists) |  |
| **TypeScript** | Type safety | Frontend, Backend | NOT INSTALLED | N/A | VERIFIED (no `node_modules`) | To install: `npm install -D typescript` after `npm init` |
| **ESLint/Prettier** | Lint/format | QA | NOT INSTALLED | N/A | VERIFIED | Planned in package.json scripts |
| **Vitest** | Unit tests | QA | NOT INSTALLED | N/A | VERIFIED | Planned |
| **Ollama / local LLM** | Local AI | AI/Tool | NOT INSTALLED | N/A | VERIFIED (`which ollama` → not found) | Not needed for bootstrap; optional later |
| **nvidia-smi / GPU** | GPU compute | AI/Tool | NOT AVAILABLE | N/A | VERIFIED (command not found) | WSL has no GPU passthrough in this env; CPU: Intel Core 5 210H 8 threads, RAM 7.8Gi, Disk 101G free on E: |
| **PostgreSQL / DB** | Persistence | DB, Backend | NOT INSTALLED | BLOCKED | VERIFIED | No local DB; recommend Neon/Supabase/PlanetScale for prod or Docker postgres when daemon available |
| **Vercel CLI** | Deployment | DevOps | NOT INSTALLED | BLOCKED | VERIFIED | `BLOCKED — REQUIRES USER ACTION`: `npm i -g vercel && vercel login` |
| **MCP Servers** | Agent tooling | Orchestrator | NOT INSTALLED | BLOCKED | VERIFIED | No filesystem/browser/github MCPs configured. See docs/MCP_ARCHITECTURE.md |

## Installation Priority (when unblocked)

1. **Fix WSL Node natively** — requires `sudo` (currently blocked by container `no new privileges`). Workaround shim at `/tmp/mynode` is ephemeral (tmp cleared on reboot). Permanent fix: ask admin to allow sudo or install Node via Windows-side WSL setup.
2. **Git init + GitHub CLI** — `git init`, `gh auth login`
3. **Docker Desktop** — start Docker Desktop on Windows host, then `docker ps` should connect via `npipe:////./pipe/dockerDesktopLinuxEngine`
4. **Playwright** — `npm install -D @playwright/test && npx playwright install chromium` (deps need sudo — may need `--with-deps` alternative via manual)
5. **TypeScript/ESLint/Prettier/Vitest/Tailwind** — via `npm install` once package.json finalized in Phase 1

## Verification Commands Executed

```bash
"/mnt/c/Program Files/nodejs/node.exe" --version  # v24.16.0
npm --version  # 11.13.0
python3 --version  # 3.12.3
git --version  # 2.43.0
gh --version  # not found
docker --version  # 29.7.2
docker ps  # failed to connect
npx playwright --version  # not installed (prompts install)
ls "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"  # exists
which ollama / nvidia-smi  # not found
free -h / df -h  # 7.8Gi RAM, 101G free E:
```
