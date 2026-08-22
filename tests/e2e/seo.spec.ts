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

test("SoftwareApplication offers use INR and llms.txt is factual", async ({ page, request }) => {
  await page.goto("/tools/pdf-merge");
  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(jsonLd.some((text) => /"priceCurrency":\s*"INR"/.test(text))).toBeTruthy();
  expect(jsonLd.join("")).not.toMatch(/"priceCurrency":\s*"USD"/);

  const llms = await request.get("/llms.txt");
  expect(llms.ok()).toBeTruthy();
  const body = await llms.text();
  expect(body).toMatch(/ZANCTA/);
  expect(body).toMatch(/Merge PDF/);
  expect(body).not.toMatch(/#1|most secure|guaranteed indexing|guaranteed ChatGPT/i);
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

test("checkout availability is not an open live switch locally", async ({ request, page }) => {
  const avail = await request.get("/api/payments/checkout");
  expect(avail.ok()).toBeTruthy();
  const body = await avail.json();
  expect(body.live).toBe(false);
  await page.goto("/pricing");
  await expect(page.getByRole("button", { name: "Not available" }).first()).toBeVisible();
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
});
