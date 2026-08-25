import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Upstash so the "valid config" path can exercise the distributed limiter
// without a real Redis. The mock keeps an in-process counter per key so we can
// assert distributed counting semantics (count <= limit).
const redisCounters = new Map<string, number>();
// `mock`-prefixed so vitest allows referencing it inside the hoisted vi.mock factory.
const mockRedisState = { throwOnIncr: false };
vi.mock("@upstash/redis", () => ({
  Redis: class {
    async incr(key: string) {
      if (mockRedisState.throwOnIncr) throw new Error("simulated redis outage");
      const next = (redisCounters.get(key) ?? 0) + 1;
      redisCounters.set(key, next);
      return next;
    }
    async expire() {
      return 1;
    }
    async ttl() {
      return 900;
    }
  },
}));
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static slidingWindow() {
      return {};
    }
  },
}));

async function loadRateLimit() {
  // Fresh module state (memoized limiter + memory store) per scenario.
  vi.resetModules();
  return await import("@/lib/rate-limit");
}

const REAL_URL = "https://example.upstash.io";
const REAL_TOKEN = "test-upstash-token";

beforeEach(() => {
  redisCounters.clear();
  mockRedisState.throwOnIncr = false;
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("rateLimitAsync — production fail-closed on missing Upstash (P0-1)", () => {
  it("Production + valid Upstash config → uses distributed limiter (allows within limit)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", REAL_URL);
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", REAL_TOKEN);

    const { rateLimitAsync } = await loadRateLimit();
    const first = await rateLimitAsync("k-distributed", 2, 60_000);
    const second = await rateLimitAsync("k-distributed", 2, 60_000);
    const third = await rateLimitAsync("k-distributed", 2, 60_000);

    // Distributed mock counts 1,2,3 → first two within limit, third over.
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(third.ok).toBe(false);
    // Distributed path yields a real reset window from ttl(), not the memory window.
    expect(third.remaining).toBe(0);
  });

  it("Production + BOTH Upstash vars missing → fails closed (does NOT fall back to memory)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    const { rateLimitAsync } = await loadRateLimit();
    // Even the very first request is blocked: no distributed limiter is available.
    const first = await rateLimitAsync("k-missing", 100, 60_000);
    const second = await rateLimitAsync("k-missing", 100, 60_000);

    expect(first.ok).toBe(false);
    expect(second.ok).toBe(false);
    expect(first.remaining).toBe(0);
  });

  it("Production + Upstash configured but Redis throws → fails closed (no memory fallback)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", REAL_URL);
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", REAL_TOKEN);
    mockRedisState.throwOnIncr = true;

    const { rateLimitAsync } = await loadRateLimit();
    const res = await rateLimitAsync("k-redis-down", 100, 60_000);
    expect(res.ok).toBe(false);
    expect(res.remaining).toBe(0);
  });

  it("Development + Upstash configured but Redis throws → memory fallback (DX preserved)", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", REAL_URL);
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", REAL_TOKEN);
    mockRedisState.throwOnIncr = true;

    const { rateLimitAsync } = await loadRateLimit();
    const a = await rateLimitAsync("k-redis-down-dev", 1, 60_000);
    const b = await rateLimitAsync("k-redis-down-dev", 1, 60_000);
    // Falls back to memory: first allowed, second blocked (not hard fail-closed).
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(false);
  });

  it("Production + URL present but TOKEN missing → fails closed (cannot initialize)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", REAL_URL);
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    const { rateLimitAsync } = await loadRateLimit();
    const res = await rateLimitAsync("k-partial", 100, 60_000);
    expect(res.ok).toBe(false);
    expect(res.remaining).toBe(0);
  });

  it("Development + missing Upstash → memory fallback still works (local DX preserved)", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    const { rateLimitAsync } = await loadRateLimit();
    const a = await rateLimitAsync("k-dev", 2, 60_000);
    const b = await rateLimitAsync("k-dev", 2, 60_000);
    const c = await rateLimitAsync("k-dev", 2, 60_000);

    // Memory limiter allows up to the limit, then blocks — proving it is NOT failing closed.
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    expect(c.ok).toBe(false);
  });

  it("Vercel Preview + missing Upstash → memory fallback (not fail-closed, preview unaffected)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    const { rateLimitAsync } = await loadRateLimit();
    const a = await rateLimitAsync("k-preview", 1, 60_000);
    const b = await rateLimitAsync("k-preview", 1, 60_000);

    expect(a.ok).toBe(true); // first allowed via memory
    expect(b.ok).toBe(false); // second over the limit via memory (not fail-closed)
  });

  it("Test env + missing Upstash → memory fallback (no regression to existing tests)", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    const { rateLimitAsync } = await loadRateLimit();
    const a = await rateLimitAsync("k-test", 1, 60_000);
    const b = await rateLimitAsync("k-test", 1, 60_000);
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(false);
  });
});

describe("rateLimit (sync) — unchanged memory semantics", () => {
  it("counts in memory and blocks over the limit", async () => {
    vi.stubEnv("NODE_ENV", "test");
    const { rateLimit } = await loadRateLimit();
    const a = rateLimit("sync-k", 2, 60_000);
    const b = rateLimit("sync-k", 2, 60_000);
    const c = rateLimit("sync-k", 2, 60_000);
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    expect(c.ok).toBe(false);
  });
});

describe("getClientIp", () => {
  it("prefers first x-forwarded-for hop", async () => {
    const { getClientIp } = await loadRateLimit();
    const h = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(getClientIp(h)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip then unknown", async () => {
    const { getClientIp } = await loadRateLimit();
    expect(getClientIp(new Headers({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});

describe("assertProductionConfig — Upstash required in production (fail config validation safely)", () => {
  it("Production + missing Upstash → ok:false and reports the missing Upstash vars", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("AUTH_SECRET", "x");
    vi.stubEnv("DATABASE_URL", "postgres://x");
    vi.stubEnv("RESEND_API_KEY", "x");
    vi.stubEnv("EMAIL_FROM", "a@b.co");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    vi.resetModules();
    const { assertProductionConfig } = await import("@/lib/production-config");
    const res = assertProductionConfig();
    expect(res.ok).toBe(false);
    expect(res.missing).toContain("UPSTASH_REDIS_REST_URL");
    expect(res.missing).toContain("UPSTASH_REDIS_REST_TOKEN");
  });

  it("Production + full config present → ok:true", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("AUTH_SECRET", "x");
    vi.stubEnv("DATABASE_URL", "postgres://x");
    vi.stubEnv("RESEND_API_KEY", "x");
    vi.stubEnv("EMAIL_FROM", "a@b.co");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", REAL_URL);
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", REAL_TOKEN);

    vi.resetModules();
    const { assertProductionConfig } = await import("@/lib/production-config");
    const res = assertProductionConfig();
    expect(res.ok).toBe(true);
    expect(res.missing).toEqual([]);
  });

  it("Non-production → ok:true regardless of Upstash", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "");
    vi.resetModules();
    const { assertProductionConfig } = await import("@/lib/production-config");
    const res = assertProductionConfig();
    expect(res.ok).toBe(true);
  });
});
