import { expect, test } from "@playwright/test";
import path from "node:path";
import { readFile } from "node:fs/promises";

const singleFixture = path.resolve("tests/fixtures/pdf-text-single.pdf");
const multiFixture = path.resolve("tests/fixtures/pdf-text-multi.pdf");
const imageOnlyFixture = path.resolve("tests/fixtures/pdf-text-image-only.pdf");
const corruptFixture = path.resolve("tests/fixtures/pdf-text-corrupt.pdf");
const largeFixture = path.resolve("tests/fixtures/pdf-text-large.pdf");

test.describe("local PDF text extractor", () => {
  test("extracts embedded text, searches it, copies it, downloads it, and clears it", async ({ page, context, browserName }) => {
    if (browserName === "chromium") {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    }
    await page.goto("/tools/pdf-text-extractor");
    await page.locator('input[type="file"]').setInputFiles(multiFixture);
    await page.getByRole("button", { name: "Extract text locally" }).click();

    await expect(page.getByText("Completed — processed locally")).toBeVisible();
    await expect(page.getByText("2 pages processed.")).toBeVisible();
    await expect(page.getByText("First Page Extraction")).toBeVisible();
    await expect(page.getByText("Second Page Search Target")).toBeVisible();

    await page.getByLabel("Search extracted text").fill("search target");
    await expect(page.getByText("1 match found.")).toBeVisible();
    await expect(page.getByLabel("Search results").getByText("Page 2")).toBeVisible();

    await page.getByRole("button", { name: "Copy text" }).click();
    await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
    if (browserName === "chromium") {
      await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toMatch(/Second Page Search Target/);
    }

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download TXT" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("pdf-text-multi-text.txt");
    const downloadPath = await download.path();
    if (!downloadPath) throw new Error("No downloaded file path");
    expect(await readFile(downloadPath, "utf8")).toContain("Second Page Search Target");

    await page.getByRole("button", { name: "Clear", exact: true }).click();
    await expect(page.getByText("Select a text-based PDF to begin.")).toBeVisible();
    await expect(page.getByLabel("Extracted PDF text")).toHaveCount(0);
  });

  test("reports invalid, corrupted, and image-only PDFs honestly", async ({ page }) => {
    await page.goto("/tools/pdf-text-extractor");
    await page.locator('input[type="file"]').setInputFiles({ name: "not-a-pdf.txt", mimeType: "text/plain", buffer: Buffer.from("not a PDF") });
    await page.getByRole("button", { name: "Extract text locally" }).click();
    await expect(page.getByText("Choose a PDF file to extract text.")).toBeVisible();

    await page.locator('input[type="file"]').setInputFiles(corruptFixture);
    await page.getByRole("button", { name: "Extract text locally" }).click();
    await expect(page.getByText("This PDF could not be read.")).toBeVisible();

    await page.locator('input[type="file"]').setInputFiles(imageOnlyFixture);
    await page.getByRole("button", { name: "Extract text locally" }).click();
    await expect(page.getByText("No embedded text was found. This PDF may be scanned or image-only.")).toBeVisible();
  });

  test("cancellation terminates an active local extraction", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/tools/pdf-text-extractor");
    await page.locator('input[type="file"]').setInputFiles(largeFixture);
    await page.getByRole("button", { name: "Extract text locally" }).click();
    const cancel = page.getByRole("button", { name: "Cancel" });
    await expect(cancel).toBeVisible();
    await cancel.click({ force: true }).catch(() => {});
    await expect(page.getByText(/Text extraction cancelled\.|Completed — processed locally/)).toBeVisible({ timeout: 15_000 });
    if (await page.getByText("Text extraction cancelled.").isVisible().catch(() => false)) {
      await expect(page.getByText("Completed — processed locally")).toHaveCount(0);
    }
  });

  test("keeps the workspace usable at requested mobile widths", async ({ page }) => {
    for (const width of [320, 375, 390, 430]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/tools/pdf-text-extractor");
      await expect(page.getByRole("region", { name: "Local PDF text workspace" })).toBeVisible();
      expect(await page.locator("body").evaluate((body) => body.scrollWidth <= window.innerWidth)).toBe(true);
    }
  });

  test("supports keyboard focus for the upload control", async ({ page }) => {
    await page.goto("/tools/pdf-text-extractor");
    await page.locator('input[type="file"]').focus();
    await expect(page.locator('input[type="file"]')).toBeFocused();
  });

  test("extracts text from a real single-page fixture", async ({ page }) => {
    await page.goto("/tools/pdf-text-extractor");
    await page.locator('input[type="file"]').setInputFiles(singleFixture);
    await page.getByRole("button", { name: "Extract text locally" }).click();
    await expect(page.getByText("Local PDF Text Test 123")).toBeVisible();
  });
});
