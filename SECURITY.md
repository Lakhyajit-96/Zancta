# Security Policy

## Supported versions

Only the production deployment at [https://zancta.tech](https://zancta.tech) and the current `main` branch are supported.

| Version | Supported |
|---|---|
| Production (`zancta.tech`) | Yes |
| Preview / local builds | Best-effort |

## Reporting a vulnerability

Email **security@zancta.tech**.

Please include:

- A description of the issue and impact
- Steps to reproduce, or a proof of concept
- Affected URL or component if known

Do **not** open a public GitHub issue for an unfixed vulnerability.

We will acknowledge mail to the security address. There is no published SLA and no bug-bounty program.

## Responsible disclosure

- Give us a reasonable window to investigate and deploy a fix before public write-ups.
- Do not access other people’s accounts or files.
- Do not run destructive testing against production.
- Do not submit IndexNow, crawl, or traffic-generation attacks as a “test.”

## Privacy-first processing

For implemented local tools, selected file bytes are processed in the browser. ZANCTA does not receive those bytes for conversion. The site still serves HTML, JavaScript, WASM, and fonts. Account, billing, contact, and OCR language-pack routes use the server.

This is not a claim of “unhackable,” “military-grade,” or zero vulnerabilities. Limitations include browser extensions, malware, operator error, and dependency flaws.

## Secrets

Never commit `.env`, API keys, or webhook secrets. See [docs/operations/environment.md](docs/operations/environment.md).
