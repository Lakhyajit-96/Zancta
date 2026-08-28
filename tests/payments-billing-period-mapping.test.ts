import { afterAll, describe, expect, it } from "vitest";
import prisma from "@/lib/db";
import { getEntitlement, hasEntitlement } from "@/lib/entitlement";
import { processVerifiedDodoEvent } from "@/lib/payments/process-dodo-event";
import { reconcileFromProvider } from "@/lib/payments/reconciliation";
import { mapDodoSubscriptionJson } from "@/lib/payments/providers/dodo";

const stamp = Date.now();
const createdUsers: string[] = [];

async function setupUser(label: string) {
  const user = await prisma.user.create({ data: { email: `period-map-${label}-${stamp}@example.com` } });
  createdUsers.push(user.id);
  await prisma.entitlement.create({ data: { userId: user.id, plan: "FREE", status: "ACTIVE" } });
  return user.id;
}

async function runWebhook(
  userId: string,
  eventType: string,
  webhookId: string,
  subId: string,
  data: Record<string, unknown>,
  ts = Math.floor(Date.now() / 1000),
) {
  const payload = {
    event_type: eventType,
    data: {
      metadata: { userId, planId: "PREMIUM_MONTHLY" },
      customer_id: `cus_${subId}`,
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

describe("PHASE 8-5A billing period mapping (next_billing_date / previous_billing_date)", () => {
  afterAll(async () => {
    if (!createdUsers.length) return;
    await prisma.webhookEvent.deleteMany({ where: { providerEventId: { startsWith: `wh_map_${stamp}` } } }).catch(() => {});
    await prisma.payment.deleteMany({ where: { userId: { in: createdUsers } } }).catch(() => {});
    await prisma.paymentSubscription.deleteMany({ where: { userId: { in: createdUsers } } }).catch(() => {});
    await prisma.paymentCustomer.deleteMany({ where: { userId: { in: createdUsers } } }).catch(() => {});
    await prisma.entitlement.deleteMany({ where: { userId: { in: createdUsers } } }).catch(() => {});
    await prisma.auditEvent.deleteMany({ where: { userId: { in: createdUsers } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: createdUsers } } }).catch(() => {});
  });

  // --- Pure mapper semantics (no DB) ---

  it("mapper: next_billing_date -> currentPeriodEnd, previous_billing_date -> currentPeriodStart", () => {
    const mapped = mapDodoSubscriptionJson(
      {
        subscription_id: "sub_map_a",
        customer_id: "cus_map_a",
        status: "active",
        previous_billing_date: "2026-08-01T00:00:00.000Z",
        next_billing_date: "2026-09-01T00:00:00.000Z",
        cancel_at_next_billing_date: false,
      },
      "sub_map_a",
    );
    expect(mapped.currentPeriodStart?.toISOString()).toBe("2026-08-01T00:00:00.000Z");
    expect(mapped.currentPeriodEnd?.toISOString()).toBe("2026-09-01T00:00:00.000Z");
    expect(mapped.cancelAtPeriodEnd).toBe(false);
  });

  it("mapper: explicit current_period_* takes precedence over billing-date fields", () => {
    const mapped = mapDodoSubscriptionJson(
      {
        subscription_id: "sub_map_pref",
        status: "active",
        current_period_start: "2026-08-10T00:00:00.000Z",
        current_period_end: "2026-09-10T00:00:00.000Z",
        previous_billing_date: "2026-08-01T00:00:00.000Z",
        next_billing_date: "2026-09-01T00:00:00.000Z",
      },
      "sub_map_pref",
    );
    expect(mapped.currentPeriodStart?.toISOString()).toBe("2026-08-10T00:00:00.000Z");
    expect(mapped.currentPeriodEnd?.toISOString()).toBe("2026-09-10T00:00:00.000Z");
  });

  it("mapper: missing period + billing-date fields stay null (no invented dates)", () => {
    const mapped = mapDodoSubscriptionJson(
      { subscription_id: "sub_map_null", status: "active" },
      "sub_map_null",
    );
    expect(mapped.currentPeriodStart).toBeNull();
    expect(mapped.currentPeriodEnd).toBeNull();
  });

  // --- A. Active subscription webhook with next_billing_date -> currentPeriodEnd ---

  it("A. active webhook with next_billing_date stores period end and grants provider-backed Premium", async () => {
    const userId = await setupUser("active_next");
    const subId = `sub_map_active_${stamp}`;
    const start = new Date(Date.now() - 2 * 86400000);
    const end = new Date(Date.now() + 28 * 86400000);
    const result = await runWebhook(userId, "subscription.active", `wh_map_${stamp}_active`, subId, {
      status: "active",
      previous_billing_date: start.toISOString(),
      next_billing_date: end.toISOString(),
    });
    expect(result.ok).toBe(true);

    const sub = await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } });
    expect(sub?.currentPeriodStart?.getTime()).toBe(start.getTime());
    expect(sub?.currentPeriodEnd?.getTime()).toBe(end.getTime());

    const ent = await getEntitlement(userId);
    expect(ent.plan).toBe("PREMIUM");
    expect(ent.providerBacked).toBe(true);
    expect(ent.currentPeriodEnd?.getTime()).toBe(end.getTime());
    expect(ent.expiresAt?.getTime()).toBe(end.getTime());
    expect(hasEntitlement(ent, "PREMIUM")).toBe(true);
  });

  // --- B. Provider refresh with next_billing_date -> currentPeriodEnd ---

  it("B. provider refresh maps next_billing_date rather than reintroducing null", async () => {
    const userId = await setupUser("refresh_next");
    const subId = `sub_map_refresh_${stamp}`;
    const seedEnd = new Date(Date.now() + 10 * 86400000);
    await runWebhook(userId, "subscription.active", `wh_map_${stamp}_refresh_seed`, subId, {
      status: "active",
      next_billing_date: seedEnd.toISOString(),
    }, Math.floor(Date.now() / 1000) - 120);

    const newerEnd = new Date(Date.now() + 40 * 86400000);
    const remote = mapDodoSubscriptionJson(
      {
        subscription_id: subId,
        customer_id: `cus_${subId}`,
        status: "active",
        previous_billing_date: new Date(Date.now() - 86400000).toISOString(),
        next_billing_date: newerEnd.toISOString(),
        cancel_at_next_billing_date: false,
      },
      subId,
    );
    expect(remote.currentPeriodEnd?.getTime()).toBe(newerEnd.getTime());

    await reconcileFromProvider(userId, remote);

    const sub = await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } });
    expect(sub?.currentPeriodEnd?.getTime()).toBe(newerEnd.getTime());
    expect((await getEntitlement(userId)).plan).toBe("PREMIUM");
  });

  // --- C. cancelAtPeriodEnd=true keeps PREMIUM/ACTIVE while subscription remains active ---

  it("C. active + cancel_at_next_billing_date keeps Premium until period end (no immediate revoke)", async () => {
    const userId = await setupUser("cancel_pe");
    const subId = `sub_map_cancel_${stamp}`;
    const end = new Date(Date.now() + 15 * 86400000);
    await runWebhook(userId, "subscription.active", `wh_map_${stamp}_cancel_seed`, subId, {
      status: "active",
      next_billing_date: end.toISOString(),
    });

    const upd = await runWebhook(userId, "subscription.updated", `wh_map_${stamp}_cancel_upd`, subId, {
      status: "active",
      next_billing_date: end.toISOString(),
      cancel_at_next_billing_date: true,
    }, Math.floor(Date.now() / 1000) + 5);
    expect(upd.ok).toBe(true);

    const ent = await getEntitlement(userId);
    expect(ent.plan).toBe("PREMIUM");
    expect(ent.status).toBe("ACTIVE");
    expect(ent.cancelAtPeriodEnd).toBe(true);
    expect(ent.currentPeriodEnd?.getTime()).toBe(end.getTime());
    expect(hasEntitlement(ent, "PREMIUM")).toBe(true);
  });

  // --- D. Genuinely ended subscription revokes Premium ---

  it("D. expired subscription revokes Premium", async () => {
    const userId = await setupUser("expired");
    const subId = `sub_map_expired_${stamp}`;
    const openEnd = new Date(Date.now() + 20 * 86400000);
    await runWebhook(userId, "subscription.active", `wh_map_${stamp}_exp_seed`, subId, {
      status: "active",
      next_billing_date: openEnd.toISOString(),
    });
    expect((await getEntitlement(userId)).plan).toBe("PREMIUM");

    const past = new Date(Date.now() - 60_000);
    const exp = await runWebhook(userId, "subscription.expired", `wh_map_${stamp}_exp`, subId, {
      status: "expired",
      next_billing_date: past.toISOString(),
    }, Math.floor(Date.now() / 1000) + 10);
    expect(exp.ok).toBe(true);

    const ent = await getEntitlement(userId);
    expect(ent.plan).not.toBe("PREMIUM");
    expect(hasEntitlement(ent, "PREMIUM")).toBe(false);
  });

  // --- E. Missing billing-date fields remain safely nullable ---

  it("E. active webhook without any period/billing-date field keeps period null without inventing dates", async () => {
    const userId = await setupUser("nulls");
    const subId = `sub_map_nulls_${stamp}`;
    const result = await runWebhook(userId, "subscription.active", `wh_map_${stamp}_nulls`, subId, {
      status: "active",
    });
    expect(result.ok).toBe(true);

    const sub = await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } });
    expect(sub?.currentPeriodEnd).toBeNull();
    expect(sub?.currentPeriodStart).toBeNull();

    // Active with no known end still derives Premium (no invented expiry), expiresAt stays null.
    const ent = await getEntitlement(userId);
    expect(ent.plan).toBe("PREMIUM");
    expect(ent.currentPeriodEnd).toBeNull();
    expect(ent.expiresAt).toBeNull();
  });

  // --- F. Duplicate webhook processing remains idempotent ---

  it("F. duplicate webhook delivery is idempotent", async () => {
    const userId = await setupUser("dup");
    const subId = `sub_map_dup_${stamp}`;
    const end = new Date(Date.now() + 25 * 86400000);
    const first = await runWebhook(userId, "subscription.active", `wh_map_${stamp}_dup`, subId, {
      status: "active",
      next_billing_date: end.toISOString(),
    });
    expect(first.ok).toBe(true);
    expect("duplicate" in first && first.duplicate).toBeFalsy();

    const second = await runWebhook(userId, "subscription.active", `wh_map_${stamp}_dup`, subId, {
      status: "active",
      next_billing_date: end.toISOString(),
    });
    expect(second).toMatchObject({ ok: true, duplicate: true });

    const subs = await prisma.paymentSubscription.findMany({ where: { userId } });
    expect(subs.length).toBe(1);
  });

  // --- G. Stale event cannot overwrite newer state ---

  it("G. older event with older next_billing_date cannot roll back newer period", async () => {
    const userId = await setupUser("stale");
    const subId = `sub_map_stale_${stamp}`;
    const newerEnd = new Date(Date.now() + 60 * 86400000);
    const olderEnd = new Date(Date.now() + 5 * 86400000);
    const newerTs = Math.floor(Date.now() / 1000);

    await runWebhook(userId, "subscription.renewed", `wh_map_${stamp}_stale_newer`, subId, {
      status: "active",
      next_billing_date: newerEnd.toISOString(),
    }, newerTs);

    const stale = await runWebhook(userId, "subscription.updated", `wh_map_${stamp}_stale_older`, subId, {
      status: "active",
      next_billing_date: olderEnd.toISOString(),
    }, newerTs - 3600);
    expect(stale).toMatchObject({ ok: true, stale: true });

    const sub = await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } });
    expect(sub?.currentPeriodEnd?.getTime()).toBe(newerEnd.getTime());
    expect((await getEntitlement(userId)).currentPeriodEnd?.getTime()).toBe(newerEnd.getTime());
  });
});
