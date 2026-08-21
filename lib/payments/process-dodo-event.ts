/**
 * Durable Dodo webhook processing: verify first, then claim, then mutate, then succeed.
 * Failed processing stays retryable. Duplicates of succeeded events are no-ops.
 */
import crypto from "crypto";
import prisma from "@/lib/db";
import { auditEvent } from "@/lib/audit";
import { deriveFromSubscription, isStaleEvent } from "@/lib/payments/billing-state";
import { revokeToFree, syncEntitlement } from "@/lib/payments/entitlement-sync";

const TERMINAL_SUCCESS = new Set(["succeeded", "processed", "duplicate"]);
const STALE_PROCESSING_MS = 2 * 60 * 1000;
const RETRYABLE = new Set(["received", "failed", "processing"]);

export type ProcessResult =
  | { ok: true; duplicate?: boolean; noUser?: boolean; stale?: boolean }
  | { ok: false; retry: true; error: string };

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

export function extractDodoResourceIds(eventType: string, data: Record<string, unknown>) {
  const t = eventType.toLowerCase();
  const isPayment = t.startsWith("payment.") || t.startsWith("refund.") || t.includes("dispute");
  const isSubscription = t.startsWith("subscription.");
  const customer = asRecord(data.customer);

  const paymentId = isPayment
    ? asString(data.payment_id ?? data.paymentId ?? data.id)
    : asString(data.payment_id ?? data.paymentId);
  const subscriptionId = isSubscription
    ? asString(data.subscription_id ?? data.subscriptionId ?? data.id)
    : asString(data.subscription_id ?? data.subscriptionId);
  const customerId = asString(data.customer_id ?? data.customerId ?? customer.customer_id ?? customer.id);

  return { paymentId, subscriptionId, customerId };
}

export function hashWebhookPayload(rawBody: string): string {
  return crypto.createHash("sha256").update(rawBody).digest("hex");
}

async function claimEvent(input: {
  webhookId: string;
  eventType: string;
  payloadHash: string;
  eventTimestamp?: number | null;
}): Promise<"process" | "duplicate" | "in_progress"> {
  const { webhookId, eventType, payloadHash, eventTimestamp } = input;
  try {
    await prisma.webhookEvent.create({
      data: {
        provider: "dodo",
        providerEventId: webhookId,
        eventType,
        status: "received",
        payloadHash,
        eventTimestamp: eventTimestamp ?? undefined,
      },
    });
  } catch (e: unknown) {
    const code = (e as { code?: string }).code;
    if (code !== "P2002") throw e;
  }

  const existing = await prisma.webhookEvent.findUnique({ where: { providerEventId: webhookId } });
  if (!existing) throw new Error("Webhook event missing after insert");
  if (TERMINAL_SUCCESS.has(existing.status)) return "duplicate";

  const processingFresh =
    existing.status === "processing" &&
    existing.processingStartedAt &&
    Date.now() - existing.processingStartedAt.getTime() < STALE_PROCESSING_MS;
  if (processingFresh) return "in_progress";

  const claimed = await prisma.webhookEvent.updateMany({
    where: { providerEventId: webhookId, status: { in: [...RETRYABLE] } },
    data: {
      status: "processing",
      processingStartedAt: new Date(),
      attemptCount: { increment: 1 },
      eventType,
      payloadHash,
      lastError: null,
      ...(eventTimestamp != null ? { eventTimestamp } : {}),
    },
  });
  if (claimed.count !== 1) {
    const again = await prisma.webhookEvent.findUnique({ where: { providerEventId: webhookId } });
    if (again && TERMINAL_SUCCESS.has(again.status)) return "duplicate";
    return "in_progress";
  }
  return "process";
}

async function markSucceeded(webhookId: string) {
  await prisma.webhookEvent.update({
    where: { providerEventId: webhookId },
    data: { status: "succeeded", processedAt: new Date(), lastError: null },
  });
}

async function markFailed(webhookId: string, error: string) {
  await prisma.webhookEvent.update({
    where: { providerEventId: webhookId },
    data: { status: "failed", lastError: error.slice(0, 500), processedAt: null },
  });
}

async function resolveUserId(opts: {
  userIdFromMeta: string | null;
  email: string | null;
  subscriptionId: string | null;
}): Promise<{ userId: string | null; deletedUser: boolean }> {
  if (opts.userIdFromMeta) {
    const user = await prisma.user.findUnique({ where: { id: opts.userIdFromMeta } });
    if (user) return { userId: user.id, deletedUser: false };
    return { userId: null, deletedUser: true };
  }
  if (opts.email) {
    const user = await prisma.user.findUnique({ where: { email: opts.email } });
    if (!user) return { userId: null, deletedUser: false };
    const checkout = await prisma.paymentCheckout.findFirst({
      where: { userId: user.id, status: "created" },
      orderBy: { createdAt: "desc" },
    });
    if (checkout) return { userId: user.id, deletedUser: false };
  }
  return { userId: null, deletedUser: false };
}

async function upsertCustomer(userId: string, customerId: string | null, email: string | null) {
  if (!customerId) return;
  const byUser = await prisma.paymentCustomer.findUnique({ where: { userId } });
  if (byUser) {
    await prisma.paymentCustomer.update({
      where: { userId },
      data: { providerCustomerId: customerId, ...(email ? { email } : {}) },
    }).catch(() => {});
    return;
  }
  await prisma.paymentCustomer.upsert({
    where: { providerCustomerId: customerId },
    create: { userId, provider: "dodo", providerCustomerId: customerId, email: email || undefined },
    update: { userId, ...(email ? { email } : {}) },
  }).catch(() => {});
}

async function upsertSubscription(opts: {
  userId: string;
  subscriptionId: string;
  customerId: string | null;
  plan: string;
  status: string;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
  webhookId: string;
  eventTimestamp?: number | null;
}): Promise<"applied" | "stale"> {
  const existing = await prisma.paymentSubscription.findUnique({
    where: { providerSubscriptionId: opts.subscriptionId },
  });
  if (isStaleEvent({ incomingTimestamp: opts.eventTimestamp, existingTimestamp: existing?.providerUpdatedAt })) {
    return "stale";
  }
  const providerUpdatedAt = opts.eventTimestamp != null ? new Date(opts.eventTimestamp * 1000) : new Date();
  await prisma.paymentSubscription.upsert({
    where: { providerSubscriptionId: opts.subscriptionId },
    create: {
      userId: opts.userId,
      provider: "dodo",
      providerSubscriptionId: opts.subscriptionId,
      providerCustomerId: opts.customerId || undefined,
      plan: opts.plan,
      status: opts.status,
      currentPeriodStart: opts.currentPeriodStart || undefined,
      currentPeriodEnd: opts.currentPeriodEnd || undefined,
      cancelAtPeriodEnd: !!opts.cancelAtPeriodEnd,
      providerUpdatedAt,
      lastWebhookId: opts.webhookId,
    },
    update: {
      status: opts.status,
      ...(opts.customerId ? { providerCustomerId: opts.customerId } : {}),
      ...(opts.currentPeriodStart ? { currentPeriodStart: opts.currentPeriodStart } : {}),
      ...(opts.currentPeriodEnd ? { currentPeriodEnd: opts.currentPeriodEnd } : {}),
      ...(opts.cancelAtPeriodEnd !== undefined ? { cancelAtPeriodEnd: opts.cancelAtPeriodEnd } : {}),
      providerUpdatedAt,
      lastWebhookId: opts.webhookId,
    },
  });
  return "applied";
}

async function applyEntitlementFromSubscription(opts: {
  userId: string;
  subscriptionId: string;
  customerId: string | null;
  webhookId: string;
  eventTimestamp?: number | null;
}) {
  const sub = await prisma.paymentSubscription.findUnique({
    where: { providerSubscriptionId: opts.subscriptionId },
  });
  if (!sub) return { applied: false, reason: "missing_subscription" };
  const derived = deriveFromSubscription({
    status: sub.status,
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
  });
  if (derived.plan === "PREMIUM" && derived.status === "ACTIVE") {
    return syncEntitlement({
      userId: opts.userId,
      provider: "dodo",
      providerCustomerId: opts.customerId || sub.providerCustomerId,
      providerSubscriptionId: opts.subscriptionId,
      plan: "PREMIUM",
      status: "ACTIVE",
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: derived.cancelAtPeriodEnd,
      providerEventId: opts.webhookId,
      eventTimestamp: opts.eventTimestamp,
    });
  }
  return revokeToFree(opts.userId, "dodo", derived.reason, opts.webhookId, opts.eventTimestamp);
}

async function cancelOrphanSubscription(subscriptionId: string) {
  try {
    const { getPaymentProvider } = await import("@/lib/payments");
    await getPaymentProvider("dodo").cancelSubscription(subscriptionId, true);
  } catch (e) {
    throw new Error(`orphan_cancel_failed:${e instanceof Error ? e.message : String(e)}`);
  }
}

export async function processVerifiedDodoEvent(input: {
  webhookId: string;
  eventType: string;
  timestamp?: string;
  payload: unknown;
  rawBody: string;
}): Promise<ProcessResult> {
  const webhookId = input.webhookId.trim();
  if (!webhookId) return { ok: false, retry: true, error: "Missing webhook-id" };

  const eventTimestamp = input.timestamp && Number.isFinite(Number(input.timestamp))
    ? Number(input.timestamp)
    : null;
  const payloadHash = hashWebhookPayload(input.rawBody);
  const payload = asRecord(input.payload);
  const data = payload.data && typeof payload.data === "object" ? asRecord(payload.data) : payload;
  const metadata = data.metadata && typeof data.metadata === "object"
    ? asRecord(data.metadata)
    : asRecord(data.meta);
  const eventType = input.eventType || "unknown";

  let claim: "process" | "duplicate" | "in_progress";
  try {
    claim = await claimEvent({ webhookId, eventType, payloadHash, eventTimestamp });
  } catch (e) {
    return { ok: false, retry: true, error: e instanceof Error ? e.message : "Event claim failed" };
  }
  if (claim === "duplicate") return { ok: true, duplicate: true };
  if (claim === "in_progress") return { ok: false, retry: true, error: "in_progress" };

  try {
    const { paymentId, subscriptionId, customerId } = extractDodoResourceIds(eventType, data);
    const userIdFromMeta = asString(metadata.userId ?? metadata.user_id);
    const planFromMeta = asString(metadata.planId ?? metadata.plan) || "PREMIUM_MONTHLY";
    const email = asString(data.customer_email ?? data.email ?? asRecord(data.customer).email);
    const mapped = await resolveUserId({ userIdFromMeta, email, subscriptionId });
    const t = eventType.toLowerCase();
    const cps = data.current_period_start ? new Date(String(data.current_period_start)) : null;
    const cpe = data.current_period_end ? new Date(String(data.current_period_end)) : null;
    const cancelAtEnd = Boolean(data.cancel_at_next_billing_date ?? data.cancel_at_period_end ?? false);

    if (mapped.deletedUser) {
      if (paymentId) {
        await prisma.payment.upsert({
          where: { providerPaymentId: paymentId },
          create: {
            userId: null,
            provider: "dodo",
            providerPaymentId: paymentId,
            providerSubscriptionId: subscriptionId || undefined,
            amount: Number(data.total_amount ?? data.amount ?? 0),
            currency: String(data.currency || "INR"),
            status: t.includes("fail") ? "failed" : "succeeded",
          },
          update: { userId: null },
        });
      }
      if (subscriptionId) await cancelOrphanSubscription(subscriptionId);
      await markSucceeded(webhookId);
      await auditEvent({
        action: "payment.webhook_deleted_user",
        targetId: webhookId,
        metadata: JSON.stringify({ eventType, subscriptionId, paymentId }),
      });
      return { ok: true, noUser: true };
    }

    if (!mapped.userId) {
      if (paymentId) {
        await prisma.payment.upsert({
          where: { providerPaymentId: paymentId },
          create: {
            provider: "dodo",
            providerPaymentId: paymentId,
            providerSubscriptionId: subscriptionId || undefined,
            amount: Number(data.total_amount ?? data.amount ?? 0),
            currency: String(data.currency || "INR"),
            status: t.includes("fail") ? "failed" : "processing",
          },
          update: {},
        });
      }
      await markSucceeded(webhookId);
      return { ok: true, noUser: true };
    }

    const userId = mapped.userId;
    await upsertCustomer(userId, customerId, email);

    if (t === "payment.succeeded" || t === "payment_succeeded") {
      if (paymentId) {
        await prisma.payment.upsert({
          where: { providerPaymentId: paymentId },
          create: {
            userId,
            provider: "dodo",
            providerPaymentId: paymentId,
            providerSubscriptionId: subscriptionId || undefined,
            amount: Number(data.total_amount ?? data.amount ?? 0),
            currency: String(data.currency || "INR"),
            status: "succeeded",
          },
          update: {
            userId,
            status: "succeeded",
            amount: Number(data.total_amount ?? data.amount ?? 0),
            currency: String(data.currency || "INR"),
            ...(subscriptionId ? { providerSubscriptionId: subscriptionId } : {}),
          },
        });
      }
      await prisma.paymentCheckout.updateMany({
        where: { userId, status: "created" },
        data: { status: "completed" },
      });
      if (subscriptionId) {
        const subApply = await upsertSubscription({
          userId,
          subscriptionId,
          customerId,
          plan: planFromMeta,
          status: "active",
          currentPeriodStart: cps,
          currentPeriodEnd: cpe,
          cancelAtPeriodEnd: cancelAtEnd,
          webhookId,
          eventTimestamp,
        });
        if (subApply === "stale") {
          await markSucceeded(webhookId);
          return { ok: true, stale: true };
        }
        await applyEntitlementFromSubscription({ userId, subscriptionId, customerId, webhookId, eventTimestamp });
      }
    } else if (
      t.includes("subscription.active") ||
      t === "subscription.renewed" ||
      t === "subscription_renewed" ||
      t.includes("subscription.updated") ||
      t === "subscription.plan_changed"
    ) {
      if (!subscriptionId) throw new Error("subscription event missing subscription id");
      const remoteStatus = asString(data.status)?.toLowerCase() || "active";
      const subApply = await upsertSubscription({
        userId,
        subscriptionId,
        customerId,
        plan: planFromMeta,
        status: LIVE_OR_HOLD(remoteStatus),
        currentPeriodStart: cps,
        currentPeriodEnd: cpe,
        cancelAtPeriodEnd: cancelAtEnd,
        webhookId,
        eventTimestamp,
      });
      if (subApply === "stale") {
        await markSucceeded(webhookId);
        return { ok: true, stale: true };
      }
      await applyEntitlementFromSubscription({ userId, subscriptionId, customerId, webhookId, eventTimestamp });
    } else if (t.includes("subscription.on_hold") || t === "subscription_on_hold") {
      if (!subscriptionId) throw new Error("subscription event missing subscription id");
      await upsertSubscription({
        userId,
        subscriptionId,
        customerId,
        plan: planFromMeta,
        status: "on_hold",
        currentPeriodStart: cps,
        currentPeriodEnd: cpe,
        cancelAtPeriodEnd: cancelAtEnd,
        webhookId,
        eventTimestamp,
      });
      await applyEntitlementFromSubscription({ userId, subscriptionId, customerId, webhookId, eventTimestamp });
    } else if (t.includes("subscription.cancelled") || t === "subscription_cancelled" || t === "subscription.canceled") {
      if (!subscriptionId) throw new Error("subscription event missing subscription id");
      await upsertSubscription({
        userId,
        subscriptionId,
        customerId,
        plan: planFromMeta,
        status: "cancelled",
        currentPeriodStart: cps,
        currentPeriodEnd: cpe,
        cancelAtPeriodEnd: true,
        webhookId,
        eventTimestamp,
      });
      await applyEntitlementFromSubscription({ userId, subscriptionId, customerId, webhookId, eventTimestamp });
    } else if (t.includes("subscription.failed") || t === "subscription_failed") {
      if (subscriptionId) {
        await upsertSubscription({
          userId,
          subscriptionId,
          customerId,
          plan: planFromMeta,
          status: "failed",
          currentPeriodStart: cps,
          currentPeriodEnd: cpe,
          cancelAtPeriodEnd: cancelAtEnd,
          webhookId,
          eventTimestamp,
        });
        await applyEntitlementFromSubscription({ userId, subscriptionId, customerId, webhookId, eventTimestamp });
      }
    } else if (t.includes("payment.failed") || t === "payment_failed") {
      if (paymentId) {
        await prisma.payment.upsert({
          where: { providerPaymentId: paymentId },
          create: {
            userId,
            provider: "dodo",
            providerPaymentId: paymentId,
            providerSubscriptionId: subscriptionId || undefined,
            amount: Number(data.total_amount ?? data.amount ?? 0),
            currency: String(data.currency || "INR"),
            status: "failed",
          },
          update: { status: "failed", userId },
        });
      }
    } else if (t.includes("subscription.expired") || t === "subscription_expired") {
      if (!subscriptionId) throw new Error("subscription event missing subscription id");
      await upsertSubscription({
        userId,
        subscriptionId,
        customerId,
        plan: planFromMeta,
        status: "expired",
        currentPeriodStart: cps,
        currentPeriodEnd: cpe,
        cancelAtPeriodEnd: true,
        webhookId,
        eventTimestamp,
      });
      await applyEntitlementFromSubscription({ userId, subscriptionId, customerId, webhookId, eventTimestamp });
    } else if (t.includes("refund.succeeded") || t === "refund_succeeded") {
      if (paymentId) {
        await prisma.payment.updateMany({
          where: { providerPaymentId: paymentId },
          data: { status: "refunded" },
        });
      }
      await revokeToFree(userId, "dodo", "refund_succeeded", webhookId, eventTimestamp);
    } else if (t.includes("dispute") || t.includes("chargeback")) {
      if (subscriptionId) {
        await prisma.paymentSubscription.updateMany({
          where: { providerSubscriptionId: subscriptionId },
          data: { status: "on_hold" },
        });
      }
      await revokeToFree(userId, "dodo", "dispute", webhookId, eventTimestamp);
    }

    await markSucceeded(webhookId);
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await markFailed(webhookId, message).catch(() => {});
    return { ok: false, retry: true, error: message };
  }
}

function LIVE_OR_HOLD(status: string): string {
  if (status === "on_hold") return "on_hold";
  if (status === "cancelled" || status === "canceled") return "cancelled";
  if (status === "expired") return "expired";
  if (status === "failed" || status === "pending") return status;
  return "active";
}
