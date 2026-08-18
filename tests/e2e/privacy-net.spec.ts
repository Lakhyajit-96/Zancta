import { expect, test } from "@playwright/test";
import path from "node:path";

const fixture = path.resolve("tests/fixtures/local-ocr-test-123.png");

test("privacy — local OCR makes no document upload or third-party request", async ({ page }) => {
  test.setTimeout(90_000);
  const requests: { url: string; method: string; postData: string | null }[] = [];

  page.on("request", (request) => {
    requests.push({ url: request.url(), method: request.method(), postData: request.postData() });
  });

  await page.goto("/tools/ocr");
  const appOrigin = new URL(page.url()).origin;
  await page.locator('input[type="file"]').setInputFiles(fixture);
  await page.getByRole("button", { name: "Extract text locally" }).click();
  await expect(page.getByLabel("Extracted OCR text")).toHaveValue(/Local OCR Test 123/i, { timeout: 75_000 });

  const processingRequests = requests.filter((request) => request.url.startsWith(appOrigin));
  // Tesseract creates its internal worker from a browser-local blob URL. It is not a network origin.
  const externalRequests = requests.filter((request) => !request.url.startsWith(appOrigin) && !request.url.startsWith("blob:"));
  const unsafeMethods = processingRequests.filter((request) => !["GET", "HEAD"].includes(request.method));
  const documentText = "Local OCR Test 123";

  expect(externalRequests).toEqual([]);
  expect(unsafeMethods).toEqual([]);
  expect(requests.some((request) => request.postData?.includes(documentText))).toBe(false);
  expect(processingRequests.some((request) => request.url.includes("/ocr/worker.min.js"))).toBe(true);
  expect(processingRequests.some((request) => request.url.includes("/ocr/eng.traineddata.gz"))).toBe(true);
});
