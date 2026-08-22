import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test.describe("a11y", () => {
    const pages = [
    "/",
    "/tools",
    "/pricing",
    "/faq",
    "/help",
    "/privacy",
    "/terms",
    "/refund-and-cancellation",
    "/security",
    "/contact",
    "/about",
    "/signin",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/account",
    "/this-page-does-not-exist-12h7",
    "/how-it-works",
    "/guides/local-processing",
    "/guides/merge-pdf-without-uploading",
    "/guides/jpg-vs-png-vs-webp",
    "/guides/browser-ocr-without-uploading",
    "/guides/compress-pdf-without-uploading",
    "/guides/split-pdf-without-uploading",
    "/guides/remove-exif-before-sharing",
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
    const fileInput = page.getByLabel("Select files");
    await expect(fileInput).toBeAttached();
    await expect(fileInput).not.toHaveAttribute("aria-hidden", "true");
    await fileInput.focus();
    await expect(fileInput).toBeFocused();
    await expect(page.getByLabel("Quality")).toBeVisible();
    await page.goto("/tools/image-resize");
    await expect(page.getByLabel("Width")).toBeVisible();
    await expect(page.getByLabel("Height")).toBeVisible();
    await page.goto("/pricing");
    await expect(page.getByRole("group", { name: "Billing period" })).toBeVisible();
    await page.goto("/faq");
    await expect(page.getByRole("button", { name: "Does ZANCTA upload my files?" })).toBeVisible();
    await page.goto("/tools/ocr");
    await expect(page.getByLabel("OCR language")).toBeVisible();
    await page.getByLabel("OCR language").focus();
    await expect(page.getByLabel("OCR language")).toBeFocused();
    await page.goto("/signin");
    await expect(page.getByLabel("Email")).toBeVisible();
    await page.keyboard.press("Tab");
    await page.goto("/contact");
    await expect(page.getByLabel("Name")).toBeVisible();
    await page.getByLabel("Name").focus();
    await expect(page.getByLabel("Name")).toBeFocused();
    await expect(page.getByLabel("Message")).toBeVisible();
  });
});
