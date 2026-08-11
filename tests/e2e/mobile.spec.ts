import { test, expect, devices } from "@playwright/test";
const viewports = [320, 375, 390, 430];
for (const w of viewports) {
  test(`mobile ${w}px — no overflow, controls visible`, async ({ browser }) => {
    const ctx = await browser.newContext({ ...devices["Pixel 5"], viewport: { width: w, height: 800 } });
    const page = await ctx.newPage();
    await page.goto("/tools/image-compress");
    await expect(page.getByRole("heading", {level:1})).toBeVisible();
    // Check no horizontal overflow
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasOverflow).toBe(false);
    await expect(page.getByLabel("Quality")).toBeVisible();
    // Touch target size check — button should be at least 44px?
    const btn = page.getByRole("button", { name: /Select files/i }).first();
    await expect(btn).toBeVisible();
    await ctx.close();
    console.log(`mobile ${w}px ok`);
  });
}
test("mobile upload + convert via emulated device", async ({ browser }) => {
  const ctx = await browser.newContext({ ...devices["iPhone 12"] });
  const page = await ctx.newPage();
  await page.goto("/tools/image-convert");
  const pngBase64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";
  const buf=Buffer.from(pngBase64,'base64');
  await page.locator('input[type="file"]').setInputFiles({ name:"a.png", mimeType:"image/png", buffer:buf });
  await page.getByRole("button", { name:/Process locally/i }).click();
  await expect(page.getByText(/Completed/i)).toBeVisible({timeout:15000});
  await ctx.close();
});
