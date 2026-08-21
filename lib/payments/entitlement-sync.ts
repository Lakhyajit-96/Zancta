/**
 * Authoritative writer for Entitlement from provider-backed billing state.
 * Never grants PREMIUM without a provider subscription id.
 */
import prisma from "@/lib/db";
import { auditEvent } from "@/lib/audit";
import { isStaleEvent } from "@/lib/payments/billing-state";

type SyncInput = {
  userId: string;
  provider: string;
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
  plan: "PREMIUM" | "FREE" | "EXPIRED" | "CANCELLED";
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
  providerEventId?: string;
  eventTimestamp?: number | null;
  ip?: string | null;
};

export type SyncResult = { applied: boolean; reason: string };

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

  if (plan === "PREMIUM" && status === "ACTIVE" && !providerSubscriptionId) {
    return { applied: false, reason: "refused_premium_without_provider_subscription" };
  }

  const existing = await prisma.entitlement.findUnique({ where: { userId } });
  if (isStaleEvent({ incomingTimestamp: eventTimestamp, existingTimestamp: existing?.providerUpdatedAt })) {
    return { applied: false, reason: "stale_event" };
  }

  const providerUpdatedAt = eventTimestamp != null ? new Date(eventTimestamp * 1000) : new Date();

  await prisma.entitlement.upsert({
    where: { userId },
    create: {
      userId,
      plan,
      status,
      source: provider,
      providerCustomerId: providerCustomerId || undefined,
      providerSubscriptionId: providerSubscriptionId || undefined,
      currentPeriodStart: currentPeriodStart || undefined,
      currentPeriodEnd: currentPeriodEnd || undefined,
      cancelAtPeriodEnd: !!cancelAtPeriodEnd,
      expiresAt: currentPeriodEnd || undefined,
      providerUpdatedAt,
      lastWebhookId: providerEventId,
    },
    update: {
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
    },
  });

  await auditEvent({
    userId,
    action: `payment.entitlement_${status.toLowerCase()}`,
    targetId: providerEventId || providerSubscriptionId || userId,
    metadata: JSON.stringify({ provider, plan, status, providerEventId, reason: "applied" }),
    ...(ip ? { ip } : {}),
  });

  return { applied: true, reason: "applied" };
}

export async function revokeToFree(userId: string, provider: string, reason: string, providerEventId?: string, eventTimestamp?: number | null) {
  const existing = await prisma.entitlement.findUnique({ where: { userId } });
  if (isStaleEvent({ incomingTimestamp: eventTimestamp, existingTimestamp: existing?.providerUpdatedAt })) {
    return { applied: false, reason: "stale_event" };
  }
  await syncEntitlement({
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
  await auditEvent({
    userId,
    action: "payment.entitlement_expired",
    targetId: providerEventId || userId,
    metadata: JSON.stringify({ provider, reason, providerEventId }),
  });
  return { applied: true, reason };
}
