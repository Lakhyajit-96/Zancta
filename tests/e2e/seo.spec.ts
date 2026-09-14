import { test, expect } from "@playwright/test";
test("seo", async ({ page }) => {
  await page.goto("/tools/image-compress");
  const title = await page.title();
  console.log("title:", title);
  expect(title).toContain("Compress Image");
  const desc = await page.locator('meta[name="description"]').getAttribute("content");
  console.log("desc:", desc?.slice(0,80));
  expect(desc).toBeTruthy();
  const h1 = await page.locator("h1").innerText();
  console.log("h1:", h1);
  expect(h1).toContain("Compress images");
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href").catch(()=>null);
  console.log("canonical:", canonical);
  await expect(page.getByRole("navigation", {name:"Breadcrumb"})).toBeVisible();
  const robots = await page.request.get("/robots.txt");
  console.log("robots", await robots.text().then(t=>t.slice(0,100)));
  expect(robots.ok()).toBeTruthy();
  const sitemap = await page.request.get("/sitemap.xml");
  console.log("sitemap", await sitemap.text().then(t=>t.slice(0,200)));
  expect(sitemap.ok()).toBeTruthy();
});

test("tools catalog has unique metadata and twitter image", async ({ page }) => {
  await page.goto("/tools");
  expect(await page.title()).toMatch(/Tools/i);
  const desc = await page.locator('meta[name="description"]').getAttribute("content");
  expect(desc || "").toMatch(/Eleven local/i);
  const ogWidth = await page.locator('meta[property="og:image:width"]').getAttribute("content");
  expect(ogWidth).toBe("1200");
  const ogHeight = await page.locator('meta[property="og:image:height"]').getAttribute("content");
  expect(ogHeight).toBe("630");
  const twitter = await page.locator('meta[name="twitter:image"], meta[property="twitter:image"]').first().getAttribute("content");
  expect(twitter || "").toMatch(/zancta-og-hero/);
});

test("every sitemap page publishes distinct title and description metadata", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  const xml = await sitemap.text();
  const paths = [...xml.matchAll(/<loc>https:\/\/zancta\.tech([^<]*)<\/loc>/g)].map((match) => match[1] || "/");
  const titles: string[] = [];
  const descriptions: string[] = [];

  for (const path of paths) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1] ?? "";
    const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "";
    expect(title, path).not.toBe("");
    expect(description, path).not.toBe("");
    titles.push(title);
    descriptions.push(description);
  }

  expect(new Set(titles).size).toBe(titles.length);
  expect(new Set(descriptions).size).toBe(descriptions.length);
});

test("representative metadata stays page-specific and branded", async ({ page }) => {
  for (const path of ["/", "/pricing", "/faq", "/tools/pdf-merge", "/guides/local-processing", "/privacy", "/terms"]) {
    await page.goto(path);
    const title = await page.title();
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
    const ogUrl = await page.locator('meta[property="og:url"]').getAttribute("content");
    expect(title, path).toBeTruthy();
    expect(description, path).toBeTruthy();
    expect(canonical, path).toMatch(/^https:\/\/zancta\.tech\//);
    expect(ogTitle, path).toBe(title);
    expect(ogUrl, path).toBe(canonical);
  }
});

test("SoftwareApplication avoids blanket pricing and llms.txt is factual", async ({ page, request }) => {
  await page.goto("/tools/pdf-merge");
  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(jsonLd.some((text) => /"SoftwareApplication"/.test(text))).toBeTruthy();
  expect(jsonLd.join("")).not.toMatch(/"offers"|"priceCurrency"/);

  const llms = await request.get("/llms.txt");
  expect(llms.ok()).toBeTruthy();
  const body = await llms.text();
  expect(body).toMatch(/ZANCTA/);
  expect(body).toMatch(/Merge PDF/);
  expect(body).not.toMatch(/#1|most secure|guaranteed indexing|guaranteed ChatGPT/i);
});

test("legacy routes are permanent one-hop redirects", async ({ request }) => {
  for (const path of ["/Tools", "/features"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(308);
    expect(response.headers().location, path).toMatch(/\/tools$/);
  }

  const tools = await request.get("/tools");
  expect(tools.status()).toBe(200);
});

test("crawl semantics remain explicit on tools, FAQ, and guides", async ({ page }) => {
  await page.goto("/tools");
  expect(await page.locator("h1").count()).toBe(1);
  expect(await page.locator("h2").count()).toBeGreaterThan(0);

  await page.goto("/faq");
  expect(await page.locator("h1").count()).toBe(1);
  expect(await page.locator("h2").count()).toBeGreaterThan(0);

  await page.goto("/guides/local-processing");
  expect(await page.locator("main > section > article").count()).toBe(1);
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Local processing");
});

test("local processing guide is unique and linked", async ({ page }) => {
  await page.goto("/guides/local-processing");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Local processing/i);
  await expect(page.getByRole("link", { name: /OCR/i }).first()).toBeVisible();
});

test("IndexNow notify route is not an open proxy", async ({ request }) => {
  const missing = await request.post("/api/indexnow", { data: { urls: ["https://zancta.tech/"] } });
  expect([401, 429, 503]).toContain(missing.status());
  const get = await request.get("/api/indexnow");
  expect(get.status()).toBe(405);
});

test("checkout availability is reflected consistently in pricing", async ({ request, page }) => {
  const avail = await request.get("/api/payments/checkout");
  expect(avail.ok()).toBeTruthy();
  const body = await avail.json() as { live?: boolean };
  await page.goto("/pricing");
  if (body.live) {
    await expect(page.getByRole("button", { name: "Subscribe annually" })).toBeVisible();
    await expect(page.getByText("Premium checkout is currently unavailable while ZANCTA verifies payment availability.")).toHaveCount(0);
  } else {
    await expect(page.getByText("Premium checkout is currently unavailable while ZANCTA verifies payment availability.").first()).toBeVisible();
  }
});

test("404 metadata is accurate and non-indexable", async ({ request }) => {
  const response = await request.get("/phase6-missing-page");
  expect(response.status()).toBe(404);
  const body = await response.text();
  expect(body).toContain("Page not found");
  expect(body).toContain('name="robots"');
  expect(body).toContain("noindex");
  expect(body).not.toContain('rel="canonical"');
});

test("auth metadata is specific and non-indexable", async ({ page }) => {
  await page.goto("/signin");
  expect(await page.title()).toContain("Sign in");
  expect(await page.locator('meta[name="description"]').getAttribute("content")).toContain("ZANCTA account");
  expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
  expect(await page.locator('link[rel="canonical"]').count()).toBe(0);
});

test("sitemap.xml is valid XML with canonical HTTPS URLs", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()["content-type"] || "").toMatch(/xml/);
  const xml = await sitemap.text();
  expect(xml).toContain("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
  expect(xml).toContain("http://www.sitemaps.org/schemas/sitemap/0.9");
  expect(xml).toContain("https://zancta.tech/guides/merge-pdf-without-uploading");
  expect(xml).toContain("https://zancta.tech/guides/jpg-vs-png-vs-webp");
  expect(xml).toContain("https://zancta.tech/guides/browser-ocr-without-uploading");
  expect(xml).toContain("https://zancta.tech/guides/compress-pdf-without-uploading");
  expect(xml).toContain("https://zancta.tech/guides/split-pdf-without-uploading");
  expect(xml).toContain("https://zancta.tech/guides/remove-exif-before-sharing");
  expect(xml).toContain("https://zancta.tech/guides/check-browser-file-tool-uploads");
  expect(xml).toContain("https://zancta.tech/guides/exif-data-before-sharing");
  expect(xml).not.toMatch(/localhost|127\.0\.0\.1|vercel\.app/i);
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  expect(new Set(locs).size).toBe(locs.length);
});

test("premium OCR language packs are not public", async ({ request }) => {
  const res = await request.get("/api/ocr/lang/hin.traineddata.gz");
  expect(res.status()).toBe(401);
  const unknown = await request.get("/api/ocr/lang/eng.traineddata.gz");
  expect(unknown.status()).toBe(404);
});

test("SEO guides render with breadcrumbs and internal links", async ({ page }) => {
  await page.goto("/guides/merge-pdf-without-uploading");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Merge PDF/i);
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Merge PDF" }).first()).toBeVisible();

  await page.goto("/guides/jpg-vs-png-vs-webp");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/JPG/);
  await expect(page.getByRole("link", { name: "Convert Image" })).toBeVisible();

  await page.goto("/guides/browser-ocr-without-uploading");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/browser OCR/i);
  await expect(page.getByRole("link", { name: "Image OCR" }).first()).toBeVisible();

  await page.goto("/guides/check-browser-file-tool-uploads");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/check whether a browser file tool uploads/i);
  await expect(page.getByRole("link", { name: /local processing guide/i })).toBeVisible();

  await page.goto("/guides/exif-data-before-sharing");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/EXIF data can reveal/i);
  await expect(page.getByRole("link", { name: "EXIF Cleaner" })).toBeVisible();

  await page.goto("/guides/compress-pdf-without-uploading");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Compress a PDF/i);
  await expect(page.getByRole("link", { name: "Compress PDF" }).first()).toBeVisible();
  await expect(page.getByText("Does ZANCTA recompress the photos inside my PDF?")).toBeVisible();

  await page.goto("/guides/split-pdf-without-uploading");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Split a PDF/i);
  await expect(page.getByRole("link", { name: "Split PDF" }).first()).toBeVisible();
  await expect(page.getByText("Do I get one file per page?")).toBeVisible();

  await page.goto("/guides/remove-exif-before-sharing");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Remove EXIF/i);
  await expect(page.getByRole("link", { name: "EXIF Cleaner" }).first()).toBeVisible();
  await expect(page.getByText("Does this make a photo anonymous?")).toBeVisible();
});
