import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { getPaymentProvider } from "@/lib/payments";
import { rateLimitAsync } from "@/lib/rate-limit";
import { auditEvent } from "@/lib/audit";

// POST /api/payments/cancel — period-end cancel via the provider. No local grant.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const rl = await rateLimitAsync(`cancel:${session.user.id}`, 5, 15 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });

  const body = await req.json().catch(() => null) as { confirm?: unknown } | null;
  if (body?.confirm !== true) {
    return NextResponse.json({ error: "Confirmation required" }, { status: 400 });
  }

  const userId = session.user.id;
  const ent = await prisma.entitlement.findUnique({ where: { userId } });
  const sub = await prisma.paymentSubscription.findFirst({
    where: { userId, provider: "dodo" },
    orderBy: { updatedAt: "desc" },
  });
  const subscriptionId = ent?.providerSubscriptionId || sub?.providerSubscriptionId;
  if (!subscriptionId) {
    return NextResponse.json({ error: "No subscription to cancel" }, { status: 404 });
  }
  if (ent?.plan !== "PREMIUM" || ent.status !== "ACTIVE") {
    return NextResponse.json({ error: "No active Premium subscription" }, { status: 409 });
  }
  if (ent.cancelAtPeriodEnd) {
    return NextResponse.json({ ok: true, cancelAtPeriodEnd: true, already: true });
  }

  const provider = getPaymentProvider("dodo");
  await provider.cancelSubscription(subscriptionId, true);
  const remote = await provider.getSubscription(subscriptionId);
  if (!remote) {
    return NextResponse.json({ error: "Provider did not return the subscription after cancel" }, { status: 502 });
  }

  const cancelAtPeriodEnd = remote.cancelAtPeriodEnd || ["cancelled", "canceled"].includes(remote.status.toLowerCase());
  if (!cancelAtPeriodEnd) {
    return NextResponse.json({ error: "Provider did not confirm period-end cancellation" }, { status: 502 });
  }

  const cpe = remote.currentPeriodEnd || ent.currentPeriodEnd || undefined;
  await prisma.entitlement.update({
    where: { userId },
    data: {
      cancelAtPeriodEnd: true,
      ...(cpe ? { currentPeriodEnd: cpe, expiresAt: cpe } : {}),
    },
  });
  await prisma.paymentSubscription.updateMany({
    where: { providerSubscriptionId: subscriptionId },
    data: {
      cancelAtPeriodEnd: true,
      ...(remote.status ? { status: remote.status.toLowerCase() } : {}),
      ...(remote.currentPeriodEnd ? { currentPeriodEnd: remote.currentPeriodEnd } : {}),
    },
  });

  await auditEvent({
    userId,
    action: "payment.cancel_at_period_end",
    targetId: subscriptionId,
    metadata: JSON.stringify({ provider: "dodo", status: remote.status }),
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined,
    userAgent: req.headers.get("user-agent") || undefined,
  } as Parameters<typeof auditEvent>[0]);

  return NextResponse.json({
    ok: true,
    cancelAtPeriodEnd: true,
    currentPeriodEnd: cpe || null,
    providerStatus: remote.status,
  });
}
