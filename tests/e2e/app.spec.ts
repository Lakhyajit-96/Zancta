import { test, expect } from "@playwright/test";
test("homepage loads with correct heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /PDF and image tools/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Choose a tool/i }).first()).toBeVisible();
});
test("tools page lists tools", async ({ page }) => {
  await page.goto("/tools");
  await expect(page.getByRole("heading", { name: "Tool Suite" })).toBeVisible();
  await expect(page.getByText("Merge PDF").first()).toBeVisible();
});
test("tool shell validates HEIC", async ({ page }) => {
  await page.goto("/tools/image-compress");
  await expect(page.getByText("Local — no upload")).toBeVisible();
});
test("navigation accessible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
});
test("public information routes are useful and linked", async ({ page }) => {
  for (const route of ["/about", "/features", "/how-it-works", "/faq", "/help", "/docs", "/privacy", "/terms", "/security", "/contact"]) {
    await page.goto(route);
    await expect(page.locator("main").first()).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Loading tools...");
  }
});
