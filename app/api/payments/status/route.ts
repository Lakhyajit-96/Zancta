import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { getEntitlement } from "@/lib/entitlement";
import { refreshSubscriptionFromProvider } from "@/lib/payments/subscription-sync";
import { detectLocalBillingDrift } from "@/lib/payments/reconciliation";
import { rateLimitAsync } from "@/lib/rate-limit";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const rl = await rateLimitAsync(`status:${session.user.id}`, 30, 15 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });

  try {
    await refreshSubscriptionFromProvider(session.user.id);
  } catch (e) {
    console.warn("[payments/status] provider refresh skipped", e instanceof Error ? e.message : String(e));
  }

  const [ent, sub, drift] = await Promise.all([
    getEntitlement(session.user.id),
    prisma.paymentSubscription.findFirst({ where: { userId: session.user.id }, orderBy: { updatedAt: "desc" } }),
    detectLocalBillingDrift(session.user.id),
  ]);

  return NextResponse.json({
    plan: ent.plan,
    recordedPlan: ent.recordedPlan,
    status: ent.status,
    source: ent.source,
    providerCustomerId: ent.providerCustomerId,
    providerSubscriptionId: ent.providerSubscriptionId,
    currentPeriodStart: ent.currentPeriodStart,
    currentPeriodEnd: ent.currentPeriodEnd,
    expiresAt: ent.expiresAt,
    cancelAtPeriodEnd: ent.cancelAtPeriodEnd,
    providerBacked: ent.providerBacked,
    integrityIssue: ent.integrityIssue,
    drift,
    subscription: sub
      ? { id: sub.providerSubscriptionId, status: sub.status, currentPeriodEnd: sub.currentPeriodEnd, plan: sub.plan }
      : null,
  });
}
