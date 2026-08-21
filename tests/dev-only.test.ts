import { describe, it, expect, afterEach } from "vitest";
import { isDevOnlyRouteEnabled, allowDevTokenExposure } from "@/lib/dev-only";
import { readFile } from "fs/promises";
import path from "path";

describe("dev-only token routes", () => {
  afterEach(() => {
    delete process.env.VERCEL_ENV;
  });

  it("are closed on Vercel public hosts", () => {
    process.env.VERCEL_ENV = "production";
    expect(isDevOnlyRouteEnabled("zancta.tech")).toBe(false);
    expect(isDevOnlyRouteEnabled("localhost.attacker.com")).toBe(false);
    expect(allowDevTokenExposure("zancta.tech")).toBe(false);
  });

  it("are available on exact localhost even if VERCEL_ENV is set in a local .env", () => {
    process.env.VERCEL_ENV = "production";
    expect(isDevOnlyRouteEnabled("localhost:3010")).toBe(true);
    expect(isDevOnlyRouteEnabled("127.0.0.1:3010")).toBe(true);
    expect(allowDevTokenExposure("localhost")).toBe(true);
  });

  it("treats NextRequest localhost hostname as local even when VERCEL_ENV is set", async () => {
    process.env.VERCEL_ENV = "production";
    const { isLocalDevRequest } = await import("@/lib/dev-only");
    const headers = new Headers({ host: "localhost:3010" });
    expect(isLocalDevRequest({ headers, nextUrl: new URL("http://localhost:3010/api/auth/signup") })).toBe(true);
    expect(isLocalDevRequest({ headers: new Headers({ host: "zancta.tech" }), nextUrl: new URL("https://zancta.tech/api/auth/signup") })).toBe(false);
  });

  it("dev token HTTP handlers consult the Vercel gate", async () => {
    const resetSrc = await readFile(path.join(process.cwd(), "app/api/dev/password-reset-tokens/route.ts"), "utf8");
    const verifySrc = await readFile(path.join(process.cwd(), "app/api/dev/verification-tokens/route.ts"), "utf8");
    expect(resetSrc).toMatch(/isLocalDevRequest\(req\)/);
    expect(verifySrc).toMatch(/isLocalDevRequest\(req\)/);
    expect(resetSrc).not.toMatch(/includes\(["']localhost["']\)/);
    expect(verifySrc).not.toMatch(/includes\(["']localhost["']\)/);
  });
});
