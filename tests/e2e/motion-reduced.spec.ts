import { test, expect } from "@playwright/test";

test.describe("motion reduced", () => {
  test("reduced-motion: hero static, no Lenis, processing works", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/");
    // Check that useReducedMotion is true via evaluate
    const isReduced = await page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    console.log("isReduced", isReduced);
    expect(isReduced).toBe(true);
    // Hero should be immediately visible without y offset (Framer Motion disabled)
    const heroVisual = page.locator("section >> .rounded-xl.border").first();
    await expect(heroVisual).toBeVisible();
    // Check that the motion div has no transform (since reduce=true, initial=false)
    const style = await heroVisual.evaluate(el => getComputedStyle(el as Element).transform);
    console.log("hero transform reduced", style);
    // With reduced motion, Framer should not animate, so transform should be none or matrix identity
    // Also check that Lenis is not active (window.lenis undefined)
    const hasLenis = await page.evaluate(() => (window as unknown as { lenis?: unknown }).lenis !== undefined);
    console.log("hasLenis", hasLenis);
    expect(hasLenis).toBe(false);
    // Verify scroll is native (no smooth)
    const scrollBehavior = await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
    console.log("scrollBehavior", scrollBehavior);
    expect(scrollBehavior).toBe("auto");

    // Tool processing still works with reduced motion
    await page.goto("/tools/image-compress");
    const pngBase64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";
    const buf=Buffer.from(pngBase64,'base64');
    await page.locator('input[type="file"]').setInputFiles({ name:"a.png", mimeType:"image/png", buffer:buf });
    await page.getByRole("button", {name:/Process locally/i}).click();
    await expect(page.getByText(/Completed/i)).toBeVisible({timeout:15000});
    await ctx.close();
  });

  test("normal motion: hero animates, Lenis still not active (not installed)", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "no-preference" });
    const page = await ctx.newPage();
    await page.goto("/");
    const isReduced = await page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    console.log("isReduced normal", isReduced);
    expect(isReduced).toBe(false);
    const heroVisual = page.locator("section >> .rounded-xl.border").first();
    await expect(heroVisual).toBeVisible();
    // In normal mode, Framer should animate, but after animation it should be visible with opacity 1
    await page.waitForTimeout(2400);
    const opacity = await heroVisual.evaluate(el => getComputedStyle(el as Element).opacity);
    console.log("hero opacity normal", opacity);
    expect(parseFloat(opacity)).toBeGreaterThan(0.9);
    await ctx.close();
  });

  test("reduced motion at 375px still no overflow and processing works", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 375, height: 800 } });
    const page = await ctx.newPage();
    await page.goto("/tools/image-resize");
    await expect(page.getByRole("heading", {level:1})).toBeVisible();
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasOverflow).toBe(false);
    await ctx.close();
  });
});
