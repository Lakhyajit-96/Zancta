import prisma from "@/lib/db";
import { getEmailAdapter, trySendEmail } from "@/lib/email";
import { amountLabelFromPlan, planLabelFromId } from "@/lib/email/templates";

function asString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function formatPeriodEnd(value: Date | null): string | undefined {
  if (!value || Number.isNaN(value.getTime())) return undefined;
  return value.toISOString().slice(0, 10);
}

function formatAmount(amount: unknown, currency: unknown): string | undefined {
  const numeric = typeof amount === "number" ? amount : Number(amount);
  const code = asString(currency)?.toUpperCase();
  if (!Number.isFinite(numeric) || numeric <= 0 || !code) return undefined;
  if (code === "INR" && (numeric === 19900 || numeric === 99900)) return `₹${numeric / 100}`;
  if (code === "INR" && (numeric === 199 || numeric === 999)) return `₹${numeric}`;
  return `${numeric} ${code}`;
}

export async function notifyBillingEvent(input: {
  eventType: string;
  userId: string;
  fallbackEmail?: string | null;
  planId?: string | null;
  data: Record<string, unknown>;
  paymentId?: string | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
}): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { email: true },
  });
  const to = user?.email || input.fallbackEmail;
  if (!to || !to.includes("@")) return;

  const t = input.eventType.toLowerCase();
  const emailer = getEmailAdapter();
  const planLabel = planLabelFromId(input.planId);
  const amountLabel = amountLabelFromPlan(input.planId);
  const periodEnd = formatPeriodEnd(input.currentPeriodEnd ?? null);
  const refundId = asString(input.data.refund_id ?? input.data.refundId ?? input.data.id);

  if (t === "subscription.active") {
    await trySendEmail("subscription-activated", () =>
      emailer.sendSubscriptionActivated(to, { planLabel, amountLabel, periodEnd })
    );
    return;
  }
  if (t === "subscription.renewed" || t === "subscription_renewed") {
    await trySendEmail("subscription-renewed", () =>
      emailer.sendSubscriptionRenewed(to, { planLabel, amountLabel, periodEnd })
    );
    return;
  }
  if (t.includes("subscription.cancelled") || t === "subscription_cancelled" || t === "subscription.canceled") {
    await trySendEmail("subscription-cancelled", () =>
      emailer.sendCancellation(to, {
        scheduled: Boolean(input.cancelAtPeriodEnd && periodEnd),
        periodEnd,
      })
    );
    return;
  }
  if (t.includes("payment.failed") || t === "payment_failed") {
    await trySendEmail("payment-failed", () => emailer.sendPaymentFailed(to));
    return;
  }
  if (t.includes("refund.succeeded") || t === "refund_succeeded") {
    await trySendEmail("refund-processed", () =>
      emailer.sendRefundProcessed(to, {
        amountLabel: formatAmount(input.data.amount ?? input.data.total_amount, input.data.currency),
        currency: asString(input.data.currency) || undefined,
        status: asString(input.data.status) || "succeeded",
        reference: input.paymentId || refundId || undefined,
      })
    );
  }
}
