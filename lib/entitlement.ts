import prisma from "@/lib/db";
import { deriveFromSubscription } from "@/lib/payments/billing-state";

export type Plan = "FREE" | "PREMIUM" | "ADMIN" | "EXPIRED" | "CANCELLED";
export type EntitlementStatus = "ACTIVE" | "EXPIRED" | "CANCELLED";
export type IntegrityIssue = "missing_provider_subscription" | "expired" | null;

export type EntitlementDTO = {
  plan: Plan;
  recordedPlan: Plan;
  status: EntitlementStatus;
  source: string | null;
  expiresAt: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  currentPeriodStart: Date | null;
  providerBacked: boolean;
  integrityIssue: IntegrityIssue;
};

export async function getEntitlement(userId: string): Promise<EntitlementDTO> {
  const [ent, sub] = await Promise.all([
    prisma.entitlement.findUnique({ where: { userId } }),
    prisma.paymentSubscription.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } }),
  ]);

  const empty: EntitlementDTO = {
    plan: "FREE",
    recordedPlan: "FREE",
    status: "ACTIVE",
    source: null,
    expiresAt: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    providerCustomerId: null,
    providerSubscriptionId: null,
    currentPeriodStart: null,
    providerBacked: false,
    integrityIssue: null,
  };
  if (!ent) return empty;

  const expiredByTime = !!(ent.expiresAt && new Date(ent.expiresAt) < new Date() && ent.status === "ACTIVE");
  const recordedPlan = (expiredByTime ? "EXPIRED" : ent.plan) as Plan;
  const recordedStatus = (expiredByTime ? "EXPIRED" : ent.status) as EntitlementStatus;

  const derived = sub
    ? deriveFromSubscription({
        status: sub.status,
        currentPeriodEnd: sub.currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      })
    : null;

  const providerBacked = !!(
    ent.providerSubscriptionId &&
    derived &&
    derived.plan === "PREMIUM" &&
    derived.status === "ACTIVE" &&
    !expiredByTime
  );

  const premiumRecorded = recordedPlan === "PREMIUM" && recordedStatus === "ACTIVE";
  const derivedExpired = derived?.plan === "EXPIRED";
  let integrityIssue: IntegrityIssue = null;
  if (expiredByTime || derivedExpired || recordedPlan === "EXPIRED") integrityIssue = "expired";
  else if (premiumRecorded && !providerBacked) integrityIssue = "missing_provider_subscription";

  const effectivePlan: Plan = ent.plan === "ADMIN"
    ? "ADMIN"
    : providerBacked
      ? "PREMIUM"
      : (expiredByTime || derivedExpired || recordedPlan === "EXPIRED")
        ? "EXPIRED"
        : recordedPlan === "CANCELLED"
          ? "CANCELLED"
          : "FREE";
  const effectiveStatus: EntitlementStatus = effectivePlan === "PREMIUM"
    ? "ACTIVE"
    : effectivePlan === "EXPIRED"
      ? "EXPIRED"
      : effectivePlan === "CANCELLED" || recordedStatus === "CANCELLED"
        ? "CANCELLED"
        : "ACTIVE";

  return {
    plan: effectivePlan,
    recordedPlan,
    status: effectiveStatus,
    source: ent.source,
    expiresAt: ent.expiresAt,
    currentPeriodEnd: derived?.plan === "PREMIUM" ? (sub?.currentPeriodEnd ?? ent.currentPeriodEnd) : ent.currentPeriodEnd,
    cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? ent.cancelAtPeriodEnd,
    providerCustomerId: ent.providerCustomerId,
    providerSubscriptionId: ent.providerSubscriptionId,
    currentPeriodStart: sub?.currentPeriodStart ?? ent.currentPeriodStart,
    providerBacked,
    integrityIssue,
  };
}

export function hasEntitlement(ent: { plan: Plan; status: EntitlementStatus; providerBacked?: boolean }, required: Plan): boolean {
  if (required === "FREE") return true;
  if (ent.status !== "ACTIVE") return false;
  if (ent.plan === "ADMIN") return true;
  if (required === "PREMIUM") {
    if (ent.providerBacked === false) return false;
    return ent.plan === "PREMIUM";
  }
  return ent.plan === required;
}

export function canShowAds(ent: { plan: Plan; status: EntitlementStatus; providerBacked?: boolean } | null): boolean {
  if (!ent) return true;
  if (ent.plan === "ADMIN") return false;
  if (ent.plan === "PREMIUM" && ent.status === "ACTIVE" && ent.providerBacked !== false) return false;
  return true;
}

export function getDisplayPlan(ent: { plan: Plan } | null): string {
  if (!ent) return "FREE (anonymous)";
  return ent.plan;
}
