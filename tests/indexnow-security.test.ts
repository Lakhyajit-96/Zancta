import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { buildIndexNowPayload, isAllowedIndexNowUrl, sanitizeIndexNowUrls } from "@/lib/indexnow";

const TEST_KEY = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

describe("IndexNow URL allowlist", () => {
  const prevKey = process.env.INDEXNOW_KEY;
  const prevSecret = process.env.INDEXNOW_NOTIFY_SECRET;

  beforeEach(() => {
    process.env.INDEXNOW_KEY = TEST_KEY;
    process.env.INDEXNOW_NOTIFY_SECRET = "test-notify-secret";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterEach(() => {
    process.env.INDEXNOW_KEY = prevKey;
    process.env.INDEXNOW_NOTIFY_SECRET = prevSecret;
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("allows only https zancta.tech public URLs", () => {
    expect(isAllowedIndexNowUrl("https://zancta.tech/")).toBe(true);
    expect(isAllowedIndexNowUrl("https://zancta.tech/tools")).toBe(true);
    expect(isAllowedIndexNowUrl("http://zancta.tech/")).toBe(false);
    expect(isAllowedIndexNowUrl("https://www.zancta.tech/")).toBe(false);
    expect(isAllowedIndexNowUrl("https://evil.example/")).toBe(false);
    expect(isAllowedIndexNowUrl("not-a-url")).toBe(false);
    expect(isAllowedIndexNowUrl("https://zancta.tech/signin")).toBe(false);
    expect(isAllowedIndexNowUrl("https://zancta.tech/account")).toBe(false);
    expect(isAllowedIndexNowUrl("https://zancta.tech/api/indexnow")).toBe(false);
  });

  it("does not put rejected hosts into the payload", () => {
    const payload = buildIndexNowPayload([
      "https://zancta.tech/pricing",
      "https://evil.example/steal",
      "http://zancta.tech/tools",
    ]);
    expect(payload?.urlList).toEqual(["https://zancta.tech/pricing"]);
    expect(payload?.host).toBe("zancta.tech");
    expect(payload?.key).toBe(TEST_KEY);
  });

  it("caps submissions and drops duplicates", () => {
    const urls = Array.from({ length: 25 }, (_, i) => `https://zancta.tech/tools?n=${i}`);
    urls.push("https://zancta.tech/tools?n=0");
    expect(sanitizeIndexNowUrls(urls).length).toBe(20);
  });
});

describe("POST /api/indexnow", () => {
  const prevKey = process.env.INDEXNOW_KEY;
  const prevSecret = process.env.INDEXNOW_NOTIFY_SECRET;

  beforeEach(() => {
    process.env.INDEXNOW_KEY = TEST_KEY;
    process.env.INDEXNOW_NOTIFY_SECRET = "test-notify-secret";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 202 })));
  });

  afterEach(() => {
    process.env.INDEXNOW_KEY = prevKey;
    process.env.INDEXNOW_NOTIFY_SECRET = prevSecret;
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  async function call(init: { auth?: string | null; body?: unknown; ip?: string }) {
    const { POST } = await import("@/app/api/indexnow/route");
    const req = new NextRequest("http://localhost:3000/api/indexnow", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(init.auth ? { authorization: init.auth } : {}),
        "x-forwarded-for": init.ip || "10.20.0.2",
      },
      body: JSON.stringify(init.body ?? { urls: ["https://zancta.tech/"] }),
    });
    const res = await POST(req);
    return { status: res.status, body: await res.json() as Record<string, unknown> };
  }

  it("rejects missing secret header", async () => {
    const res = await call({ auth: null });
    expect(res.status).toBe(401);
    expect(JSON.stringify(res.body)).not.toContain(TEST_KEY);
  });

  it("rejects wrong secret", async () => {
    const res = await call({ auth: "Bearer wrong" });
    expect(res.status).toBe(401);
  });

  it("rejects non-zancta and http URLs", async () => {
    const res = await call({
      auth: "Bearer test-notify-secret",
      body: { urls: ["https://example.com/", "http://zancta.tech/"] },
    });
    expect(res.status).toBe(400);
  });

  it("accepts a valid authorized request without echoing the key", async () => {
    const res = await call({
      auth: "Bearer test-notify-secret",
      body: { urls: ["https://zancta.tech/", "https://zancta.tech/tools"] },
    });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.accepted).toBe(2);
    expect(JSON.stringify(res.body)).not.toContain(TEST_KEY);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("rate-limits excessive submissions from the same IP", async () => {
    vi.mocked(fetch).mockClear();
    const ip = "203.0.113.50";
    for (let i = 0; i < 5; i += 1) {
      const res = await call({ auth: null, ip, body: { urls: ["https://zancta.tech/"] } });
      expect(res.status).toBe(401);
    }
    const limited = await call({ auth: "Bearer test-notify-secret", ip });
    expect(limited.status).toBe(429);
    expect(fetch).not.toHaveBeenCalled();
  });
});
