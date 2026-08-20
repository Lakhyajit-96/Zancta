import { test, expect } from "@playwright/test";

test.describe("Auth — real flows", () => {
  const password = "Test12345!";

  test("signup → verify → signin → account → delete", async ({ page, request }) => {
    const email = `test-${Date.now()}-${Math.random().toString(36).slice(2,6)}@example.com`;
    // Signup via API to capture devToken reliably
    const resSignup = await request.post("/api/auth/signup", { data: { email, password, name: "Test User" } });
    const jSignup = await resSignup.json().catch(()=>({ error: "no json", status: resSignup.status() }));
    // Debug: log if no devToken
    if (!jSignup.devToken) console.log("Signup response", resSignup.status(), JSON.stringify(jSignup).slice(0,500));
    let devToken = jSignup.devToken || "";
    if (!devToken) {
      const res2 = await request.get(`/api/dev/verification-tokens?email=${email}`);
      const j2 = await res2.json().catch(()=>({ error: "no json2", status: res2.status() }));
      if (!j2.tokens) console.log("Tokens response", res2.status(), JSON.stringify(j2).slice(0,500));
      if (j2.tokens?.length) devToken = j2.tokens[0].token;
    }
    expect(devToken.length).toBeGreaterThan(0);
    const token = devToken;
    // Also verify UI shows success
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /Create account/i })).toBeVisible();

    // Verify
    await page.goto(`/verify-email?token=${token}`);
    await expect(page.getByText(/verified/i)).toBeVisible({ timeout: 10000 });

    // Signin
    await page.goto("/signin");
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.getByRole("button", { name: /Sign in/i }).click();
    await page.waitForURL(/\/account/, { timeout: 10000 });
    await expect(page.getByText(email)).toBeVisible();

    // Account shows entitlement
    await expect(page.getByText(/FREE/i)).toBeVisible();

    // Delete
    await page.fill('input[placeholder="Type DELETE"]', "DELETE");
    await page.getByRole("button", { name: /Delete account/i }).click();
    await page.waitForURL(/\//, { timeout: 10000 });
  });

  test("unknown credentials sign-in stays on sign-in and does not open an account", async ({ page }) => {
    await page.goto("/signin");
    await page.fill("#email", `nobody-${Date.now()}@example.com`);
    await page.fill("#password", "Test12345!");
    await page.getByRole("button", { name: /^Sign in$/i }).click();
    await expect(page.getByRole("alert").filter({ hasText: /Invalid email or password/i })).toBeVisible();
    await expect(page).toHaveURL(/\/signin/);
  });

  test("deleted credentials account cannot be used to sign in", async ({ page, request }) => {
    const email = `gone-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
    const signup = await request.post("/api/auth/signup", { data: { email, password, name: "Gone" } });
    const body = await signup.json();
    let token = body.devToken || "";
    if (!token) {
      const tokens = await request.get(`/api/dev/verification-tokens?email=${email}`);
      const j = await tokens.json();
      token = j.tokens?.[0]?.token || "";
    }
    expect(token.length).toBeGreaterThan(0);
    await page.goto(`/verify-email?token=${token}`);
    await expect(page.getByText(/verified/i)).toBeVisible({ timeout: 10000 });
    await page.goto("/signin");
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.getByRole("button", { name: /^Sign in$/i }).click();
    await page.waitForURL(/\/account/, { timeout: 10000 });
    await page.fill('input[placeholder="Type DELETE"]', "DELETE");
    await page.getByRole("button", { name: /Delete account/i }).click();
    await page.waitForURL(/\//, { timeout: 10000 });
    const accountRes = await page.request.get("/account");
    expect(accountRes.url()).toMatch(/signin/);
    await page.goto("/signin");
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.getByRole("button", { name: /^Sign in$/i }).click();
    await expect(page.getByRole("alert").filter({ hasText: /Invalid email or password/i })).toBeVisible();
    await expect(page).toHaveURL(/\/signin/);
  });

  test("anonymous tools still work (no upload)", async ({ page }) => {
    const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";
    const png = Buffer.from(pngBase64, "base64");
    await page.goto("/tools/image-compress");
    await page.locator('input[type="file"]').setInputFiles({ name: "a.png", mimeType: "image/png", buffer: png });
    await page.getByRole("button", { name: /Process locally/i }).click();
    await expect(page.getByText(/Completed/i)).toBeVisible({ timeout: 15000 });
  });

  test("invalid credentials show error, no enumeration", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.fill("#email", "nonexistent@example.com");
    await page.getByRole("button", { name: /Send reset link/i }).click();
    await expect(page.getByText(/If that email exists/i)).toBeVisible({ timeout: 10000 });
  });
});
