import { afterAll, describe, expect, it } from "vitest";
import prisma from "@/lib/db";
import { getEntitlement, hasEntitlement } from "@/lib/entitlement";
import { processVerifiedDodoEvent } from "@/lib/payments/process-dodo-event";
import { reconcileFromProvider } from "@/lib/payments/reconciliation";

const stamp = Date.now();
const createdUsers: string[] = [];

function withInjectedTx(inject: (tx: typeof prisma) => void): () => void {
  const original = prisma.$transaction.bind(prisma);
  (prisma as { $transaction: typeof prisma.$transaction }).$transaction = (async (
    fnOrOps: unknown,
    options?: unknown,
  ) => {
    if (typeof fnOrOps !== "function") {
      return original(fnOrOps as never, options as never);
    }
    return original(async (tx) => {
      inject(tx as typeof prisma);
      return (fnOrOps as (client: typeof tx) => Promise<unknown>)(tx);
    }, options as never);
  }) as typeof prisma.$transaction;
  return () => {
    (prisma as { $transaction: typeof prisma.$transaction }).$transaction = original;
  };
}

async function setupUser(label: string) {
  const user = await prisma.user.create({ data: { email: `billing-tx-${label}-${stamp}@example.com` } });
  createdUsers.push(user.id);
  await prisma.entitlement.create({ data: { userId: user.id, plan: "FREE", status: "ACTIVE" } });
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
      customer_id: `cus_tx_${stamp}`,
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

describe("P2-PAY-4 billing write transaction integrity", () => {
  afterAll(async () => {
    for (const userId of createdUsers) {
      await prisma.webhookEvent.deleteMany({ where: { providerEventId: { startsWith: `wh_tx_` } } }).catch(() => {});
      await prisma.payment.deleteMany({ where: { userId } }).catch(() => {});
      await prisma.paymentSubscription.deleteMany({ where: { userId } }).catch(() => {});
      await prisma.paymentCustomer.deleteMany({ where: { userId } }).catch(() => {});
      await prisma.paymentCheckout.deleteMany({ where: { userId } }).catch(() => {});
      await prisma.entitlement.deleteMany({ where: { userId } }).catch(() => {});
      await prisma.auditEvent.deleteMany({ where: { userId } }).catch(() => {});
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
  });

  it("A. payment write failure does not leave a partial entitlement", async () => {
    const userId = await setupUser("pay_fail");
    const payId = `pay_tx_a_${stamp}`;
    const subId = `sub_tx_a_${stamp}`;
    const webhookId = `wh_tx_${stamp}_a`;
    const before = await prisma.entitlement.findUnique({ where: { userId } });
    expect(before?.plan).toBe("FREE");

    const restore = withInjectedTx((tx) => {
      (tx.payment as { upsert: typeof tx.payment.upsert }).upsert = (async () => {
        throw new Error("injected payment failure");
      }) as unknown as typeof tx.payment.upsert;
    });
    try {
      const result = await runWebhook(userId, "payment.succeeded", webhookId, {
        payment_id: payId,
        subscription_id: subId,
        total_amount: 19900,
        currency: "INR",
        status: "active",
        current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
      });
      expect(result.ok).toBe(false);
    } finally {
      restore();
    }

    expect((await prisma.payment.findUnique({ where: { providerPaymentId: payId } }))).toBeNull();
    expect((await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } }))).toBeNull();
    expect((await prisma.entitlement.findUnique({ where: { userId } }))?.plan).toBe("FREE");
    expect(hasEntitlement(await getEntitlement(userId), "PREMIUM")).toBe(false);
    expect((await prisma.webhookEvent.findUnique({ where: { providerEventId: webhookId } }))?.status).toBe("failed");
  });

  it("B. entitlement write failure rolls back the payment write", async () => {
    const userId = await setupUser("ent_fail");
    const payId = `pay_tx_b_${stamp}`;
    const subId = `sub_tx_b_${stamp}`;
    const webhookId = `wh_tx_${stamp}_b`;

    const restore = withInjectedTx((tx) => {
      (tx.entitlement as { updateMany: typeof tx.entitlement.updateMany }).updateMany = (async () => {
        throw new Error("injected entitlement failure");
      }) as unknown as typeof tx.entitlement.updateMany;
    });
    try {
      const result = await runWebhook(userId, "payment.succeeded", webhookId, {
        payment_id: payId,
        subscription_id: subId,
        total_amount: 19900,
        currency: "INR",
        status: "active",
        current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
      });
      expect(result.ok).toBe(false);
    } finally {
      restore();
    }

    expect((await prisma.payment.findUnique({ where: { providerPaymentId: payId } }))).toBeNull();
    expect((await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } }))).toBeNull();
    expect((await prisma.entitlement.findUnique({ where: { userId } }))?.plan).toBe("FREE");
    expect((await prisma.webhookEvent.findUnique({ where: { providerEventId: webhookId } }))?.status).toBe("failed");
  });

  it("C. processing-state failure does not commit billing mutations", async () => {
    const userId = await setupUser("ack_fail");
    const payId = `pay_tx_c_${stamp}`;
    const subId = `sub_tx_c_${stamp}`;
    const webhookId = `wh_tx_${stamp}_c`;

    const restore = withInjectedTx((tx) => {
      (tx.webhookEvent as { update: typeof tx.webhookEvent.update }).update = (async () => {
        throw new Error("injected processing-state failure");
      }) as unknown as typeof tx.webhookEvent.update;
    });
    try {
      const result = await runWebhook(userId, "payment.succeeded", webhookId, {
        payment_id: payId,
        subscription_id: subId,
        total_amount: 19900,
        currency: "INR",
        status: "active",
        current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
      });
      expect(result.ok).toBe(false);
    } finally {
      restore();
    }

    expect((await prisma.payment.findUnique({ where: { providerPaymentId: payId } }))).toBeNull();
    expect((await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } }))).toBeNull();
    expect((await prisma.entitlement.findUnique({ where: { userId } }))?.plan).toBe("FREE");
    const event = await prisma.webhookEvent.findUnique({ where: { providerEventId: webhookId } });
    expect(event?.status).toBe("failed");
    expect(event?.status).not.toBe("succeeded");
  });

  it("D. a failed transaction remains retryable and then applies fully", async () => {
    const userId = await setupUser("retry");
    const payId = `pay_tx_d_${stamp}`;
    const subId = `sub_tx_d_${stamp}`;
    const webhookId = `wh_tx_${stamp}_d`;
    let calls = 0;
    const restore = withInjectedTx((tx) => {
      const orig = tx.payment.upsert.bind(tx.payment);
      (tx.payment as { upsert: typeof orig }).upsert = (async (...args: Parameters<typeof orig>) => {
        calls += 1;
        if (calls === 1) throw new Error("injected retryable failure");
        return orig(...args);
      }) as unknown as typeof orig;
    });
    try {
      const first = await runWebhook(userId, "payment.succeeded", webhookId, {
        payment_id: payId,
        subscription_id: subId,
        total_amount: 19900,
        currency: "INR",
        current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
      });
      expect(first.ok).toBe(false);
      expect((await prisma.webhookEvent.findUnique({ where: { providerEventId: webhookId } }))?.status).toBe("failed");
      expect((await prisma.payment.findUnique({ where: { providerPaymentId: payId } }))).toBeNull();

      const retry = await runWebhook(userId, "payment.succeeded", webhookId, {
        payment_id: payId,
        subscription_id: subId,
        total_amount: 19900,
        currency: "INR",
        current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
      });
      expect(retry.ok).toBe(true);
    } finally {
      restore();
    }

    expect((await prisma.webhookEvent.findUnique({ where: { providerEventId: webhookId } }))?.status).toBe("succeeded");
    expect((await prisma.payment.findUnique({ where: { providerPaymentId: payId } }))?.status).toBe("succeeded");
    expect((await prisma.entitlement.findUnique({ where: { userId } }))?.plan).toBe("PREMIUM");
    expect(hasEntitlement(await getEntitlement(userId), "PREMIUM")).toBe(true);
  });

  it("E. concurrent duplicate webhooks apply the mutation once", async () => {
    const userId = await setupUser("concurrent");
    const payId = `pay_tx_e_${stamp}`;
    const subId = `sub_tx_e_${stamp}`;
    const webhookId = `wh_tx_${stamp}_e`;
    const data = {
      payment_id: payId,
      subscription_id: subId,
      total_amount: 19900,
      currency: "INR",
      current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
    };

    const [first, second] = await Promise.all([
      runWebhook(userId, "payment.succeeded", webhookId, data),
      runWebhook(userId, "payment.succeeded", webhookId, data),
    ]);

    expect([first, second].every((r) => r.ok || ("retry" in r && r.retry))).toBe(true);
    const processed = [first, second].filter((r) => r.ok && !("duplicate" in r && r.duplicate));
    expect(processed.length).toBe(1);

    const payments = await prisma.payment.findMany({ where: { providerPaymentId: payId } });
    expect(payments).toHaveLength(1);
    expect(payments[0]?.status).toBe("succeeded");
    const subs = await prisma.paymentSubscription.findMany({ where: { providerSubscriptionId: subId } });
    expect(subs).toHaveLength(1);
    expect((await prisma.entitlement.findUnique({ where: { userId } }))?.plan).toBe("PREMIUM");
    expect((await prisma.webhookEvent.findUnique({ where: { providerEventId: webhookId } }))?.status).toBe("succeeded");
  });

  it("F. stale webhook remains terminal ACKed without mutating newer state", async () => {
    const userId = await setupUser("stale");
    const subId = `sub_tx_f_${stamp}`;
    const newerTs = Math.floor(Date.now() / 1000);
    const olderTs = newerTs - 3600;
    const newerEnd = new Date(Date.now() + 60 * 86400000);
    const olderEnd = new Date(Date.now() + 5 * 86400000);

    const applied = await runWebhook(userId, "subscription.active", `wh_tx_${stamp}_f_new`, {
      subscription_id: subId,
      status: "active",
      current_period_end: newerEnd.toISOString(),
    }, newerTs);
    expect(applied.ok).toBe(true);
    const afterNew = await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } });
    expect(afterNew?.currentPeriodEnd?.getTime()).toBe(newerEnd.getTime());

    const stale = await runWebhook(userId, "subscription.updated", `wh_tx_${stamp}_f_old`, {
      subscription_id: subId,
      status: "active",
      current_period_end: olderEnd.toISOString(),
    }, olderTs);
    expect(stale).toMatchObject({ ok: true, stale: true });

    const afterOld = await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } });
    expect(afterOld?.currentPeriodEnd?.getTime()).toBe(afterNew?.currentPeriodEnd?.getTime());
    expect((await prisma.entitlement.findUnique({ where: { userId } }))?.plan).toBe("PREMIUM");
    expect((await prisma.webhookEvent.findUnique({ where: { providerEventId: `wh_tx_${stamp}_f_old` } }))?.status).toBe("succeeded");
  });

  it("G. reconciliation failure leaves no partial local billing state", async () => {
    const userId = await setupUser("recon");
    const subId = `sub_tx_g_${stamp}`;
    const future = new Date(Date.now() + 20 * 86400000);
    const beforeEnt = await prisma.entitlement.findUnique({ where: { userId } });
    expect(beforeEnt?.plan).toBe("FREE");
    expect(await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } })).toBeNull();

    const restore = withInjectedTx((tx) => {
      (tx.paymentSubscription as { upsert: typeof tx.paymentSubscription.upsert }).upsert = (async () => {
        throw new Error("injected recon failure");
      }) as unknown as typeof tx.paymentSubscription.upsert;
    });
    try {
      await expect(
        reconcileFromProvider(userId, {
          providerSubscriptionId: subId,
          providerCustomerId: `cus_tx_g_${stamp}`,
          status: "active",
          currentPeriodEnd: future,
          cancelAtPeriodEnd: false,
        }),
      ).rejects.toThrow("injected recon failure");
    } finally {
      restore();
    }

    expect(await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } })).toBeNull();
    expect((await prisma.entitlement.findUnique({ where: { userId } }))?.plan).toBe("FREE");
    expect(hasEntitlement(await getEntitlement(userId), "PREMIUM")).toBe(false);

    await reconcileFromProvider(userId, {
      providerSubscriptionId: subId,
      providerCustomerId: `cus_tx_g_${stamp}`,
      status: "active",
      currentPeriodEnd: future,
      cancelAtPeriodEnd: false,
    });
    expect((await prisma.paymentSubscription.findUnique({ where: { providerSubscriptionId: subId } }))?.status).toBe("active");
    expect((await prisma.entitlement.findUnique({ where: { userId } }))?.plan).toBe("PREMIUM");
  });
});
