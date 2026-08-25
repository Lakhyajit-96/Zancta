import { afterAll, describe, expect, it } from "vitest";
import prisma from "@/lib/db";
import { getEntitlement, hasEntitlement } from "@/lib/entitlement";
import { processVerifiedDodoEvent } from "@/lib/payments/process-dodo-event";
import { reconcileFromProvider } from "@/lib/payments/reconciliation";
import { mapDodoSubscriptionJson } from "@/lib/payments/providers/dodo";

const stamp = Date.now();
const t0 = Math.floor(Date.now() / 1000) - 180;
const createdUsers: string[] = [];

async function setupCase(label: string) {
  const user = await prisma.user.create({ data: { email: `billing-order-${label}-${stamp}@example.com` } });
  createdUsers.push(user.id);
  await prisma.entitlement.create({ data: { userId: user.id, plan: "FREE", status: "ACTIVE" } });
  const subId = `sub_order_${label}_${stamp}`;
  async function run(eventType: string, webhookId: string, data: Record<string, unknown>, ts: number) {
    const payload = {
      event_type: eventType,
      data: {
        metadata: { userId: user.id, planId: "PREMIUM_MONTHLY" },
        customer_id: `cus_order_${label}_${stamp}`,
        subscription_id: subId,
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
  return { userId: user.id, subId, run };
}

describe("P2-PAY-1 reconciliation / webhook ordering", () => {
  afterAll(async () => {
    for (const userId of createdUsers) {
      await prisma.webhookEvent.deleteMany({ where: { providerEventId: { startsWith: `wh_order_` } } }).catch(() => {});
      await prisma.payment.deleteMany({ where: { userId } }).catch(() => {});
      await prisma.paymentSubscription.deleteMany({ where: { userId } }).catch(() => {});
      await prisma.paymentCustomer.deleteMany({ where: { userId } }).catch(() => {});
      await prisma.entitlement.deleteMany({ where: { userId } }).catch(() => {});
      await prisma.auditEvent.deleteMany({ where: { userId } }).catch(() => {});
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
  });

  it("maps Dodo GET mutation timestamps without inventing updated_at", () => {
    const mapped = mapDodoSubscriptionJson({
      subscription_id: "sub_docs",
      customer_id: "cus_docs",
      status: "cancelled",
      created_at: "2026-01-01T00:00:00.000Z",
      cancelled_at: "2026-02-01T00:00:00.000Z",
      paused_at: null,
      previous_billing_date: "2026-01-15T00:00:00.000Z",
      next_billing_date: "2026-03-01T00:00:00.000Z",
      cancel_at_next_billing_date: true,
    }, "sub_docs");
    expect(mapped.createdAt?.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(mapped.cancelledAt?.toISOString()).toBe("2026-02-01T00:00:00.000Z");
    expect(mapped.previousBillingDate?.toISOString()).toBe("2026-01-15T00:00:00.000Z");
    expect(mapped.currentPeriodEnd).toBeNull();
    expect(mapped.cancelAtPeriodEnd).toBe(true);
  });

  it("1. delayed valid webhook after reconciliation is applied, not permanently ACKed stale", async () => {
    const { userId, subId, run } = await setupCase("delayed");
    const end = new Date(Date.now() + 30 * 86400000);
    await run("subscription.active", `wh_order_${stamp}_active`, {
      status: "active",
      current_period_start: new Date((t0 - 86400) * 1000).toISOString(),
      current_period_end: end.toISOString(),
    }, t0);

    const before = await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } });
    expect(before?.providerUpdatedAt?.getTime()).toBe(t0 * 1000);

    await reconcileFromProvider(userId, {
      providerSubscriptionId: subId,
      providerCustomerId: `cus_order_delayed_${stamp}`,
      status: "active",
      currentPeriodStart: new Date((t0 - 86400) * 1000),
      currentPeriodEnd: end,
      cancelAtPeriodEnd: false,
      createdAt: new Date((t0 - 86400) * 1000),
    });

    const afterRecon = await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } });
    expect(afterRecon?.providerUpdatedAt?.getTime()).toBe(t0 * 1000);
    expect(Math.abs((afterRecon?.providerUpdatedAt?.getTime() || 0) - Date.now())).toBeGreaterThan(60_000);

    const delayed = await run("subscription.cancelled", `wh_order_${stamp}_delayed_cancel`, {
      status: "cancelled",
      current_period_end: end.toISOString(),
      cancel_at_next_billing_date: true,
    }, t0 + 10);
    expect(delayed).toMatchObject({ ok: true });
    expect("stale" in delayed && delayed.stale).toBeFalsy();
    const ent = await getEntitlement(userId);
    expect(ent.plan).toBe("PREMIUM");
    expect(ent.cancelAtPeriodEnd).toBe(true);
    const sub = await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } });
    expect(sub?.providerUpdatedAt?.getTime()).toBe((t0 + 10) * 1000);
  });

  it("2. genuinely stale webhook remains terminal stale", async () => {
    const { userId, subId, run } = await setupCase("stale");
    const newerEnd = new Date(Date.now() + 60 * 86400000);
    const olderEnd = new Date(Date.now() + 5 * 86400000);
    const newerTs = t0 + 20;
    await run("subscription.renewed", `wh_order_${stamp}_stale_newer`, {
      status: "active",
      current_period_end: newerEnd.toISOString(),
    }, newerTs);
    const result = await run("subscription.updated", `wh_order_${stamp}_stale_older`, {
      status: "active",
      current_period_end: olderEnd.toISOString(),
    }, newerTs - 3600);
    expect(result).toMatchObject({ ok: true, stale: true });
    const sub = await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } });
    expect(sub?.currentPeriodEnd?.getTime()).toBe(newerEnd.getTime());
    expect((await getEntitlement(userId)).currentPeriodEnd?.getTime()).toBe(newerEnd.getTime());
  });

  it("3. newer webhook then older reconciliation does not roll back provider state", async () => {
    const { userId, subId, run } = await setupCase("newer_then_recon");
    const newerEnd = new Date(Date.now() + 60 * 86400000);
    const olderEnd = new Date(Date.now() + 5 * 86400000);
    const newerTs = t0 + 30;
    await run("subscription.renewed", `wh_order_${stamp}_renew`, {
      status: "active",
      current_period_end: newerEnd.toISOString(),
    }, newerTs);

    await reconcileFromProvider(userId, {
      providerSubscriptionId: subId,
      providerCustomerId: `cus_order_newer_then_recon_${stamp}`,
      status: "active",
      currentPeriodEnd: olderEnd,
      cancelAtPeriodEnd: false,
      createdAt: new Date((t0 - 86400) * 1000),
    });

    const sub = await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } });
    expect(sub?.currentPeriodEnd?.getTime()).toBe(newerEnd.getTime());
    expect(sub?.providerUpdatedAt?.getTime()).toBe(newerTs * 1000);
    const ent = await getEntitlement(userId);
    expect(ent.currentPeriodEnd?.getTime()).toBe(newerEnd.getTime());
    expect(ent.cancelAtPeriodEnd).toBe(false);
  });

  it("4. reconciliation followed by a newer webhook applies the webhook", async () => {
    const { userId, subId, run } = await setupCase("recon_then_newer");
    const reconEnd = new Date(Date.now() + 40 * 86400000);
    const end = new Date(Date.now() + 45 * 86400000);
    await run("subscription.active", `wh_order_${stamp}_seed`, {
      status: "active",
      current_period_end: reconEnd.toISOString(),
    }, t0);

    await reconcileFromProvider(userId, {
      providerSubscriptionId: subId,
      providerCustomerId: `cus_order_recon_then_newer_${stamp}`,
      status: "active",
      currentPeriodEnd: reconEnd,
      cancelAtPeriodEnd: false,
    });
    const afterRecon = await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } });
    expect(afterRecon?.providerUpdatedAt?.getTime()).toBe(t0 * 1000);

    const newerTs = t0 + 40;
    const result = await run("subscription.renewed", `wh_order_${stamp}_after_recon`, {
      status: "active",
      current_period_end: end.toISOString(),
    }, newerTs);
    expect(result).toMatchObject({ ok: true });
    expect("stale" in result && result.stale).toBeFalsy();
    const sub = await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } });
    expect(sub?.currentPeriodEnd?.getTime()).toBe(end.getTime());
    expect(sub?.providerUpdatedAt?.getTime()).toBe(newerTs * 1000);
  });

  it("5. concurrent reconciliation and webhook keep the newer provider event", async () => {
    const { userId, subId, run } = await setupCase("concurrent");
    const seedEnd = new Date(Date.now() + 20 * 86400000);
    await run("subscription.active", `wh_order_${stamp}_conc_seed`, {
      status: "active",
      current_period_end: seedEnd.toISOString(),
    }, t0);

    const webhookEnd = new Date(Date.now() + 70 * 86400000);
    const reconEnd = new Date(Date.now() + 8 * 86400000);
    const webhookTs = t0 + 80;
    const startedAt = new Date((t0 + 50) * 1000);
    const [webhookResult] = await Promise.all([
      run("subscription.renewed", `wh_order_${stamp}_conc_wh`, {
        status: "active",
        current_period_end: webhookEnd.toISOString(),
      }, webhookTs),
      reconcileFromProvider(userId, {
        providerSubscriptionId: subId,
        providerCustomerId: `cus_order_concurrent_${stamp}`,
        status: "active",
        currentPeriodEnd: reconEnd,
        cancelAtPeriodEnd: false,
        createdAt: new Date((t0 - 86400) * 1000),
      }, { startedAt }),
    ]);
    expect(webhookResult).toMatchObject({ ok: true });
    const sub = await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } });
    expect(sub?.currentPeriodEnd?.getTime()).toBe(webhookEnd.getTime());
    expect(sub?.providerUpdatedAt?.getTime()).toBe(webhookTs * 1000);
    expect((await getEntitlement(userId)).currentPeriodEnd?.getTime()).toBe(webhookEnd.getTime());
  });

  it("5b. concurrent reconciliations converge on the same provider snapshot", async () => {
    const { userId, subId, run } = await setupCase("concurrent_recon");
    const end = new Date(Date.now() + 33 * 86400000);
    await run("subscription.active", `wh_order_${stamp}_conc_recon_seed`, {
      status: "active",
      current_period_end: end.toISOString(),
    }, t0);
    const remote = {
      providerSubscriptionId: subId,
      providerCustomerId: `cus_order_concurrent_recon_${stamp}`,
      status: "active",
      currentPeriodEnd: end,
      cancelAtPeriodEnd: false,
    };
    await Promise.all([
      reconcileFromProvider(userId, remote),
      reconcileFromProvider(userId, remote),
    ]);
    const sub = await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } });
    expect(sub?.status).toBe("active");
    expect(sub?.currentPeriodEnd?.getTime()).toBe(end.getTime());
    expect(sub?.cancelAtPeriodEnd).toBe(false);
    expect(sub?.providerUpdatedAt?.getTime()).toBe(t0 * 1000);
    expect((await getEntitlement(userId)).plan).toBe("PREMIUM");
  });

  it("6. repeated reconciliation is idempotent and does not stamp wall-clock freshness", async () => {
    const { userId, subId, run } = await setupCase("idempotent");
    const end = new Date(Date.now() + 33 * 86400000);
    await run("subscription.active", `wh_order_${stamp}_idem_seed`, {
      status: "active",
      current_period_end: end.toISOString(),
    }, t0);
    const remote = {
      providerSubscriptionId: subId,
      providerCustomerId: `cus_order_idempotent_${stamp}`,
      status: "active",
      currentPeriodEnd: end,
      cancelAtPeriodEnd: false,
    };
    await reconcileFromProvider(userId, remote);
    const first = await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } });
    await reconcileFromProvider(userId, remote);
    const second = await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } });
    expect(second?.status).toBe(first?.status);
    expect(second?.currentPeriodEnd?.getTime()).toBe(first?.currentPeriodEnd?.getTime());
    expect(second?.providerUpdatedAt?.getTime()).toBe(first?.providerUpdatedAt?.getTime());
    expect(second?.providerUpdatedAt?.getTime()).toBe(t0 * 1000);
    expect(Math.abs((second?.providerUpdatedAt?.getTime() || 0) - Date.now())).toBeGreaterThan(30_000);
  });

  it("cancel/expire/renew: recon after cancel webhook cannot restore uncancelled Premium from older GET", async () => {
    const { userId, subId, run } = await setupCase("cancel_race");
    const end = new Date(Date.now() + 14 * 86400000);
    await run("subscription.active", `wh_order_${stamp}_cancel_seed`, {
      status: "active",
      current_period_end: end.toISOString(),
    }, t0);
    const cancelTs = t0 + 90;
    await run("subscription.cancelled", `wh_order_${stamp}_cancel_race`, {
      status: "cancelled",
      current_period_end: end.toISOString(),
      cancel_at_next_billing_date: true,
    }, cancelTs);
    expect((await getEntitlement(userId)).cancelAtPeriodEnd).toBe(true);

    await reconcileFromProvider(userId, {
      providerSubscriptionId: subId,
      providerCustomerId: `cus_order_cancel_race_${stamp}`,
      status: "active",
      currentPeriodEnd: end,
      cancelAtPeriodEnd: false,
      createdAt: new Date((t0 - 86400) * 1000),
    });
    expect((await getEntitlement(userId)).cancelAtPeriodEnd).toBe(true);
    expect((await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } }))?.cancelAtPeriodEnd).toBe(true);

    const expireTs = t0 + 100;
    await run("subscription.expired", `wh_order_${stamp}_expire_race`, {
      status: "expired",
      current_period_end: new Date(Date.now() - 1000).toISOString(),
    }, expireTs);
    expect((await getEntitlement(userId)).plan).toBe("EXPIRED");
    expect(hasEntitlement(await getEntitlement(userId), "PREMIUM")).toBe(false);
  });
});
