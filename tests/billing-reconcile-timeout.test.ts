import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/db";
import { getEntitlement } from "@/lib/entitlement";
import { PROVIDER_UNAVAILABLE } from "@/lib/http/timed-fetch";
import { refreshAndReconcile } from "@/lib/payments/reconciliation";

const getSubscription = vi.fn();

vi.mock("@/lib/payments", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/payments")>();
  return {
    ...actual,
    getPaymentProvider: () => ({
      getSubscription,
    }),
  };
});

describe("reconciliation Dodo GET timeout", () => {
  const stamp = Date.now();
  const created: string[] = [];

  afterEach(() => {
    getSubscription.mockReset();
  });

  afterAll(async () => {
    if (!created.length) return;
    await prisma.paymentSubscription.deleteMany({ where: { userId: { in: created } } }).catch(() => {});
    await prisma.entitlement.deleteMany({ where: { userId: { in: created } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: created } } }).catch(() => {});
  });

  it("does not mutate local entitlement or subscription when getSubscription times out", async () => {
    const user = await prisma.user.create({
      data: { email: `recon-timeout-${stamp}@example.com` },
    });
    created.push(user.id);
    const subId = `sub_recon_timeout_${stamp}`;
    const periodEnd = new Date(Date.now() + 20 * 86400000);
    const watermark = new Date("2026-08-01T00:00:00.000Z");
    await prisma.entitlement.create({
      data: {
        userId: user.id,
        plan: "PREMIUM",
        status: "ACTIVE",
        source: "dodo",
        providerSubscriptionId: subId,
        currentPeriodEnd: periodEnd,
        providerUpdatedAt: watermark,
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
        cancelAtPeriodEnd: false,
        providerUpdatedAt: watermark,
      },
    });

    getSubscription.mockRejectedValueOnce(new Error(PROVIDER_UNAVAILABLE));
    await refreshAndReconcile(user.id);
    expect(getSubscription).toHaveBeenCalledTimes(1);

    const ent = await prisma.entitlement.findUnique({ where: { userId: user.id } });
    const sub = await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } });
    expect(ent).toMatchObject({
      plan: "PREMIUM",
      status: "ACTIVE",
      providerSubscriptionId: subId,
    });
    expect(ent?.providerUpdatedAt?.toISOString()).toBe(watermark.toISOString());
    expect(sub).toMatchObject({ status: "active", cancelAtPeriodEnd: false });
    expect(sub?.providerUpdatedAt?.toISOString()).toBe(watermark.toISOString());
    expect((await getEntitlement(user.id)).plan).toBe("PREMIUM");
  });
});
