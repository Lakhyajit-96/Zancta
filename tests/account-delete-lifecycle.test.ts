import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { hashProviderIdentity } from "@/lib/deleted-identity";

const state = { userId: "" };
const cancel = vi.fn(async () => {});
const getSub = vi.fn(async () => ({ cancelAtPeriodEnd: true, status: "cancelled" }));

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    auth: async () => (state.userId ? { user: { id: state.userId } } : null),
  };
});

vi.mock("@/lib/payments", () => ({
  getPaymentProvider: () => ({
    cancelSubscription: cancel,
    getSubscription: getSub,
  }),
}));

(process.env as Record<string, string | undefined>).NODE_ENV = "test";
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

describe("Account deletion lifecycle", () => {
  const ts = Date.now();
  const password = "Test12345!";
  let oauthUserId = "";
  let premiumUserId = "";
  const googlePid = `del-google-${ts}`;
  const githubPid = `del-github-${ts}`;

  beforeAll(async () => {
    const hash = await bcrypt.hash(password, 12);
    const oauth = await prisma.user.create({
      data: { email: `del-oauth-${ts}@example.com`, passwordHash: hash, emailVerified: new Date() },
    });
    oauthUserId = oauth.id;
    await prisma.entitlement.create({ data: { userId: oauth.id, plan: "FREE", status: "ACTIVE" } });
    await prisma.account.create({
      data: { userId: oauth.id, type: "oauth", provider: "google", providerAccountId: googlePid },
    });
    await prisma.account.create({
      data: { userId: oauth.id, type: "oauth", provider: "github", providerAccountId: githubPid },
    });
    await prisma.session.create({
      data: {
        sessionToken: `sess-${ts}`,
        userId: oauth.id,
        expires: new Date(Date.now() + 86400000),
      },
    });

    const premium = await prisma.user.create({
      data: { email: `del-prem-${ts}@example.com`, passwordHash: hash, emailVerified: new Date() },
    });
    premiumUserId = premium.id;
    await prisma.entitlement.create({
      data: { userId: premium.id, plan: "PREMIUM", status: "ACTIVE", source: "DODO" },
    });
    await prisma.paymentSubscription.create({
      data: {
        userId: premium.id,
        provider: "dodo",
        providerSubscriptionId: `sub_${ts}`,
        plan: "PREMIUM_MONTHLY",
        status: "active",
      },
    });
  });

  afterAll(async () => {
    await prisma.deletedProviderIdentity.deleteMany({
      where: {
        identityHash: {
          in: [hashProviderIdentity("google", googlePid), hashProviderIdentity("github", githubPid)],
        },
      },
    }).catch(() => {});
    await prisma.session.deleteMany({ where: { userId: { in: [oauthUserId, premiumUserId] } } }).catch(() => {});
    await prisma.account.deleteMany({ where: { userId: { in: [oauthUserId, premiumUserId] } } }).catch(() => {});
    await prisma.paymentSubscription.deleteMany({ where: { userId: { in: [oauthUserId, premiumUserId] } } }).catch(() => {});
    await prisma.entitlement.deleteMany({ where: { userId: { in: [oauthUserId, premiumUserId] } } }).catch(() => {});
    await prisma.auditEvent.deleteMany({ where: { userId: { in: [oauthUserId, premiumUserId] } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [oauthUserId, premiumUserId] } } }).catch(() => {});
  });

  it("10-13. delete records hashed identities, drops sessions, and does not keep the user", async () => {
    state.userId = oauthUserId;
    const { POST } = await import("@/app/api/account/delete/route");
    const req = new NextRequest("http://localhost:3000/api/account/delete", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "10.9.0.1" },
      body: JSON.stringify({ confirm: "DELETE" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(await prisma.user.findUnique({ where: { id: oauthUserId } })).toBeNull();
    expect(await prisma.session.count({ where: { userId: oauthUserId } })).toBe(0);
    expect(await prisma.account.count({ where: { userId: oauthUserId } })).toBe(0);
    expect(await prisma.deletedProviderIdentity.findUnique({
      where: { identityHash: hashProviderIdentity("google", googlePid) },
    })).not.toBeNull();
    expect(await prisma.deletedProviderIdentity.findUnique({
      where: { identityHash: hashProviderIdentity("github", githubPid) },
    })).not.toBeNull();
  });

  it("14. premium deletion cancels the provider subscription before removing the account", async () => {
    state.userId = premiumUserId;
    cancel.mockClear();
    getSub.mockClear();
    const { POST } = await import("@/app/api/account/delete/route");
    const req = new NextRequest("http://localhost:3000/api/account/delete", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "10.9.0.2" },
      body: JSON.stringify({ confirm: "DELETE" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(cancel).toHaveBeenCalledWith(`sub_${ts}`, true);
    expect(getSub).toHaveBeenCalledWith(`sub_${ts}`);
    expect(await prisma.user.findUnique({ where: { id: premiumUserId } })).toBeNull();
  });
});
