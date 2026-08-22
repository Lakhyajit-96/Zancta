import { expect, test } from "@playwright/test";
import path from "node:path";

const scanned1 = path.resolve("tests/fixtures/ocr-scanned-1.pdf");
const scanned5 = path.resolve("tests/fixtures/ocr-scanned-5.pdf");
const scanned21 = path.resolve("tests/fixtures/ocr-scanned-21.pdf");
const embedded = path.resolve("tests/fixtures/ocr-embedded-text.pdf");

async function mockPremium(page: import("@playwright/test").Page) {
  await page.route("**/api/ocr/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        premium: true,
        languages: [
          { code: "eng", name: "English", premium: false },
          { code: "hin", name: "Hindi", premium: true },
        ],
      }),
    });
  });
}

test.describe("scanned PDF OCR", () => {
  test.setTimeout(180_000);

  test("free users are gated before scanned PDF OCR starts", async ({ page }) => {
    await page.goto("/tools/ocr");
    await page.locator('input[type="file"]').setInputFiles(scanned1);
    await page.getByRole("button", { name: "Extract text locally" }).click();
    await expect(page.getByText(/Scanned PDF OCR is a Premium capability/i)).toBeVisible();
    await expect(page.getByLabel("Extracted OCR text")).toHaveCount(0);
  });

  test("unauthenticated premium language packs are not public", async ({ request }) => {
    const hin = await request.get("/api/ocr/lang/hin.traineddata.gz");
    expect(hin.status()).toBe(401);
    expect(hin.headers()["access-control-allow-origin"] ?? "").not.toMatch(/\*/);
    const queryToken = await request.get("/api/ocr/lang/hin.traineddata.gz?token=not-a-secret");
    expect(queryToken.status()).toBe(401);
    const nested = await request.get("/api/ocr/lang/foo/hin.traineddata.gz");
    expect(nested.status()).toBe(404);
    const traversal = await request.get("/api/ocr/lang/../eng.traineddata.gz");
    expect([400, 404]).toContain(traversal.status());
  });

  test("embedded-text PDFs skip OCR and scanned pages extract locally", async ({ page }) => {
    await mockPremium(page);
    await page.goto("/tools/ocr");
    await page.locator('input[type="file"]').setInputFiles(embedded);
    await page.getByRole("button", { name: "Extract text locally" }).click();
    await expect(page.getByText(/already contains embedded text/i)).toBeVisible({ timeout: 60_000 });
    await expect(page.getByLabel("Extracted OCR text")).toHaveValue(/ZANCTA embedded text fixture/i);

    await page.getByRole("button", { name: "Clear" }).click();
    await page.locator('input[type="file"]').setInputFiles(scanned1);
    await page.getByRole("button", { name: "Extract text locally" }).click();
    await expect(page.getByLabel("Extracted OCR text")).toHaveValue(/ZANCTA OCR TEST/i, { timeout: 120_000 });
    await expect(page.getByLabel("Extracted OCR text")).toHaveValue(/Page 01/i);
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download text" }).click();
    expect((await download).suggestedFilename()).toBe("scanned-ocr.txt");
  });

  test("5-page scanned PDF produces ZIP and can be cancelled", async ({ page }) => {
    await mockPremium(page);
    await page.goto("/tools/ocr");
    await page.locator('input[type="file"]').setInputFiles(scanned5);
    await page.getByRole("button", { name: "Extract text locally" }).click();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByText(/OCR cancelled/i)).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "Extract text locally" }).click();
    await expect(page.getByLabel("Extracted OCR text")).toHaveValue(/Page 05/i, { timeout: 180_000 });
    await expect(page.getByRole("button", { name: "Download ZIP" })).toBeVisible();
  });

  test("repeated 1-page OCR cycles still complete", async ({ page }) => {
    await mockPremium(page);
    await page.goto("/tools/ocr");
    for (let cycle = 0; cycle < 3; cycle += 1) {
      await page.locator('input[type="file"]').setInputFiles(scanned1);
      await page.getByRole("button", { name: "Extract text locally" }).click();
      await expect(page.getByLabel("Extracted OCR text")).toHaveValue(/ZANCTA OCR TEST/i, { timeout: 120_000 });
      await page.getByRole("button", { name: "Clear" }).click();
    }
  });

  test("21-page scanned PDFs are rejected before OCR", async ({ page }) => {
    await mockPremium(page);
    await page.goto("/tools/ocr");
    await page.locator('input[type="file"]').setInputFiles(scanned21);
    await page.getByRole("button", { name: "Extract text locally" }).click();
    await expect(page.getByText(/limited to 20 pages/i)).toBeVisible({ timeout: 30_000 });
  });
});
