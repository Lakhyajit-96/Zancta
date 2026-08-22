import { expect, test } from "@playwright/test";
import path from "node:path";

const scanned1 = path.resolve("tests/fixtures/ocr-scanned-1.pdf");
const scanned10 = path.resolve("tests/fixtures/ocr-scanned-10.pdf");
const scanned20 = path.resolve("tests/fixtures/ocr-scanned-20.pdf");

async function mockPremium(page: import("@playwright/test").Page) {
  await page.route("**/api/ocr/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ premium: true, languages: [{ code: "eng", name: "English", premium: false }] }),
    });
  });
}

async function measure(page: import("@playwright/test").Page, file: string, label: string) {
  await mockPremium(page);
  await page.goto("/tools/ocr");
  const t0 = Date.now();
  await page.locator('input[type="file"]').setInputFiles(file);
  await page.getByRole("button", { name: "Extract text locally" }).click();
  await expect(page.getByLabel("Extracted OCR text")).toHaveValue(/ZANCTA OCR TEST/i, { timeout: 420_000 });
  const ms = Date.now() - t0;
  const memory = await page.evaluate(() => {
    const mem = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
    return mem ? Math.round(mem.usedJSHeapSize / 1048576) : null;
  });
  console.log(JSON.stringify({ label, browser: test.info().project.name, ms, heapMB: memory }));
  return ms;
}

test.describe("scanned PDF OCR performance", () => {
  test.describe.configure({ mode: "serial" });

  test("1-page scanned PDF", async ({ page }) => {
    test.setTimeout(120_000);
    const ms = await measure(page, scanned1, "ocr-scanned-1");
    expect(ms).toBeGreaterThan(100);
  });

  test("10-page scanned PDF", async ({ page }) => {
    test.skip(test.info().project.name !== "chromium", "10-page timing is collected on Chromium; other engines: NOT MEASURED in this run");
    test.setTimeout(300_000);
    const ms = await measure(page, scanned10, "ocr-scanned-10");
    expect(ms).toBeGreaterThan(100);
  });

  test("20-page scanned PDF", async ({ page }) => {
    test.skip(test.info().project.name !== "chromium", "20-page timing is collected on Chromium; other engines: NOT MEASURED in this run");
    test.setTimeout(420_000);
    const ms = await measure(page, scanned20, "ocr-scanned-20");
    expect(ms).toBeGreaterThan(100);
  });
});
