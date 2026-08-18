import { expect, test } from "@playwright/test";
import path from "node:path";

const fixture = path.resolve("tests/fixtures/local-ocr-test-123.png");

test.describe("local OCR", () => {
  test.setTimeout(90_000);

  test("extracts actual fixture text, copies it, downloads it, and clears the result", async ({ page, context }) => {

    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/tools/ocr");
    await page.locator('input[type="file"]').setInputFiles(fixture);
    await page.getByRole("button", { name: "Extract text locally" }).click();

    const result = page.getByLabel("Extracted OCR text");
    await expect(result).toHaveValue(/Local OCR Test 123/i, { timeout: 75_000 });

    await page.getByRole("button", { name: "Copy text" }).click();
    await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toMatch(/Local OCR Test 123/i);

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download text" }).click();
    const download = await downloadPromise;
    expect(await download.suggestedFilename()).toBe("local-ocr-test-123-ocr.txt");
    expect((await download.createReadStream())?.readable).toBeTruthy();
    const content = await download.path().then(async (filePath) => {
      if (!filePath) throw new Error("No downloaded file path");
      return (await import("node:fs/promises")).readFile(filePath, "utf8");
    });
    expect(content).toMatch(/Local OCR Test 123/i);

    await page.getByRole("button", { name: "Clear" }).click();
    await expect(result).toHaveCount(0);
    await expect(page.getByText("Select an image to begin.")).toBeVisible();
  });

  test("rejects an unsupported input before starting OCR", async ({ page }) => {
    await page.goto("/tools/ocr");
    await page.locator('input[type="file"]').setInputFiles({ name: "not-an-image.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") });
    await page.getByRole("button", { name: "Extract text locally" }).click();
    await expect(page.getByText("OCR supports JPG, PNG, and WebP images.")).toBeVisible();
  });

  test("keeps the OCR workspace usable at requested mobile widths", async ({ page }) => {
    for (const width of [320, 375, 390, 430]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/tools/ocr");
      await expect(page.getByRole("region", { name: "Local OCR workspace" })).toBeVisible();
      expect(await page.locator("body").evaluate((body) => body.scrollWidth <= window.innerWidth)).toBe(true);
    }
  });

  test("cancellation terminates a worker that is still loading", async ({ page }) => {
    await page.route("**/ocr/worker.min.js", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1_500));
      await route.continue();
    });
    await page.goto("/tools/ocr");
    await page.locator('input[type="file"]').setInputFiles(fixture);
    await page.getByRole("button", { name: "Extract text locally" }).click();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByText("OCR cancelled.")).toBeVisible();
    await expect(page.getByText("Completed — processed locally")).toHaveCount(0);
  });
});
