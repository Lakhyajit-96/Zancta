import { test, expect } from "@playwright/test";
test("homepage loads with correct heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Your files stay local/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Explore tools/i }).first()).toBeVisible();
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
