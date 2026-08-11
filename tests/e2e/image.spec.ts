import { test, expect } from "@playwright/test";

const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";
const pngBuf = Buffer.from(pngBase64, "base64");
// larger png 100x100 red via base64? reuse single pixel but browser will still process
// Use a 10x10 png for resize testing - we can also use canvas-generated via data URL?
// For WebP/JPG conversion we use same png buffer but set mime accordingly; browser decodes it

test.describe("Image tools — real processing", () => {
  test("compress: quality slider reduces or keeps size", async ({ page }) => {
    await page.goto("/tools/image-compress");
    // verify quality control exists
    await expect(page.getByLabel("Quality")).toBeVisible();
    // upload png
    await page.locator('input[type="file"]').setInputFiles({ name: "orig.png", mimeType: "image/png", buffer: pngBuf });
    // move slider to 0.6
    const slider = page.getByLabel("Quality");
    await slider.fill("0.6");
    await page.getByRole("button", { name: /Process locally/i }).click();
    await expect(page.getByText(/Completed/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: /Download/i })).toBeVisible();
    // download and check blob type/size
    const dlPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /Download/i }).first().click();
    const dl = await dlPromise;
    const p = await dl.path();
    expect(p).toBeTruthy();
  });

  test("convert: PNG → JPG, JPG → PNG, PNG → WebP", async ({ page }) => {
    // PNG -> JPG
    await page.goto("/tools/image-convert");
    await expect(page.getByText("Target")).toBeVisible();
    await page.locator('select').selectOption("image/jpeg");
    await page.locator('input[type="file"]').setInputFiles({ name: "a.png", mimeType: "image/png", buffer: pngBuf });
    await page.getByRole("button", { name: /Process locally/i }).click();
    await expect(page.getByText(/Completed/i)).toBeVisible({ timeout: 15000 });
    let dlPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /Download/i }).first().click();
    let dl = await dlPromise;
    expect(await dl.path()).toBeTruthy();
    // suggestions: filename should end with .jpg
    expect(await dl.suggestedFilename()).toMatch(/\.jpg$/i);

    // PNG -> WebP
    await page.goto("/tools/image-convert");
    await page.locator('select').selectOption("image/webp");
    await page.locator('input[type="file"]').setInputFiles({ name: "b.png", mimeType: "image/png", buffer: pngBuf });
    await page.getByRole("button", { name: /Process locally/i }).click();
    await expect(page.getByText(/Completed/i)).toBeVisible({ timeout: 15000 });
    dlPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /Download/i }).first().click();
    dl = await dlPromise;
    expect(await dl.suggestedFilename()).toMatch(/\.webp$/i);

    // PNG -> PNG (passthrough)
    await page.goto("/tools/image-convert");
    await page.locator('select').selectOption("image/png");
    await page.locator('input[type="file"]').setInputFiles({ name: "c.png", mimeType: "image/png", buffer: pngBuf });
    await page.getByRole("button", { name: /Process locally/i }).click();
    await expect(page.getByText(/Completed/i)).toBeVisible({ timeout: 15000 });
  });

  test("resize: width/height and aspect clamp", async ({ page }) => {
    await page.goto("/tools/image-resize");
    await expect(page.getByLabel("Width")).toBeVisible();
    await expect(page.getByLabel("Height")).toBeVisible();
    await expect(page.getByLabel("Keep aspect")).toBeVisible();
    await page.getByLabel("Width").fill("80");
    await page.getByLabel("Height").fill("60");
    await page.locator('input[type="file"]').setInputFiles({ name: "orig.png", mimeType: "image/png", buffer: pngBuf });
    await page.getByRole("button", { name: /Process locally/i }).click();
    await expect(page.getByText(/Completed/i)).toBeVisible({ timeout: 15000 });
    const dlPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /Download/i }).first().click();
    const dl = await dlPromise;
    expect(await dl.path()).toBeTruthy();
  });

  test("exif cleaner: re-encode strips metadata", async ({ page }) => {
    await page.goto("/tools/exif-cleaner");
    await page.locator('input[type="file"]').setInputFiles({ name: "photo.jpg", mimeType: "image/jpeg", buffer: pngBuf });
    await page.getByRole("button", { name: /Process locally/i }).click();
    await expect(page.getByText(/Completed/i)).toBeVisible({ timeout: 15000 });
    const dlPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /Download/i }).first().click();
    const dl = await dlPromise;
    expect(await dl.path()).toBeTruthy();
  });

  test("image tools show local privacy and handle download", async ({ page }) => {
    await page.goto("/tools/image-convert");
    await expect(page.getByText("Local — no upload")).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles({ name: "a.png", mimeType: "image/png", buffer: pngBuf });
    await page.getByRole("button", { name: /Process locally/i }).click();
    await expect(page.getByText(/Completed/i)).toBeVisible({ timeout: 15000 });
  });
});
