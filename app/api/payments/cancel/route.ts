import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { getPaymentProvider } from "@/lib/payments";
import { isLivePaymentsEnabled } from "@/lib/payments/live";
import { PROVIDER_UNAVAILABLE } from "@/lib/http/timed-fetch";
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
  let candidateId = ent?.providerSubscriptionId || null;
  if (!candidateId) {
    const latestOwned = await prisma.paymentSubscription.findFirst({
      where: { userId, provider: "dodo" },
      orderBy: { updatedAt: "desc" },
      select: { providerSubscriptionId: true },
    });
    candidateId = latestOwned?.providerSubscriptionId || null;
  }
  if (!candidateId) {
    return NextResponse.json({ error: "No subscription to cancel" }, { status: 404 });
  }
  if (ent?.plan !== "PREMIUM" || ent.status !== "ACTIVE") {
    return NextResponse.json({ error: "No active Premium subscription" }, { status: 409 });
  }
  if (ent.cancelAtPeriodEnd) {
    return NextResponse.json({ ok: true, cancelAtPeriodEnd: true, already: true });
  }

  // Compound lookup: never cancel a provider id that is not this session user's row.
  const owned = await prisma.paymentSubscription.findFirst({
    where: { providerSubscriptionId: candidateId, userId },
    select: { providerSubscriptionId: true },
  });
  if (!owned) {
    console.warn("[billing-cancel] refusing cancellation; subscription is not owned by the session user");
    await auditEvent({
      userId,
      action: "payment.cancel_refused_unowned",
      targetId: userId,
      metadata: JSON.stringify({ reason: "unowned_subscription" }),
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });
    return NextResponse.json({ error: "No subscription to cancel" }, { status: 404 });
  }
  const subscriptionId = owned.providerSubscriptionId;

  if (!isLivePaymentsEnabled()) {
    return NextResponse.json(
      { live: false, error: "Billing changes are not available while checkout is disabled." },
      { status: 503 }
    );
  }

  const provider = getPaymentProvider("dodo");
  let remote;
  try {
    await provider.cancelSubscription(subscriptionId, true);
    remote = await provider.getSubscription(subscriptionId);
  } catch (e) {
    const msg = (e as Error).message || "Cancellation failed";
    console.error("[billing-cancel] failed", msg);
    if (msg === PROVIDER_UNAVAILABLE) {
      return NextResponse.json({ error: "Cancellation failed" }, { status: 502 });
    }
    throw e;
  }
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
    where: { providerSubscriptionId: subscriptionId, userId },
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
