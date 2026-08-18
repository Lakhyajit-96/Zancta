# Phase 11E-2 — Next High-ROI Feature Decision Gate

**Date:** 2026-08-18  
**Scope:** Research and decision gate only. No application code, dependency, asset, environment, database, payment, email, domain, or deployment change was made.  
**Baseline commit:** `78ada41` (`feat(ocr): add privacy-first local OCR tool`) on `main`, matching `origin/main`.  
**Classification:** **DECISION: implement one small local PDF Text Extractor & Search feature, then prioritize launch blockers rather than broad feature expansion.**

## A. Executive Summary

### Recommended next implementation

**Local PDF Text Extractor & Search**: accept a text-native PDF, extract its existing text page-by-page locally in a PDF.js worker, present searchable/copyable text with per-page context, and download a UTF-8 `.txt` export.

This is the highest-ROI *single* next product feature because it:

- extends the product’s strongest existing category (local PDF tools) without a new dependency or remote service;
- meets a clear task intent—getting selectable text out of a PDF—without making an unsupported OCR or accuracy promise;
- uses already-installed `pdfjs-dist@5.1.91` (Apache-2.0) and the project’s established worker/local-output patterns;
- gives the new local image OCR a coherent follow-up workflow without attempting the substantially riskier “OCR any PDF into a searchable PDF” promise;
- supports honest “extract text from text-based PDFs locally in your browser” positioning and a dedicated tool page, rather than thin SEO content;
- creates credible future Premium boundaries (larger page/file limits, batch extraction, full-document export formats, offline index retention) without gating basic privacy.

### Why not expand aggressively now

**Inference:** feature count is approaching diminishing returns. The repository already has 10 working local tools (five PDF, four image, one image OCR) and one honestly deferred tool. The larger launch constraints are not another generic converter: public support/security contact is not configured; Privacy/Terms need human legal review; a custom domain/Search Console remain unconfigured; analytics/observability are intentionally blocked; and production Resend/Dodo work is paused. A narrowly scoped, no-dependency PDF text feature is justified; a new feature program beyond it is not currently the highest-return action.

### Runner-up

**PDF metadata inspector and standard-property editor** should follow later. It is technically attractive with existing `pdfjs-dist` and `pdf-lib`, but “remove metadata” is easy to overstate: PDFs can contain XMP, attachments, annotations, form data, and nonstandard objects. It needs a more rigorous adversarial fixture/audit design before public privacy-sanitization claims.

## B. Current Product Baseline

### VERIFIED from repository source

| Area | Current state |
| --- | --- |
| Branch/repository state | `main` was clean; `HEAD` and `origin/main` were `78ada41756d27e098970b34cb828647d7f46bfac` before this report. |
| Local tools | `lib/tools.ts` registers Merge PDF, Split PDF, Compress PDF, PDF to Images, Images to PDF, Compress Image, Convert Image, Resize Image, EXIF Cleaner, and Image OCR. Background Remover remains explicitly deferred. |
| OCR | `tesseract.js@7.0.0`, Tesseract core, worker, and English `tessdata_fast` assets are self-hosted under `/public/ocr`; no default OCR CDN is configured. See [OCR audit](OCR_LICENSE_AUDIT.md). |
| Privacy/CSP | `connect-src 'self'`, `worker-src 'self' blob:`, no external OCR endpoint, and only narrowly scoped production `wasm-unsafe-eval` for self-hosted Tesseract WASM. |
| Authentication | Credentials-based Auth.js/Prisma authentication exists, with signup/signin/recovery/verification/account routes. |
| Entitlements/payments | Free/Premium/Admin entitlement types and Dodo API/webhook architecture exist. Production Dodo verification is intentionally unperformed. |
| Public routes | Product, tools, pricing, feature, help, FAQ, legal/trust, docs, and contact routes exist; tool pages receive dynamic metadata, canonical URLs, JSON-LD, and sitemap inclusion. |
| Ads | Architecture is feature-flagged and disabled; no provider script or approval claim exists. |
| Analytics/observability | GA/Search Console/Sentry are documented as blocked pending real identifiers/domain. No production analytics provider is installed. |
| PWA | No service-worker/PWA architecture is implemented. |
| Design/accessibility | Existing reports document a graphite/rose-metal design system, reduced-motion behavior, keyboard/focus coverage, and Chromium axe checks. |
| Test baseline | Phase 11E-1 recorded 48/48 unit and 58/58 Chromium E2E passing, plus typecheck/build passing and lint with 13 existing warnings. This gate did not rerun or modify tests. |

## C. Current Verified Capabilities

1. **PDF manipulation locally:** merge, split, compress, page-to-image rendering, and image-to-PDF creation.
2. **Image processing locally:** compress, convert among advertised formats, resize, and EXIF cleanup.
3. **Local English image OCR:** actual browser Tesseract OCR with real progress, cancellation, copy, `.txt` download, and privacy network regression coverage.
4. **Privacy boundary:** the implemented local tools use browser memory/workers and generate local object-URL downloads rather than application upload APIs.
5. **Public product foundation:** a crawlable route architecture, unique metadata, sitemap/robots, tool JSON-LD/FAQ schema, public trust pages, and truthful deferred-state messaging.
6. **Commercial foundation:** account and entitlement primitives exist, but live external-provider operations are not verified.

## D. Current Deferred Items

| Item | Status | Reason |
| --- | --- | --- |
| Background removal | **DEFERRED** | Commercial model/weight licensing remains unresolved; no model should be added without verification. |
| PDF OCR/searchable PDF | **DEFERRED** | Requires PDF rasterization, multi-page worker scheduling, coordinate transformations, output-layer fidelity, large memory budgets, and mobile validation. |
| Extra OCR language packs | **DEFERRED** | Only English is bundled/licensed/audited. |
| PWA | **DEFERRED** | Needs a deliberate offline/cache/update and browser-support strategy; an install prompt alone has little business value. |
| AVIF encoding | **DEFERRED** | Cross-browser encoding behavior needs verification; browser decode support does not prove portable local encode support. |
| Archive utilities | **DEFERRED** | Need explicit ZIP-bomb/entry/path/memory defenses and tested UX. |
| Live Resend/Dodo/domain/Hostinger/ads | **PAUSED / external dependency** | Requires real provider/domain/legal/user action; not a feature implementation task. |

## E. Competitor Research

### VERIFIED vendor-published facts

| Competitor | Browser processing model | Relevant offer / monetization signal | Evidence |
| --- | --- | --- | --- |
| iLovePDF | Web product is online; Desktop is its local/offline product. | Broad PDF suite, desktop batch/offline capability, paid Desktop offering. | [Desktop](https://www.ilovepdf.com/desktop), [web vs desktop](https://www.ilovepdf.com/blog/pdf-web-or-desktop) |
| Smallpdf | Online workflow uploads/processes remotely; desktop app is local/offline. | Free/Pro and desktop product funnel. | [Online vs offline](https://smallpdf.com/blog/online-vs-offline-pdf-editing-which-is-right-for-you), [privacy](https://smallpdf.com/blog/is-smallpdf-safe) |
| PDF24 | Online tools are server processed; PDF24 Creator is a local desktop product. | Broad free desktop suite; vendor says free product is ad-funded. | [FAQ](https://tools.pdf24.org/en/faq), [Creator](https://tools.pdf24.org/en/creator) |
| Sejda | Online editor uploads and deletes files; Desktop is the no-upload alternative. | Broad PDF/OCR suite; Desktop has free limits and paid unlimited use. | [editor](https://www.sejda.com/pdf-editor), [Desktop](https://www.sejda.com/desktop) |
| Adobe Acrobat Online | Online tools explicitly upload to Adobe servers. | 25+ PDF/e-sign/AI tools and paid Acrobat ecosystem. | [Acrobat Online](https://www.adobe.com/acrobat/online.html), [online OCR](https://www.adobe.com/acrobat/online/ocr-pdf) |
| CloudConvert | Selected files are transferred to temporary server storage. | 212-format general conversion, API/workflows, usage-based model. | [product](https://cloudconvert.com/), [privacy](https://cloudconvert.com/privacy), [API](https://cloudconvert.com/apis/file-conversion) |
| TinyWow | Files are processed on servers and the vendor says they are deleted after one hour. | Broad free/no-signup suite; vendor discloses advertising. | [Your data](https://tinywow.com/your-data), [privacy](https://tinywow.com/privacy) |
| Img2Go / Online-Convert | Both describe server processing/retention windows and Premium plans. | Broad image/general conversion, metadata utilities, accounts/Premium. | [Img2Go security](https://www.img2go.com/security), [Online-Convert](https://www.online-convert.com/), [security](https://www.online-convert.com/security) |
| LocalConvert / Unwrite / fwip | Their own sites claim browser-local/no-upload operation. These are vendor claims, not independent audits. | Browser-local PDF/image/text tools; LocalConvert identifies AGPL-3.0; fwip advertises a one-time purchase. | [LocalConvert](https://localconvert.app/), [Unwrite](https://unwrite.co/), [fwip](https://fwip.app/) |

### Inference from the research

Major incumbents validate demand for PDF/OCR/conversion workflows, but generally reserve local processing for a desktop installation. Browser-local competitors prove that “no upload” is feasible and commercially relevant, so that phrase alone is no longer a durable moat. Toolsite’s opportunity is **verifiable local processing for sensitive, common tasks with restrained, high-quality UX—not attempting cloud-suite format parity**.

## F. Market Research

### VERIFIED

- Major PDF suites prominently offer OCR, editing, conversion, organization, and security workflows; this is visible in their current product pages cited above.
- Cloud conversion businesses differentiate through server-side format breadth, integrations, API/workflows, and accounts—not through local browser execution.
- Multiple browser-local entrants explicitly lead with no uploads, on-device processing, privacy, and offline claims.

### INFERENCE

Sensitive PDFs (contracts, invoices, statements, IDs, reports) are a credible privacy-sensitive use case because cloud competitors’ online paths expressly require an upload. This supports a local text-extraction workflow more strongly than an undifferentiated “another converter.”

No search-volume, traffic, revenue, MAU, conversion, or market-size figure is asserted in this report; none was independently retrieved from a reliable keyword-data provider during this gate.

## G. Search / SEO Opportunities

### Strong, useful intent clusters — INFERENCE based on current tool categories

| Cluster | User task | Suitable truthful page | Why it is viable |
| --- | --- | --- | --- |
| PDF text extraction | “extract text from PDF”, “copy text from PDF”, “PDF to text no upload” | One genuine `/tools/pdf-text-extractor` page plus help/FAQ support | Clear task intent, aligns with PDF.js and local positioning. |
| Text search in PDF | “search PDF text locally”, “find text in PDF browser” | Integrated feature explanation, not a separate thin page | Search is a natural part of extraction and improves repeat use. |
| Local OCR | “image to text no upload” | Existing OCR page and a quality/limits guide | Already real; improve support content only when it answers practical questions. |
| Privacy-safe sharing | “remove PDF metadata”, “check image GPS metadata” | Future inspector/sanitizer pages only after complete behavior is verified | Strong privacy differentiation; claim scope must be exact. |

### Rejected SEO behavior

Do not produce mass “PDF to [format]” pages without an implemented converter and real user documentation. Do not promise “offline,” “private,” “best,” “100+ languages,” “legal compliance,” or accuracy rates without matching implementation/evidence.

## H. User Pain Points

**VERIFIED from competitor workflows:** online incumbents require upload, account progression, deletion-window trust, or desktop installation for local use.

**INFERENCE:** users who simply need text from a text-native PDF benefit from a faster, no-install/no-upload route; users with scanned PDFs need OCR but should not be told that a text extractor can read an image-only scan.

The product must distinguish:

- **Text-native PDF:** existing embedded text can be extracted/searchable.
- **Scanned/image-only PDF:** may yield little/no text; OCR is a different, deferred workflow.
- **Password-protected/corrupt PDF:** explicit unsupported/error state, never a fabricated result.

## I. Feature Candidate Matrix

Scores below are **decision-model estimates**, not measured market statistics. Each criterion is scored 1–5 from repository and cited source evidence; weighted totals are comparative.

| Candidate | Demand | SEO | Monetization | Privacy differentiation | Browser feasibility | Performance | Mobile | License | Complexity | Maintenance | Score /100 | Decision |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| **PDF Text Extractor & Search** | 4 | 4 | 3 | 4 | 5 | 4 | 4 | 5 | 4 | 4 | **79** | **Recommend next** |
| PDF metadata inspector/editor | 3 | 3 | 3 | 5 | 4 | 4 | 4 | 5 | 3 | 3 | **73** | Runner-up |
| Batch image recipes / target-size compression | 4 | 3 | 4 | 3 | 4 | 3 | 3 | 5 | 3 | 3 | **69** | Later |
| Searchable PDF OCR | 4 | 4 | 4 | 5 | 2 | 1 | 1 | 4 | 1 | 2 | **60** | Defer |
| Image metadata inspector | 3 | 3 | 3 | 5 | 4 | 5 | 5 | 3 | 3 | 3 | **68** | Later; license review first |
| Local hashes | 2 | 2 | 2 | 4 | 5 | 4 | 4 | 5 | 5 | 5 | **68** | Useful, not next wedge |
| JSON/CSV/XML utilities | 3 | 3 | 2 | 3 | 5 | 3 | 3 | 4 | 3 | 3 | **64** | Defer as a coherent data-tools phase |
| ZIP/archive tools | 3 | 3 | 3 | 3 | 3 | 2 | 2 | 5 | 2 | 2 | **56** | Defer |
| PWA | 2 | 1 | 2 | 3 | 3 | 3 | 3 | 5 | 2 | 2 | **48** | Defer |
| AVIF encode workflow | 3 | 3 | 3 | 2 | 2 | 2 | 2 | 4 | 2 | 2 | **50** | Defer |

## J. Weighted Scoring Method

Weights required by this gate: demand 20%, SEO 15%, monetization 15%, privacy 15%, technical feasibility 10%, performance 5%, mobile 5%, licensing 5%, complexity 5%, maintenance 5%. The total is `(score / 5) × weight` summed across criteria.

The selected feature wins because it combines a real task with **zero new dependency and a familiar worker engine already present in production**. It does not win because it is novel or technically impressive.

## K. Monetization Analysis

### FREE — INFERENCE

- **Acquisition:** a useful free PDF-to-text workflow can earn repeat intent from people needing a one-off extract without upload.
- **Ad-supported usage:** if ads are ever approved/configured, informative help/FAQ/guide pages may be eligible surfaces; no ad belongs in upload, processing, result, copy, or download controls.
- **Retention:** local search and copy/download make the tool useful beyond a single conversion.

### PREMIUM — INFERENCE; not to be implemented now

Potential, privacy-preserving differentiators are larger text-native PDF limits, longer documents, multi-file batch extraction, exports beyond `.txt`, and local saved search/index preferences. Basic no-upload processing should remain available rather than being treated as a Premium entitlement.

### No fabricated revenue projection

No revenue or conversion estimate is provided. Valid forecasting requires real acquisition, tool-completion, ad-impression, plan-selection, and checkout data after analytics/consent/domain work is configured.

## L. AdSense / Advertising Considerations

**VERIFIED repository state:** current ad architecture is disabled and, per [public-content report](PHASE11_PUBLIC_CONTENT_AD_READINESS_REPORT.md), reserved for informational pages rather than active tool workflows.

**VERIFIED policy sources:** Google states sites need useful content and policy compliance ([eligibility](https://support.google.com/adsense/answer/9724)) and prohibits deceptive placements, including placements that can confuse navigation/download interaction ([ad placement policies](https://support.google.com/adsense/answer/1346295)).

**Decision:** no new advertising surface is justified by this feature. If ads are configured later, place them outside the active extractor workspace and never next to Copy, Download, Reset, or an error/progress message. Never derive ad targeting from file bytes, filenames, extracted text, or document metadata.

## M. Premium Conversion Opportunities

The current entitlement code supports FREE/PREMIUM/ADMIN state and explicitly suppresses ads for active Premium users. That is implementation evidence of an eventual Premium experience, not evidence that Dodo is ready for production sale.

For this feature, premium value must be capability/scale convenience—not a reduced privacy promise:

- free: one supported text-native PDF within conservative validated limits, search/copy/download;
- potential Premium later: batch queue, larger safe limits validated on real devices, richer local export formats, and optional local preference persistence;
- not Premium: “files stay local.” That is the product’s core trust boundary.

## N. Privacy Architecture Analysis

**VERIFIED:** the project’s existing local tools and OCR implementation preserve the no-file-upload boundary through browser engines, local workers, same-origin assets, and output blobs. The target feature can preserve the same boundary by passing `File.arrayBuffer()`/typed data to PDF.js in a worker; no application API is needed.

**Required future proof:** add a Playwright privacy regression that monitors all requests during actual PDF extraction. It must fail on non-static external requests, unsafe application upload methods, or request body content from the fixture. The only allowed runtime network work is same-origin app/static worker assets.

## O. Technical Feasibility

### VERIFIED dependency and license status

- `pdfjs-dist@5.1.91` is already installed. PDF.js is Apache-2.0; commercial use, modification, redistribution, and self-hosting are permitted subject to Apache license/notice obligations. [Repository/license](https://github.com/mozilla/pdf.js).
- PDF.js exposes `getDocument`, per-page `getTextContent`, and metadata APIs. [API](https://mozilla.github.io/pdf.js/api/); [Mozilla example](https://github.com/mozilla/pdf.js/blob/master/examples/node/getinfo.mjs).
- Existing project dependencies include `pdf-lib@1.17.1` (MIT) but it is not required for the recommended extractor.

### IMPLEMENTATION INFERENCE

A dedicated PDF text worker should load a PDF from the local file bytes, iterate pages sequentially, emit actual page completion/progress, stream page text to the UI, support worker termination/cancellation, and destroy the PDF document/worker after success, failure, cancellation, or unmount. It should not rasterize pages for a text-native PDF.

## P. Licensing / Legal Risk

**LOW for selected feature:** it uses installed Apache-2.0 PDF.js; no new language model, ML weight, CDN, third-party API, or new dependency is required.

**HIGH / DEFER:** do not use Scribe.js as a shortcut for OCR/searchable PDFs without a separate legal decision: its repository states AGPL-3.0. [Scribe.js](https://github.com/scribeocr/scribe.js). Do not conflate browser delivery with a license exemption.

**MEDIUM / DEFER:** a future image metadata reader such as [ExifReader](https://github.com/mattiasw/ExifReader) uses MPL-2.0 and needs a specific compliance review before installation/distribution.

## Q. Performance Risk

**Moderate, manageable:** text extraction avoids OCR/rasterization but long/malformed PDFs can still consume CPU/memory. PDF.js maintainers have discussed cancellation for long extraction tasks ([discussion](https://github.com/mozilla/pdf.js/pull/16286)). Future implementation needs measured limits—not copied generic PDF limits—covering at minimum a small, medium, and large text-native PDF, page count, memory where observable, responsiveness, cancellation, and output size.

No performance number is asserted before that testing.

## R. Mobile Risk

**Moderate:** text extraction is substantially more feasible than PDF OCR on mobile, but large page counts and complex PDFs can still cause memory pressure. Future acceptance must test 320, 375, 390, and 430 px in Chromium plus available physical iOS/Android devices before any broad mobile-performance claim.

## S. Accessibility Risk

**Low if specified correctly:** the future feature needs a real file input/drop zone, labelled search field, keyboard navigation through results, page/result counts announced through a status region, copy/download buttons with clear names, visible focus, reduced-motion-safe progress, a selectable readonly result area, and actionable empty/error states. Search matches must not rely on color alone.

## T. Brand / Positioning Analysis

### VERIFIED

Prior brand/design audits retained the ZANCTA mark and describe a consistent graphite/black, rose-metal, editorial system. The current repository uses `ZANCTA` in public assets/content and establishes a stable production fallback URL, not a custom domain.

### INFERENCE

- **Memorable/pronounceable/distinctive:** “ZANCTA” is short and visually distinctive enough to retain; a rename would erase existing product/design investment without evidence of a problem.
- **Privacy communication:** the name does not literally describe local processing, but the positioning line can do that more clearly than a literal utility name.
- **SEO:** a coined brand does not itself create generic search demand, but is preferable to an ambiguous generic name. Tool landing pages should address task intent.
- **Commercial/domain availability:** **UNVERIFIED.** No domain-availability or trademark clearance query was performed. Do not represent the name as legally cleared or a domain as available.

**Decision: retain current brand.** Do not initiate a rename in this phase.

## U. Design / UX Opportunities

**VERIFIED from the existing design reports:** the product already uses a restrained premium system with reduced motion, purposeful interactions, consistent dark surfaces, and public/auth/tool layouts.

**INFERENCE:** the highest-value improvement is not spectacle or 3D/WebGL. The next tool should make trust and task completion visible:

1. a concise local-processing statement in the workspace;
2. a single calm upload surface;
3. honest worker progress and cancellation;
4. a clean reading/search result panel with page markers;
5. frictionless copy/download/reset;
6. clear differentiation between “no embedded text” and “OCR is required.”

No giant animation, generic AI dashboard treatment, fake activity graph, or intrusive interstitial is justified.

## V. Recommended Next Feature

# Local PDF Text Extractor & Search

### Why this feature, why now

It turns already-installed Apache-licensed PDF.js capability into a real user workflow, follows the new OCR launch coherently, adds no vendor/model license burden, and reinforces the no-upload promise against cloud-first incumbents.

### Competitive opportunity

Cloud incumbents offer PDF workflows but their online paths require file transfer; several competitors reserve truly local operation for a desktop app. The feature should not claim unique “PDF to text” functionality. Its differentiated proposition is **a tested local browser workflow for text-native PDFs**.

### Monetization/SEO/ad opportunity

- **SEO:** one genuine tool page and supporting help copy target a concrete task without a thin content farm.
- **Premium:** scale/batch/export enhancements can become optional later.
- **Ads:** no in-tool ad; future contextual informational surfaces only.
- **Revenue:** no numerical projection is justified before real traffic/conversion instrumentation.

### Risks

- scanned PDFs may have no embedded text;
- extraction order/layout can be imperfect because PDFs do not guarantee semantic reading order;
- encrypted, malformed, or very large PDFs require explicit failures/limits;
- the feature must not silently turn into an unverified PDF OCR tool.

## W. Runner-Up

# PDF Metadata Inspector and Standard-Property Editor

It is the next best privacy-first candidate because it uses existing PDF.js/PDF-Lib rather than a cloud service. It should wait until the product can test standard Info metadata, XMP, attachments, annotations, form data, encrypted PDFs, and modified output against adversarial fixtures. “Metadata removed” must never mean “forensically clean” unless that scope is technically verified.

## X. Features Rejected / Deferred

| Feature | Decision | Reason |
| --- | --- | --- |
| Searchable PDF OCR | Defer | Highest privacy value but substantial page rendering/OCR/overlay/memory/mobile complexity. |
| Background removal | Keep deferred | Licensing/weights remain unresolved. |
| PWA | Defer | Needs a complete cache/update/offline strategy, not an install badge. |
| AVIF encoding | Defer | Cross-browser encoder behavior and mobile cost unverified. |
| ZIP/archive tooling | Defer | Requires security-hardening beyond a superficial unzip/create UI. |
| Local AI document summary/redaction | Defer | Model licensing, assets, device budget, and quality claims need separate proof. |
| Data tools | Defer | Build later as a coherent worker-first family, not a random feature count increase. |
| Broad SEO page expansion | Defer | No thin/duplicate pages. |

## Y. Future Implementation Specification — Selected Feature Only

### Product behavior and user flow

1. User opens `/tools/pdf-text-extractor`.
2. User selects one supported PDF; bytes remain in the browser.
3. UI validates file and begins worker loading/processing.
4. Worker extracts actual text incrementally by page.
5. UI exposes searchable result text with page context, Copy all, Download `.txt`, Clear/Reset.
6. If no text is present, UI says that the PDF may be scanned/image-only and that this tool does not OCR PDFs; no fabricated result.
7. On cancel, terminate the extraction worker/document task and show `ABORTED`.

### State machine

`IDLE → VALIDATING → LOADING → PROCESSING → COMPLETED`  
Failure exits: `FAILED`, `ABORTED`.

Progress is worker/page completion derived, not an elapsed-time timer. Use indeterminate UI while an exact denominator is unavailable.

### Architecture

- New dedicated PDF-text worker; do not overload unrelated generic tool logic.
- Use installed `pdfjs-dist@5.1.91` with explicit same-origin worker configuration consistent with CSP and existing PDF architecture.
- Pass local file bytes/typed data to the worker; no route handler/API request.
- Extract each page with `getTextContent`; emit page number, total pages after document load, and extracted text chunks.
- Destroy `PDFDocumentProxy` and terminate worker on completion, error, abort, file replacement, clear, and component unmount.
- Prevent concurrent runs using a job ID/worker ref pattern proven by the OCR implementation.

### Dependencies/assets/licensing

- **Required new dependency:** none.
- **Existing dependency:** `pdfjs-dist@5.1.91`, Apache-2.0; re-audit the exact locked package, browser worker assets, notices, paths, and CSP before implementation.
- **No model/language asset:** no OCR is part of this feature.
- **No remote CDN:** self-host/explicitly point worker assets to same-origin paths.

### Privacy/analytics

- no document bytes/text/metadata in server logs, errors, analytics, ads, or database;
- no external request or third-party processing;
- only coarse non-content event names may be designed for a future consented analytics implementation; no current analytics event implementation is requested;
- add an E2E network allowlist/privacy regression using a real text-native PDF fixture.

### UX

- Existing graphite/rose-metal design only; compact editorial workspace.
- File acceptance and limit disclosure must precisely match tested capabilities.
- Language: “Extract text from text-based PDFs locally” rather than “OCR PDF.”
- Explain scan limitation without upselling an unimplemented tool.
- Full-text result should remain selectable, readable, and not rendered as a giant uncontrolled DOM for unbounded documents.

### Errors and limits

Future implementation must derive limits from benchmark evidence. Required errors: unsupported/missing file, file too large, too many pages once an evidence-based cap exists, encrypted/password-protected, corrupt/unreadable PDF, no embedded text, worker failure, cancellation, and memory/timeout failure.

### Mobile/accessibility

Test 320/375/390/430 widths, keyboard upload/search/copy/download/reset, screen-reader status/error/result announcements, contrast/focus, reduced motion, result selection, and small-screen text wrapping. Perform physical-device validation before performance claims.

### SEO

Add only the one real dynamic tool route with unique title/description/canonical/Open Graph/SoftwareApplication and appropriate FAQ schema if answers remain factual. Add it to existing sitemap through the registry. Do not create a cluster of derivative pages yet.

### Free versus Premium boundaries

Do not gate local privacy. Begin with a complete useful free single-file workflow. Only after usage evidence, consider Premium scale controls (validated higher limits/batch/richer exports) while retaining clear free behavior.

### Testing strategy and acceptance criteria

- Unit: input/limit/language-free validation, no-text classification, state transitions, cancellation cleanup, output naming/chunk handling.
- E2E: actual extraction against a deterministic text-native PDF fixture; recognizable expected text; search; copy; download content; clear; invalid/corrupt/encrypted/no-text input; cancel while worker is active; privacy request monitoring; 320–430 responsive checks; axe/keyboard/reduced-motion coverage.
- Performance: actual small/medium/large text-native PDF measurements on Chromium, worker responsiveness and observable memory; physical mobile evidence where available.
- Security: CSP remains strict; no `unsafe-eval`, no external worker/CDN, no content logging.
- Done only when existing tests remain green and no behavior is mocked/simulated.

## Z. Launch Readiness Decision

**Decision: F — do a small final polish and move toward launch readiness after the single recommended feature.**

This means: implement PDF Text Extractor & Search as the last currently justified feature expansion, then focus on real launch blockers in this order:

1. Configure a monitored public support/security channel and update public contact disclosure.
2. Obtain human legal review and fill only factual legal-entity/jurisdiction/consent details.
3. Set custom domain and Search Console verification when the owner is ready.
4. Complete Resend and Dodo production verification with real credentials/test transactions only when explicitly authorized.
5. Configure privacy-appropriate analytics/observability and consent where required.
6. Seek ad approval only if content, traffic, jurisdictional consent, and placement review support it.

**Not recommended:** broad PWA, background removal, many new tools, SEO page multiplication, ad enablement, or redesign before these steps. They add maintenance and risk without evidence of higher immediate return.

## AA. Evidence Sources

### Repository sources

- `lib/tools.ts`, `lib/ocr-engine.ts`, `next.config.ts`, `package.json`, `app/sitemap.ts`, `lib/seo.ts`, `lib/auth.ts`, `lib/entitlement.ts`
- [Phase 11E-1 OCR implementation report](PHASE11E1_OCR_IMPLEMENTATION_REPORT.md)
- [OCR license audit](OCR_LICENSE_AUDIT.md)
- [Public content and ad readiness report](PHASE11_PUBLIC_CONTENT_AD_READINESS_REPORT.md)
- [Pre-domain production gate](PHASE11C_PRE_DOMAIN_PRODUCTION_GATE_REPORT.md)
- [Analytics/monetization bootstrap](MONETIZATION.md) and [observability bootstrap](OBSERVABILITY.md)

### External sources

All URLs are included inline in sections E, L, O, P, and Y. Primary sources are competitor/vendor product/privacy pages, Mozilla PDF.js documentation/repository, and official Google AdSense policy/help pages. Competitor privacy/local claims are attributed to the competitors and are not independent security audits.

## AB. Verified vs Estimated vs Unverified Claims

| Classification | Meaning in this report |
| --- | --- |
| **VERIFIED** | Direct repository inspection, a completed prior verification report, an official package/repository license/API document, or a vendor’s own current published page. |
| **ESTIMATE / INFERENCE** | Comparative feature scores, user-pain interpretation, SEO/monetization potential, and strategic sequencing. These are reasoned decisions, not measured market facts. |
| **UNVERIFIED** | Custom-domain availability, trademark clearance, real search volumes/rankings, traffic, MAU, conversions, revenue, live analytics, live Dodo/Resend, ad approval, physical mobile CPU/memory/battery, Firefox/WebKit, and competitor local-privacy claims not independently audited. |
| **DEFERRED / BLOCKED** | Features or launch tasks intentionally not implemented because of licensing, scope, provider, legal, or evidence gaps. |

## AC. Final Recommendation

**Implement exactly one next feature: Local PDF Text Extractor & Search.** It is a compact, real, privacy-consistent use of an already audited/stable browser PDF engine and is materially safer than PDF OCR/searchable-PDF creation, archives, PWA, AVIF, or a model-driven feature.

After that, stop feature expansion and move to genuine launch readiness: support contact, legal/domain/provider verification, observability, and measured user behavior. The business should optimize for trustworthy completion of sensitive file tasks—not for a larger catalog of unverified tools.
