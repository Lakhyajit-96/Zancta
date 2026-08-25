import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { getEntitlement, hasEntitlement } from "@/lib/entitlement";
import { processVerifiedDodoEvent } from "@/lib/payments/process-dodo-event";
import { detectLocalBillingDrift, reconcileFromProvider } from "@/lib/payments/reconciliation";
import { DodoProvider } from "@/lib/payments/providers/dodo";
import crypto from "crypto";

const cancel = vi.fn(async () => {});

vi.mock("@/lib/payments", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/payments")>();
  return {
    ...actual,
    getPaymentProvider: () => ({
      name: "dodo" as const,
      cancelSubscription: cancel,
      getSubscription: async () => ({
        providerSubscriptionId: "orphan_sub",
        status: "cancelled",
        cancelAtPeriodEnd: true,
        currentPeriodEnd: new Date(Date.now() + 86400000),
      }),
      createCheckout: async () => ({ checkoutUrl: "https://example.com", providerCheckoutId: "chk", provider: "dodo" as const }),
      getPayment: async () => null,
      refundPayment: async () => {},
      verifyWebhook: async () => ({ ok: false, provider: "dodo" as const, eventType: "unknown", providerEventId: "unknown", payload: null, error: "mock" }),
    }),
  };
});

const TEST_SECRET = "whsec_" + Buffer.from("billing_lifecycle_secret_1234567890ab").toString("base64");

function sign(raw: string, id: string, ts: string) {
  const bare = TEST_SECRET.startsWith("whsec_") ? TEST_SECRET.slice(6) : TEST_SECRET;
  const key = Buffer.from(bare, "base64");
  const expected = crypto.createHmac("sha256", key).update(`${id}.${ts}.${raw}`, "utf8").digest("base64");
  return `v1,${expected}`;
}

describe("billing webhook lifecycle", () => {
  const stamp = Date.now();
  let userId = "";
  const subId = `sub_life_${stamp}`;
  const payId = `pay_life_${stamp}`;

  async function run(eventType: string, webhookId: string, data: Record<string, unknown>, ts = Math.floor(Date.now() / 1000)) {
    const payload = {
      event_type: eventType,
      data: {
        metadata: { userId, planId: "PREMIUM_MONTHLY" },
        customer_id: `cus_${stamp}`,
        ...data,
      },
    };
    const rawBody = JSON.stringify(payload);
    return processVerifiedDodoEvent({
      webhookId,
      eventType,
      timestamp: String(ts),
      payload,
      rawBody,
    });
  }

  beforeAll(async () => {
    process.env.DODO_WEBHOOK_SECRET = TEST_SECRET;
    process.env.DODO_API_KEY = "test_dummy_key_for_code_path";
    const user = await prisma.user.create({ data: { email: `billing-life-${stamp}@example.com` } });
    userId = user.id;
    await prisma.entitlement.create({ data: { userId, plan: "FREE", status: "ACTIVE" } });
  });

  afterAll(async () => {
    await prisma.webhookEvent.deleteMany({ where: { providerEventId: { startsWith: `wh_${stamp}` } } }).catch(() => {});
    await prisma.payment.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.paymentSubscription.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.paymentCustomer.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.paymentCheckout.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.entitlement.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.auditEvent.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  });

  it("does not grant premium from payment.succeeded without a subscription id", async () => {
    const result = await run("payment.succeeded", `wh_${stamp}_pay_only`, {
      payment_id: `${payId}_solo`,
      total_amount: 19900,
      currency: "INR",
    });
    expect(result.ok).toBe(true);
    const ent = await getEntitlement(userId);
    expect(ent.plan).toBe("FREE");
    expect(hasEntitlement(ent, "PREMIUM")).toBe(false);
    const pay = await prisma.payment.findUnique({ where: { providerPaymentId: `${payId}_solo` } });
    expect(pay?.status).toBe("succeeded");
    expect(pay?.providerSubscriptionId).toBeFalsy();
  });

  it("creates Payment, PaymentSubscription and provider-backed Premium on first subscription.active", async () => {
    const ts = Math.floor(Date.now() / 1000);
    const result = await run("subscription.active", `wh_${stamp}_sub_active`, {
      subscription_id: subId,
      status: "active",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
    }, ts);
    expect(result.ok).toBe(true);
    const sub = await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } });
    expect(sub?.status).toBe("active");
    const ent = await getEntitlement(userId);
    expect(ent.plan).toBe("PREMIUM");
    expect(ent.providerBacked).toBe(true);
    expect(hasEntitlement(ent, "PREMIUM")).toBe(true);
  });

  it("acks duplicate webhook-id without changing state", async () => {
    const before = await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } });
    const result = await run("subscription.active", `wh_${stamp}_sub_active`, {
      subscription_id: subId,
      status: "active",
    });
    expect(result).toMatchObject({ ok: true, duplicate: true });
    const after = await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } });
    expect(after?.updatedAt.getTime()).toBe(before?.updatedAt.getTime());
  });

  it("retries a failed event instead of treating it as a duplicate", async () => {
    const webhookId = `wh_${stamp}_retry`;
    await prisma.webhookEvent.create({
      data: {
        provider: "dodo",
        providerEventId: webhookId,
        eventType: "payment.succeeded",
        status: "failed",
        lastError: "injected",
        payloadHash: "x",
      },
    });
    const result = await run("payment.succeeded", webhookId, {
      payment_id: payId,
      subscription_id: subId,
      total_amount: 19900,
      currency: "INR",
    });
    expect(result.ok).toBe(true);
    const event = await prisma.webhookEvent.findUnique({ where: { providerEventId: webhookId } });
    expect(event?.status).toBe("succeeded");
    expect(event?.attemptCount).toBeGreaterThanOrEqual(1);
    const pay = await prisma.payment.findUnique({ where: { providerPaymentId: payId } });
    expect(pay?.status).toBe("succeeded");
    expect(pay?.providerSubscriptionId).toBe(subId);
  });

  it("does not let a stale event overwrite a newer period", async () => {
    const newerTs = Math.floor(Date.now() / 1000);
    const olderTs = newerTs - 3600;
    await run("subscription.renewed", `wh_${stamp}_renew`, {
      subscription_id: subId,
      status: "active",
      current_period_end: new Date(Date.now() + 60 * 86400000).toISOString(),
    }, newerTs);
    const afterNew = await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } });
    const result = await run("subscription.updated", `wh_${stamp}_stale`, {
      subscription_id: subId,
      status: "active",
      current_period_end: new Date(Date.now() + 5 * 86400000).toISOString(),
    }, olderTs);
    expect(result).toMatchObject({ ok: true, stale: true });
    const afterOld = await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } });
    expect(afterOld?.currentPeriodEnd?.getTime()).toBe(afterNew?.currentPeriodEnd?.getTime());
  });

  it("records payment failure without revoking an active paid period", async () => {
    const result = await run("payment.failed", `wh_${stamp}_pay_fail`, {
      payment_id: `${payId}_fail`,
      subscription_id: subId,
      total_amount: 19900,
      currency: "INR",
    });
    expect(result.ok).toBe(true);
    expect((await getEntitlement(userId)).plan).toBe("PREMIUM");
    expect((await prisma.payment.findUnique({ where: { providerPaymentId: `${payId}_fail` } }))?.status).toBe("failed");
  });

  it("keeps premium after cancel-at-period-end while the period is open", async () => {
    const end = new Date(Date.now() + 12 * 86400000);
    const result = await run("subscription.cancelled", `wh_${stamp}_cancel`, {
      subscription_id: subId,
      status: "cancelled",
      current_period_end: end.toISOString(),
      cancel_at_next_billing_date: true,
    });
    expect(result.ok).toBe(true);
    const ent = await getEntitlement(userId);
    expect(ent.plan).toBe("PREMIUM");
    expect(ent.cancelAtPeriodEnd).toBe(true);
  });

  it("expires access on subscription.expired", async () => {
    const result = await run("subscription.expired", `wh_${stamp}_expired`, {
      subscription_id: subId,
      status: "expired",
      current_period_end: new Date(Date.now() - 1000).toISOString(),
    });
    expect(result.ok).toBe(true);
    const ent = await getEntitlement(userId);
    expect(ent.plan).toBe("EXPIRED");
    expect(hasEntitlement(ent, "PREMIUM")).toBe(false);
  });

  it("keeps an in-flight delivery retryable instead of ack'ing it", async () => {
    const webhookId = `wh_${stamp}_inprog`;
    await prisma.webhookEvent.create({
      data: {
        provider: "dodo",
        providerEventId: webhookId,
        eventType: "subscription.active",
        status: "processing",
        processingStartedAt: new Date(),
        payloadHash: "x",
      },
    });
    const result = await run("subscription.active", webhookId, { subscription_id: subId });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("in_progress");
  });

  it("does not attach a deleted user's webhook to a later account", async () => {
    cancel.mockClear();
    const result = await processVerifiedDodoEvent({
      webhookId: `wh_${stamp}_deleted`,
      eventType: "subscription.active",
      timestamp: String(Math.floor(Date.now() / 1000)),
      payload: {
        event_type: "subscription.active",
        data: {
          subscription_id: `sub_deleted_${stamp}`,
          metadata: { userId: "missing_user_id", planId: "PREMIUM_MONTHLY" },
        },
      },
      rawBody: "{}",
    });
    expect(result).toMatchObject({ ok: true, noUser: true });
    expect(cancel).toHaveBeenCalled();
    expect(await prisma.entitlement.findUnique({ where: { userId } })).toBeTruthy();
  });

  it("rejects forged webhook signatures over the HTTP route", async () => {
    process.env.DODO_WEBHOOK_SECRET = TEST_SECRET;
    const { POST } = await import("@/app/api/payments/webhooks/dodo/route");
    const raw = JSON.stringify({ event_type: "payment.succeeded", data: {} });
    const req = new NextRequest("http://localhost:3000/api/payments/webhooks/dodo", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "webhook-id": `wh_${stamp}_forged`,
        "webhook-timestamp": String(Math.floor(Date.now() / 1000)),
        "webhook-signature": "v1,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
      },
      body: raw,
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("accepts a valid signature and uses webhook-id as the idempotency key", async () => {
    const p = new DodoProvider();
    const raw = JSON.stringify({ event_type: "payment.succeeded", event_id: "payload_not_the_key", data: { payment_id: "pay_x" } });
    const id = `wh_${stamp}_header`;
    const ts = String(Math.floor(Date.now() / 1000));
    const res = await p.verifyWebhook({
      rawBody: raw,
      headers: { "webhook-id": id, "webhook-timestamp": ts, "webhook-signature": sign(raw, id, ts) },
    });
    expect(res.ok).toBe(true);
    expect(res.providerEventId).toBe(id);
  });

  it("detects premium without a local subscription as drift and does not repair without provider data", async () => {
    const ghost = await prisma.user.create({ data: { email: `billing-drift-${stamp}@example.com` } });
    await prisma.entitlement.create({ data: { userId: ghost.id, plan: "PREMIUM", status: "ACTIVE", source: "dodo" } });
    const drift = await detectLocalBillingDrift(ghost.id);
    expect(drift.some((item) => item.kind === "premium_without_provider_subscription")).toBe(true);
    const unrepaired = await reconcileFromProvider(ghost.id, null);
    expect(unrepaired.some((item) => item.kind === "provider_unavailable" && item.repaired === false)).toBe(true);
    expect((await getEntitlement(ghost.id)).plan).toBe("FREE");
    await prisma.entitlement.deleteMany({ where: { userId: ghost.id } });
    await prisma.user.delete({ where: { id: ghost.id } });
  });

  it("repairs local subscription + entitlement when provider state is authoritative", async () => {
    const future = new Date(Date.now() + 20 * 86400000);
    const repaired = await reconcileFromProvider(userId, {
      providerSubscriptionId: subId,
      providerCustomerId: `cus_${stamp}`,
      status: "active",
      currentPeriodEnd: future,
      cancelAtPeriodEnd: false,
    });
    expect(repaired.every((item) => item.kind !== "provider_unavailable")).toBe(true);
    const ent = await getEntitlement(userId);
    expect(ent.plan).toBe("PREMIUM");
    expect(ent.providerBacked).toBe(true);
  });

  it("keeps a failed event retryable after a database write error", async () => {
    const webhookId = `wh_${stamp}_dberr`;
    const original = prisma.$transaction.bind(prisma);
    let calls = 0;
    (prisma as { $transaction: typeof prisma.$transaction }).$transaction = (async (
      fnOrOps: unknown,
      options?: unknown,
    ) => {
      if (typeof fnOrOps !== "function") {
        return original(fnOrOps as never, options as never);
      }
      return original(async (tx) => {
        const origUpsert = tx.payment.upsert.bind(tx.payment);
        (tx.payment as { upsert: typeof origUpsert }).upsert = (async (
          ...args: Parameters<typeof origUpsert>
        ) => {
          calls += 1;
          if (calls === 1) throw new Error("injected db failure");
          return origUpsert(...args);
        }) as unknown as typeof origUpsert;
        return (fnOrOps as (client: typeof tx) => Promise<unknown>)(tx);
      }, options as never);
    }) as typeof prisma.$transaction;
    try {
      const result = await run("payment.succeeded", webhookId, {
        payment_id: `${payId}_dberr`,
        subscription_id: subId,
        total_amount: 1,
        currency: "INR",
      });
      expect(result.ok).toBe(false);
      expect((await prisma.webhookEvent.findUnique({ where: { providerEventId: webhookId } }))?.status).toBe("failed");
      const retry = await run("payment.succeeded", webhookId, {
        payment_id: `${payId}_dberr`,
        subscription_id: subId,
        total_amount: 1,
        currency: "INR",
      });
      expect(retry.ok).toBe(true);
      expect((await prisma.webhookEvent.findUnique({ where: { providerEventId: webhookId } }))?.status).toBe("succeeded");
    } finally {
      (prisma as { $transaction: typeof prisma.$transaction }).$transaction = original;
    }
  });

  it("does not reassign a PaymentCustomer or grant Premium to a second account", async () => {
    const attacker = await prisma.user.create({ data: { email: `billing-steal-${stamp}@example.com` } });
    await prisma.entitlement.create({ data: { userId: attacker.id, plan: "FREE", status: "ACTIVE" } });
    const payload = {
      event_type: "subscription.active",
      data: {
        metadata: { userId: attacker.id, planId: "PREMIUM_MONTHLY" },
        customer_id: `cus_${stamp}`,
        subscription_id: subId,
        status: "active",
        current_period_end: new Date(Date.now() + 86400000).toISOString(),
      },
    };
    await processVerifiedDodoEvent({
      webhookId: `wh_${stamp}_steal`,
      eventType: "subscription.active",
      timestamp: String(Math.floor(Date.now() / 1000) + 30),
      payload,
      rawBody: JSON.stringify(payload),
    });
    expect((await prisma.paymentCustomer.findUnique({ where: { providerCustomerId: `cus_${stamp}` } }))?.userId).toBe(userId);
    expect((await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } }))?.userId).toBe(userId);
    expect((await getEntitlement(attacker.id)).plan).toBe("FREE");
    await prisma.entitlement.deleteMany({ where: { userId: attacker.id } });
    await prisma.webhookEvent.deleteMany({ where: { providerEventId: `wh_${stamp}_steal` } }).catch(() => {});
    await prisma.user.delete({ where: { id: attacker.id } });
  });
});
