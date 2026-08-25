import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { disableLivePaymentMutations, enableLivePaymentMutations, restoreLivePaymentEnv, snapshotLivePaymentEnv } from "./live-payment-env";

const state = { userId: "" };
const createCheckout = vi.fn(async () => ({
  checkoutUrl: "https://example.test/checkout",
  providerCheckoutId: "chk_test",
  provider: "dodo" as const,
}));

vi.mock("@/lib/auth", () => ({
  auth: async () => (state.userId ? { user: { id: state.userId, email: "checkout@example.com" } } : null),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimitAsync: async () => ({ ok: true, remaining: 9, resetAt: Date.now() + 1000 }),
  getClientIp: () => "10.0.0.1",
}));

vi.mock("@/lib/payments", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/payments")>();
  return {
    ...actual,
    getPaymentProvider: () => ({
      name: "dodo" as const,
      createCheckout,
      cancelSubscription: async () => {
        throw new Error("cancel must not be reached from checkout");
      },
      getSubscription: async () => null,
      getPayment: async () => null,
      refundPayment: async () => {
        throw new Error("refund must not be reached from checkout");
      },
      verifyWebhook: async () => ({ ok: false, provider: "dodo" as const, eventType: "unknown", providerEventId: "unknown", payload: null }),
    }),
  };
});

const stamp = Date.now();
const createdUsers: string[] = [];

async function createVerifiedUser(label: string) {
  const user = await prisma.user.create({
    data: {
      email: `checkout-gate-${label}-${stamp}@example.com`,
      emailVerified: new Date(),
    },
  });
  createdUsers.push(user.id);
  return user;
}

async function postCheckout(userId: string | "", body: Record<string, unknown> = { planId: "PREMIUM_MONTHLY" }) {
  state.userId = userId;
  const { POST } = await import("@/app/api/payments/checkout/route");
  const req = new NextRequest("http://localhost:3000/api/payments/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return POST(req);
}

describe("checkout live-gate and identity safety", () => {
  const prev = snapshotLivePaymentEnv();

  beforeEach(() => {
    createCheckout.mockClear();
    restoreLivePaymentEnv(prev);
    disableLivePaymentMutations();
    state.userId = "";
  });

  afterEach(() => {
    restoreLivePaymentEnv(prev);
  });

  afterAll(async () => {
    restoreLivePaymentEnv(prev);
    if (!createdUsers.length) return;
    await prisma.paymentCheckout.deleteMany({ where: { userId: { in: createdUsers } } }).catch(() => {});
    await prisma.paymentSubscription.deleteMany({ where: { userId: { in: createdUsers } } }).catch(() => {});
    await prisma.entitlement.deleteMany({ where: { userId: { in: createdUsers } } }).catch(() => {});
    await prisma.auditEvent.deleteMany({ where: { userId: { in: createdUsers } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: createdUsers } } }).catch(() => {});
  });

  it("unauthenticated POST cannot create checkout", async () => {
    const res = await postCheckout("");
    expect(res.status).toBe(401);
    expect(createCheckout).not.toHaveBeenCalled();
  });

  it("GET reports live=false under the default test gate", async () => {
    const { GET } = await import("@/app/api/payments/checkout/route");
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ live: false });
    expect(createCheckout).not.toHaveBeenCalled();
  });

  it("live=false never calls the provider", async () => {
    const user = await createVerifiedUser("free");
    await prisma.entitlement.create({ data: { userId: user.id, plan: "FREE", status: "ACTIVE" } });
    const res = await postCheckout(user.id);
    const json = await res.json() as { live?: boolean; error?: string; checkoutUrl?: string };
    expect(res.status).toBe(503);
    expect(json.live).toBe(false);
    expect(json.checkoutUrl).toBeUndefined();
    expect(JSON.stringify(json)).not.toMatch(/dodo|api[_-]?key|whsec_|Bearer/i);
    expect(createCheckout).not.toHaveBeenCalled();
  });

  it("ADMIN cannot start Premium checkout", async () => {
    const user = await createVerifiedUser("admin");
    await prisma.entitlement.create({
      data: { userId: user.id, plan: "ADMIN", status: "ACTIVE", source: "OPERATOR_BOOTSTRAP" },
    });
    enableLivePaymentMutations();
    const res = await postCheckout(user.id);
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "Operator accounts cannot start Premium checkout." });
    expect(createCheckout).not.toHaveBeenCalled();
    expect((await prisma.entitlement.findUnique({ where: { userId: user.id } }))?.plan).toBe("ADMIN");
  });

  it("existing Premium cannot create a duplicate checkout", async () => {
    const user = await createVerifiedUser("premium");
    const subId = `sub_prem_${stamp}`;
    const periodEnd = new Date(Date.now() + 20 * 86400000);
    await prisma.entitlement.create({
      data: {
        userId: user.id,
        plan: "PREMIUM",
        status: "ACTIVE",
        source: "dodo",
        providerSubscriptionId: subId,
        currentPeriodEnd: periodEnd,
      },
    });
    await prisma.paymentSubscription.create({
      data: {
        userId: user.id,
        provider: "dodo",
        providerSubscriptionId: subId,
        plan: "PREMIUM_MONTHLY",
        status: "active",
        currentPeriodEnd: periodEnd,
      },
    });
    enableLivePaymentMutations();
    const res = await postCheckout(user.id);
    expect(res.status).toBe(409);
    expect(createCheckout).not.toHaveBeenCalled();
  });

  it("client cannot control product, price, currency, or redirect URL", async () => {
    const user = await createVerifiedUser("client");
    await prisma.entitlement.create({ data: { userId: user.id, plan: "FREE", status: "ACTIVE" } });
    enableLivePaymentMutations();
    const res = await postCheckout(user.id, {
      planId: "PREMIUM_MONTHLY",
      productId: "pdt_attacker",
      amount: 1,
      currency: "USD",
      successUrl: "https://evil.example/steal",
      cancelUrl: "https://evil.example/cancel",
      provider: "attacker",
    });
    expect(res.status).toBe(200);
    expect(createCheckout).toHaveBeenCalledTimes(1);
    expect(createCheckout).toHaveBeenCalledWith({
      userId: user.id,
      email: user.email,
      planId: "PREMIUM_MONTHLY",
      currency: "INR",
    });
  });

  it("live=true + valid config permits the provider checkout call", async () => {
    const user = await createVerifiedUser("live");
    await prisma.entitlement.create({ data: { userId: user.id, plan: "FREE", status: "ACTIVE" } });
    enableLivePaymentMutations();
    const res = await postCheckout(user.id, { planId: "PREMIUM_ANNUAL" });
    expect(res.status).toBe(200);
    expect(createCheckout).toHaveBeenCalledWith({
      userId: user.id,
      email: user.email,
      planId: "PREMIUM_ANNUAL",
      currency: "INR",
    });
  });

  it("rejects unknown plan ids", async () => {
    const user = await createVerifiedUser("badplan");
    await prisma.entitlement.create({ data: { userId: user.id, plan: "FREE", status: "ACTIVE" } });
    enableLivePaymentMutations();
    const res = await postCheckout(user.id, { planId: "ENTERPRISE" });
    expect(res.status).toBe(400);
    expect(createCheckout).not.toHaveBeenCalled();
  });
});
