import { test, expect } from "@playwright/test";
test("visual qa — homepage and tools", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", {name:/Powerful file tools/i})).toBeVisible();
  await page.screenshot({ path: "test-screenshots/home.png", fullPage: true });
  console.log("home screenshot ok");
  await page.goto("/tools");
  await expect(page.getByRole("heading", {name:"Tool Suite"})).toBeVisible();
  await page.screenshot({ path: "test-screenshots/tools.png", fullPage: true });
  console.log("tools screenshot ok");
  for (const slug of ["image-compress","image-convert","image-resize","exif-cleaner"]) {
    await page.goto(`/tools/${slug}`);
    await expect(page.getByRole("heading",{level:1})).toBeVisible();
    await page.screenshot({ path: `test-screenshots/${slug}-qa.png`, fullPage: true });
    console.log(`${slug} qa screenshot ok`);
  }
});
