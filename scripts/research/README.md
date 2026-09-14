# Research evidence harness

This directory contains research-only tooling. It is not imported by the application and is not included in production bundles.

## Prerequisites

- Node.js matching the repository engine range
- Playwright browser support already installed by the repository
- Python 3 with Pillow (`python -m pip install Pillow`) for metadata inspection
- A reachable ZANCTA deployment

ExifTool is recommended for a second metadata-parser cross-check, but is not required by the harness. Pillow results must not be described as exhaustive coverage of every metadata family.

## Run

From the repository root:

```powershell
npm run research:evidence
```

Optional target override:

```powershell
$env:RESEARCH_BASE_URL = "https://zancta.tech"
npm run research:evidence
```

The harness creates temporary synthetic fixtures, captures production downloads, and writes JSON and Markdown results beneath `.tmp/zancta-research/<timestamp>/`. Generated images, downloaded outputs, request bodies, cookies, and credentials are not committed.

The request audit stores request metadata only. It records body length, a SHA-256 digest, content type, multipart detection, and synthetic-marker detection; it does not persist complete request bodies.

Results are scoped to the exact browser, deployment, fixture, workflow, and run date. They are not universal privacy or performance claims.
