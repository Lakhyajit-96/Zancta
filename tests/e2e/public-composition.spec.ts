import { expect, test } from "@playwright/test";

test("FAQ accordion is keyboard-accessible and reveals a real answer", async ({ page }) => {
  await page.goto("/faq");

  const firstQuestion = page.getByRole("button", { name: "Does ZANCTA upload my files?" });
  await expect(firstQuestion).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText(/selected file bytes are processed in the browser/i)).toBeVisible();

  const secondQuestion = page.getByRole("button", { name: "Where does processing happen?" });
  await secondQuestion.focus();
  await page.keyboard.press("Enter");
  await expect(secondQuestion).toHaveAttribute("aria-expanded", "true");
  await expect(firstQuestion).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByText(/Supported PDF, image, OCR, and PDF text-extraction workflows run in the browser/i)).toBeVisible();
});

test("public editorial pages use the viewport without horizontal overflow", async ({ browser }) => {
  test.setTimeout(180000);
    for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920]) {
    const context = await browser.newContext({ viewport: { width, height: 1080 } });
    const page = await context.newPage();

    for (const route of ["/about", "/faq", "/help", "/privacy", "/terms", "/refund-and-cancellation", "/security", "/contact", "/", "/tools", "/pricing", "/how-it-works"]) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    }

    await context.close();
  }
});
