/**
 * Throttled provider refresh. Local DB is the read path; Dodo is consulted
 * only when we already have a provider subscription id.
 */
import prisma from "@/lib/db";
import { rateLimitAsync } from "@/lib/rate-limit";
import { refreshAndReconcile } from "@/lib/payments/reconciliation";

const SYNC_WINDOW_MS = 5 * 60 * 1000;

export async function refreshSubscriptionFromProvider(userId: string): Promise<void> {
  const [ent, sub] = await Promise.all([
    prisma.entitlement.findUnique({ where: { userId } }),
    prisma.paymentSubscription.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } }),
  ]);
  if (!ent?.providerSubscriptionId && !sub?.providerSubscriptionId) return;

  const rl = await rateLimitAsync(`billing-sync:${userId}`, 1, SYNC_WINDOW_MS);
  if (!rl.ok) return;

  await refreshAndReconcile(userId);
}
