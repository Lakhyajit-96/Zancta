/**
 * Central live-payment switch.
 *
 * Real Dodo *writes* (checkout, cancel, refund) are allowed only when every
 * condition below is true. Presence of Dodo env vars is not enough.
 *
 * PAYMENTS_LIVE_ENABLED is an exact string match for "true":
 *   "true"                         → may enable (if other conditions hold)
 *   undefined / "" / "false"       → off
 *   "TRUE" / " true " / "1" / "yes" → off
 * Preview and Vercel development are always off.
 */
export function isLivePaymentsEnabled(): boolean {
  if (process.env.VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "development") return false;
  const dodoEnv = (process.env.DODO_ENVIRONMENT || "test").trim().toLowerCase();
  const liveEnabled = process.env.PAYMENTS_LIVE_ENABLED === "true";
  const monthly = process.env.DODO_PRODUCT_MONTHLY_ID || process.env.DODO_PAYMENTS_PRODUCT_MONTHLY_ID;
  const annual = process.env.DODO_PRODUCT_ANNUAL_ID || process.env.DODO_PAYMENTS_PRODUCT_ANNUAL_ID;
  if (!liveEnabled) return false;
  if (!monthly || !annual) return false;
  return dodoEnv === "live" || dodoEnv === "production";
}

export const PROVIDER_MUTATION_DISABLED = "provider_mutation_disabled";

/** Throws if a Dodo write would execute while the live gate is off. */
export function assertProviderMutationsAllowed(): void {
  if (!isLivePaymentsEnabled()) {
    throw new Error(PROVIDER_MUTATION_DISABLED);
  }
}

