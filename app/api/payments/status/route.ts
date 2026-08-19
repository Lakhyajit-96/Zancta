import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { refreshSubscriptionFromProvider } from "@/lib/payments/subscription-sync";

// GET /api/payments/status — authoritative entitlement + subscription
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  // Throttled provider reconciliation (closes the no-webhook cancel gap).
  // Best-effort: on any failure the local DB stays authoritative.
  try {
    await refreshSubscriptionFromProvider(session.user.id);
  } catch (e) {
    console.warn("[payments/status] provider refresh skipped", e instanceof Error ? e.message : String(e));
  }

  const [ent, sub] = await Promise.all([
    prisma.entitlement.findUnique({ where: { userId: session.user.id } }),
    prisma.paymentSubscription.findFirst({ where: { userId: session.user.id }, orderBy: { updatedAt: "desc" } }),
  ]);

  if (!ent) return NextResponse.json({ plan: "FREE", status: "ACTIVE", provider: null });

  // Expiry check (mirrors lib/entitlement)
  if (ent.expiresAt && new Date(ent.expiresAt) < new Date() && ent.status === "ACTIVE") {
    return NextResponse.json({
      plan: "EXPIRED",
      status: "EXPIRED",
      source: ent.source,
      expiresAt: ent.expiresAt,
      currentPeriodEnd: ent.currentPeriodEnd,
      cancelAtPeriodEnd: ent.cancelAtPeriodEnd,
      subscription: sub ? { id: sub.providerSubscriptionId, status: sub.status, currentPeriodEnd: sub.currentPeriodEnd } : null,
    });
  }

  return NextResponse.json({
    plan: ent.plan,
    status: ent.status,
    source: ent.source,
    providerCustomerId: ent.providerCustomerId,
    providerSubscriptionId: ent.providerSubscriptionId,
    currentPeriodStart: ent.currentPeriodStart,
    currentPeriodEnd: ent.currentPeriodEnd,
    expiresAt: ent.expiresAt,
    cancelAtPeriodEnd: ent.cancelAtPeriodEnd,
    subscription: sub ? { id: sub.providerSubscriptionId, status: sub.status, currentPeriodEnd: sub.currentPeriodEnd, plan: sub.plan } : null,
  });
}
