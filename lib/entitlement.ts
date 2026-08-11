import prisma from "@/lib/db";

export type Plan = "FREE" | "PREMIUM" | "ADMIN" | "EXPIRED" | "CANCELLED";
export type EntitlementStatus = "ACTIVE" | "EXPIRED" | "CANCELLED";

export type EntitlementDTO = {
  plan: Plan;
  status: EntitlementStatus;
  source: string | null;
  expiresAt: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  currentPeriodStart: Date | null;
};

export async function getEntitlement(userId: string): Promise<EntitlementDTO> {
  const ent = await prisma.entitlement.findUnique({ where: { userId } });
  if (!ent) return { plan: "FREE" as Plan, status: "ACTIVE" as EntitlementStatus, source: null, expiresAt: null, currentPeriodEnd: null, cancelAtPeriodEnd: false, providerCustomerId: null, providerSubscriptionId: null, currentPeriodStart: null };
  if (ent.expiresAt && new Date(ent.expiresAt) < new Date() && ent.status === "ACTIVE") {
    return {
      plan: "EXPIRED" as Plan,
      status: "EXPIRED" as EntitlementStatus,
      source: ent.source,
      expiresAt: ent.expiresAt,
      currentPeriodEnd: ent.currentPeriodEnd,
      cancelAtPeriodEnd: ent.cancelAtPeriodEnd,
      providerCustomerId: ent.providerCustomerId,
      providerSubscriptionId: ent.providerSubscriptionId,
      currentPeriodStart: ent.currentPeriodStart,
    };
  }
  return ent as unknown as EntitlementDTO;
}

export function hasEntitlement(ent: { plan: Plan; status: EntitlementStatus }, required: Plan): boolean {
  if (required === "FREE") return true;
  if (ent.status !== "ACTIVE") return false;
  if (ent.plan === "ADMIN") return true;
  return ent.plan === required || ent.plan === "PREMIUM";
}

export function canShowAds(ent: { plan: Plan; status: EntitlementStatus } | null): boolean {
  // Premium and Admin do not see ads; anonymous and FREE do
  if (!ent) return true; // anonymous
  if (ent.plan === "PREMIUM" && ent.status === "ACTIVE") return false;
  if (ent.plan === "ADMIN") return false;
  return true;
}

export function getDisplayPlan(ent: { plan: Plan } | null): string {
  if (!ent) return "FREE (anonymous)";
  return ent.plan;
}
