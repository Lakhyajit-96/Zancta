import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import prisma from "@/lib/db";

const state = { userId: "" };
const cancelSub = vi.fn(async () => {});
const getSub = vi.fn(async (id: string) => ({
  providerSubscriptionId: id,
  status: "cancelled",
  cancelAtPeriodEnd: true,
  currentPeriodEnd: new Date(Date.now() + 14 * 86400000),
}));

vi.mock("@/lib/auth", () => ({
  auth: async () => (state.userId ? { user: { id: state.userId } } : null),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimitAsync: async () => ({ ok: true, remaining: 4, resetAt: Date.now() + 1000 }),
}));

vi.mock("@/lib/payments", () => ({
  getPaymentProvider: () => ({
    cancelSubscription: cancelSub,
    getSubscription: getSub,
  }),
}));

const stamp = Date.now();
const createdUsers: string[] = [];

async function createUser(label: string) {
  const user = await prisma.user.create({ data: { email: `cancel-own-${label}-${stamp}@example.com` } });
  createdUsers.push(user.id);
  return user.id;
}

async function postCancel(userId: string, body: Record<string, unknown> = { confirm: true }) {
  state.userId = userId;
  const { POST } = await import("@/app/api/payments/cancel/route");
  const req = new NextRequest("http://localhost:3000/api/payments/cancel", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return POST(req);
}

describe("P2-PAY-2 cancellation subscription ownership", () => {
  beforeEach(() => {
    cancelSub.mockClear();
    getSub.mockClear();
    getSub.mockImplementation(async (id: string) => ({
      providerSubscriptionId: id,
      status: "cancelled",
      cancelAtPeriodEnd: true,
      currentPeriodEnd: new Date(Date.now() + 14 * 86400000),
    }));
    cancelSub.mockImplementation(async () => {});
    state.userId = "";
  });

  afterAll(async () => {
    if (!createdUsers.length) return;
    await prisma.paymentSubscription.deleteMany({ where: { userId: { in: createdUsers } } }).catch(() => {});
    await prisma.paymentCustomer.deleteMany({ where: { userId: { in: createdUsers } } }).catch(() => {});
    await prisma.entitlement.deleteMany({ where: { userId: { in: createdUsers } } }).catch(() => {});
    await prisma.auditEvent.deleteMany({ where: { userId: { in: createdUsers } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: createdUsers } } }).catch(() => {});
  });

  it("1. authenticated user cancels own subscription", async () => {
    const userId = await createUser("own");
    const subId = `sub_own_${stamp}`;
    const periodEnd = new Date(Date.now() + 20 * 86400000);
    await prisma.entitlement.create({
      data: { userId, plan: "PREMIUM", status: "ACTIVE", source: "dodo", providerSubscriptionId: subId, currentPeriodEnd: periodEnd },
    });
    await prisma.paymentSubscription.create({
      data: { userId, provider: "dodo", providerSubscriptionId: subId, plan: "PREMIUM_MONTHLY", status: "active", currentPeriodEnd: periodEnd },
    });

    const res = await postCancel(userId);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, cancelAtPeriodEnd: true });
    expect(cancelSub).toHaveBeenCalledTimes(1);
    expect(cancelSub).toHaveBeenCalledWith(subId, true);
    expect((await prisma.entitlement.findUnique({ where: { userId } }))?.cancelAtPeriodEnd).toBe(true);
    expect((await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } }))?.cancelAtPeriodEnd).toBe(true);
  });

  it("2. entitlement provider ID is ownership-verified before the provider call", async () => {
    const userId = await createUser("ent_id");
    const subId = `sub_ent_${stamp}`;
    await prisma.entitlement.create({
      data: { userId, plan: "PREMIUM", status: "ACTIVE", source: "dodo", providerSubscriptionId: subId },
    });
    await prisma.paymentSubscription.create({
      data: { userId, provider: "dodo", providerSubscriptionId: subId, plan: "PREMIUM_MONTHLY", status: "active" },
    });

    const res = await postCancel(userId, { confirm: true, subscriptionId: "sub_ignored", userId: "other" });
    expect(res.status).toBe(200);
    expect(cancelSub).toHaveBeenCalledTimes(1);
    expect(cancelSub).toHaveBeenCalledWith(subId, true);
  });

  it("3. entitlement provider ID pointing at another user's subscription does not call the provider", async () => {
    const victimId = await createUser("victim_ent");
    const attackerId = await createUser("attacker_ent");
    const victimSub = `sub_victim_ent_${stamp}`;
    await prisma.entitlement.create({
      data: { userId: victimId, plan: "PREMIUM", status: "ACTIVE", source: "dodo", providerSubscriptionId: victimSub },
    });
    await prisma.paymentSubscription.create({
      data: { userId: victimId, provider: "dodo", providerSubscriptionId: victimSub, plan: "PREMIUM_MONTHLY", status: "active" },
    });
    await prisma.entitlement.create({
      data: { userId: attackerId, plan: "PREMIUM", status: "ACTIVE", source: "dodo", providerSubscriptionId: victimSub },
    });

    const res = await postCancel(attackerId);
    const body = await res.json() as { error?: string };
    expect(res.status).toBe(404);
    expect(body.error).toBe("No subscription to cancel");
    expect(JSON.stringify(body)).not.toContain(victimSub);
    expect(JSON.stringify(body)).not.toContain(victimId);
    expect(cancelSub).not.toHaveBeenCalled();
    expect(getSub).not.toHaveBeenCalled();
    expect((await prisma.entitlement.findUnique({ where: { userId: attackerId } }))?.cancelAtPeriodEnd).toBe(false);
    expect((await prisma.entitlement.findUnique({ where: { userId: victimId } }))?.cancelAtPeriodEnd).toBe(false);
    expect((await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: victimSub } }))?.userId).toBe(victimId);
    expect((await prisma.auditEvent.findFirst({ where: { userId: attackerId, action: "payment.cancel_refused_unowned" } }))).toBeTruthy();
  });

  it("4. fallback cannot select another user's PaymentSubscription", async () => {
    const victimId = await createUser("victim_fb");
    const attackerId = await createUser("attacker_fb");
    const victimSub = `sub_victim_fb_${stamp}`;
    await prisma.entitlement.create({
      data: { userId: victimId, plan: "PREMIUM", status: "ACTIVE", source: "dodo", providerSubscriptionId: victimSub },
    });
    await prisma.paymentSubscription.create({
      data: { userId: victimId, provider: "dodo", providerSubscriptionId: victimSub, plan: "PREMIUM_MONTHLY", status: "active" },
    });
    await prisma.entitlement.create({
      data: { userId: attackerId, plan: "PREMIUM", status: "ACTIVE", source: "dodo" },
    });

    const res = await postCancel(attackerId);
    expect(res.status).toBe(404);
    expect(cancelSub).not.toHaveBeenCalled();
    expect((await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: victimSub } }))?.cancelAtPeriodEnd).toBe(false);
    expect((await prisma.entitlement.findUnique({ where: { userId: attackerId } }))?.cancelAtPeriodEnd).toBe(false);
  });

  it("5. fallback finds the caller's latest subscription and calls the provider", async () => {
    const userId = await createUser("fallback");
    const older = `sub_fb_old_${stamp}`;
    const latest = `sub_fb_new_${stamp}`;
    await prisma.entitlement.create({
      data: { userId, plan: "PREMIUM", status: "ACTIVE", source: "dodo" },
    });
    await prisma.paymentSubscription.create({
      data: {
        userId,
        provider: "dodo",
        providerSubscriptionId: older,
        plan: "PREMIUM_MONTHLY",
        status: "cancelled",
        updatedAt: new Date(Date.now() - 60_000),
      },
    });
    await prisma.paymentSubscription.create({
      data: { userId, provider: "dodo", providerSubscriptionId: latest, plan: "PREMIUM_MONTHLY", status: "active" },
    });

    const res = await postCancel(userId);
    expect(res.status).toBe(200);
    expect(cancelSub).toHaveBeenCalledWith(latest, true);
    expect(cancelSub).not.toHaveBeenCalledWith(older, true);
  });

  it("6. no subscription returns the existing safe 404", async () => {
    const userId = await createUser("none");
    await prisma.entitlement.create({
      data: { userId, plan: "PREMIUM", status: "ACTIVE", source: "dodo" },
    });
    const res = await postCancel(userId);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "No subscription to cancel" });
    expect(cancelSub).not.toHaveBeenCalled();
    expect((await prisma.entitlement.findUnique({ where: { userId } }))?.plan).toBe("PREMIUM");
  });

  it("7. ADMIN cancellation is rejected and entitlement is unchanged", async () => {
    const userId = await createUser("admin");
    const subId = `sub_admin_cancel_${stamp}`;
    await prisma.entitlement.create({
      data: { userId, plan: "ADMIN", status: "ACTIVE", source: "OPERATOR_BOOTSTRAP", providerSubscriptionId: subId },
    });
    await prisma.paymentSubscription.create({
      data: { userId, provider: "dodo", providerSubscriptionId: subId, plan: "PREMIUM_MONTHLY", status: "active" },
    });

    const res = await postCancel(userId);
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "No active Premium subscription" });
    expect(cancelSub).not.toHaveBeenCalled();
    const row = await prisma.entitlement.findUnique({ where: { userId } });
    expect(row?.plan).toBe("ADMIN");
    expect(row?.status).toBe("ACTIVE");
    expect(row?.source).toBe("OPERATOR_BOOTSTRAP");
    expect(row?.cancelAtPeriodEnd).toBe(false);
  });

  it("8. provider failure leaves Premium intact", async () => {
    const userId = await createUser("fail");
    const subId = `sub_fail_${stamp}`;
    await prisma.entitlement.create({
      data: { userId, plan: "PREMIUM", status: "ACTIVE", source: "dodo", providerSubscriptionId: subId },
    });
    await prisma.paymentSubscription.create({
      data: { userId, provider: "dodo", providerSubscriptionId: subId, plan: "PREMIUM_MONTHLY", status: "active" },
    });
    cancelSub.mockRejectedValueOnce(new Error("provider down"));

    await expect(postCancel(userId)).rejects.toThrow(/provider down/);
    expect((await prisma.entitlement.findUnique({ where: { userId } }))).toMatchObject({
      plan: "PREMIUM",
      status: "ACTIVE",
      cancelAtPeriodEnd: false,
    });
    expect((await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } }))?.cancelAtPeriodEnd).toBe(false);
  });

  it("9. duplicate cancellation is idempotent and does not call the provider again", async () => {
    const userId = await createUser("dup");
    const subId = `sub_dup_${stamp}`;
    await prisma.entitlement.create({
      data: { userId, plan: "PREMIUM", status: "ACTIVE", source: "dodo", providerSubscriptionId: subId, cancelAtPeriodEnd: true },
    });
    await prisma.paymentSubscription.create({
      data: { userId, provider: "dodo", providerSubscriptionId: subId, plan: "PREMIUM_MONTHLY", status: "cancelled", cancelAtPeriodEnd: true },
    });

    const res = await postCancel(userId);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, cancelAtPeriodEnd: true, already: true });
    expect(cancelSub).not.toHaveBeenCalled();
  });
});
