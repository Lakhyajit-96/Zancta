import { describe, it, expect, afterEach, vi, afterAll, beforeAll } from "vitest";
import prisma from "@/lib/db";
import { describeAuthError } from "@/lib/auth-errors";

describe("OAuth error messages — safe, no internals leaked", () => {
  it("maps linking conflict to a password-signin hint", () => {
    expect(describeAuthError("OAuthAccountNotLinked")).toMatch(/already registered with a password/i);
  });
  it("maps missing OAuth account on sign-in to create-account guidance", () => {
    expect(describeAuthError("OAuthAccountNotFound")).toMatch(/Create an account first/i);
    expect(describeAuthError("OAuthCreateAccount")).toMatch(/Create an account first/i);
    expect(describeAuthError("OAuthCreateAccount", { page: "signup" })).toMatch(/couldn't create/i);
  });
  it("maps deleted OAuth identity to explicit re-registration, not resurrection", () => {
    expect(describeAuthError("OAuthAccountDeleted")).toMatch(/no longer exists/i);
    expect(describeAuthError("OAuthAccountDeleted", { page: "signup" })).toMatch(/couldn't create/i);
  });
  it("maps provider failures to a generic safe message", () => {
    for (const code of ["OAuthSignin", "OAuthCallback", "OAuthCallbackError", "CallbackRouteError"]) {
      const msg = describeAuthError(code);
      expect(msg).toBeTruthy();
      // Must not echo the error code or provider internals
      expect(msg).not.toContain(code);
      expect(msg).not.toMatch(/token|secret|stack/i);
    }
  });
  it("maps cancellation and missing config safely", () => {
    expect(describeAuthError("AccessDenied")).toMatch(/cancelled/i);
    expect(describeAuthError("Configuration")).toMatch(/temporarily unavailable/i);
    expect(describeAuthError("SomethingUnknown")).toMatch(/couldn't sign you in/i);
  });
  it("returns null when there is no error", () => {
    expect(describeAuthError(null)).toBeNull();
    expect(describeAuthError(undefined)).toBeNull();
    expect(describeAuthError("")).toBeNull();
  });
});

describe("OAuth provider env gating", () => {
  const ORIGINAL = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL };
    vi.resetModules();
  });

  it("registers both providers when all credentials exist", async () => {
    process.env.GOOGLE_CLIENT_ID = "google-id";
    process.env.GOOGLE_CLIENT_SECRET = "google-secret";
    process.env.GITHUB_CLIENT_ID = "github-id";
    process.env.GITHUB_CLIENT_SECRET = "github-secret";
    vi.resetModules();
    const { hasGoogleOAuth, hasGitHubOAuth } = await import("@/lib/auth");
    expect(hasGoogleOAuth()).toBe(true);
    expect(hasGitHubOAuth()).toBe(true);
  });

  it("withholds a provider when its secret is missing", async () => {
    process.env.GOOGLE_CLIENT_ID = "google-id";
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GITHUB_CLIENT_ID;
    process.env.GITHUB_CLIENT_SECRET = "github-secret";
    vi.resetModules();
    const { hasGoogleOAuth, hasGitHubOAuth } = await import("@/lib/auth");
    expect(hasGoogleOAuth()).toBe(false);
    expect(hasGitHubOAuth()).toBe(false);
  });
});

describe("OAuth entitlement behavior", () => {
  const email = `oauth-ent-${Date.now()}@example.com`;
  let userId: string;

  beforeAll(async () => {
    const u = await prisma.user.create({ data: { email, name: "OAuth Test", emailVerified: new Date() } });
    userId = u.id;
  });

  afterAll(async () => {
    await prisma.auditEvent.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.entitlement.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  });

  it("creates FREE/ACTIVE entitlement for a new OAuth user — never PREMIUM", async () => {
    const { ensureOAuthEntitlement } = await import("@/lib/auth");
    await ensureOAuthEntitlement(userId);
    const ent = await prisma.entitlement.findUnique({ where: { userId } });
    expect(ent).not.toBeNull();
    expect(ent?.plan).toBe("FREE");
    expect(ent?.status).toBe("ACTIVE");
    expect(ent?.source).toBe("OAUTH");
    expect(["PREMIUM", "ADMIN"]).not.toContain(ent?.plan);
  });

  it("does not overwrite an existing entitlement", async () => {
    const { ensureOAuthEntitlement } = await import("@/lib/auth");
    await prisma.entitlement.update({ where: { userId }, data: { plan: "PREMIUM" } });
    await ensureOAuthEntitlement(userId);
    const ent = await prisma.entitlement.findUnique({ where: { userId } });
    expect(ent?.plan).toBe("PREMIUM");
  });
});
