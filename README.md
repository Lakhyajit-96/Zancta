# ZANCTA

ZANCTA is a privacy-first collection of browser-based PDF and image tools. For implemented local workflows, selected file bytes are processed in the browser and are not uploaded for processing.

## Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e -- --project=chromium
# Optional cross-browser smoke (requires `npx playwright install firefox webkit`):
npx playwright test -c playwright.browsers.config.ts
```

## Product scope

- Local PDF and image workflows, including image OCR and text-native PDF text extraction.
- Tool-specific input limits and supported formats are defined in `lib/tools.ts`.
- Background removal is intentionally deferred pending commercially verified local model licensing.
- Authentication and payment code exist, but production email, payment-provider, legal, and custom-domain configuration require separate launch authorization and verification.

## Repository and third-party software

This repository's application code is proprietary; see `LICENSE`. Third-party packages and OCR assets remain governed by their respective licenses; see `docs/OCR_LICENSE_AUDIT.md` for the shipped local OCR assets.
