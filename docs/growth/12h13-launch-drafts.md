# Phase 12H-13 launch drafts — do not post

Operator authorization required before any community post. No fake votes, supporters, testimonials, or traffic claims. Checkout is not live. Ads are not live.

## Product Hunt

**Tagline:** PDF and image tools that run in your browser.

**One line:** Merge, split, compress, convert, and OCR files locally — ZANCTA does not upload your documents for processing.

**Full description (draft):**
ZANCTA is a small suite of PDF and image tools that process files in the tab after the page loads. Merge, split, compress, convert, resize, strip typical EXIF by re-encoding, extract embedded PDF text, and run English OCR without sending the file to a conversion API.

Compress PDF rewrites object streams; it does not downsample images and does not promise a percentage. Split PDF copies a page range into one new PDF, not a ZIP of single pages. EXIF Cleaner re-encodes JPG/PNG/WebP (not a lossless ExifTool strip, not anonymity).

Additional OCR languages and scanned PDF OCR are Local OCR Power on Premium. Checkout is not live. Limits are shown on each tool. OCR is not human-level.

**Maker story (draft):**
I did not want contracts and IDs sitting on a converter’s disk. The engineering choice is pdf-lib, PDF.js, and Tesseract.js in Web Workers, with language packs loaded only when selected.

**Privacy differentiator:**
Files stay in the tab after the app loads. You can watch the Network panel during a merge: selected PDF bytes are not posted to ZANCTA. Language packs are entitlement-gated. Checkout is explicitly not live.

**Launch-day FAQ (draft):**
- Are files uploaded? Not for implemented local tools.
- Is OCR perfect? No.
- Is Premium purchasable today? No. The site says Premium is currently unavailable while ZANCTA completes its launch process.
- Ads? Not enabled.
- Best compression? Not claimed. Read the sizes the tool reports.

**Screenshots to capture later (operator):** homepage, Merge PDF completed state, Compress PDF size readout, Image OCR workspace, pricing with checkout not available.

Status: **not submitted**.

## Reddit (draft, non-promotional)

Title option: “Browser-local PDF/image tools so documents are not uploaded to a converter.”

Body should cover: File API + Web Workers; pdf-lib vs PDF.js vs Tesseract; why language packs are entitlement-gated; 20-page scanned OCR cap; object-stream compress vs image downsampling; what still leaves the device (HTML/JS/analytics after consent). Invite technical critique. Do not spam subreddits. One authentic post per community, max, and only when authorized.

Status: **not posted**.

## Hacker News (draft)

**Title:** Show HN: ZANCTA — PDF/image tools that run in the browser (pdf-lib, PDF.js, Tesseract.js)

**Body:** Eleven local tools. Merge/split/compress with pdf-lib. Image work with canvas. English OCR free in a Worker; extra languages and scanned PDFs are Premium and not for sale yet (`GET /api/payments/checkout` returns `live: false`). Compress is object streams, not Ghostscript downsampling — image-heavy files often do not shrink. Ask about the privacy boundary, not votes.

Status: **not posted**.

## Dev.to (draft)

**Title:** Object streams are not image compression: an honest in-browser PDF compressor

Walk through pdf-lib `useObjectStreams: true` vs downsampling, why SERPs train users to expect 90% savings, and link `/guides/compress-pdf-without-uploading` after it is live. Disclose checkout off. No invented benchmarks.

Status: **not posted**.

## Indie Hackers (draft)

**Title:** Shipping browser-local PDF tools, and saying no to upload converters.

**Body:** I run ZANCTA as an individual. Eleven local tools, English OCR free, Premium OCR packs not for sale yet. The interesting constraint is no server-side file processing, plus honest PDF compress (object streams, not image transcode). Ask for critique of the privacy boundary, not upvotes.

Status: **not posted**.

## Directories (research list — do not pay, do not auto-submit)

| Site | URL | Requirements | Cost | Follow (if known) | Recommended description | Status |
| --- | --- | --- | --- | --- | --- | --- |
| AlternativeTo | https://alternativeto.net | Account; comparable products; honest feature list | Free listing typical | Mixed; do not assume dofollow | Browser-local PDF/image tools; no upload for implemented processing | Not submitted |
| SaaSHub | https://www.saasshub.com | Product profile | Free tier common | Often nofollow | Same factual one-liner; checkout not live | Not submitted |
| BetaList | https://betalist.com | Early product; may require invite | Free/paid mix | Often nofollow | Only when a real launch window exists | Deferred |
| PrivacyGuides / similar editorial lists | https://www.privacyguides.org | Editorial review; do not spam | Free if accepted | Editorial | Do not pitch until architecture page is complete | Not submitted |
| Awesome-privacy GitHub lists | various | PR quality bar | Free | n/a | Only a factual PR if a list owner wants it | Not submitted |
| G2 / Capterra | vendor listings | Business verification; often paid | Paid common | Mixed | Skip — paid, and no review inventory | Skip |
| Tool-spam SEO directories | various | Reciprocal links / fees | Paid | Usually nofollow | Skip | Skip |

Do not purchase listings. Do not submit automatically.
