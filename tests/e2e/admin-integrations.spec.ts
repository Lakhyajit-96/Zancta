import { test, expect } from "@playwright/test";
import pg from "pg";
import { TEST_DATABASE_URL } from "../postgres-url";

function uniqueIp() {
  return `10.${1 + (Date.now() % 250)}.${1 + Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}`;
}

async function signupVerifySignin(page: import("@playwright/test").Page, request: import("@playwright/test").APIRequestContext) {
  const password = "Test12345!";
  const email = `admin-int-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
  const signup = await request.post("/api/auth/signup", {
    headers: { "x-forwarded-for": uniqueIp() },
    data: { email, password, name: "Integrations User" },
  });
  const body = await signup.json().catch(() => ({ devToken: "" }));
  let token = body.devToken || "";
  if (!token) {
    const tokens = await request.get(`/api/dev/verification-tokens?email=${email}`);
    const j = await tokens.json().catch(() => ({ tokens: [] }));
    token = j.tokens?.[0]?.token || "";
  }
  expect(token.length).toBeGreaterThan(0);
  await page.goto(`/verify-email?token=${token}`);
  await expect(page.getByText(/verified/i)).toBeVisible({ timeout: 10_000 });
  await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
  await page.goto("/signin");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.locator("form").evaluate((form) => (form as HTMLFormElement).requestSubmit());
  await expect(page).toHaveURL(/\/account/, { timeout: 25_000 });
  return email;
}

async function setPlan(email: string, plan: "FREE" | "ADMIN") {
  if (!TEST_DATABASE_URL.includes("127.0.0.1:54329")) {
    throw new Error("Refusing to change entitlements outside the local test database");
  }
  const client = new pg.Client({ connectionString: TEST_DATABASE_URL });
  await client.connect();
  try {
    const updated = await client.query(
      'UPDATE "Entitlement" SET plan = $1, status = $2, "updatedAt" = NOW() WHERE "userId" = (SELECT id FROM "User" WHERE email = $3)',
      [plan, "ACTIVE", email],
    );
    expect(updated.rowCount).toBe(1);
  } finally {
    await client.end();
  }
}

test.describe("operator integrations authorization", () => {
  test("unauthenticated visitor is sent to sign-in", async ({ request }) => {
    const pageRes = await request.get("/admin/integrations", { maxRedirects: 0 });
    expect(pageRes.status()).toBeGreaterThanOrEqual(300);
    expect(pageRes.status()).toBeLessThan(400);
    expect(pageRes.headers()["location"] || "").toMatch(/signin/i);

    const connect = await request.get("/api/admin/integrations/google/connect", { maxRedirects: 0 });
    expect(connect.status()).toBeGreaterThanOrEqual(300);
    expect(connect.headers()["location"] || "").toMatch(/signin/i);
  });

  test("signed-in free user cannot open the dashboard or start OAuth", async ({ page, request }) => {
    await signupVerifySignin(page, request);
    await page.goto("/admin/integrations");
    await expect(page).toHaveURL(/\/account/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Operator integrations" })).toHaveCount(0);

    const google = await page.request.get("/api/admin/integrations/google/connect", { maxRedirects: 0 });
    expect(google.headers()["location"] || google.url()).toMatch(/account/i);
    const bing = await page.request.get("/api/admin/integrations/bing/connect", { maxRedirects: 0 });
    expect(bing.headers()["location"] || bing.url()).toMatch(/account/i);
  });

  test("authorized ADMIN opens the dashboard and can start provider OAuth", async ({ page, request }) => {
    const email = await signupVerifySignin(page, request);
    await setPlan(email, "ADMIN");
    await page.goto("/admin/integrations");
    await expect(page).toHaveURL(/\/admin\/integrations/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Operator integrations" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Google Search Console" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Google Analytics 4" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Bing Webmaster" })).toBeVisible();

    const google = await page.request.get("/api/admin/integrations/google/connect", { maxRedirects: 0 });
    const googleLocation = google.headers()["location"] || google.url();
    expect(googleLocation).not.toMatch(/\/signin/i);
    expect(googleLocation).not.toMatch(/\/account$/);
    expect(googleLocation).toMatch(/accounts\.google\.com|google-not-configured|admin\/integrations/i);

    const bing = await page.request.get("/api/admin/integrations/bing/connect", { maxRedirects: 0 });
    const bingLocation = bing.headers()["location"] || bing.url();
    expect(bingLocation).not.toMatch(/\/signin/i);
    expect(bingLocation).not.toMatch(/\/account$/);
    expect(bingLocation).toMatch(/bing\.com|live\.com|microsoftonline|bing-not-configured|admin\/integrations/i);
  });
});
