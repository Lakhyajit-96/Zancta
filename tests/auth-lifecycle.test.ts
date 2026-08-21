import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { gatedPrismaAdapter, verifyCredentialsUser, ensureOAuthEntitlement } from "@/lib/auth";
import { signOAuthIntent, verifyOAuthIntent } from "@/lib/oauth-intent";
import {
  hashProviderIdentity,
  recordDeletedProviderIdentities,
  consumeDeletedProviderIdentity,
  hasDeletedProviderIdentity,
} from "@/lib/deleted-identity";
import type { Adapter } from "next-auth/adapters";

(process.env as Record<string, string | undefined>).NODE_ENV = "test";
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

const ts = Date.now();
const ids: string[] = [];

describe("OAuth intent HMAC (server-authoritative, not a query param)", () => {
  it("signs and verifies signup vs signin", () => {
    const now = 1_700_000_000;
    expect(verifyOAuthIntent(signOAuthIntent("signup", now), now)).toBe("signup");
    expect(verifyOAuthIntent(signOAuthIntent("signin", now), now)).toBe("signin");
  });

  it("rejects missing, truncated, and tampered cookies", () => {
    expect(verifyOAuthIntent(null)).toBeNull();
    expect(verifyOAuthIntent("signup")).toBeNull();
    expect(verifyOAuthIntent("intent=signup")).toBeNull();
    const raw = signOAuthIntent("signup");
    const flipped = raw.slice(0, -2) + (raw.endsWith("aa") ? "bb" : "aa");
    expect(verifyOAuthIntent(flipped)).toBeNull();
  });

  it("rejects expired intent", () => {
    const now = 1_700_000_000;
    const token = signOAuthIntent("signup", now);
    expect(verifyOAuthIntent(token, now + 11 * 60)).toBeNull();
  });

  it("does not treat a client query string as authorization to create", () => {
    expect(verifyOAuthIntent("signup")).toBeNull();
    expect(verifyOAuthIntent("signin")).toBeNull();
  });
});

describe("Deleted provider identity (hashed, no tokens)", () => {
  const provider = "google";
  const providerAccountId = `pid-${ts}-deleted`;

  afterAll(async () => {
    const identityHash = hashProviderIdentity(provider, providerAccountId);
    await prisma.deletedProviderIdentity.deleteMany({ where: { identityHash } }).catch(() => {});
    const githubHash = hashProviderIdentity("github", `gh-${ts}`);
    await prisma.deletedProviderIdentity.deleteMany({ where: { identityHash: githubHash } }).catch(() => {});
  });

  it("HMAC hash is not the raw provider account id and stores no tokens", async () => {
    const hash = hashProviderIdentity(provider, providerAccountId);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toBe(providerAccountId);
    expect(hash.toLowerCase()).not.toContain(providerAccountId.toLowerCase());
    await recordDeletedProviderIdentities([{ provider, providerAccountId }]);
    const row = await prisma.deletedProviderIdentity.findUnique({ where: { identityHash: hash } });
    expect(row).not.toBeNull();
    expect(row?.provider).toBe("google");
    expect(JSON.stringify(row)).not.toMatch(/access_token|refresh_token/i);
  });

  it("skips credentials provider ids", async () => {
    const before = await prisma.deletedProviderIdentity.count();
    await recordDeletedProviderIdentities([{ provider: "credentials", providerAccountId: "user-1" }]);
    expect(await prisma.deletedProviderIdentity.count()).toBe(before);
  });

  it("consume removes the tombstone so explicit re-registration can proceed", async () => {
    await recordDeletedProviderIdentities([{ provider: "github", providerAccountId: `gh-${ts}` }]);
    expect(await hasDeletedProviderIdentity("github", `gh-${ts}`)).toBe(true);
    expect(await consumeDeletedProviderIdentity("github", `gh-${ts}`)).toBe(true);
    expect(await hasDeletedProviderIdentity("github", `gh-${ts}`)).toBe(false);
  });
});

describe("Gated Prisma adapter — Sign In must not create users", () => {
  it("createUser without signup intent does not persist a user", async () => {
    const created: unknown[] = [];
    const adapter = gatedPrismaAdapter(
      {
        createUser: async (data) => {
          created.push(data);
          return { id: "should-not", email: data.email ?? null, emailVerified: null };
        },
      } as Adapter,
      async () => "signin"
    );
    await expect(adapter.createUser!({ id: "pending", email: `ghost-${ts}@example.com`, emailVerified: null })).rejects.toMatchObject({
      name: "OAuthAccountNotFound",
    });
    expect(created).toHaveLength(0);
  });

  it("createUser with missing intent does not persist a user", async () => {
    const created: unknown[] = [];
    const adapter = gatedPrismaAdapter(
      {
        createUser: async (data) => {
          created.push(data);
          return { id: "should-not", email: data.email ?? null, emailVerified: null };
        },
      } as Adapter,
      async () => null
    );
    await expect(adapter.createUser!({ id: "pending", email: `ghost2-${ts}@example.com`, emailVerified: null })).rejects.toMatchObject({
      name: "OAuthAccountNotFound",
    });
    expect(created).toHaveLength(0);
  });

  it("createUser with signup intent delegates to the adapter", async () => {
    const adapter = gatedPrismaAdapter(
      {
        createUser: async (data) => ({ id: "new-user", email: data.email ?? null, emailVerified: null }),
      } as Adapter,
      async () => "signup"
    );
    const user = await adapter.createUser!({ id: "pending", email: `ok-${ts}@example.com`, emailVerified: null });
    expect(user.id).toBe("new-user");
  });

  it("linkAccount with a deleted identity is blocked on sign-in intent", async () => {
    const pid = `block-${ts}`;
    await recordDeletedProviderIdentities([{ provider: "google", providerAccountId: pid }]);
    const adapter = gatedPrismaAdapter(
      { linkAccount: async (account) => account } as Adapter,
      async () => "signin"
    );
    await expect(
      adapter.linkAccount!({
        userId: "u",
        type: "oauth",
        provider: "google",
        providerAccountId: pid,
      })
    ).rejects.toMatchObject({ name: "OAuthAccountDeleted" });
    await prisma.deletedProviderIdentity.deleteMany({
      where: { identityHash: hashProviderIdentity("google", pid) },
    });
  });

  it("linkAccount with signup intent consumes the tombstone (explicit re-registration)", async () => {
    const pid = `rereg-${ts}`;
    await recordDeletedProviderIdentities([{ provider: "github", providerAccountId: pid }]);
    const adapter = gatedPrismaAdapter(
      { linkAccount: async (account) => account } as Adapter,
      async () => "signup"
    );
    await adapter.linkAccount!({
      userId: "u",
      type: "oauth",
      provider: "github",
      providerAccountId: pid,
    });
    expect(await hasDeletedProviderIdentity("github", pid)).toBe(false);
  });
});

describe("Credentials lifecycle", () => {
  const password = "Test12345!";
  const unknownEmail = `cred-unknown-${ts}@example.com`;
  const signupEmail = `cred-signup-${ts}@example.com`;
  let existingEmail = "";
  let existingId = "";

  beforeAll(async () => {
    existingEmail = `cred-existing-${ts}@example.com`;
    const hash = await bcrypt.hash(password, 12);
    const u = await prisma.user.create({
      data: { email: existingEmail, passwordHash: hash, emailVerified: new Date() },
    });
    existingId = u.id;
    ids.push(u.id);
    await prisma.entitlement.create({ data: { userId: u.id, plan: "FREE", status: "ACTIVE" } });
  });

  afterAll(async () => {
    await prisma.entitlement.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.auditEvent.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.account.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.session.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: ids } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { email: signupEmail } }).catch(() => {});
  });

  it("1. unknown credentials sign-in does not create a user", async () => {
    const before = await prisma.user.count({ where: { email: unknownEmail } });
    const result = await verifyCredentialsUser(unknownEmail, password);
    expect(result).toBeNull();
    expect(await prisma.user.count({ where: { email: unknownEmail } })).toBe(before);
  });

  it("2. credentials signup creates a user and FREE entitlement", async () => {
    const { POST } = await import("@/app/api/auth/signup/route");
    const req = new NextRequest("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "10.8.0.1" },
      body: JSON.stringify({ email: signupEmail, password, name: "Signup" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const user = await prisma.user.findUnique({ where: { email: signupEmail } });
    expect(user).not.toBeNull();
    ids.push(user!.id);
    const ent = await prisma.entitlement.findUnique({ where: { userId: user!.id } });
    expect(ent?.plan).toBe("FREE");
    expect(ent?.status).toBe("ACTIVE");
  });

  it("verified existing email signup returns a generic 200 and does not create a second user", async () => {
    const { POST } = await import("@/app/api/auth/signup/route");
    const before = await prisma.user.count({ where: { email: existingEmail } });
    const req = new NextRequest("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "10.8.0.2" },
      body: JSON.stringify({ email: existingEmail, password, name: "Dup" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.error).toBeUndefined();
    expect(body.message).toMatch(/check your inbox/i);
    expect(await prisma.user.count({ where: { email: existingEmail } })).toBe(before);
  });

  it("3. existing credentials sign-in succeeds", async () => {
    const result = await verifyCredentialsUser(existingEmail, password);
    expect(result?.id).toBe(existingId);
    expect(result?.email).toBe(existingEmail);
  });

  it("wrong password and unknown email both return null (no extra enumeration)", async () => {
    expect(await verifyCredentialsUser(existingEmail, "wrong-password")).toBeNull();
    expect(await verifyCredentialsUser(unknownEmail, password)).toBeNull();
  });

  it("deleted credentials account cannot silently recreate via sign-in", async () => {
    const email = `cred-deleted-${ts}@example.com`;
    const hash = await bcrypt.hash(password, 12);
    const u = await prisma.user.create({ data: { email, passwordHash: hash, emailVerified: new Date() } });
    await prisma.user.delete({ where: { id: u.id } });
    expect(await verifyCredentialsUser(email, password)).toBeNull();
    expect(await prisma.user.findUnique({ where: { email } })).toBeNull();
  });
});

describe("OAuth account isolation and linking policy", () => {
  let aId = "";
  let bId = "";

  beforeAll(async () => {
    const a = await prisma.user.create({ data: { email: `iso-a-${ts}@example.com`, emailVerified: new Date() } });
    const b = await prisma.user.create({ data: { email: `iso-b-${ts}@example.com`, emailVerified: new Date() } });
    aId = a.id;
    bId = b.id;
    ids.push(a.id, b.id);
    await prisma.account.create({
      data: { userId: a.id, type: "oauth", provider: "google", providerAccountId: `google-a-${ts}` },
    });
    await prisma.account.create({
      data: { userId: b.id, type: "oauth", provider: "github", providerAccountId: `github-b-${ts}` },
    });
  });

  it("15. provider accounts stay isolated to their user", async () => {
    const google = await prisma.account.findUnique({
      where: { provider_providerAccountId: { provider: "google", providerAccountId: `google-a-${ts}` } },
    });
    const github = await prisma.account.findUnique({
      where: { provider_providerAccountId: { provider: "github", providerAccountId: `github-b-${ts}` } },
    });
    expect(google?.userId).toBe(aId);
    expect(github?.userId).toBe(bId);
    expect(google?.userId).not.toBe(github?.userId);
  });

  it("duplicate provider account cannot attach to a second user", async () => {
    await expect(
      prisma.account.create({
        data: { userId: bId, type: "oauth", provider: "google", providerAccountId: `google-a-${ts}` },
      })
    ).rejects.toThrow();
  });

  it("16. dangerous email account linking is not enabled", async () => {
    const src = await readFile(path.join(process.cwd(), "lib/auth.ts"), "utf8");
    expect(src).not.toMatch(/allowDangerousEmailAccountLinking\s*:\s*true/);
  });

  it("OAuth signup entitlement is FREE, never PREMIUM", async () => {
    const u = await prisma.user.create({ data: { email: `oauth-free-${ts}@example.com` } });
    ids.push(u.id);
    await ensureOAuthEntitlement(u.id);
    const ent = await prisma.entitlement.findUnique({ where: { userId: u.id } });
    expect(ent?.plan).toBe("FREE");
    expect(ent?.status).toBe("ACTIVE");
  });
});

describe("OAuth intent HTTP endpoint", () => {
  it("sets an HttpOnly intent cookie for signup and signin only", async () => {
    const { POST } = await import("@/app/api/auth/oauth-intent/route");
    const req = new NextRequest("http://localhost:3000/api/auth/oauth-intent", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "10.8.0.2" },
      body: JSON.stringify({ intent: "signin" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const cookie = res.cookies.get("zancta.oauth-intent") || res.cookies.get("__Host-zancta.oauth-intent");
    expect(cookie?.value).toBeTruthy();
    expect(verifyOAuthIntent(cookie?.value)).toBe("signin");
  });

  it("rejects a client-supplied create flag that is not a valid intent", async () => {
    const { POST } = await import("@/app/api/auth/oauth-intent/route");
    const req = new NextRequest("http://localhost:3000/api/auth/oauth-intent", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "10.8.0.3" },
      body: JSON.stringify({ intent: "create-account" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
