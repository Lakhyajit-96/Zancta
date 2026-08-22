import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  buildIndexNowPayload,
  getIndexNowKey,
  indexNowKeyFileResponse,
  isAllowedIndexNowUrl,
  sanitizeIndexNowUrls,
} from "@/lib/indexnow";
import { allIndexablePaths, canonicalSitemapUrl } from "@/lib/seo/public-urls";

const TEST_KEY = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const DASHED_KEY = "Ab12-Cd34-Ef56-Gh78-Ij90klmn";

describe("IndexNow URL allowlist", () => {
  const prevKey = process.env.INDEXNOW_KEY;
  const prevSecret = process.env.INDEXNOW_NOTIFY_SECRET;

  beforeEach(() => {
    process.env.INDEXNOW_KEY = TEST_KEY;
    delete process.env.INDEXNOW_NOTIFY_SECRET;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterEach(() => {
    process.env.INDEXNOW_KEY = prevKey;
    process.env.INDEXNOW_NOTIFY_SECRET = prevSecret;
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("allows only https zancta.tech canonical public URLs", () => {
    expect(isAllowedIndexNowUrl("https://zancta.tech/")).toBe(true);
    expect(isAllowedIndexNowUrl("https://zancta.tech/tools")).toBe(true);
    expect(isAllowedIndexNowUrl("https://zancta.tech/guides/compress-pdf-without-uploading")).toBe(true);
    expect(isAllowedIndexNowUrl("http://zancta.tech/")).toBe(false);
    expect(isAllowedIndexNowUrl("https://www.zancta.tech/")).toBe(false);
    expect(isAllowedIndexNowUrl("https://evil.example/")).toBe(false);
    expect(isAllowedIndexNowUrl("not-a-url")).toBe(false);
    expect(isAllowedIndexNowUrl("https://zancta.tech/signin")).toBe(false);
    expect(isAllowedIndexNowUrl("https://zancta.tech/account")).toBe(false);
    expect(isAllowedIndexNowUrl("https://zancta.tech/admin")).toBe(false);
    expect(isAllowedIndexNowUrl("https://zancta.tech/admin/growth")).toBe(false);
    expect(isAllowedIndexNowUrl("https://zancta.tech/api/indexnow")).toBe(false);
    expect(isAllowedIndexNowUrl("https://zancta.tech/tools/background-remover")).toBe(false);
    expect(isAllowedIndexNowUrl("https://zancta.tech.evil.example/")).toBe(false);
  });

  it("does not put rejected hosts into the payload", () => {
    const payload = buildIndexNowPayload([
      "https://zancta.tech/pricing",
      "https://evil.example/steal",
      "http://zancta.tech/tools",
      "https://zancta.tech/admin",
    ]);
    expect(payload?.urlList).toEqual(["https://zancta.tech/pricing"]);
    expect(payload?.host).toBe("zancta.tech");
    expect(payload?.key).toBe(TEST_KEY);
    expect(payload?.keyLocation).toBe(`https://zancta.tech/${TEST_KEY}.txt`);
  });

  it("builds a payload without INDEXNOW_NOTIFY_SECRET", () => {
    expect(process.env.INDEXNOW_NOTIFY_SECRET).toBeUndefined();
    expect(getIndexNowKey()).toBe(TEST_KEY);
    const payload = buildIndexNowPayload(["https://zancta.tech/guides/split-pdf-without-uploading"]);
    expect(payload?.urlList).toHaveLength(1);
  });

  it("collapses query variants and caps the allowlist", () => {
    const queried = Array.from({ length: 8 }, (_, i) => `https://zancta.tech/tools?n=${i}`);
    expect(sanitizeIndexNowUrls(queried)).toEqual(["https://zancta.tech/tools"]);
    const many = allIndexablePaths().map((path) => canonicalSitemapUrl(path));
    expect(sanitizeIndexNowUrls(many).length).toBe(20);
  });

  it("serves the key file only at the exact public path", () => {
    const file = indexNowKeyFileResponse(`/${TEST_KEY}.txt`);
    expect(file?.body).toBe(TEST_KEY);
    expect(file?.headers["content-type"]).toMatch(/text\/plain/);
    expect(file?.headers["x-robots-tag"]).toBe("noindex");
    expect(indexNowKeyFileResponse("/llms.txt")).toBeNull();
    expect(indexNowKeyFileResponse("/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab.txt")).toBeNull();
    expect(indexNowKeyFileResponse("/api/indexnow")).toBeNull();
    expect(indexNowKeyFileResponse("/robots.txt")).toBeNull();
  });

  it("accepts official dashed keys and rejects short keys", () => {
    process.env.INDEXNOW_KEY = DASHED_KEY;
    expect(getIndexNowKey()).toBe(DASHED_KEY);
    const file = indexNowKeyFileResponse(`/${DASHED_KEY}.txt`);
    expect(file?.body).toBe(DASHED_KEY);
    process.env.INDEXNOW_KEY = "short";
    expect(getIndexNowKey()).toBeNull();
    process.env.INDEXNOW_KEY = "has_underscore_not_allowed_here1";
    expect(getIndexNowKey()).toBeNull();
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

  async function call(init: { auth?: string | null; body?: unknown; ip?: string; url?: string }) {
    const { POST } = await import("@/app/api/indexnow/route");
    const req = new NextRequest(init.url || "http://localhost:3000/api/indexnow", {
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

  it("rejects the IndexNow key used as bearer or query", async () => {
    const asBearer = await call({ auth: `Bearer ${TEST_KEY}` });
    expect(asBearer.status).toBe(401);
    const asQuery = await call({
      auth: null,
      url: `http://localhost:3000/api/indexnow?key=${TEST_KEY}&secret=${TEST_KEY}`,
    });
    expect(asQuery.status).toBe(401);
    expect(JSON.stringify(asQuery.body)).not.toContain(TEST_KEY);
  });

  it("rejects wrong secret", async () => {
    const res = await call({ auth: "Bearer wrong" });
    expect(res.status).toBe(401);
  });

  it("rejects non-zancta, http, admin, and api URLs", async () => {
    const res = await call({
      auth: "Bearer test-notify-secret",
      body: { urls: ["https://example.com/", "http://zancta.tech/", "https://zancta.tech/admin", "https://zancta.tech/api/ocr"] },
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
    const [endpoint, init] = vi.mocked(fetch).mock.calls[0] as [string, { body: string }];
    expect(endpoint).toBe("https://api.indexnow.org/indexnow");
    const sent = JSON.parse(init.body) as { host: string; urlList: string[]; keyLocation: string };
    expect(sent.host).toBe("zancta.tech");
    expect(sent.urlList).toEqual(["https://zancta.tech/", "https://zancta.tech/tools"]);
    expect(sent.keyLocation).toBe(`https://zancta.tech/${TEST_KEY}.txt`);
  });

  it("rate-limits excessive submissions from the same IP", async () => {
    vi.mocked(fetch).mockClear();
    const ip = "203.0.113.51";
    for (let i = 0; i < 5; i += 1) {
      const res = await call({ auth: null, ip, body: { urls: ["https://zancta.tech/"] } });
      expect(res.status).toBe(401);
    }
    const limited = await call({ auth: "Bearer test-notify-secret", ip });
    expect(limited.status).toBe(429);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("IndexNow client isolation", () => {
  function walk(dir: string, acc: string[] = []): string[] {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const next = join(dir, entry.name);
      if (entry.isDirectory()) walk(next, acc);
      else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) acc.push(next);
    }
    return acc;
  }

  it("does not put INDEXNOW credentials in client components or public pages", () => {
    const roots = ["components", "app"].map((d) => join(process.cwd(), d));
    const skip = /[/\\]app[/\\]api[/\\]indexnow[/\\]/;
    for (const root of roots) {
      for (const file of walk(root)) {
        if (skip.test(file)) continue;
        const text = readFileSync(file, "utf8");
        expect(text, file).not.toMatch(/INDEXNOW_KEY|INDEXNOW_NOTIFY_SECRET/);
      }
    }
  });
});
