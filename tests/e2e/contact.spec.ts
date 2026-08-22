import { expect, test } from "@playwright/test";

async function fillContactForm(
  page: import("@playwright/test").Page,
  input: { name: string; email: string; topic?: string; subject: string; message: string }
) {
  await page.locator("#contact-name").fill(input.name);
  await page.locator("#contact-email").fill(input.email);
  if (input.topic) await page.locator("#contact-topic").selectOption(input.topic);
  await page.locator("#contact-subject").fill(input.subject);
  await page.locator("#contact-message").fill(input.message);
  await expect(page.locator("#contact-name")).toHaveValue(input.name);
  await expect(page.locator("#contact-email")).toHaveValue(input.email);
}

test("contact form is labelled, keyboard reachable, and confirms a reference", async ({ page }) => {
  await page.route("**/api/contact", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    const body = route.request().postDataJSON() as { topic?: string; website?: string };
    expect(body.topic).toBe("billing");
    expect(body.website).toBe("");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, reference: "ZCT-E2E000001" }),
    });
  });

  await page.goto("/contact");
  await expect(page.getByLabel("Name")).toBeVisible();
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  await expect(page.getByLabel(/Account email/)).toBeVisible();
  await expect(page.getByLabel("Topic")).toBeVisible();
  await expect(page.getByLabel("Subject")).toBeVisible();
  await expect(page.getByLabel("Message")).toBeVisible();

  await fillContactForm(page, {
    name: "Jordan Example",
    email: "jordan@example.com",
    topic: "billing",
    subject: "Invoice question",
    message: "I need help locating a Dodo invoice for an existing Premium period.",
  });
  await page.getByRole("button", { name: "Send enquiry" }).click();

  await expect(page.getByRole("status")).toContainText("ZCT-E2E000001");
  await expect(page.getByRole("status")).toContainText("response-time SLA is not published");
});

test("contact form shows a generic failure without inventing a ticket", async ({ page }) => {
  await page.route("**/api/contact", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "Unable to send this enquiry." }),
    });
  });

  await page.goto("/contact");
  await fillContactForm(page, {
    name: "Jordan Example",
    email: "jordan@example.com",
    subject: "Need help",
    message: "This is a long enough message for the client form.",
  });
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByText("Unable to send this enquiry.")).toBeVisible({ timeout: 10000 });
  await expect(page.locator("body")).not.toContainText("ZCT-E2E");
});

test("contact page exposes breadcrumb structured data and no fake support claims", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/contact");
  await expect(page.locator("#contact-name")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send enquiry" })).toBeVisible();
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(hasOverflow).toBe(false);
  await expect(page.getByRole("heading", { name: "Legal identity" })).toBeVisible();
  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(jsonLd.some((text) => text.includes("BreadcrumbList") && text.includes("Contact"))).toBeTruthy();
  await expect(page.locator("body")).not.toContainText("live chat");
  await expect(page.locator("body")).not.toContainText("average response");
});
