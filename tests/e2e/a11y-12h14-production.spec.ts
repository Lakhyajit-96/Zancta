import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pages = [
  "/",
  "/tools",
  "/pricing",
  "/guides/local-processing",
  "/guides/merge-pdf-without-uploading",
  "/guides/jpg-vs-png-vs-webp",
  "/guides/browser-ocr-without-uploading",
  "/guides/compress-pdf-without-uploading",
  "/guides/split-pdf-without-uploading",
  "/guides/remove-exif-before-sharing",
];

test.describe("production a11y 12H-14", () => {
  for (const path of pages) {
    test(`axe ${path}`, async ({ page }) => {
      await page.goto(`https://zancta.tech${path}`);
      await page.waitForTimeout(700);
      const results = await new AxeBuilder({ page }).exclude("#__next-route-announcer__").analyze();
      const serious = results.violations.filter((v) => ["serious", "critical"].includes(v.impact || ""));
      console.log(JSON.stringify({ path, total: results.violations.length, serious: serious.length, ids: serious.map((v) => v.id) }));
      expect(serious.length).toBe(0);
    });
  }
});
