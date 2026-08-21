import { describe, expect, it } from "vitest";
import { TEST_DATABASE_URL } from "./postgres-url";

describe("test database isolation", () => {
  it("uses PostgreSQL on loopback instead of SQLite or production DATABASE_URL", () => {
    expect(process.env.DATABASE_URL).toBe(TEST_DATABASE_URL);
    expect(process.env.DATABASE_URL).toMatch(/^postgres(ql)?:\/\//i);
    expect(process.env.DATABASE_URL).toMatch(/127\.0\.0\.1|localhost/);
    expect(process.env.DATABASE_URL).not.toMatch(/^file:/);
    expect(process.env.PAYMENTS_LIVE_ENABLED).toBe("false");
  });
});
