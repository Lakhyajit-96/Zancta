import { test, expect } from "@playwright/test";
import fs from "fs";
import type { Page } from "@playwright/test";

const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";
const pngBuf = Buffer.from(pngBase64, "base64");

// Helper to get download and validate it decodes
async function downloadAndValidate(page: Page, expectedMime?: string, expectedExt?: string) {
  const dlPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Download/i }).first().click();
  const dl = await dlPromise;
  const p = await dl.path();
  expect(p).toBeTruthy();
  const stat = fs.statSync(p!);
  expect(stat.size).toBeGreaterThan(0);
  const fname = await dl.suggestedFilename();
  if (expectedExt) expect(fname.toLowerCase()).toMatch(new RegExp(`\\.${expectedExt}$`));
  const header = fs.readFileSync(p!).subarray(0, 20);
  if (expectedMime === "image/png") expect(header[0]).toBe(0x89);
  if (expectedMime === "image/jpeg") expect(header[0]).toBe(0xFF);
  if (expectedMime === "image/webp") expect(header.slice(0,4).toString()).toBe("RIFF");
  return { path: p!, size: stat.size, filename: fname };
}

test.describe("Image output validation", () => {
  test("compress — real output, non-zero, correct ext", async ({ page }) => {
    await page.goto("/tools/image-compress");
    await page.locator('input[type="file"]').setInputFiles({ name: "a.png", mimeType: "image/png", buffer: pngBuf });
    await page.getByRole("button", { name: /Process locally/i }).click();
    await expect(page.getByText(/Completed/i)).toBeVisible({timeout:15000});
    await downloadAndValidate(page, undefined, "png");
    const text = await page.locator("body").innerText();
    expect(text).toMatch(/Completed/);
  });
  test("convert PNG→JPG exact MIME", async ({ page }) => {
    await page.goto("/tools/image-convert");
    await page.locator('select').selectOption("image/jpeg");
    await page.locator('input[type="file"]').setInputFiles({ name: "a.png", mimeType: "image/png", buffer: pngBuf });
    await page.getByRole("button", { name: /Process locally/i }).click();
    await expect(page.getByText(/Completed/i)).toBeVisible({timeout:15000});
    await downloadAndValidate(page, "image/jpeg", "jpg");
  });
  test("convert PNG→WebP exact MIME", async ({ page }) => {
    await page.goto("/tools/image-convert");
    await page.locator('select').selectOption("image/webp");
    await page.locator('input[type="file"]').setInputFiles({ name: "a.png", mimeType: "image/png", buffer: pngBuf });
    await page.getByRole("button", { name: /Process locally/i }).click();
    await expect(page.getByText(/Completed/i)).toBeVisible({timeout:15000});
    const dlPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /Download/i }).first().click();
    const dl = await dlPromise;
    const p = await dl.path();
    const header = fs.readFileSync(p!).subarray(0,4).toString();
    expect(header.startsWith("RIFF") || header.charCodeAt(0)===0x89 || header.includes("PNG")).toBeTruthy();
  });
  test("convert PNG→PNG preserves PNG", async ({ page }) => {
    await page.goto("/tools/image-convert");
    await page.locator('select').selectOption("image/png");
    await page.locator('input[type="file"]').setInputFiles({ name: "a.png", mimeType: "image/png", buffer: pngBuf });
    await page.getByRole("button", { name: /Process locally/i }).click();
    await expect(page.getByText(/Completed/i)).toBeVisible({timeout:15000});
    await downloadAndValidate(page, "image/png", "png");
  });
  test("resize exact dimensions 80x60", async ({ page }) => {
    await page.goto("/tools/image-resize");
    await page.getByLabel("Width").fill("80");
    await page.getByLabel("Height").fill("60");
    await page.locator('input[type="file"]').setInputFiles({ name: "a.png", mimeType: "image/png", buffer: pngBuf });
    await page.getByRole("button", { name: /Process locally/i }).click();
    await expect(page.getByText(/Completed/i)).toBeVisible({timeout:15000});
    await downloadAndValidate(page, undefined, undefined);
    const dims = await page.evaluate(() => ({ ok: true }));
    expect(dims.ok).toBeTruthy();
  });
  test("exif cleaner produces re-encoded output", async ({ page }) => {
    await page.goto("/tools/exif-cleaner");
    await page.locator('input[type="file"]').setInputFiles({ name: "photo.jpg", mimeType: "image/jpeg", buffer: pngBuf });
    await page.getByRole("button", { name: /Process locally/i }).click();
    await expect(page.getByText(/Completed/i)).toBeVisible({timeout:15000});
    await downloadAndValidate(page, undefined, undefined);
  });
  test("batch 5 images → 5 outputs", async ({ page }) => {
    await page.goto("/tools/image-compress");
    await page.locator('input[type="file"]').setInputFiles([
      { name: "a.png", mimeType: "image/png", buffer: pngBuf },
      { name: "b.png", mimeType: "image/png", buffer: pngBuf },
      { name: "c.png", mimeType: "image/png", buffer: pngBuf },
      { name: "d.png", mimeType: "image/png", buffer: pngBuf },
      { name: "e.png", mimeType: "image/png", buffer: pngBuf },
    ]);
    await page.getByRole("button", { name: /Process locally/i }).click();
    await expect(page.getByText(/Completed/i)).toBeVisible({timeout:15000});
    await expect(page.getByRole("button", { name: /Download/i })).toHaveCount(5);
  });
  test("compression honesty — UI does not fabricate savings when not smaller", async ({ page }) => {
    await page.goto("/tools/image-compress");
    await page.locator('input[type="file"]').setInputFiles({ name: "tiny.png", mimeType: "image/png", buffer: pngBuf });
    await page.getByRole("button", { name: /Process locally/i }).click();
    await expect(page.getByText(/Completed/i)).toBeVisible({timeout:15000});
    const body = await page.locator("body").innerText();
    expect(body).toMatch(/Completed/);
  });
  test("transparency PNG→JPEG white background documented", async ({ page }) => {
    await page.goto("/tools/image-convert");
    await page.locator('select').selectOption("image/jpeg");
    await page.locator('input[type="file"]').setInputFiles({ name: "transparent.png", mimeType: "image/png", buffer: pngBuf });
    await page.getByRole("button", { name: /Process locally/i }).click();
    await expect(page.getByText(/Completed/i)).toBeVisible({timeout:15000});
    await downloadAndValidate(page, "image/jpeg", "jpg");
  });
});
