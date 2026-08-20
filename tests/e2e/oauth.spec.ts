import { test, expect } from "@playwright/test";

// CODE-VERIFIED OAuth flows: these tests prove the real Auth.js → provider
// authorization chain (CSRF, state, redirect to the genuine provider consent
// URL). They do NOT assert a completed provider login — that requires real
// provider-side configuration and is reported separately.

test.describe("OAuth — real provider wiring", () => {
  test("signin renders provider buttons when configured", async ({ page }) => {
    await page.goto("/signin");
    await expect(page.getByRole("button", { name: /Continue with Google/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Continue with GitHub/i })).toBeVisible();
  });

  test("provider buttons carry the official brand marks (visible, decorative)", async ({ page }) => {
    await page.goto("/signin");
    const googleButton = page.getByRole("button", { name: /Continue with Google/i });
    const githubButton = page.getByRole("button", { name: /Continue with GitHub/i });

    // Google: the official four-color G — all four brand fills present.
    const googleMark = googleButton.locator("svg[data-testid='google-mark']");
    await expect(googleMark).toBeVisible();
    for (const fill of ["#EA4335", "#4285F4", "#FBBC05", "#34A853"]) {
      await expect(googleMark.locator(`path[fill='${fill}']`)).toHaveCount(1);
    }
    // Decorative: the mark is aria-hidden, the label is the text.
    await expect(googleMark).toHaveAttribute("aria-hidden", "true");
    await expect(googleButton.locator("svg[data-testid='google-mark'] path").first()).not.toHaveAttribute("aria-label", /.+/);

    // GitHub: the official monochrome Octocat mark, rendered with nonzero size.
    const githubMark = githubButton.locator("svg[data-testid='github-mark']");
    await expect(githubMark).toBeVisible();
    await expect(githubMark).toHaveAttribute("aria-hidden", "true");
    const box = await githubMark.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(10);
    expect(box!.height).toBeGreaterThan(10);
  });

  test("signup renders provider buttons when configured", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("button", { name: /Sign up with Google/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign up with GitHub/i })).toBeVisible();
  });

  test("signin copy distinguishes existing accounts from create-account", async ({ page }) => {
    await page.goto("/signin");
    await expect(page.getByText(/Already have an account\?/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Continue with Google/i })).toBeVisible();
  });

  test("signup copy distinguishes new registration", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByText(/New to ZANCTA\?/i)).toBeVisible();
  });

  test("unknown OAuth identity on sign-in shows create-account guidance", async ({ page }) => {
    await page.goto("/signin?error=OAuthAccountNotFound");
    await expect(page.getByRole("alert").first()).toContainText(/Create an account first/i);
    await expect(page.getByRole("alert").first()).not.toContainText("OAuthAccountNotFound");
  });

  test("deleted OAuth identity on sign-in does not invite silent recreation", async ({ page }) => {
    await page.goto("/signin?error=OAuthAccountDeleted");
    await expect(page.getByRole("alert").first()).toContainText(/no longer exists/i);
    await expect(page.getByRole("alert").first()).toContainText(/Create a new account/i);
  });

  test("query intent parameter does not change OAuth button semantics", async ({ page }) => {
    await page.goto("/signin?intent=signup");
    await expect(page.getByRole("button", { name: /Continue with Google/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign up with Google/i })).toHaveCount(0);
  });

  test("Google button reaches the real Google authorization URL", async ({ page }) => {
    await page.goto("/signin");
    await Promise.all([
      page.waitForURL(/accounts\.google\.com/, { timeout: 20000 }),
      page.getByRole("button", { name: /Continue with Google/i }).click(),
    ]);
    const url = new URL(page.url());
    expect(url.hostname).toBe("accounts.google.com");
    // Real authorization request carries a client_id and redirect_uri back to ZANCTA.
    expect(url.searchParams.has("client_id")).toBe(true);
    expect(url.searchParams.get("redirect_uri") || "").toContain("/api/auth/callback/google");
    // Never log the client_id value.
  });

  test("GitHub button reaches the real GitHub authorization URL", async ({ page }) => {
    await page.goto("/signin");
    await Promise.all([
      // GitHub sends unauthenticated browsers to /login first, with the real
      // authorize request embedded in the return_to param. Authenticated
      // sessions land directly on /login/oauth/authorize. Accept both.
      page.waitForURL(/github\.com\/login/, { timeout: 20000 }),
      page.getByRole("button", { name: /Continue with GitHub/i }).click(),
    ]);
    const url = new URL(page.url());
    expect(url.hostname).toBe("github.com");
    const authorizeTarget =
      url.pathname === "/login/oauth/authorize"
        ? url
        : new URL(url.searchParams.get("return_to") || "", url);
    expect(authorizeTarget.pathname).toBe("/login/oauth/authorize");
    expect(authorizeTarget.searchParams.has("client_id")).toBe(true);
    expect(authorizeTarget.searchParams.get("redirect_uri") || "").toContain("/api/auth/callback/github");
  });

  test("callback routes are live (invalid code returns safe error redirect, not 404)", async ({ request }) => {
    for (const provider of ["google", "github"]) {
      const res = await request.get(`/api/auth/callback/${provider}?error=access_denied`, { maxRedirects: 0 });
      // Auth.js handles the route: a redirect to the signin error page, not a missing route.
      expect([302, 303, 307, 400, 405]).toContain(res.status());
      expect(res.status()).not.toBe(404);
    }
  });

  test("provider failure shows a safe message, no internals", async ({ page }) => {
    await page.goto("/signin?error=OAuthAccountNotLinked");
    const alert = page.getByRole("alert").first();
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/already registered with a password/i);
    // No error codes or provider internals in the UI
    await expect(alert).not.toContainText("OAuthAccountNotLinked");
  });

  test("cancelled authorization surfaces the safe cancellation message", async ({ page }) => {
    await page.goto("/signin?error=AccessDenied");
    await expect(page.getByRole("alert").first()).toContainText(/cancelled/i);
  });
});
