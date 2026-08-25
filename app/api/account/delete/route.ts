import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { rateLimitAsync, getClientIp } from "@/lib/rate-limit";
import { auditEvent } from "@/lib/audit";
import { hashToken } from "@/lib/token";

const STEP_UP_ERROR =
  "Re-authentication required. Request a new confirmation code from your account email and try again.";

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as unknown as { id?: string } | undefined)?.id;
  if (!session?.user || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(req.headers);
  const rl = await rateLimitAsync(`delete:${userId}`, 3, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });

  const { confirm, stepUpToken } = await req.json().catch(() => ({}));
  if (confirm !== "DELETE") return NextResponse.json({ error: "Confirmation required" }, { status: 400 });

  // Step-up authentication: a signed-in session alone must not be able to
  // destroy the account. The caller must present the single-use confirmation
  // code that was emailed to the account owner (see ./request-code). The code
  // is claimed atomically so it cannot be replayed, and the lookup is scoped
  // to this session's userId so another account's code can never match.
  // Errors are generic on purpose — no invalid/expired/wrong-user oracle.
  if (typeof stepUpToken !== "string" || stepUpToken.trim().length === 0) {
    await auditEvent({ userId, action: "account_deletion_stepup_failed", targetId: userId, ip });
    return NextResponse.json({ error: STEP_UP_ERROR }, { status: 401 });
  }
  const stepUpHash = hashToken(stepUpToken.trim());
  const claimed = await prisma.accountDeletionToken.updateMany({
    where: { userId, token: stepUpHash, usedAt: null, expires: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (claimed.count !== 1) {
    await auditEvent({ userId, action: "account_deletion_stepup_failed", targetId: userId, ip });
    return NextResponse.json({ error: STEP_UP_ERROR }, { status: 401 });
  }
  // If deletion aborts below because the payment provider rejected or was
  // unreachable, the claimed code is restored so a transient billing outage
  // does not burn the user's code. No destructive action happens in between.
  const restoreStepUpToken = async () => {
    await prisma.accountDeletionToken
      .updateMany({ where: { userId, token: stepUpHash }, data: { usedAt: null } })
      .catch(() => {});
  };

  // Billing safety: cancel any provider subscription we know about before
  // removing local rows. Dodo retains customer, payment, subscription and
  // checkout records as Merchant of Record — we cannot delete those and do
  // not store card data. Local Payment rows remain with userId nulled
  // (onDelete SetNull) for reconciliation. PaymentSubscription, Entitlement,
  // PaymentCustomer and PaymentCheckout cascade-delete with the user.
  const [liveSubs, ent] = await Promise.all([
    prisma.paymentSubscription.findMany({
      where: { userId, provider: "dodo", status: { in: ["active", "on_hold", "pending", "failed"] } },
    }),
    prisma.entitlement.findUnique({ where: { userId } }),
  ]);
  const subscriptionIds = new Set(liveSubs.map((s) => s.providerSubscriptionId));
  if (ent?.providerSubscriptionId) subscriptionIds.add(ent.providerSubscriptionId);

  if (subscriptionIds.size > 0) {
    const { getPaymentProvider } = await import("@/lib/payments");
    const provider = getPaymentProvider("dodo");
    for (const subscriptionId of subscriptionIds) {
      try {
        await provider.cancelSubscription(subscriptionId, true);
        const remote = await provider.getSubscription(subscriptionId);
        const accepted = remote && (remote.cancelAtPeriodEnd || ["cancelled", "canceled", "expired"].includes(remote.status.toLowerCase()));
        if (!accepted) {
          await restoreStepUpToken();
          return NextResponse.json(
            { error: "Your subscription could not be cancelled at the payment provider. Please try again, or cancel it in your provider account before deleting." },
            { status: 409 }
          );
        }
        await prisma.paymentSubscription.updateMany({
          where: { providerSubscriptionId: subscriptionId },
          data: { cancelAtPeriodEnd: true, ...(remote.status ? { status: remote.status.toLowerCase() } : {}) },
        });
        await auditEvent({
          userId,
          action: "subscription_cancelled_on_delete",
          targetId: subscriptionId,
          ip,
        });
      } catch (e) {
        console.error("[account/delete] provider subscription cancel failed", subscriptionId, e instanceof Error ? e.message : String(e));
        await restoreStepUpToken();
        return NextResponse.json(
          { error: "We couldn't reach the payment provider to cancel your subscription. The account was NOT deleted — please try again shortly." },
          { status: 502 }
        );
      }
    }
    await prisma.entitlement.updateMany({
      where: { userId },
      data: { cancelAtPeriodEnd: true, status: "CANCELLED", plan: "CANCELLED" },
    });
  }

  await prisma.paymentCheckout.updateMany({
    where: { userId, status: "created" },
    data: { status: "abandoned" },
  });

  // Hard delete for privacy: remove user and cascade (sessions, accounts, entitlement, tokens)
  // Audit event is anonymized (userId set null via SetNull? but we keep targetId)
  const oauthAccounts = await prisma.account.findMany({
    where: { userId, provider: { not: "credentials" } },
    select: { provider: true, providerAccountId: true },
  });
  const { recordDeletedProviderIdentities } = await import("@/lib/deleted-identity");
  await recordDeletedProviderIdentities(oauthAccounts);

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });

  await auditEvent({ userId, action: "account_deleted", targetId: userId, ip, metadata: JSON.stringify({ oauthProviders: oauthAccounts.map((a) => a.provider) }) });

  await prisma.session.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });

  if (user?.email) {
    const { getEmailAdapter, trySendEmail } = await import("@/lib/email");
    await trySendEmail("account-deleted", () => getEmailAdapter().sendAccountDeleted(user.email));
  }

  return NextResponse.json({ ok: true });
}
