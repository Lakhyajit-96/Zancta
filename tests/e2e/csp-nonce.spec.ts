import { expect, test } from "@playwright/test";

function cspNonceFromHeader(csp: string): string | null {
  const match = csp.match(/'nonce-([A-Za-z0-9+/_-]+={0,2})'/);
  return match?.[1] ?? null;
}

function headerCsp(headers: Record<string, string>): string {
  return headers["content-security-policy"] || "";
}

function allCsp(headers: Record<string, string>): string[] {
  const raw = headers["content-security-policy"];
  if (!raw) return [];
  return raw.split(/,(?=\s*default-src|\s*script-src)/).map((part) => part.trim()).filter(Boolean);
}

test.describe("CSP nonce architecture", () => {
  test("HTML documents use a unique nonce matching Flight scripts", async ({ request, page }) => {
    const cspErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && /content security policy|csp/i.test(msg.text())) {
        cspErrors.push(msg.text());
      }
    });
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    const first = await request.get("/privacy");
    const second = await request.get("/privacy");
    expect(first.status()).toBe(200);
    expect(second.status()).toBe(200);

    const csp1 = headerCsp(first.headers());
    const csp2 = headerCsp(second.headers());
    expect(allCsp(first.headers()).length).toBe(1);
    expect(csp1).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(csp1).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp1).toContain("'wasm-unsafe-eval'");
    expect(csp1).toContain("worker-src 'self' blob:");

    const nonce1 = cspNonceFromHeader(csp1);
    const nonce2 = cspNonceFromHeader(csp2);
    expect(nonce1).toBeTruthy();
    expect(nonce2).toBeTruthy();
    expect(nonce1).not.toBe(nonce2);

    const html1 = await first.text();
    const html2 = await second.text();
    expect(html1).toContain("self.__next_f");
    const flightAttrs = [...html1.matchAll(/<script([^>]*)>[\s\S]*?self\.__next_f/g)].map((match) => match[1]);
    expect(flightAttrs.length).toBeGreaterThan(0);
    for (const attrs of flightAttrs) {
      expect(attrs).toContain(`nonce="${nonce1}"`);
    }
    expect(html2).toContain(`nonce="${nonce2}"`);
    expect(html1).not.toContain(`nonce="${nonce2}"`);

    const cache = first.headers()["cache-control"] || "";
    expect(cache).toMatch(/no-store/i);
    expect(cache).toMatch(/private/i);
    expect(cache).not.toMatch(/s-maxage\s*=\s*[1-9]/i);
    expect(first.headers()["x-nonce"]).toBeFalsy();
    expect(first.headers()["x-vercel-cache"] || "").not.toMatch(/^HIT$/i);

    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: /how zancta handles privacy/i })).toBeVisible();
    expect(cspErrors, cspErrors.join("\n")).toEqual([]);
    expect(pageErrors.filter((msg) => /hydrat/i.test(msg)), pageErrors.join("\n")).toEqual([]);
  });

  test("representative routes hydrate without script-src unsafe-inline", async ({ page, request }) => {
    const routes = ["/", "/signin", "/pricing", "/security", "/verify-email", "/tools/ocr", "/guides/local-processing", "/faq"];
    for (const route of routes) {
      const res = await request.get(route);
      expect(res.status(), route).toBe(200);
      const csp = headerCsp(res.headers());
      expect(csp, route).not.toMatch(/script-src[^;]*'unsafe-inline'/);
      expect(cspNonceFromHeader(csp), route).toBeTruthy();
      const html = await res.text();
      expect(html, route).toContain("self.__next_f");
      expect(html, route).toContain(`nonce="${cspNonceFromHeader(csp)}"`);
    }

    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/tools/ocr");
    await expect(page.getByRole("region", { name: "Local OCR workspace" })).toBeVisible();
    expect(errors.filter((msg) => /hydrat/i.test(msg))).toEqual([]);
  });

  test("API JSON does not receive an HTML nonce", async ({ request }) => {
    const res = await request.get("/api/payments/status");
    expect(res.status()).toBe(401);
    const csp = headerCsp(res.headers());
    expect(cspNonceFromHeader(csp)).toBeNull();
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    const body = await res.text();
    expect(body).not.toMatch(/nonce-/);
  });

  test("security.txt remains a static public file", async ({ request }) => {
    const res = await request.get("/.well-known/security.txt");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"] || "").toMatch(/text\/plain/);
    const body = await res.text();
    expect(body).toMatch(/^Contact:\s*mailto:security@zancta\.tech$/m);
    expect(cspNonceFromHeader(headerCsp(res.headers()))).toBeNull();
    expect(res.headers()["x-nonce"]).toBeFalsy();
  });

  test("robots.txt and IndexNow key files do not receive an HTML nonce", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    expect(cspNonceFromHeader(headerCsp(robots.headers()))).toBeNull();
    expect(robots.headers()["x-nonce"]).toBeFalsy();

    const key = process.env.INDEXNOW_KEY?.trim() || "";
    if (/^[A-Za-z0-9-]{8,128}$/.test(key)) {
      const file = await request.get(`/${key}.txt`);
      expect(file.status()).toBe(200);
      expect(await file.text()).toBe(key);
      expect(cspNonceFromHeader(headerCsp(file.headers()))).toBeNull();
      expect(file.headers()["cache-control"] || "").toMatch(/public/i);
    } else {
      const missing = await request.get("/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab.txt");
      expect(missing.status()).toBeGreaterThanOrEqual(400);
      expect(cspNonceFromHeader(headerCsp(missing.headers()))).toBeNull();
    }
  });

  test("404 HTML still receives a nonce", async ({ request, page }) => {
    const res = await request.get("/this-route-does-not-exist-csp-nonce");
    expect(res.status()).toBe(404);
    const nonce = cspNonceFromHeader(headerCsp(res.headers()));
    expect(nonce).toBeTruthy();
    expect(await res.text()).toContain(`nonce="${nonce}"`);
    await page.goto("/this-route-does-not-exist-csp-nonce");
    await expect(page.getByRole("heading", { name: /not available/i })).toBeVisible();
  });
});
