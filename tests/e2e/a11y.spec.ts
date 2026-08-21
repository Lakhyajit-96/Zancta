import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test.describe("a11y", () => {
  const pages = [
    "/",
    "/tools",
    "/tools/pdf-merge",
    "/tools/pdf-split",
    "/tools/pdf-compress",
    "/tools/pdf-to-images",
    "/tools/images-to-pdf",
    "/tools/image-compress",
    "/tools/image-convert",
    "/tools/image-resize",
    "/tools/exif-cleaner",
    "/tools/ocr",
    "/tools/pdf-text-extractor",
    "/tools/background-remover",
  ];
  for (const p of pages) {
    test(`axe ${p} — no serious violations`, async ({ page }) => {
      await page.goto(p);
      // Allow hero Framer Motion (0.5s) to settle before contrast check
      await page.waitForTimeout(700);
      const results = await new AxeBuilder({ page }).exclude("#__next-route-announcer__").analyze();
      // Filter only serious/critical
      const serious = results.violations.filter(v => ["serious","critical"].includes(v.impact||""));
      console.log(`${p}: ${results.violations.length} violations, ${serious.length} serious`);
      for (const v of serious) console.log(`- ${v.id}: ${v.description}`);
      expect(serious.length).toBe(0);
    });
  }
  test("keyboard focus and labels", async ({ page }) => {
    await page.goto("/tools/image-compress");
    await page.keyboard.press("Tab");
    await expect(page.locator('input[type="file"]')).toBeAttached();
    // Check aria labels
    await expect(page.getByLabel("Quality")).toBeVisible();
    await page.goto("/tools/image-resize");
    await expect(page.getByLabel("Width")).toBeVisible();
    await expect(page.getByLabel("Height")).toBeVisible();
  });
});
