import { describe, it, expect } from "vitest";
import {
  DATABASE_URL_POSTGRES_ERROR,
  DATABASE_URL_REQUIRED_ERROR,
  resolveDatabaseUrl,
  sqliteFallbackAllowed,
} from "@/lib/database-url";

const SECRET_URL = "postgresql://prod-user:super-secret-pass@db.example:5432/zancta";
const POOLER_TX = "postgresql://postgres.proj:pooler-secret@aws-0-us-east-1.pooler.supabase.com:6543/postgres";
const POOLER_SESSION =
  "postgresql://postgres.proj:pooler-secret@aws-0-us-east-1.pooler.supabase.com:5432/postgres";

const PROD = { NODE_ENV: "production", VERCEL_ENV: "production" } as const;
const PREVIEW = { NODE_ENV: "production", VERCEL_ENV: "preview" } as const;
const DEV = { NODE_ENV: "development", VERCEL_ENV: undefined } as const;
const TEST_ENV = { NODE_ENV: "test", VERCEL_ENV: undefined } as const;

function expectNoSecret(message: string) {
  expect(message).not.toContain("super-secret-pass");
  expect(message).not.toContain("pooler-secret");
  expect(message).not.toContain("prod-user");
  expect(message).not.toContain("db.example");
  expect(message).not.toContain("postgresql://");
  expect(message).not.toContain("postgres://");
  expect(message).not.toContain("file:");
}

describe("Production DATABASE_URL", () => {
  it("accepts a valid PostgreSQL URL", () => {
    expect(resolveDatabaseUrl({ ...PROD, DATABASE_URL: SECRET_URL })).toBe(SECRET_URL);
  });

  it("accepts postgres:// scheme", () => {
    const url = "postgres://user:x@db.example:5432/zancta";
    expect(resolveDatabaseUrl({ ...PROD, DATABASE_URL: url })).toBe(url);
  });

  it("accepts a Supabase transaction pooler URL (:6543)", () => {
    expect(resolveDatabaseUrl({ ...PROD, DATABASE_URL: POOLER_TX })).toBe(POOLER_TX);
  });

  it("accepts a Supabase session pooler URL (:5432)", () => {
    expect(resolveDatabaseUrl({ ...PROD, DATABASE_URL: POOLER_SESSION })).toBe(POOLER_SESSION);
  });

  it("fails hard when DATABASE_URL is missing", () => {
    expect(() => resolveDatabaseUrl({ ...PROD })).toThrow(DATABASE_URL_REQUIRED_ERROR);
  });

  it("fails hard when DATABASE_URL is empty", () => {
    expect(() => resolveDatabaseUrl({ ...PROD, DATABASE_URL: "" })).toThrow(DATABASE_URL_REQUIRED_ERROR);
  });

  it("fails hard when DATABASE_URL is whitespace-only", () => {
    expect(() => resolveDatabaseUrl({ ...PROD, DATABASE_URL: "   " })).toThrow(DATABASE_URL_REQUIRED_ERROR);
  });

  it("fails hard when DATABASE_URL is a file: SQLite URL", () => {
    expect(() => resolveDatabaseUrl({ ...PROD, DATABASE_URL: "file:./prisma/dev.db" })).toThrow(
      DATABASE_URL_POSTGRES_ERROR
    );
  });

  it("fails hard when DATABASE_URL uses sqlite: scheme", () => {
    expect(() => resolveDatabaseUrl({ ...PROD, DATABASE_URL: "sqlite:./prisma/dev.db" })).toThrow(
      DATABASE_URL_POSTGRES_ERROR
    );
  });

  it("fails hard when a PostgreSQL URL is malformed (no host)", () => {
    expect(() => resolveDatabaseUrl({ ...PROD, DATABASE_URL: "postgresql://" })).toThrow(
      DATABASE_URL_POSTGRES_ERROR
    );
  });

  it("NODE_ENV=production without Vercel still refuses SQLite", () => {
    expect(sqliteFallbackAllowed({ NODE_ENV: "production" })).toBe(false);
    expect(() =>
      resolveDatabaseUrl({ NODE_ENV: "production", DATABASE_URL: "file:./prisma/dev.db" })
    ).toThrow(DATABASE_URL_POSTGRES_ERROR);
  });

  it("error messages never contain the connection string or password", () => {
    const cases = [
      () => resolveDatabaseUrl({ ...PROD, DATABASE_URL: SECRET_URL.replace("postgresql", "file") }),
      () => resolveDatabaseUrl({ ...PROD, DATABASE_URL: "" }),
      () => resolveDatabaseUrl({ ...PROD, DATABASE_URL: "postgresql://" }),
    ];
    for (const run of cases) {
      try {
        run();
        throw new Error("expected throw");
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        expect(msg === "expected throw").toBe(false);
        expectNoSecret(msg);
        expect(msg).toMatch(/DATABASE_URL/);
      }
    }
  });
});

describe("Preview DATABASE_URL", () => {
  it("accepts Preview Postgres and does not fall back to SQLite", () => {
    expect(resolveDatabaseUrl({ ...PREVIEW, DATABASE_URL: POOLER_TX })).toBe(POOLER_TX);
    expect(sqliteFallbackAllowed(PREVIEW)).toBe(false);
  });

  it("fails hard when Preview DATABASE_URL is missing", () => {
    expect(() => resolveDatabaseUrl({ ...PREVIEW })).toThrow(DATABASE_URL_REQUIRED_ERROR);
  });

  it("fails hard when Preview DATABASE_URL is file:", () => {
    expect(() => resolveDatabaseUrl({ ...PREVIEW, DATABASE_URL: "file:./prisma/dev.db" })).toThrow(
      DATABASE_URL_POSTGRES_ERROR
    );
  });
});

describe("Development DATABASE_URL", () => {
  it("missing DATABASE_URL preserves the local SQLite fallback", () => {
    expect(resolveDatabaseUrl({ ...DEV })).toBe("file:./prisma/dev.db");
  });

  it("explicit file: URL remains usable in development", () => {
    expect(resolveDatabaseUrl({ ...DEV, DATABASE_URL: "file:./prisma/dev.db" })).toBe("file:./prisma/dev.db");
  });

  it("PostgreSQL URLs still work in development", () => {
    expect(resolveDatabaseUrl({ ...DEV, DATABASE_URL: SECRET_URL })).toBe(SECRET_URL);
  });
});

describe("Test DATABASE_URL", () => {
  it("uses the provided Postgres URL (Vitest harness)", () => {
    const testUrl = "postgresql://zancta:zancta@127.0.0.1:54329/zancta_test";
    expect(resolveDatabaseUrl({ ...TEST_ENV, DATABASE_URL: testUrl })).toBe(testUrl);
  });

  it("does not throw when tests omit VERCEL_ENV", () => {
    expect(sqliteFallbackAllowed(TEST_ENV)).toBe(true);
  });
});

describe("lib/db.ts uses the resolver (no silent Production SQLite)", () => {
  it("createClient calls resolveDatabaseUrl instead of a hardcoded file fallback", async () => {
    const { readFile } = await import("fs/promises");
    const path = await import("path");
    const src = await readFile(path.join(process.cwd(), "lib/db.ts"), "utf8");
    expect(src).toMatch(/resolveDatabaseUrl\(\)/);
    expect(src).not.toMatch(/DATABASE_URL \|\| ["']file:/);
  });
});
