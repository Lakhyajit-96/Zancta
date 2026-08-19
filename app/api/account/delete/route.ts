import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { auditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as unknown as { id: string }).id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(req.headers);
  const rl = rateLimit(`delete:${userId}`, 3, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });

  const { confirm } = await req.json().catch(() => ({}));
  if (confirm !== "DELETE") return NextResponse.json({ error: "Confirmation required" }, { status: 400 });

  // Billing safety gate: an account with a provider subscription that could
  // still be billed must have that subscription cancelled at the provider
  // BEFORE the local rows are removed. We never silently delete an account
  // while billing may continue.
  const liveSubs = await prisma.paymentSubscription.findMany({
    where: { userId, provider: "dodo", status: { in: ["active", "on_hold", "pending"] } },
  });
  if (liveSubs.length > 0) {
    const { getPaymentProvider } = await import("@/lib/payments");
    const provider = getPaymentProvider("dodo");
    for (const sub of liveSubs) {
      try {
        await provider.cancelSubscription(sub.providerSubscriptionId, true);
        // Verify the provider actually accepted the cancellation.
        const remote = await provider.getSubscription(sub.providerSubscriptionId);
        const accepted = remote && (remote.cancelAtPeriodEnd || ["cancelled", "canceled", "expired"].includes(remote.status.toLowerCase()));
        if (!accepted) {
          return NextResponse.json(
            { error: "Your subscription could not be cancelled at the payment provider. Please try again, or cancel it in your provider account before deleting." },
            { status: 409 }
          );
        }
        await prisma.paymentSubscription.update({
          where: { id: sub.id },
          data: { cancelAtPeriodEnd: true, ...(remote.status ? { status: remote.status.toLowerCase() } : {}) },
        });
        await auditEvent({
          userId,
          action: "subscription_cancelled_on_delete",
          targetId: sub.providerSubscriptionId,
          ip,
        });
      } catch (e) {
        console.error("[account/delete] provider subscription cancel failed", sub.providerSubscriptionId, e instanceof Error ? e.message : String(e));
        return NextResponse.json(
          { error: "We couldn't reach the payment provider to cancel your subscription. The account was NOT deleted — please try again shortly." },
          { status: 502 }
        );
      }
    }
    // Mark the entitlement as cancelled so nothing downstream treats it as
    // billable/entitled beyond the paid period already delivered.
    await prisma.entitlement.updateMany({
      where: { userId },
      data: { cancelAtPeriodEnd: true, status: "CANCELLED", plan: "CANCELLED" },
    });
  }

  // Hard delete for privacy: remove user and cascade (sessions, accounts, entitlement, tokens)
  // Audit event is anonymized (userId set null via SetNull? but we keep targetId)
  await auditEvent({ userId, action: "account_deleted", targetId: userId, ip });

  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ ok: true });
}
