import { afterAll, describe, expect, it } from "vitest";
import prisma from "@/lib/db";
import { getEntitlement, hasEntitlement } from "@/lib/entitlement";
import { processVerifiedDodoEvent } from "@/lib/payments/process-dodo-event";
import { reconcileFromProvider } from "@/lib/payments/reconciliation";
import { revokeToFree } from "@/lib/payments/entitlement-sync";

const stamp = Date.now();
const createdUsers: string[] = [];

async function setupUser(label: string) {
  const user = await prisma.user.create({ data: { email: `period-end-${label}-${stamp}@example.com` } });
  createdUsers.push(user.id);
  return user.id;
}

async function runWebhook(
  userId: string,
  eventType: string,
  webhookId: string,
  data: Record<string, unknown>,
  ts = Math.floor(Date.now() / 1000),
) {
  const payload = {
    event_type: eventType,
    data: {
      metadata: { userId, planId: "PREMIUM_MONTHLY" },
      customer_id: `cus_period_${labelOf(userId)}`,
      ...data,
    },
  };
  return processVerifiedDodoEvent({
    webhookId,
    eventType,
    timestamp: String(ts),
    payload,
    rawBody: JSON.stringify(payload),
  });
}

function labelOf(userId: string) {
  return userId.slice(-8);
}

describe("P2-PAY-3 period-end enforcement for active/on_hold", () => {
  afterAll(async () => {
    if (!createdUsers.length) return;
    await prisma.webhookEvent.deleteMany({ where: { providerEventId: { startsWith: `wh_period_${stamp}` } } }).catch(() => {});
    await prisma.payment.deleteMany({ where: { userId: { in: createdUsers } } }).catch(() => {});
    await prisma.paymentSubscription.deleteMany({ where: { userId: { in: createdUsers } } }).catch(() => {});
    await prisma.paymentCustomer.deleteMany({ where: { userId: { in: createdUsers } } }).catch(() => {});
    await prisma.entitlement.deleteMany({ where: { userId: { in: createdUsers } } }).catch(() => {});
    await prisma.auditEvent.deleteMany({ where: { userId: { in: createdUsers } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: createdUsers } } }).catch(() => {});
  });

  it("active webhook with an open period grants Premium", async () => {
    const userId = await setupUser("open");
    await prisma.entitlement.create({ data: { userId, plan: "FREE", status: "ACTIVE" } });
    const subId = `sub_period_open_${stamp}`;
    const future = new Date(Date.now() + 20 * 86400000);
    const result = await runWebhook(userId, "subscription.active", `wh_period_${stamp}_open`, {
      subscription_id: subId,
      status: "active",
      current_period_end: future.toISOString(),
    });
    expect(result.ok).toBe(true);
    const ent = await getEntitlement(userId);
    expect(ent.plan).toBe("PREMIUM");
    expect(hasEntitlement(ent, "PREMIUM")).toBe(true);
  });

  it("active webhook with a past currentPeriodEnd does not create valid Premium", async () => {
    const userId = await setupUser("active_past");
    await prisma.entitlement.create({ data: { userId, plan: "FREE", status: "ACTIVE" } });
    const subId = `sub_period_active_past_${stamp}`;
    const past = new Date(Date.now() - 60_000);
    const result = await runWebhook(userId, "subscription.active", `wh_period_${stamp}_active_past`, {
      subscription_id: subId,
      status: "active",
      current_period_end: past.toISOString(),
    });
    expect(result.ok).toBe(true);
    const ent = await getEntitlement(userId);
    expect(ent.plan).not.toBe("PREMIUM");
    expect(hasEntitlement(ent, "PREMIUM")).toBe(false);
  });

  it("on_hold webhook after period end does not grant indefinite Premium", async () => {
    const userId = await setupUser("hold_past");
    await prisma.entitlement.create({ data: { userId, plan: "FREE", status: "ACTIVE" } });
    const subId = `sub_period_hold_${stamp}`;
    const past = new Date(Date.now() - 60_000);
    await runWebhook(userId, "subscription.on_hold", `wh_period_${stamp}_hold`, {
      subscription_id: subId,
      status: "on_hold",
      current_period_end: past.toISOString(),
    });
    const ent = await getEntitlement(userId);
    expect(ent.plan).not.toBe("PREMIUM");
    expect(hasEntitlement(ent, "PREMIUM")).toBe(false);
  });

  it("old active webhook cannot restore an expired entitlement", async () => {
    const userId = await setupUser("stale_restore");
    const subId = `sub_period_stale_${stamp}`;
    const past = new Date(Date.now() - 60_000);
    const newerTs = Math.floor(Date.now() / 1000);
    await prisma.entitlement.create({ data: { userId, plan: "FREE", status: "ACTIVE" } });
    await runWebhook(userId, "subscription.expired", `wh_period_${stamp}_expired_first`, {
      subscription_id: subId,
      status: "expired",
      current_period_end: past.toISOString(),
    }, newerTs);
    expect((await getEntitlement(userId)).plan).toBe("EXPIRED");

    const stale = await runWebhook(userId, "subscription.active", `wh_period_${stamp}_stale_active`, {
      subscription_id: subId,
      status: "active",
      current_period_end: past.toISOString(),
    }, newerTs - 3600);
    expect(stale).toMatchObject({ ok: true, stale: true });
    expect((await getEntitlement(userId)).plan).toBe("EXPIRED");
    expect(hasEntitlement(await getEntitlement(userId), "PREMIUM")).toBe(false);
  });

  it("reconciliation of an ended active snapshot cannot restore Premium", async () => {
    const userId = await setupUser("recon_ended");
    const subId = `sub_period_recon_ended_${stamp}`;
    const past = new Date(Date.now() - 120_000);
    await prisma.entitlement.create({
      data: {
        userId,
        plan: "PREMIUM",
        status: "ACTIVE",
        source: "dodo",
        providerSubscriptionId: subId,
        currentPeriodEnd: past,
        expiresAt: past,
      },
    });
    await prisma.paymentSubscription.create({
      data: {
        userId,
        provider: "dodo",
        providerSubscriptionId: subId,
        plan: "PREMIUM_MONTHLY",
        status: "active",
        currentPeriodEnd: past,
      },
    });
    await reconcileFromProvider(userId, {
      providerSubscriptionId: subId,
      status: "active",
      currentPeriodEnd: past,
      cancelAtPeriodEnd: false,
    });
    const ent = await getEntitlement(userId);
    expect(hasEntitlement(ent, "PREMIUM")).toBe(false);
    expect(ent.plan).not.toBe("PREMIUM");
  });

  it("reconciliation of a genuinely newer open period can grant Premium", async () => {
    const userId = await setupUser("recon_newer");
    const subId = `sub_period_recon_newer_${stamp}`;
    const past = new Date(Date.now() - 60_000);
    const future = new Date(Date.now() + 25 * 86400000);
    await prisma.entitlement.create({
      data: {
        userId,
        plan: "EXPIRED",
        status: "EXPIRED",
        source: "dodo",
        providerSubscriptionId: subId,
        currentPeriodEnd: past,
        expiresAt: past,
      },
    });
    await prisma.paymentSubscription.create({
      data: {
        userId,
        provider: "dodo",
        providerSubscriptionId: subId,
        plan: "PREMIUM_MONTHLY",
        status: "expired",
        currentPeriodEnd: past,
        cancelAtPeriodEnd: true,
      },
    });
    await reconcileFromProvider(userId, {
      providerSubscriptionId: subId,
      status: "active",
      currentPeriodEnd: future,
      cancelAtPeriodEnd: false,
    });
    const ent = await getEntitlement(userId);
    expect(ent.plan).toBe("PREMIUM");
    expect(hasEntitlement(ent, "PREMIUM")).toBe(true);
  });

  it("renewal webhook with a new future period grants Premium", async () => {
    const userId = await setupUser("renew");
    const subId = `sub_period_renew_${stamp}`;
    await prisma.entitlement.create({ data: { userId, plan: "FREE", status: "ACTIVE" } });
    const t0 = Math.floor(Date.now() / 1000) - 120;
    await runWebhook(userId, "subscription.active", `wh_period_${stamp}_renew_seed`, {
      subscription_id: subId,
      status: "active",
      current_period_end: new Date(Date.now() - 1000).toISOString(),
    }, t0);
    expect(hasEntitlement(await getEntitlement(userId), "PREMIUM")).toBe(false);
    const future = new Date(Date.now() + 40 * 86400000);
    await runWebhook(userId, "subscription.renewed", `wh_period_${stamp}_renew`, {
      subscription_id: subId,
      status: "active",
      current_period_end: future.toISOString(),
    }, t0 + 30);
    expect(hasEntitlement(await getEntitlement(userId), "PREMIUM")).toBe(true);
  });

  it("refund/dispute still revokes the stored entitlement", async () => {
    const userId = await setupUser("refund");
    const subId = `sub_period_refund_${stamp}`;
    const future = new Date(Date.now() + 15 * 86400000);
    await prisma.entitlement.create({ data: { userId, plan: "FREE", status: "ACTIVE" } });
    await runWebhook(userId, "subscription.active", `wh_period_${stamp}_refund_seed`, {
      subscription_id: subId,
      status: "active",
      current_period_end: future.toISOString(),
      payment_id: `pay_period_refund_${stamp}`,
    });
    expect(hasEntitlement(await getEntitlement(userId), "PREMIUM")).toBe(true);
    const refund = await revokeToFree(userId, "dodo", "refund_succeeded", `wh_period_${stamp}_refund`, Math.floor(Date.now() / 1000));
    expect(refund.applied).toBe(true);
    const row = await prisma.entitlement.findUnique({ where: { userId } });
    expect(row?.plan).toBe("EXPIRED");
    expect(row?.status).toBe("EXPIRED");
  });

  it("ADMIN is not converted by period-end derivation or reconciliation", async () => {
    const userId = await setupUser("admin");
    const subId = `sub_period_admin_${stamp}`;
    const past = new Date(Date.now() - 60_000);
    await prisma.entitlement.create({
      data: { userId, plan: "ADMIN", status: "ACTIVE", source: "OPERATOR_BOOTSTRAP", providerSubscriptionId: subId },
    });
    await prisma.paymentSubscription.create({
      data: {
        userId,
        provider: "dodo",
        providerSubscriptionId: subId,
        plan: "PREMIUM_MONTHLY",
        status: "active",
        currentPeriodEnd: past,
      },
    });
    await reconcileFromProvider(userId, {
      providerSubscriptionId: subId,
      status: "active",
      currentPeriodEnd: past,
      cancelAtPeriodEnd: false,
    });
    const ent = await getEntitlement(userId);
    expect(ent.plan).toBe("ADMIN");
    expect(hasEntitlement(ent, "ADMIN")).toBe(true);
    expect(ent.source).toBe("OPERATOR_BOOTSTRAP");
  });
});
