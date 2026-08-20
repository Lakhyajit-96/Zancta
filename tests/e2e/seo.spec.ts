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
  // breadcrumbs
  await expect(page.getByRole("navigation", {name:"Breadcrumb"})).toBeVisible();
  // sitemap/robots via fetch
  const robots = await page.request.get("/robots.txt");
  console.log("robots", await robots.text().then(t=>t.slice(0,100)));
  expect(robots.ok()).toBeTruthy();
  const sitemap = await page.request.get("/sitemap.xml");
  console.log("sitemap", await sitemap.text().then(t=>t.slice(0,200)));
  expect(sitemap.ok()).toBeTruthy();
});

test("IndexNow notify route is not an open proxy", async ({ request }) => {
  const missing = await request.post("/api/indexnow", { data: { urls: ["https://zancta.tech/"] } });
  expect([401, 503]).toContain(missing.status());
  const body = await missing.json();
  expect(JSON.stringify(body)).not.toMatch(/indexnow/i);
  const get = await request.get("/api/indexnow");
  expect(get.status()).toBe(405);
});
  await page.goto("/guides/local-processing");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Local processing/i);
  await expect(page.getByRole("link", { name: /OCR/i }).first()).toBeVisible();
});
