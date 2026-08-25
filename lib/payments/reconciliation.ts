/**
 * Provider-authoritative billing reconciliation.
 * Repairs local state only when Dodo returns a subscription record.
 * Never upgrades or downgrades from incomplete data.
 *
 * Ordering: Dodo GET has no monotonic updated_at. Reconciliation must not stamp
 * providerUpdatedAt with local wall-clock time — that makes delayed but valid
 * webhooks look stale and get a terminal ACK. Watermarks advance only from
 * provider mutation timestamps (cancelled_at / paused_at / past period end on
 * terminal statuses) or remain at the last verified webhook timestamp.
 */
import prisma from "@/lib/db";
import {
  deriveFromSubscription,
  laterTimestamp,
  providerMutationTime,
  shouldSkipReconcileApply,
  unixSeconds,
} from "@/lib/payments/billing-state";
import { revokeToFree, syncEntitlement } from "@/lib/payments/entitlement-sync";
import type { BillingDb } from "@/lib/payments/billing-db";
import type { SubscriptionRecord } from "@/lib/payments/types";

export type DriftKind =
  | "premium_without_provider_subscription"
  | "premium_without_local_subscription"
  | "local_subscription_without_provider_id"
  | "active_provider_without_premium"
  | "payment_without_subscription"
  | "provider_unavailable";

export type DriftFinding = {
  kind: DriftKind;
  userId: string;
  detail: string;
  repaired: boolean;
};

export async function detectLocalBillingDrift(userId: string): Promise<DriftFinding[]> {
  const [ent, sub, payments] = await Promise.all([
    prisma.entitlement.findUnique({ where: { userId } }),
    prisma.paymentSubscription.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } }),
    prisma.payment.findMany({ where: { userId, status: "succeeded" } }),
  ]);
  const findings: DriftFinding[] = [];
  const premiumActive = ent?.plan === "PREMIUM" && ent.status === "ACTIVE";
  if (premiumActive && !ent?.providerSubscriptionId) {
    findings.push({
      kind: "premium_without_provider_subscription",
      userId,
      detail: "ACTIVE PREMIUM entitlement has no providerSubscriptionId",
      repaired: false,
    });
  }
  if (premiumActive && ent?.providerSubscriptionId && !sub) {
    findings.push({
      kind: "premium_without_local_subscription",
      userId,
      detail: "ACTIVE PREMIUM has a provider id but no PaymentSubscription row",
      repaired: false,
    });
  }
  if (sub && !sub.providerSubscriptionId) {
    findings.push({
      kind: "local_subscription_without_provider_id",
      userId,
      detail: "PaymentSubscription is missing providerSubscriptionId",
      repaired: false,
    });
  }
  if (sub && deriveFromSubscription(sub).plan === "PREMIUM" && !(premiumActive && ent?.providerSubscriptionId === sub.providerSubscriptionId)) {
    findings.push({
      kind: "active_provider_without_premium",
      userId,
      detail: `Local subscription ${sub.status} is not reflected on entitlement`,
      repaired: false,
    });
  }
  if (payments.some((p) => p.status === "succeeded") && !sub && premiumActive) {
    findings.push({
      kind: "payment_without_subscription",
      userId,
      detail: "Succeeded payment exists with PREMIUM entitlement but no local subscription",
      repaired: false,
    });
  }
  return findings;
}

export async function reconcileFromProvider(
  userId: string,
  remote: SubscriptionRecord | null,
  opts?: { startedAt?: Date },
): Promise<DriftFinding[]> {
  const findings = await detectLocalBillingDrift(userId);
  if (!remote) {
    return [
      ...findings,
      {
        kind: "provider_unavailable",
        userId,
        detail: "Provider subscription was not returned; local state was not changed",
        repaired: false,
      },
    ];
  }

  const reconStartedAt = opts?.startedAt ?? new Date();

  const loadLocal = async () => {
    const existing = await prisma.paymentSubscription.findUnique({
      where: { providerSubscriptionId: remote.providerSubscriptionId },
    });
    const entitlement = await prisma.entitlement.findUnique({ where: { userId } });
    const local = existing
      ? {
          status: existing.status,
          currentPeriodEnd: existing.currentPeriodEnd,
          cancelAtPeriodEnd: existing.cancelAtPeriodEnd,
          providerUpdatedAt: existing.providerUpdatedAt,
        }
      : null;
    return { existing, entitlement, local };
  };

  const first = await loadLocal();
  if (
    shouldSkipReconcileApply({
      remote,
      local: first.local,
      entitlementUpdatedAt: first.entitlement?.providerUpdatedAt,
      reconStartedAt,
    })
  ) {
    const afterSkip = await detectLocalBillingDrift(userId);
    return afterSkip.map((item) => ({ ...item, repaired: false }));
  }

  const latest = await loadLocal();
  if (
    shouldSkipReconcileApply({
      remote,
      local: latest.local,
      entitlementUpdatedAt: latest.entitlement?.providerUpdatedAt,
      reconStartedAt,
    })
  ) {
    const afterSkip = await detectLocalBillingDrift(userId);
    return afterSkip.map((item) => ({ ...item, repaired: false }));
  }

  const storedWatermark = laterTimestamp(
    latest.existing?.providerUpdatedAt ?? null,
    latest.entitlement?.providerUpdatedAt ?? null,
  );
  const watermark = laterTimestamp(storedWatermark, providerMutationTime(remote));

  const eventTimestamp = watermark ? unixSeconds(watermark) : null;
  const derived = deriveFromSubscription({
    status: remote.status,
    currentPeriodEnd: remote.currentPeriodEnd,
    cancelAtPeriodEnd: remote.cancelAtPeriodEnd,
  });

  await prisma.$transaction(async (tx) => {
    // Local subscription + entitlement only. Provider GET stays outside this callback.
    await tx.paymentSubscription.upsert({
      where: { providerSubscriptionId: remote.providerSubscriptionId },
      create: {
        userId,
        provider: "dodo",
        providerSubscriptionId: remote.providerSubscriptionId,
        providerCustomerId: remote.providerCustomerId,
        plan: latest.existing?.plan || "PREMIUM_MONTHLY",
        status: remote.status.toLowerCase(),
        currentPeriodStart: remote.currentPeriodStart || undefined,
        currentPeriodEnd: remote.currentPeriodEnd || undefined,
        cancelAtPeriodEnd: remote.cancelAtPeriodEnd,
        ...(watermark ? { providerUpdatedAt: watermark } : {}),
      },
      update: {
        status: remote.status.toLowerCase(),
        ...(remote.providerCustomerId ? { providerCustomerId: remote.providerCustomerId } : {}),
        ...(remote.currentPeriodStart ? { currentPeriodStart: remote.currentPeriodStart } : {}),
        ...(remote.currentPeriodEnd ? { currentPeriodEnd: remote.currentPeriodEnd } : {}),
        cancelAtPeriodEnd: remote.cancelAtPeriodEnd,
        ...(watermark ? { providerUpdatedAt: watermark } : {}),
      },
    });

    if (derived.plan === "PREMIUM" && derived.status === "ACTIVE") {
      await syncEntitlement({
        userId,
        provider: "dodo",
        providerCustomerId: remote.providerCustomerId,
        providerSubscriptionId: remote.providerSubscriptionId,
        plan: "PREMIUM",
        status: "ACTIVE",
        currentPeriodStart: remote.currentPeriodStart,
        currentPeriodEnd: remote.currentPeriodEnd,
        cancelAtPeriodEnd: derived.cancelAtPeriodEnd,
        eventTimestamp,
        db: tx as BillingDb,
      });
    } else if (derived.plan === "EXPIRED") {
      await revokeToFree(userId, "dodo", derived.reason, undefined, eventTimestamp, tx as BillingDb);
    }
  });

  const after = await detectLocalBillingDrift(userId);
  return after.map((item) => ({ ...item, repaired: !findings.some((f) => f.kind === item.kind) ? item.repaired : true }));
}

export async function refreshAndReconcile(userId: string): Promise<void> {
  const startedAt = new Date();
  const ent = await prisma.entitlement.findUnique({ where: { userId } });
  const sub = await prisma.paymentSubscription.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  const subscriptionId = ent?.providerSubscriptionId || sub?.providerSubscriptionId;
  if (!subscriptionId) return;
  const { getPaymentProvider } = await import("@/lib/payments");
  let remote: SubscriptionRecord | null = null;
  try {
    remote = await getPaymentProvider("dodo").getSubscription(subscriptionId);
  } catch (e) {
    console.warn("[billing-reconcile] provider unavailable", e instanceof Error ? e.message : String(e));
    return;
  }
  if (!remote) return;
  await reconcileFromProvider(userId, remote, { startedAt });
}
