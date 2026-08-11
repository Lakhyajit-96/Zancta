/**
 * Entitlement sync — authoritative writer for Entitlement from payment/subscription state.
 * No file bytes, no card data.
 */
import prisma from "@/lib/db";
import { auditEvent } from "@/lib/audit";

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
  ip?: string | null;
};

export async function syncEntitlement(input: SyncInput) {
  const { userId, provider, providerCustomerId, providerSubscriptionId, plan, status, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd, providerEventId, ip } = input;

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
    },
  });

  await auditEvent({
    userId,
    action: `payment.entitlement_${status.toLowerCase()}`,
    targetId: providerEventId || providerSubscriptionId || userId,
    metadata: JSON.stringify({ provider, plan, status, providerEventId }),
    ...(ip ? { ip } : {}),
  } as Parameters<typeof auditEvent>[0]);
}

export async function revokeToFree(userId: string, provider: string, reason: string, providerEventId?: string) {
  await syncEntitlement({
    userId,
    provider,
    plan: "EXPIRED",
    status: "EXPIRED",
    providerEventId,
  });
  // Keep audit with reason
  await auditEvent({
    userId,
    action: "payment.entitlement_expired",
    targetId: providerEventId || userId,
    metadata: JSON.stringify({ provider, reason, providerEventId }),
  } as Parameters<typeof auditEvent>[0]);
}
