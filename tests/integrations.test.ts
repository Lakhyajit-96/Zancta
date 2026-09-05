import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, looksLikeSecret, signOAuthState, verifyOAuthState } from "@/lib/integrations/crypto";
import { resolveDateRange } from "@/lib/integrations/date-range";
import { pickZanctaProperty } from "@/lib/integrations/google/gsc";
import { pickBingSite } from "@/lib/integrations/bing/webmaster";
import { classifyHttp, fail, ok } from "@/lib/integrations/types";
import { toPublicConnection } from "@/lib/integrations/store";

describe("operator integration crypto", () => {
  it("round-trips secrets without embedding plaintext", () => {
    process.env.INTEGRATION_ENCRYPTION_KEY = "a".repeat(64);
    const token = "ya29.secret-access-token";
    const enc = encryptSecret(token);
    expect(enc.startsWith("v1.")).toBe(true);
    expect(enc).not.toContain(token);
    expect(decryptSecret(enc)).toBe(token);
  });

  it("signs and verifies OAuth state", () => {
    process.env.AUTH_SECRET = "test-only-auth-secret-not-for-production";
    const signed = signOAuthState(JSON.stringify({ uid: "u1", exp: Date.now() + 60_000 }));
    expect(verifyOAuthState(signed)).toContain("u1");
    expect(verifyOAuthState("tampered." + signed)).toBeNull();
  });

  it("detects token-like strings for log redaction", () => {
    expect(looksLikeSecret("Bearer ya29.abc")).toBe(true);
    expect(looksLikeSecret("AUTH_REQUIRED")).toBe(false);
  });
});

describe("operator integration normalization", () => {
  it("prefers sc-domain:zancta.tech", () => {
    expect(pickZanctaProperty(["https://example.com/", "sc-domain:zancta.tech"])).toBe("sc-domain:zancta.tech");
    expect(pickBingSite(["https://other.com/", "https://zancta.tech"])).toBe("https://zancta.tech/");
  });

  it("maps HTTP failures to states instead of zeros", () => {
    expect(classifyHttp(401)).toBe("TOKEN_EXPIRED");
    expect(classifyHttp(403)).toBe("PERMISSION_DENIED");
    expect(classifyHttp(429)).toBe("RATE_LIMITED");
    expect(fail("DATA_UNAVAILABLE", "Google API authorization expired.").data).toBeNull();
    expect(ok({ clicks: 3 }).data?.clicks).toBe(3);
  });

  it("never puts tokens on the public connection DTO", () => {
    const pub = toPublicConnection(
      {
        provider: "google",
        status: "CONNECTED",
        accountEmail: "owner@example.com",
        scopes: "https://www.googleapis.com/auth/webmasters",
        selectedProperty: "sc-domain:zancta.tech",
        ga4PropertyId: "123",
        ga4MeasurementId: "G-56KMDH7Z2X",
        lastSuccessAt: new Date(),
        lastFailureAt: null,
        consecutiveFailures: 0,
        lastErrorCode: null,
        lastErrorSafe: null,
        lastLatencyMs: 12,
        tokenExpiresAt: new Date(),
      },
      "google",
    );
    expect(JSON.stringify(pub)).not.toMatch(/accessToken|refreshToken|ya29/);
    expect(pub.accountEmail).toBe("owner@example.com");
  });

  it("resolves 28d by default", () => {
    const range = resolveDateRange("28d");
    expect(range.startDate <= range.endDate).toBe(true);
    expect(range.key).toBe("28d");
  });
});

describe("operator integration API mapping", () => {
  it("classifies provider timeouts and missing properties without zeros", () => {
    expect(classifyHttp(404)).toBe("PROPERTY_NOT_FOUND");
    expect(classifyHttp(500)).toBe("PROVIDER_UNAVAILABLE");
    expect(fail("RATE_LIMITED", "The provider rate-limited this request.").data).toBeNull();
    expect(fail("TOKEN_EXPIRED", "Authorization expired.").data).toBeNull();
  });

  it("accepts https URL-prefix Search Console properties when domain property is absent", () => {
    expect(pickZanctaProperty(["https://zancta.tech/"])).toBe("https://zancta.tech/");
    expect(pickZanctaProperty(["https://other.com/"])).toBeNull();
  });

  it("resolves 7d, 90d, and custom ranges", () => {
    expect(resolveDateRange("7d").key).toBe("7d");
    expect(resolveDateRange("90d").key).toBe("90d");
    const custom = resolveDateRange("custom", "2026-01-01", "2026-01-31");
    expect(custom.key.startsWith("custom:")).toBe(true);
  });
});

describe("Google integration connection actions", () => {
  it("uses persisted status consistently for connected and disconnected actions", async () => {
    const detail = await readFile(path.join(process.cwd(), "app/admin/integrations/google/page.tsx"), "utf8");
    const overview = await readFile(path.join(process.cwd(), "app/admin/integrations/page.tsx"), "utf8");

    expect(detail).toContain('const connected = dash.connection.status === "CONNECTED"');
    expect(detail).toContain('{connected ? "Reconnect Google" : "Connect Google"}');
    expect(detail).toMatch(/\{connected \? \([\s\S]*?google\/disconnect[\s\S]*?\) : null\}/);
    expect(overview).toContain('const connected = connection.status === "CONNECTED"');
    expect(overview).toContain('{google.status === "CONNECTED" ? "Reconnect Google" : "Connect Google"}');
  });

  it("redirects a successful OAuth callback without a stale status query parameter", async () => {
    const callback = await readFile(path.join(process.cwd(), "app/api/admin/integrations/google/callback/route.ts"), "utf8");

    expect(callback).toContain('new URL("/admin/integrations/google", req.url)');
    expect(callback).not.toContain("connected=1");
  });
});
