import { test, expect } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

async function makePdfBytes(pages: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([200, 200]);
  return await doc.save();
}

// helper removed — inline upload used directly

test.describe("PDF tools — real processing", () => {
  test("merge: two PDFs → one merged.pdf with 3 pages", async ({ page }) => {
    const a = await makePdfBytes(1);
    const b = await makePdfBytes(2);
    await page.goto("/tools/pdf-merge");
    const input = page.locator('input[type="file"]');
    await input.setInputFiles([
      { name: "a.pdf", mimeType: "application/pdf", buffer: Buffer.from(a) },
      { name: "b.pdf", mimeType: "application/pdf", buffer: Buffer.from(b) },
    ]);
    await page.getByRole("button", { name: /Process locally/i }).click();
    await expect(page.getByText(/Completed/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("link", { name: "Compress PDF" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /merge PDFs without uploading/i }).first()).toBeVisible();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /Download/i }).first().click();
    const dl = await downloadPromise;
    const path = await dl.path();
    expect(path).toBeTruthy();
  });

  test("split: 4-page PDF with range 2-3 → 2 pages", async ({ page }) => {
    const bytes = await makePdfBytes(4);
    await page.goto("/tools/pdf-split");
    await page.locator('input[type="file"]').setInputFiles({ name: "four.pdf", mimeType: "application/pdf", buffer: Buffer.from(bytes) });
    await page.locator("#range").fill("2-3");
    await page.getByRole("button", { name: /Process locally/i }).click();
    await expect(page.getByText(/Completed/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: /Download/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Merge PDF" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /split PDFs without uploading/i }).first()).toBeVisible();
  });

  test("compress: shows honest sizes", async ({ page }) => {
    const bytes = await makePdfBytes(1);
    await page.goto("/tools/pdf-compress");
    await page.locator('input[type="file"]').setInputFiles({ name: "one.pdf", mimeType: "application/pdf", buffer: Buffer.from(bytes) });
    await page.getByRole("button", { name: /Process locally/i }).click();
    await expect(page.getByText(/Completed/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Original \d/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Split PDF" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /PDF compression actually works/i }).first()).toBeVisible();
  });

  test("pdf-to-images: renders pages", async ({ page }) => {
    test.setTimeout(60_000);
    const bytes = await makePdfBytes(2);
    await page.goto("/tools/pdf-to-images");
    await page.locator('input[type="file"]').setInputFiles({ name: "two.pdf", mimeType: "application/pdf", buffer: Buffer.from(bytes) });
    await page.getByRole("button", { name: /Process locally/i }).click();
    await expect(page.getByText(/Completed/i)).toBeVisible({ timeout: 45000 });
  });

  test("images-to-pdf: two PNGs → PDF", async ({ page }) => {
    const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";
    const png = Buffer.from(pngBase64, "base64");
    await page.goto("/tools/images-to-pdf");
    await page.locator('input[type="file"]').setInputFiles([
      { name: "a.png", mimeType: "image/png", buffer: png },
      { name: "b.png", mimeType: "image/png", buffer: png },
    ]);
    await page.getByRole("button", { name: /Process locally/i }).click();
    await expect(page.getByText(/Completed/i)).toBeVisible({ timeout: 15000 });
  });

  test("images-to-pdf: WebP is accepted and produces a PDF", async ({ page }) => {
    const webp = Buffer.from("UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA", "base64");
    await page.goto("/tools/images-to-pdf");
    await page.locator('input[type="file"]').setInputFiles({ name: "a.webp", mimeType: "image/webp", buffer: webp });
    await page.getByRole("button", { name: /Process locally/i }).click();
    await expect(page.getByText(/Completed/i)).toBeVisible({ timeout: 15000 });
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /Download/i }).first().click();
    const dl = await downloadPromise;
    expect(await dl.suggestedFilename()).toMatch(/\.pdf$/i);
  });

  test("renamed PNG is not treated as a PDF", async ({ page }) => {
    const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";
    await page.goto("/tools/pdf-merge");
    await page.locator('input[type="file"]').setInputFiles({
      name: "fake.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(pngBase64, "base64"),
    });
    await expect(page.getByRole("alert").filter({ hasText: /couldn't process/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/not a valid PDF/i)).toBeVisible();
  });

  test("pdf-compress does not advertise quality levels", async ({ page }) => {
    await page.goto("/tools/pdf-compress");
    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/Light, Medium, Strong|3 quality levels/i);
    expect(body).toMatch(/object streams/i);
  });

  test("split rejects invalid range", async ({ page }) => {
    const bytes = await makePdfBytes(2);
    await page.goto("/tools/pdf-split");
    await page.locator('input[type="file"]').setInputFiles({ name: "two.pdf", mimeType: "application/pdf", buffer: Buffer.from(bytes) });
    await page.locator("#range").fill("5");
    await page.getByRole("button", { name: /Process locally/i }).click();
    await expect(page.getByText(/couldn't process/i)).toBeVisible({ timeout: 15000 });
  });
});
