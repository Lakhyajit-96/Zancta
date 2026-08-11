import { test, expect } from "@playwright/test";
test("privacy — no image upload", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", r => {
    if (r.method() === "POST" || r.method() === "PUT") requests.push(`${r.method()} ${r.url()} ${r.resourceType()}`);
  });
  await page.goto("/tools/image-compress");
  const pngBase64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";
  const buf=Buffer.from(pngBase64,'base64');
  await page.locator('input[type="file"]').setInputFiles({ name:"a.png", mimeType:"image/png", buffer:buf });
  await page.getByRole("button", {name:/Process locally/i}).click();
  await expect(page.getByText(/Completed/i)).toBeVisible({timeout:15000});
  const externalPosts = requests.filter(r => !r.includes("localhost"));
  console.log("POST requests:", requests);
  expect(externalPosts.length).toBe(0);
  const analytics = await page.evaluate(() => {
    return (window as unknown as { _lastGtag?: unknown })._lastGtag ?? null;
  });
  console.log("analytics:", analytics);
});
