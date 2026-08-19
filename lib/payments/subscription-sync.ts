/**
 * Provider subscription refresh — closes the gap where a cancellation made
 * against the provider (e.g., Dodo dashboard or API PATCH) emits no webhook,
 * so local state can drift. Server-authoritative: reads never require the
 * provider; the provider is only consulted on a throttled refresh.
 * No card data, no file bytes.
 */
import prisma from "@/lib/db";
import { rateLimitAsync } from "@/lib/rate-limit";

// How often we may consult the provider for one user. Local DB stays the
// read path; this only gates the expensive/external call.
const SYNC_WINDOW_MS = 5 * 60 * 1000;

/**
 * Refresh local subscription + entitlement state from the provider when
 * needed. Throttled per user via Upstash (falls back to in-memory in dev).
 * Returns silently on any provider error — local state remains authoritative.
 */
export async function refreshSubscriptionFromProvider(userId: string): Promise<void> {
  const ent = await prisma.entitlement.findUnique({ where: { userId } });
  if (!ent?.providerSubscriptionId) return;
  // Only PREMIUM-family entitlements need provider reconciliation.
  if (ent.plan !== "PREMIUM") return;

  const rl = await rateLimitAsync(`billing-sync:${userId}`, 1, SYNC_WINDOW_MS);
  if (!rl.ok) return; // recently synced — trust local state

  const { getPaymentProvider } = await import("@/lib/payments");
  const provider = getPaymentProvider("dodo");
  let remote;
  try {
    remote = await provider.getSubscription(ent.providerSubscriptionId);
  } catch (e) {
    console.warn("[billing-sync] provider refresh failed; keeping local state", e instanceof Error ? e.message : String(e));
    return;
  }
  if (!remote) return; // provider unknown/404 — keep local state

  const sub = await prisma.paymentSubscription.findFirst({
    where: { providerSubscriptionId: ent.providerSubscriptionId },
  });

  // 1) Propagate cancel-at-period-end that arrived without a webhook.
  if (remote.cancelAtPeriodEnd && !ent.cancelAtPeriodEnd) {
    await prisma.entitlement.update({ where: { userId }, data: { cancelAtPeriodEnd: true } });
    if (sub) await prisma.paymentSubscription.update({ where: { id: sub.id }, data: { cancelAtPeriodEnd: true } });
  }

  // 2) Terminal provider states — reconcile entitlement immediately.
  const rs = remote.status.toLowerCase();
  if (rs === "cancelled" || rs === "canceled" || rs === "expired") {
    const cpe = remote.currentPeriodEnd || ent.currentPeriodEnd;
    const periodEnded = cpe ? new Date(cpe).getTime() <= Date.now() : false;
    if (periodEnded) {
      const { revokeToFree } = await import("@/lib/payments/entitlement-sync");
      await revokeToFree(userId, "dodo", `provider_status_${rs}`);
    } else {
      // Period not over — stay entitled until period end, but mark it.
      await prisma.entitlement.update({ where: { userId }, data: { cancelAtPeriodEnd: true, ...(cpe ? { currentPeriodEnd: cpe, expiresAt: cpe } : {}) } });
    }
    if (sub) {
      await prisma.paymentSubscription.update({
        where: { id: sub.id },
        data: { status: rs === "expired" ? "expired" : "cancelled", cancelAtPeriodEnd: true, ...(remote.currentPeriodEnd ? { currentPeriodEnd: remote.currentPeriodEnd } : {}) },
      });
    }
    return;
  }

  // 3) Active/on_hold — refresh period dates if the provider knows them.
  if (sub && remote.currentPeriodEnd && (!sub.currentPeriodEnd || new Date(sub.currentPeriodEnd).getTime() !== remote.currentPeriodEnd.getTime())) {
    await prisma.paymentSubscription.update({
      where: { id: sub.id },
      data: {
        status: rs === "on_hold" ? "on_hold" : "active",
        currentPeriodEnd: remote.currentPeriodEnd,
        ...(remote.currentPeriodStart ? { currentPeriodStart: remote.currentPeriodStart } : {}),
      },
    });
    if (remote.currentPeriodEnd && (!ent.currentPeriodEnd || new Date(remote.currentPeriodEnd) > new Date(ent.currentPeriodEnd))) {
      await prisma.entitlement.update({
        where: { userId },
        data: {
          currentPeriodEnd: remote.currentPeriodEnd,
          expiresAt: remote.currentPeriodEnd,
          ...(remote.currentPeriodStart ? { currentPeriodStart: remote.currentPeriodStart } : {}),
        },
      });
    }
  }
}
