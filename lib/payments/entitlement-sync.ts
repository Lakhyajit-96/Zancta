/**
 * Authoritative writer for Entitlement from provider-backed billing state.
 * Never grants PREMIUM without a provider subscription id.
 * Never grants ADMIN. Never mutates an existing ADMIN entitlement.
 */
import prisma from "@/lib/db";
import { auditEvent } from "@/lib/audit";
import { isStaleEvent } from "@/lib/payments/billing-state";

type BillingPlan = "PREMIUM" | "FREE" | "EXPIRED" | "CANCELLED";

type SyncInput = {
  userId: string;
  provider: string;
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
  plan: BillingPlan;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
  providerEventId?: string;
  eventTimestamp?: number | null;
  ip?: string | null;
};

export type SyncResult = { applied: boolean; reason: string };

function isAdminGrant(plan: string): boolean {
  return plan === "ADMIN";
}

async function refuseAdminMutation(input: {
  userId: string;
  provider: string;
  plan: string;
  status: string;
  providerEventId?: string;
  ip?: string | null;
}): Promise<SyncResult> {
  await auditEvent({
    userId: input.userId,
    action: "payment.entitlement_admin_protected",
    targetId: input.providerEventId || input.userId,
    metadata: JSON.stringify({
      provider: input.provider,
      attemptedPlan: input.plan,
      attemptedStatus: input.status,
      reason: "admin_protected",
    }),
    ...(input.ip ? { ip: input.ip } : {}),
  });
  return { applied: false, reason: "admin_protected" };
}

export async function syncEntitlement(input: SyncInput): Promise<SyncResult> {
  const {
    userId,
    provider,
    providerCustomerId,
    providerSubscriptionId,
    plan,
    status,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    providerEventId,
    eventTimestamp,
    ip,
  } = input;

  // Billing must never grant operator ADMIN. The type excludes it; this is
  // the runtime backstop if a caller widens the union.
  if (isAdminGrant(plan)) {
    return { applied: false, reason: "refused_admin_grant" };
  }

  if (plan === "PREMIUM" && status === "ACTIVE" && !providerSubscriptionId) {
    return { applied: false, reason: "refused_premium_without_provider_subscription" };
  }

  const existing = await prisma.entitlement.findUnique({ where: { userId } });
  if (existing?.plan === "ADMIN") {
    return refuseAdminMutation({ userId, provider, plan, status, providerEventId, ip });
  }
  if (isStaleEvent({ incomingTimestamp: eventTimestamp, existingTimestamp: existing?.providerUpdatedAt })) {
    return { applied: false, reason: "stale_event" };
  }

  const providerUpdatedAt = eventTimestamp != null ? new Date(eventTimestamp * 1000) : new Date();
  const data = {
    plan,
    status,
    source: provider,
    ...(providerCustomerId ? { providerCustomerId } : {}),
    ...(providerSubscriptionId ? { providerSubscriptionId } : {}),
    currentPeriodStart: currentPeriodStart || undefined,
    currentPeriodEnd: currentPeriodEnd || undefined,
    cancelAtPeriodEnd: !!cancelAtPeriodEnd,
    expiresAt: currentPeriodEnd || undefined,
    providerUpdatedAt,
    ...(providerEventId ? { lastWebhookId: providerEventId } : {}),
  };

  // Atomic: this UPDATE only matches rows that are not ADMIN, so a concurrent
  // operator promotion cannot be overwritten by billing.
  const updated = await prisma.entitlement.updateMany({
    where: { userId, plan: { not: "ADMIN" } },
    data,
  });
  if (updated.count === 1) {
    await auditEvent({
      userId,
      action: `payment.entitlement_${status.toLowerCase()}`,
      targetId: providerEventId || providerSubscriptionId || userId,
      metadata: JSON.stringify({ provider, plan, status, providerEventId, reason: "applied" }),
      ...(ip ? { ip } : {}),
    });
    return { applied: true, reason: "applied" };
  }

  const current = await prisma.entitlement.findUnique({ where: { userId } });
  if (current?.plan === "ADMIN") {
    return refuseAdminMutation({ userId, provider, plan, status, providerEventId, ip });
  }

  if (!current) {
    try {
      await prisma.entitlement.create({
        data: {
          userId,
          ...data,
        },
      });
    } catch (e: unknown) {
      if ((e as { code?: string }).code !== "P2002") throw e;
      const raced = await prisma.entitlement.updateMany({
        where: { userId, plan: { not: "ADMIN" } },
        data,
      });
      if (raced.count !== 1) {
        const afterRace = await prisma.entitlement.findUnique({ where: { userId } });
        if (afterRace?.plan === "ADMIN") {
          return refuseAdminMutation({ userId, provider, plan, status, providerEventId, ip });
        }
        return { applied: false, reason: "create_conflict" };
      }
    }
    await auditEvent({
      userId,
      action: `payment.entitlement_${status.toLowerCase()}`,
      targetId: providerEventId || providerSubscriptionId || userId,
      metadata: JSON.stringify({ provider, plan, status, providerEventId, reason: "applied" }),
      ...(ip ? { ip } : {}),
    });
    return { applied: true, reason: "applied" };
  }

  return { applied: false, reason: "update_conflict" };
}

export async function revokeToFree(userId: string, provider: string, reason: string, providerEventId?: string, eventTimestamp?: number | null) {
  const existing = await prisma.entitlement.findUnique({ where: { userId } });
  if (existing?.plan === "ADMIN") {
    return refuseAdminMutation({
      userId,
      provider,
      plan: "EXPIRED",
      status: "EXPIRED",
      providerEventId,
    });
  }
  if (isStaleEvent({ incomingTimestamp: eventTimestamp, existingTimestamp: existing?.providerUpdatedAt })) {
    return { applied: false, reason: "stale_event" };
  }
  const result = await syncEntitlement({
    userId,
    provider,
    plan: "EXPIRED",
    status: "EXPIRED",
    providerSubscriptionId: existing?.providerSubscriptionId,
    providerCustomerId: existing?.providerCustomerId,
    currentPeriodEnd: existing?.currentPeriodEnd,
    currentPeriodStart: existing?.currentPeriodStart,
    cancelAtPeriodEnd: true,
    providerEventId,
    eventTimestamp,
  });
  if (!result.applied) return result;
  await auditEvent({
    userId,
    action: "payment.entitlement_expired",
    targetId: providerEventId || userId,
    metadata: JSON.stringify({ provider, reason, providerEventId }),
  });
  return { applied: true, reason };
}
