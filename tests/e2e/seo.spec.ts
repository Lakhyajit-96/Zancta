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
