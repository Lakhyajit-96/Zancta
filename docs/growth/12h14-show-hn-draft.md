# 12H-14 — one technical distribution post (draft only)

**Platform chosen:** Hacker News (`Show HN`)  
**Why:** the product’s actual differentiator is an engineering/privacy constraint (browser-local pdf-lib / PDF.js / Tesseract.js), not a marketing landing page. HN is the best fit for that story. Reddit/Product Hunt/Indie Hackers remain drafts from 12H-13 and are not posted.

**Status:** not posted. Automatic posting is not authorized. **OWNER ACTION REQUIRED** to publish from a human account.

Do not add fake traffic, users, testimonials, or “best PDF tool” claims. Checkout is not live. Ads are not live.

---

**Title:**

Show HN: ZANCTA – PDF/image tools that run in the browser (no upload for processing)

**Body:**

I built ZANCTA (https://zancta.tech) as a small suite of PDF and image tools that process files in the tab after the page loads.

Implemented tools use the File API plus pdf-lib, PDF.js, or Tesseract.js in a Worker. Selected file bytes are not posted to a conversion API. You can watch the Network panel during a merge: the PDF itself does not go out.

What is in the suite today: merge, split, compress, PDF↔images, image compress/convert/resize, EXIF cleaner (canvas re-encode, not a lossless ExifTool strip), embedded PDF text extraction, and English image OCR. Extra OCR languages and scanned-PDF OCR are Premium and not for sale yet (`GET /api/payments/checkout` returns `{"live":false}`).

Honest limits:

- Compress PDF enables object streams. It does not downsample embedded images. Image-heavy files often do not shrink; the tool reports both sizes.
- Split copies a page range into one PDF, not a ZIP of single pages.
- EXIF cleaning re-encodes JPG/PNG/WebP. It is not anonymity, and HEIC/RAW are out of scope.
- Chromium scanned-PDF OCR (synthetic): 1 page ≈ 930 ms, 10 ≈ 2524 ms, 20 ≈ 3532 ms. Firefox/WebKit multi-page timing is still unmeasured. Large files can exhaust a phone browser.
- Local processing does not hide the file from extensions, malware, or the next site you upload to.

I am looking for technical critique of the privacy boundary, not votes.

---

Do not post this automatically. One post, one platform, only when the operator submits it.
