import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

async function loadConfig() {
  vi.resetModules();
  return await import("@/lib/production-config");
}

function stubVercelProduction() {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("VERCEL_ENV", "production");
}

function stubMandatoryProduction(overrides: Record<string, string | undefined> = {}) {
  const base: Record<string, string | undefined> = {
    AUTH_SECRET: "test-auth-secret-value-do-not-leak",
    DATABASE_URL: "postgresql://prod-user:prod-pass@db.example:5432/zancta",
    RESEND_API_KEY: "re_test_live_key_do_not_leak",
    EMAIL_FROM: "noreply@mail.zancta.tech",
    UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
    UPSTASH_REDIS_REST_TOKEN: "upstash-token-do-not-leak",
    PAYMENTS_LIVE_ENABLED: "false",
    ...overrides,
  };
  stubVercelProduction();
  for (const [key, value] of Object.entries(base)) {
    if (value === undefined) {
      vi.stubEnv(key, "");
      delete process.env[key];
    } else {
      vi.stubEnv(key, value);
    }
  }
  if (!("NEXTAUTH_SECRET" in overrides)) {
    vi.stubEnv("NEXTAUTH_SECRET", "");
    delete process.env.NEXTAUTH_SECRET;
  }
}

beforeEach(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("assertProductionConfig — Production contract", () => {
  it("Production + all mandatory variables present → ok", async () => {
    stubMandatoryProduction();
    const { assertProductionConfig } = await loadConfig();
    const res = assertProductionConfig();
    expect(res.ok).toBe(true);
    expect(res.missing).toEqual([]);
  });

  it("Production + AUTH_SECRET missing → fail", async () => {
    stubMandatoryProduction({ AUTH_SECRET: undefined });
    delete process.env.NEXTAUTH_SECRET;
    const { assertProductionConfig } = await loadConfig();
    const res = assertProductionConfig();
    expect(res.ok).toBe(false);
    expect(res.missing).toContain("AUTH_SECRET");
  });

  it("Production + NEXTAUTH_SECRET alias satisfies AUTH_SECRET", async () => {
    stubMandatoryProduction({ AUTH_SECRET: undefined });
    vi.stubEnv("NEXTAUTH_SECRET", "alias-secret-do-not-leak");
    const { assertProductionConfig } = await loadConfig();
    const res = assertProductionConfig();
    expect(res.ok).toBe(true);
    expect(res.missing).not.toContain("AUTH_SECRET");
  });

  it("Production + DATABASE_URL missing → fail", async () => {
    stubMandatoryProduction({ DATABASE_URL: undefined });
    const { assertProductionConfig } = await loadConfig();
    const res = assertProductionConfig();
    expect(res.ok).toBe(false);
    expect(res.missing).toContain("DATABASE_URL");
  });

  it("Production + DATABASE_URL=file: SQLite → fail", async () => {
    stubMandatoryProduction({ DATABASE_URL: "file:./prisma/dev.db" });
    const { assertProductionConfig } = await loadConfig();
    const res = assertProductionConfig();
    expect(res.ok).toBe(false);
    expect(res.missing).toContain("DATABASE_URL");
  });

  it("Production + Supabase pooler URL → pass", async () => {
    stubMandatoryProduction({
      DATABASE_URL: "postgresql://postgres.proj:x@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
    });
    const { assertProductionConfig } = await loadConfig();
    expect(assertProductionConfig().ok).toBe(true);
  });

  it("Production + Upstash URL missing → fail", async () => {
    stubMandatoryProduction({ UPSTASH_REDIS_REST_URL: undefined });
    const { assertProductionConfig } = await loadConfig();
    const res = assertProductionConfig();
    expect(res.ok).toBe(false);
    expect(res.missing).toContain("UPSTASH_REDIS_REST_URL");
  });

  it("Production + Upstash token missing → fail", async () => {
    stubMandatoryProduction({ UPSTASH_REDIS_REST_TOKEN: undefined });
    const { assertProductionConfig } = await loadConfig();
    const res = assertProductionConfig();
    expect(res.ok).toBe(false);
    expect(res.missing).toContain("UPSTASH_REDIS_REST_TOKEN");
  });

  it("Production + RESEND_API_KEY missing → fail", async () => {
    stubMandatoryProduction({ RESEND_API_KEY: undefined });
    const { assertProductionConfig } = await loadConfig();
    const res = assertProductionConfig();
    expect(res.ok).toBe(false);
    expect(res.missing).toContain("RESEND_API_KEY");
  });

  it("Production + EMAIL_FROM missing or not a mailbox → fail", async () => {
    stubMandatoryProduction({ EMAIL_FROM: "not-a-mailbox" });
    const { assertProductionConfig } = await loadConfig();
    const res = assertProductionConfig();
    expect(res.ok).toBe(false);
    expect(res.missing).toContain("EMAIL_FROM");
  });

  it("Production + payments disabled + Dodo vars absent → pass", async () => {
    stubMandatoryProduction({ PAYMENTS_LIVE_ENABLED: "false" });
    delete process.env.DODO_API_KEY;
    delete process.env.DODO_WEBHOOK_SECRET;
    delete process.env.DODO_PRODUCT_MONTHLY_ID;
    delete process.env.DODO_PRODUCT_ANNUAL_ID;
    delete process.env.DODO_ENVIRONMENT;
    const { assertProductionConfig } = await loadConfig();
    const res = assertProductionConfig();
    expect(res.ok).toBe(true);
    expect(res.missing).not.toContain("DODO_API_KEY");
  });

  it("Production + payments live + Dodo incomplete → fail", async () => {
    stubMandatoryProduction({ PAYMENTS_LIVE_ENABLED: "true" });
    delete process.env.DODO_API_KEY;
    delete process.env.DODO_WEBHOOK_SECRET;
    delete process.env.DODO_PAYMENTS_WEBHOOK_SECRET;
    delete process.env.DODO_PRODUCT_MONTHLY_ID;
    delete process.env.DODO_PRODUCT_ANNUAL_ID;
    vi.stubEnv("DODO_ENVIRONMENT", "test");
    const { assertProductionConfig } = await loadConfig();
    const res = assertProductionConfig();
    expect(res.ok).toBe(false);
    expect(res.missing).toContain("DODO_API_KEY");
    expect(res.missing).toContain("DODO_WEBHOOK_SECRET");
    expect(res.missing).toContain("DODO_PRODUCT_MONTHLY_ID");
    expect(res.missing).toContain("DODO_PRODUCT_ANNUAL_ID");
    expect(res.missing).toContain("DODO_ENVIRONMENT");
  });

  it("Production + optional Google/operator secrets missing → pass", async () => {
    stubMandatoryProduction();
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_OPERATOR_CLIENT_ID;
    delete process.env.GOOGLE_OPERATOR_CLIENT_SECRET;
    delete process.env.INTEGRATION_ENCRYPTION_KEY;
    const { assertProductionConfig } = await loadConfig();
    const res = assertProductionConfig();
    expect(res.ok).toBe(true);
  });
});

describe("assertProductionConfig — Preview / development / test", () => {
  it("Preview + missing Production-only vars → ok", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.RESEND_API_KEY;
    const { assertProductionConfig } = await loadConfig();
    expect(assertProductionConfig().ok).toBe(true);
  });

  it("Development + missing Production-only vars → ok", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "");
    delete process.env.UPSTASH_REDIS_REST_URL;
    const { assertProductionConfig } = await loadConfig();
    expect(assertProductionConfig().ok).toBe(true);
  });

  it("Vitest/test NODE_ENV → ok", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("VERCEL_ENV", "production");
    delete process.env.DATABASE_URL;
    const { assertProductionConfig } = await loadConfig();
    expect(assertProductionConfig().ok).toBe(true);
  });
});

describe("error safety — names only, never values", () => {
  const SECRET_SENTINELS = [
    "test-auth-secret-value-do-not-leak",
    "postgresql://prod-user:prod-pass@db.example:5432/zancta",
    "re_test_live_key_do_not_leak",
    "upstash-token-do-not-leak",
  ];

  it("throw message contains variable names only", async () => {
    stubMandatoryProduction({ DATABASE_URL: undefined, AUTH_SECRET: "test-auth-secret-value-do-not-leak" });
    const { enforceProductionConfigOrThrow } = await loadConfig();
    expect(() => enforceProductionConfigOrThrow()).toThrow(/Missing required production configuration: DATABASE_URL/);
    try {
      enforceProductionConfigOrThrow();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      expect(msg).toContain("DATABASE_URL");
      expect(msg).not.toContain("postgresql://");
      for (const sentinel of SECRET_SENTINELS) {
        expect(msg).not.toContain(sentinel);
      }
    }
  });

  it("HTTP 500 body is generic and does not include names or values", async () => {
    stubMandatoryProduction({ UPSTASH_REDIS_REST_TOKEN: undefined });
    const { requireProductionConfig } = await loadConfig();
    const res = requireProductionConfig();
    expect(res).not.toBeNull();
    expect(res!.status).toBe(500);
    const body = await res!.json();
    expect(body).toEqual({ error: "Server misconfigured" });
    const raw = JSON.stringify(body);
    expect(raw).not.toContain("UPSTASH_REDIS_REST_TOKEN");
    for (const sentinel of SECRET_SENTINELS) {
      expect(raw).not.toContain(sentinel);
    }
  });
});

describe("startup vs build", () => {
  it("does not throw during next production build even if Production env is incomplete", async () => {
    stubMandatoryProduction({ AUTH_SECRET: undefined });
    delete process.env.NEXTAUTH_SECRET;
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    const { enforceProductionConfigOrThrow, requireProductionConfig } = await loadConfig();
    expect(() => enforceProductionConfigOrThrow()).not.toThrow();
    expect(requireProductionConfig()).toBeNull();
  });

  it("throws at Production runtime when mandatory config is missing", async () => {
    stubMandatoryProduction({ AUTH_SECRET: undefined });
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.NEXT_PHASE;
    const { enforceProductionConfigOrThrow } = await loadConfig();
    expect(() => enforceProductionConfigOrThrow()).toThrow(/AUTH_SECRET/);
  });
});

describe("invocation wiring", () => {
  it("instrumentation.ts invokes enforceProductionConfigOrThrow from register()", async () => {
    const { readFile } = await import("fs/promises");
    const path = await import("path");
    const src = await readFile(path.join(process.cwd(), "instrumentation.ts"), "utf8");
    expect(src).toMatch(/enforceProductionConfigOrThrow/);
    expect(src).toMatch(/export async function register/);
  });

  it("proxy.ts invokes requireProductionConfig for matched requests", async () => {
    const { readFile } = await import("fs/promises");
    const path = await import("path");
    const src = await readFile(path.join(process.cwd(), "proxy.ts"), "utf8");
    expect(src).toMatch(/requireProductionConfig/);
    expect(src).toMatch(/\/api\/:path\*/);
  });
});
