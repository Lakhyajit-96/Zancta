import { afterAll, beforeAll, describe, expect, it } from "vitest";
import prisma from "@/lib/db";
import { getEntitlement, hasEntitlement } from "@/lib/entitlement";
import { processVerifiedDodoEvent } from "@/lib/payments/process-dodo-event";
import { reconcileFromProvider } from "@/lib/payments/reconciliation";
import { revokeToFree, syncEntitlement } from "@/lib/payments/entitlement-sync";

const stamp = Date.now();

async function assertStillAdmin(userId: string, snapshot: { source: string | null; status: string }) {
  const row = await prisma.entitlement.findUnique({ where: { userId } });
  expect(row?.plan).toBe("ADMIN");
  expect(row?.status).toBe(snapshot.status);
  expect(row?.source).toBe(snapshot.source);
  const dto = await getEntitlement(userId);
  expect(dto.plan).toBe("ADMIN");
  expect(hasEntitlement(dto, "ADMIN")).toBe(true);
}

describe("ADMIN entitlement is independent of billing sync", () => {
  let adminId = "";
  let customerId = "";
  const adminSub = `sub_admin_${stamp}`;

  async function webhook(eventType: string, webhookId: string, data: Record<string, unknown>, userId = adminId) {
    const payload = {
      event_type: eventType,
      data: {
        metadata: { userId, planId: "PREMIUM_MONTHLY" },
        customer_id: `cus_admin_${stamp}`,
        ...data,
      },
    };
    return processVerifiedDodoEvent({
      webhookId,
      eventType,
      timestamp: String(Math.floor(Date.now() / 1000)),
      payload,
      rawBody: JSON.stringify(payload),
    });
  }

  beforeAll(async () => {
    const admin = await prisma.user.create({ data: { email: `admin-bill-${stamp}@example.com` } });
    adminId = admin.id;
    await prisma.entitlement.create({
      data: { userId: adminId, plan: "ADMIN", status: "ACTIVE", source: "OPERATOR_BOOTSTRAP" },
    });
    const customer = await prisma.user.create({ data: { email: `cust-bill-${stamp}@example.com` } });
    customerId = customer.id;
    await prisma.entitlement.create({ data: { userId: customerId, plan: "FREE", status: "ACTIVE" } });
  });

  afterAll(async () => {
    const ids = [adminId, customerId].filter(Boolean);
    await prisma.webhookEvent.deleteMany({ where: { providerEventId: { startsWith: `wh_admin_${stamp}` } } }).catch(() => {});
    await prisma.payment.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.paymentSubscription.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.paymentCustomer.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.entitlement.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.auditEvent.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: ids } } }).catch(() => {});
  });

  it("TEST 1: ADMIN + active Dodo subscription stays ADMIN", async () => {
    const before = await prisma.entitlement.findUnique({ where: { userId: adminId } });
    const result = await webhook("subscription.active", `wh_admin_${stamp}_active`, {
      subscription_id: adminSub,
      status: "active",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
    });
    expect(result.ok).toBe(true);
    await assertStillAdmin(adminId, { source: before!.source, status: before!.status });
    const sync = await syncEntitlement({
      userId: adminId,
      provider: "dodo",
      plan: "PREMIUM",
      status: "ACTIVE",
      providerSubscriptionId: adminSub,
      eventTimestamp: Math.floor(Date.now() / 1000),
    });
    expect(sync).toEqual({ applied: false, reason: "admin_protected" });
    await assertStillAdmin(adminId, { source: before!.source, status: before!.status });
  });

  it("TEST 2: ADMIN + cancellation stays ADMIN", async () => {
    const before = await prisma.entitlement.findUnique({ where: { userId: adminId } });
    const result = await webhook("subscription.cancelled", `wh_admin_${stamp}_cancel`, {
      subscription_id: adminSub,
      status: "cancelled",
      current_period_end: new Date(Date.now() + 12 * 86400000).toISOString(),
      cancel_at_next_billing_date: true,
    });
    expect(result.ok).toBe(true);
    await assertStillAdmin(adminId, { source: before!.source, status: before!.status });
  });

  it("TEST 3: ADMIN + expiration stays ADMIN", async () => {
    const before = await prisma.entitlement.findUnique({ where: { userId: adminId } });
    const result = await webhook("subscription.expired", `wh_admin_${stamp}_expired`, {
      subscription_id: adminSub,
      status: "expired",
      current_period_end: new Date(Date.now() - 1000).toISOString(),
    });
    expect(result.ok).toBe(true);
    await assertStillAdmin(adminId, { source: before!.source, status: before!.status });
  });

  it("TEST 4: ADMIN + refund/revocation stays ADMIN", async () => {
    const before = await prisma.entitlement.findUnique({ where: { userId: adminId } });
    const refund = await webhook("refund.succeeded", `wh_admin_${stamp}_refund`, {
      payment_id: `pay_admin_${stamp}_refund`,
      subscription_id: adminSub,
    });
    expect(refund.ok).toBe(true);
    const revoke = await revokeToFree(adminId, "dodo", "refund_succeeded");
    expect(revoke).toEqual({ applied: false, reason: "admin_protected" });
    await assertStillAdmin(adminId, { source: before!.source, status: before!.status });
  });

  it("TEST 5: ADMIN + repeated webhook stays ADMIN", async () => {
    const before = await prisma.entitlement.findUnique({ where: { userId: adminId } });
    const first = await webhook("subscription.active", `wh_admin_${stamp}_idem`, {
      subscription_id: adminSub,
      status: "active",
    });
    expect(first.ok).toBe(true);
    const second = await webhook("subscription.active", `wh_admin_${stamp}_idem`, {
      subscription_id: adminSub,
      status: "active",
    });
    expect(second).toMatchObject({ ok: true, duplicate: true });
    await assertStillAdmin(adminId, { source: before!.source, status: before!.status });
  });

  it("TEST 6: normal PREMIUM + cancellation still follows the billing state machine", async () => {
    const subId = `sub_cust_${stamp}`;
    const periodEnd = new Date(Date.now() + 12 * 86400000);
    await syncEntitlement({
      userId: customerId,
      provider: "dodo",
      plan: "PREMIUM",
      status: "ACTIVE",
      providerSubscriptionId: subId,
      currentPeriodEnd: periodEnd,
      eventTimestamp: Math.floor(Date.now() / 1000),
    });
    await prisma.paymentSubscription.create({
      data: {
        userId: customerId,
        provider: "dodo",
        providerSubscriptionId: subId,
        plan: "PREMIUM_MONTHLY",
        status: "active",
        currentPeriodEnd: periodEnd,
      },
    });
    const payload = {
      event_type: "subscription.cancelled",
      data: {
        metadata: { userId: customerId, planId: "PREMIUM_MONTHLY" },
        subscription_id: subId,
        status: "cancelled",
        current_period_end: periodEnd.toISOString(),
        cancel_at_next_billing_date: true,
      },
    };
    const cancelled = await processVerifiedDodoEvent({
      webhookId: `wh_admin_${stamp}_cust_cancel`,
      eventType: "subscription.cancelled",
      timestamp: String(Math.floor(Date.now() / 1000)),
      payload,
      rawBody: JSON.stringify(payload),
    });
    expect(cancelled.ok).toBe(true);
    const afterCancel = await getEntitlement(customerId);
    expect(afterCancel.plan).toBe("PREMIUM");
    expect(afterCancel.cancelAtPeriodEnd).toBe(true);

    const expiredPayload = {
      event_type: "subscription.expired",
      data: {
        metadata: { userId: customerId, planId: "PREMIUM_MONTHLY" },
        subscription_id: subId,
        status: "expired",
        current_period_end: new Date(Date.now() - 1000).toISOString(),
      },
    };
    const expired = await processVerifiedDodoEvent({
      webhookId: `wh_admin_${stamp}_cust_expired`,
      eventType: "subscription.expired",
      timestamp: String(Math.floor(Date.now() / 1000) + 1),
      payload: expiredPayload,
      rawBody: JSON.stringify(expiredPayload),
    });
    expect(expired.ok).toBe(true);
    const afterExpire = await prisma.entitlement.findUnique({ where: { userId: customerId } });
    expect(afterExpire?.plan).toBe("EXPIRED");
    expect(afterExpire?.status).toBe("EXPIRED");
  });

  it("TEST 7: normal FREE → PREMIUM sync still works", async () => {
    const other = await prisma.user.create({ data: { email: `cust2-bill-${stamp}@example.com` } });
    await prisma.entitlement.create({ data: { userId: other.id, plan: "FREE", status: "ACTIVE" } });
    try {
      const subId = `sub_cust2_${stamp}`;
      const applied = await syncEntitlement({
        userId: other.id,
        provider: "dodo",
        plan: "PREMIUM",
        status: "ACTIVE",
        providerSubscriptionId: subId,
        currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
        eventTimestamp: Math.floor(Date.now() / 1000),
      });
      expect(applied).toEqual({ applied: true, reason: "applied" });
      const row = await prisma.entitlement.findUnique({ where: { userId: other.id } });
      expect(row?.plan).toBe("PREMIUM");
      expect(row?.status).toBe("ACTIVE");
      expect(row?.providerSubscriptionId).toBe(subId);
    } finally {
      await prisma.entitlement.deleteMany({ where: { userId: other.id } }).catch(() => {});
      await prisma.auditEvent.deleteMany({ where: { userId: other.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: other.id } }).catch(() => {});
    }
  });

  it("TEST 8: billing cannot grant ADMIN to a normal user", async () => {
    const grant = await syncEntitlement({
      userId: customerId,
      provider: "dodo",
      plan: "ADMIN" as unknown as "PREMIUM",
      status: "ACTIVE",
      providerSubscriptionId: `sub_grant_${stamp}`,
      eventTimestamp: Math.floor(Date.now() / 1000),
    });
    expect(grant).toEqual({ applied: false, reason: "refused_admin_grant" });
    const row = await prisma.entitlement.findUnique({ where: { userId: customerId } });
    expect(row?.plan).not.toBe("ADMIN");
  });

  it("TEST 9: customer reassignment / reconciliation cannot convert a normal user into ADMIN", async () => {
    const beforeAdmin = await prisma.entitlement.findUnique({ where: { userId: adminId } });
    await reconcileFromProvider(adminId, {
      providerSubscriptionId: adminSub,
      providerCustomerId: `cus_admin_${stamp}`,
      status: "active",
      cancelAtPeriodEnd: false,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
    });
    await assertStillAdmin(adminId, { source: beforeAdmin!.source, status: beforeAdmin!.status });

    const normal = await prisma.entitlement.findUnique({ where: { userId: customerId } });
    expect(normal?.plan).not.toBe("ADMIN");
    await reconcileFromProvider(customerId, {
      providerSubscriptionId: `sub_cust_recon_${stamp}`,
      providerCustomerId: `cus_cust_${stamp}`,
      status: "active",
      cancelAtPeriodEnd: false,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
    });
    const after = await prisma.entitlement.findUnique({ where: { userId: customerId } });
    expect(after?.plan).not.toBe("ADMIN");
  });

  it("TEST 10: concurrent billing writes cannot overwrite ADMIN", async () => {
    const before = await prisma.entitlement.findUnique({ where: { userId: adminId } });
    const now = Math.floor(Date.now() / 1000);
    const results = await Promise.all([
      syncEntitlement({
        userId: adminId,
        provider: "dodo",
        plan: "PREMIUM",
        status: "ACTIVE",
        providerSubscriptionId: adminSub,
        eventTimestamp: now,
      }),
      syncEntitlement({
        userId: adminId,
        provider: "dodo",
        plan: "EXPIRED",
        status: "EXPIRED",
        providerSubscriptionId: adminSub,
        eventTimestamp: now,
      }),
      revokeToFree(adminId, "dodo", "dispute", `wh_admin_${stamp}_conc`, now),
      webhook("subscription.expired", `wh_admin_${stamp}_conc_exp`, {
        subscription_id: adminSub,
        status: "expired",
      }),
    ]);
    expect(results[0]).toEqual({ applied: false, reason: "admin_protected" });
    expect(results[1]).toEqual({ applied: false, reason: "admin_protected" });
    expect(results[2]).toEqual({ applied: false, reason: "admin_protected" });
    expect(results[3]).toMatchObject({ ok: true });
    await assertStillAdmin(adminId, { source: before!.source, status: before!.status });
  });
});
