# Show HN — ready to post (one channel)

**Platform:** Hacker News only. Do not also post to Reddit, Product Hunt, Dev.to, Indie Hackers, X, or LinkedIn in the same window.

**Status (12H-17):** not posted. No HN session, CAPTCHA, or 2FA is available in this environment. **OWNER ACTION REQUIRED.**

Verified against production `cf73a02` / checkout `{"live":false}` / ads 404 / 11 available tools / Free needs no account / Premium “currently unavailable while ZANCTA completes its launch process.”

## Exact owner action (one sitting)

1. Sign in at https://news.ycombinator.com/login
2. Open https://news.ycombinator.com/submit
3. **Title** — paste exactly:

Show HN: ZANCTA – PDF/image tools that run in the browser (no upload for processing)

4. **URL:** `https://zancta.tech`
5. **Text** — paste the body below.
6. Submit once. Do not ask for upvotes. Do not cross-post.
7. Write down the post URL and UTC time.
8. In GA4, watch `news.ycombinator.com` referrals and tool events. In GSC, do not expect instant indexing.

Do not add fake traffic, users, testimonials, or “best PDF tool” claims. Checkout is not live. Ads are not live.

---

**Title:**

Show HN: ZANCTA – PDF/image tools that run in the browser (no upload for processing)

**Body:**

I built ZANCTA (https://zancta.tech) as a small suite of PDF and image tools that process files in the tab after the page loads.

Implemented tools use the File API plus pdf-lib, PDF.js, or Tesseract.js in a Worker. Selected file bytes are not posted to a conversion API. You can watch the Network panel during a merge: the PDF itself does not go out.

What is in the suite today: eleven local tools — merge, split, compress, PDF↔images, image compress/convert/resize, EXIF cleaner (canvas re-encode, not a lossless ExifTool strip), embedded PDF text extraction, and English image OCR. Background removal is deferred. Extra OCR languages and scanned-PDF OCR are Local OCR Power on Premium. Checkout is not live (`GET /api/payments/checkout` returns `{"live":false}`). The pricing page says Premium is currently unavailable while ZANCTA completes its launch process.

Honest limits:

- Compress PDF enables object streams. It does not downsample embedded images. Image-heavy files often do not shrink; the tool reports both sizes.
- Split copies a page range into one PDF, not a ZIP of single pages.
- EXIF cleaning re-encodes JPG/PNG/WebP. It is not anonymity, and HEIC/RAW are out of scope.
- Chromium scanned-PDF OCR (synthetic, prior measurement): 1 page ≈ 930 ms, 10 ≈ 2524 ms, 20 ≈ 3532 ms. Firefox/WebKit multi-page timing is still unmeasured. Large files can exhaust a phone browser.
- Local processing does not hide the file from extensions, malware, or the next site you upload to.
- Optional GA4 runs only after analytics consent. Ads are not live.

I am looking for technical critique of the privacy boundary, not votes.

---

Do not post this automatically. One post, one platform, only when the operator submits it.
