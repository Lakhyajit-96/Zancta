# Phase 11E-3 — Local PDF Text Extractor & Search

## A. Scope

**VERIFIED:** This phase adds one route, `/tools/pdf-text-extractor`, for extracting existing embedded text from one text-native PDF in the browser. It is not a PDF OCR feature and does not rasterize PDF pages.

## B. Baseline

**VERIFIED:** Implementation began from committed `main` at `08f990d` with `origin/main` aligned and no unrelated uncommitted work. The installed PDF runtime was `pdfjs-dist@5.1.91`.

## C. Architecture

**VERIFIED:** The flow is `File` → local validation → transferred `ArrayBuffer` → dedicated `workers/pdf-text.worker.ts` → PDF.js `getDocument()` → sequential `getPage()` / `getTextContent()` → page-aware text returned to the React workspace.

The generic tool worker path is not used. The dedicated worker runs PDF.js with `disableWorker: true`, so PDF.js executes inside the already isolated Toolsite worker rather than creating a nested processing worker.

## D. PDF.js version and license

**VERIFIED:** `pdfjs-dist@5.1.91` is already declared in `package.json`. Its package metadata declares `Apache-2.0`; source repository: <https://github.com/mozilla/pdf.js>. No dependency, model, or language asset was added.

**VERIFIED:** The configured PDF.js worker module is resolved by the application bundle using `new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url)`, producing a same-origin application asset. No CDN URL is configured.

## E. Worker implementation

**VERIFIED:** `workers/pdf-text.worker.ts` accepts the actual transferred PDF bytes, loads the actual document, reports actual page count, extracts text sequentially, and reports each completed page. `page.cleanup()`, `PDFDocumentProxy.destroy()`, and `loadingTask.destroy()` are called in cleanup. The UI terminates the dedicated worker after success, error, cancellation, reset, and component unmount.

## F. Privacy implementation

**VERIFIED:** The feature has no API route and uses no remote processing service. File bytes are transferred only from the page to a browser Worker. Extracted text stays in React memory until copied or written to a locally generated Blob download.

**VERIFIED:** `tests/e2e/privacy-net.spec.ts` performs extraction against `pdf-text-single.pdf`, rejects external origins, rejects non-GET/HEAD same-origin requests, and rejects request bodies containing `Local PDF Text Test 123`. The test passed.

## G. UI/UX

**VERIFIED:** A dedicated graphite/rose-metal workspace provides PDF selection, local-processing notice, actual processing state, page-aware reading sections, search, copy, TXT download, reset, no-text guidance, and accessible alert/status regions. The visual system reuses existing product classes and does not add a new design system.

## H. Search

**VERIFIED:** Search is case-insensitive and is executed against the actual page text already extracted in memory. Matches include page number and an excerpt. Empty and no-match searches show an honest zero-match state.

## I. Copy and download

**VERIFIED:** Clipboard writes await `navigator.clipboard.writeText(actualText)`. TXT downloads use a UTF-8 `Blob`, a deterministic sanitized source-derived filename, and existing `downloadBlob` object-URL lifecycle handling.

**VERIFIED:** Chromium E2E reads the downloaded file and verifies it contains the actual fixture phrase `Second Page Search Target`.

## J. Error handling

**VERIFIED:** Client validation rejects empty, non-PDF, and greater-than-50-MB files. PDF.js failures return an honest corrupted/unsupported message. Password/encryption error messages are classified as password-protected when PDF.js exposes them. Image-only PDFs complete with the explicit no-embedded-text explanation.

**UNVERIFIED:** A password-protected fixture was not retained because a reliably generated encrypted fixture was not available from the existing dependency set. The worker has error classification coverage for PDF.js password/encryption errors.

## K. Cancellation

**VERIFIED:** Cancel sends a cancellation message, invalidates the active run identifier, and immediately terminates the actual dedicated Worker. It cannot transition to completed after cancellation. Chromium E2E validates the aborted state with an 80-page real text-native PDF.

## L. Limits

**VERIFIED:** The tool reuses the product's established 50 MB one-PDF limit. No new arbitrary page-count or timeout limit was introduced. Page progress is derived only from completed extracted pages divided by PDF.js's actual `numPages`.

## M. Fixtures

**VERIFIED:** Retained deterministic fixtures under `tests/fixtures/` include:

- `pdf-text-single.pdf`: text-native phrase `Local PDF Text Test 123`.
- `pdf-text-multi.pdf`: two text-native pages for page-aware extraction/search.
- `pdf-text-image-only.pdf`: PDF containing a raster PNG only and no embedded text.
- `pdf-text-corrupt.pdf`: malformed PDF bytes.
- `pdf-text-medium.pdf`: 20 text-native pages.
- `pdf-text-large.pdf`: 80 text-native pages for cancellation and benchmark coverage.

## N. Unit tests

**VERIFIED:** `tests/pdf-text-engine.test.ts` covers input type/size validation, safe output filenames, ordered page joining, case-insensitive search, page context, and empty/no-match searches. `tests/tools.test.ts` validates registry inclusion.

## O. E2E tests

**VERIFIED:** `tests/e2e/pdf-text-extractor.spec.ts` covers route loading, actual single/multi-page extraction, page count, actual search result, clipboard copy, TXT content, reset, invalid input, corrupted input, image-only no-text behavior, cancellation, four requested responsive widths, and focusability of the file control.

## P. Privacy tests

**VERIFIED:** The PDF-specific network regression described in section F passed in Chromium. It permits only same-origin static application assets and browser-local `blob:` resources, and rejects document-content request bodies.

## Q. Accessibility

**VERIFIED:** The workspace uses a labelled region, labelled file and search controls, button semantics, native selectable text, alert/status regions, accessible search-result labeling, visible focus support from existing classes, and motion-safe progress animation. The existing project does not have a PDF-tool-specific axe test; keyboard focus and responsive browser checks are included.

## R. Responsive verification

**VERIFIED:** Chromium checks at 320, 375, 390, and 430 CSS pixels confirmed the page did not horizontally overflow. This is browser emulation, not physical-device performance testing.

## S. Performance measurements

**VERIFIED:** Chromium benchmark run on the local Playwright environment measured elapsed time from selection through visible extracted result, including UI flow. It is not a production or mobile performance claim.

| Fixture | Pages | Output characters | Measured duration |
| --- | ---: | ---: | ---: |
| Small | 1 | 31 | 363 ms |
| Medium | 20 | 1,300 | 328 ms |
| Large | 80 | 5,180 | 491 ms |

**UNVERIFIED:** Browser memory is not reported because a reliable memory measurement API was not available in this verification path. Physical mobile processing timing was not measured.

## T. SEO

**VERIFIED:** The tool registry supplies unique title, description, canonical/OG metadata and structured data through the existing dynamic tool route architecture. Copy limits claims to embedded text in text-based PDFs and says it does not OCR scanned PDFs. Sitemap inclusion follows the existing registry-driven tool sitemap behavior.

## U. Security

**VERIFIED:** CSP was not weakened. No `unsafe-eval`, external script source, CDN, API endpoint, telemetry event, logging of document content, server storage, or new dependency was added. The pre-existing `worker-src 'self' blob:` continues to permit the same-origin worker bundle.

## V. Ads boundary

**VERIFIED:** Ads were not enabled or added to the upload, processing, search, results, copy, download, or reset flow.

## W. Premium boundary

**VERIFIED:** Complete single-PDF extraction, search, copy, and TXT download are free and ungated. **DEFERRED:** batch extraction, larger validated limits, richer export formats, and local saved preferences require separate authorization.

## X. Known limitations

**VERIFIED:** The feature extracts only existing text objects. Scanned/image-only PDFs produce no text and are not OCRed. Layout, reading order, tables, columns, and decorative text follow the text items exposed by PDF.js and may not match visual layout exactly. Password-protected documents require unlocking first.

## Y. Deferred items

**DEFERRED:** PDF OCR, searchable-PDF creation, batch PDF extraction, PWA work, background removal, payment changes, email changes, domains, Hostinger, and ads remain outside this phase.

## Z. Final verification matrix

| Check | Classification | Result |
| --- | --- | --- |
| Typecheck | VERIFIED | Passed (`npm run typecheck`) |
| Lint | VERIFIED | Passed with 13 pre-existing warnings and no errors (`npm run lint`) |
| Unit tests | VERIFIED | 55 passed (`npm test`) |
| Chromium targeted extractor/privacy tests | VERIFIED | 8 passed |
| Chromium performance baseline | VERIFIED | 3 passed |
| Production build | VERIFIED | Passed (`npm run build`) |
| Full Chromium E2E | VERIFIED | 68 passed |
| Privacy network regression | VERIFIED | Passed |
| `git diff --check` | VERIFIED | Passed before final commit |

## AA. Git commit

**UNVERIFIED:** Commit hash is recorded after final verification, commit, and push.

## AB. Final classification

**VERIFIED:** The feature performs genuine local text extraction for text-native PDFs in a dedicated browser worker and supports genuine local search, copy, TXT download, reset, cancellation, and privacy regression coverage.

**DEFERRED:** Any OCR, cloud, model, batch, premium, advertising, or launch work remains out of scope.
