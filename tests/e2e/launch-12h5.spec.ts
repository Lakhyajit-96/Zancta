import { expect, test } from "@playwright/test";

test("P0/P1 launch contract", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /PDF and image tools/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Merge PDF" }).first()).toBeVisible();
  await expect(page.getByText(/Free to use, with no account/i)).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Always private.");
  await expect(page.locator("body")).not.toContainText("Your files never leave your device");

  const primary = page.getByRole("navigation", { name: "Primary" }).first();
  await expect(primary.getByRole("link", { name: "Tools" })).toBeVisible();
  await expect(primary.getByRole("link", { name: "Pricing" })).toBeVisible();
  await expect(primary.getByRole("link", { name: "Help" })).toBeVisible();
  await expect(primary.getByRole("link", { name: "Features" })).toHaveCount(0);
  await expect(primary.getByRole("link", { name: "Docs" })).toHaveCount(0);

  await page.goto("/tools/image-convert");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("JPG");
  await expect(page.getByRole("heading", { level: 1 })).not.toContainText("any format");

  await page.goto("/tools/pdf-merge");
  await expect(page.locator("main")).not.toContainText("HEIC");
  const fileInput = page.getByLabel("Select files");
  await expect(fileInput).toBeAttached();
  await expect(fileInput).not.toHaveAttribute("aria-hidden", "true");
  await fileInput.focus();
  await expect(fileInput).toBeFocused();

  await page.goto("/tools/exif-cleaner");
  await expect(page.getByRole("link", { name: "EXIF Cleaner" })).toHaveCount(0);

  await page.goto("/pricing");
  await expect(page.getByText("₹0")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Best value");
  await expect(page.locator("body")).not.toContainText("$0");
  await expect(page.getByRole("heading", { name: /Premium is optional support/i })).toBeVisible();

    await page.goto("/contact");
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots || "").not.toMatch(/noindex/i);
    await expect(page.getByRole("heading", { name: "Contact ZANCTA" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Send an enquiry" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Send enquiry" })).toBeVisible();
    await expect(page.getByRole("link", { name: "support@zancta.tech" }).first()).toBeVisible();
    await expect(page.locator("main header")).not.toContainText("Lakhyajit Changmai");
    await expect(page.getByRole("heading", { name: "Legal identity" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Contact channels" })).toBeVisible();
    await expect(page.locator("main header")).toContainText("Independently operated PDF and image software");
    await expect(page.locator("body")).not.toContainText("not legal advice");
    await expect(page.locator("body")).not.toContainText("24/7");
    await expect(page.locator("body")).not.toContainText("live chat");

  await page.goto("/refund-and-cancellation");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Refunds and cancellation/i);
  await expect(page.getByRole("link", { name: "Account" }).first()).toBeVisible();

  await page.goto("/faq");
  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(jsonLd.some((text) => text.includes("FAQPage"))).toBeTruthy();

  await page.goto("/tools");
  const toolsDesc = await page.locator('meta[name="description"]').getAttribute("content");
  expect(toolsDesc || "").toMatch(/Eleven local PDF and image tools/i);

  await page.goto("/features");
  await expect(page).toHaveURL(/\/tools/);
  await page.goto("/docs");
  await expect(page).toHaveURL(/\/help/);
});

test("homepage primary conversion is using a tool", async ({ page }) => {
  await page.goto("/");
  const closer = page.getByRole("link", { name: /Open a tool/i }).last();
  await expect(closer).toBeVisible();
  const pricing = page.getByRole("link", { name: /See pricing/i });
  await expect(pricing).toBeVisible();
});

test("consent region is named when analytics is configured", async ({ page }) => {
  await page.goto("/");
  const banner = page.getByRole("region", { name: "Optional analytics" });
  if (await banner.count()) {
    await expect(banner).toBeVisible();
    await expect(banner.getByRole("button", { name: "Essential only" })).toBeVisible();
  }
});
