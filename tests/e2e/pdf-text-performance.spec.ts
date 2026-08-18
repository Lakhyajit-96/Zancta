import { expect, test } from "@playwright/test";
import path from "node:path";

const fixtures = [
  ["small", "pdf-text-single.pdf", "Local PDF Text Test 123"],
  ["medium", "pdf-text-medium.pdf", "Medium local PDF text page 20"],
  ["large", "pdf-text-large.pdf", "Large local PDF text page 80"],
] as const;

test.describe("local PDF text extraction performance baseline", () => {
  test.setTimeout(60_000);

  for (const [label, fileName, expectedText] of fixtures) {
    test(`${label} text-native PDF completes in a browser worker`, async ({ page }) => {
      await page.goto("/tools/pdf-text-extractor");
      const startedAt = performance.now();
      await page.locator('input[type="file"]').setInputFiles(path.resolve("tests/fixtures", fileName));
      await page.getByRole("button", { name: "Extract text locally" }).click();
      await expect(page.getByText(expectedText)).toBeVisible({ timeout: 45_000 });
      const duration = Math.round(performance.now() - startedAt);
      const outputSize = await page.getByLabel("Extracted PDF text").innerText();
      console.log(`PDF_TEXT_BENCHMARK ${label} duration_ms=${duration} output_chars=${outputSize.length}`);
    });
  }
});
