import { getEntitlement, hasEntitlement } from "@/lib/entitlement";

export async function hasPremiumOcrAccess(userId: string): Promise<boolean> {
  const entitlement = await getEntitlement(userId);
  return hasEntitlement(entitlement, "PREMIUM");
}
