import { test, expect } from "@playwright/test";

function uniqueIp() {
  return `10.${1 + (Date.now() % 250)}.${1 + Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}`;
}

test.describe("API authorization and session security", () => {
  test("unauthenticated billing and account APIs return 401", async ({ request }) => {
    const checkout = await request.post("/api/payments/checkout", {
      data: { planId: "PREMIUM_MONTHLY", userId: "someone-else" },
    });
    expect(checkout.status()).toBe(401);

    const cancel = await request.post("/api/payments/cancel", {
      data: { confirm: true, userId: "someone-else" },
    });
    expect(cancel.status()).toBe(401);

    const status = await request.get("/api/payments/status");
    expect(status.status()).toBe(401);

    const del = await request.post("/api/account/delete", {
      data: { confirm: "DELETE", userId: "someone-else" },
    });
    expect(del.status()).toBe(401);
  });

  test("unsigned Dodo webhook is rejected", async ({ request }) => {
    const res = await request.post("/api/payments/webhooks/dodo", {
      data: { event_type: "subscription.active", data: { subscription_id: "sub_fake" } },
    });
    expect([401, 429]).toContain(res.status());
    const body = await res.json();
    expect(JSON.stringify(body)).not.toMatch(/PREMIUM/i);
  });

  test("callbackUrl open redirect stays on-origin after a real sign-in", async ({ page, request }) => {
    const password = "Test12345!";
    const email = `redir-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
    const signup = await request.post("/api/auth/signup", {
      headers: { "x-forwarded-for": uniqueIp() },
      data: { email, password, name: "Redirect" },
    });
    const body = await signup.json();
    expect(body.devToken?.length).toBeGreaterThan(0);
    await request.post("/api/auth/verify-email", {
      headers: { "x-forwarded-for": uniqueIp() },
      data: { token: body.devToken },
    });
    await page.goto("/signin?callbackUrl=https://evil.example/phish");
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.getByRole("button", { name: /^Sign in$/i }).click();
    await page.waitForURL(/\/account/, { timeout: 15_000 });
    expect(page.url()).not.toMatch(/evil\.example/);
    expect(new URL(page.url()).pathname).toBe("/account");
  });

  test("security headers are present", async ({ request }) => {
    const res = await request.get("/");
    const csp = res.headers()["content-security-policy"] || "";
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(res.headers()["x-content-type-options"]).toBe("nosniff");
    expect(res.headers()["x-frame-options"]).toBe("DENY");
    expect(res.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(res.headers()["strict-transport-security"]).toMatch(/max-age=/);
  });

  test("password reset invalidates other sessions", async ({ browser, request }) => {
    test.setTimeout(60_000);
    const password = "OldPass12345!";
    const nextPassword = "NewPass12345!";
    const email = `reset-sess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;

    const signup = await request.post("/api/auth/signup", {
      headers: { "x-forwarded-for": uniqueIp() },
      data: { email, password, name: "Reset Sess" },
    });
    const signupBody = await signup.json();
    const verifyToken = signupBody.devToken as string;
    expect(verifyToken?.length).toBeGreaterThan(0);
    const verified = await request.post("/api/auth/verify-email", {
      headers: { "x-forwarded-for": uniqueIp() },
      data: { token: verifyToken },
    });
    expect(verified.ok()).toBeTruthy();

    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    for (const page of [pageA, pageB]) {
      await page.goto("/signin");
      await page.fill("#email", email);
      await page.fill("#password", password);
      await page.getByRole("button", { name: /^Sign in$/i }).click();
      await page.waitForURL(/\/account/, { timeout: 20_000, waitUntil: "commit" });
    }

    const forgot = await request.post("/api/auth/forgot-password", {
      headers: { "x-forwarded-for": uniqueIp() },
      data: { email },
    });
    const forgotBody = await forgot.json();
    const resetToken = forgotBody.devToken as string;
    expect(resetToken?.length).toBeGreaterThan(0);

    const reset = await request.post("/api/auth/reset-password", {
      headers: { "x-forwarded-for": uniqueIp() },
      data: { token: resetToken, password: nextPassword },
    });
    expect(reset.ok()).toBeTruthy();

    await pageA.goto("/account");
    await expect(pageA).toHaveURL(/\/signin/, { timeout: 15_000 });
    await pageB.goto("/account");
    await expect(pageB).toHaveURL(/\/signin/, { timeout: 15_000 });

    await pageA.fill("#email", email);
    await pageA.fill("#password", nextPassword);
    await pageA.getByRole("button", { name: /^Sign in$/i }).click();
    await pageA.waitForURL(/\/account/, { timeout: 15_000 });
    await expect(pageA.getByText(email)).toBeVisible();

    await ctxA.close();
    await ctxB.close();
  });
});
