export function isLivePaymentsEnabled(): boolean {
  if (process.env.VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "development") return false;
  const dodoEnv = (process.env.DODO_ENVIRONMENT || "test").toLowerCase();
  const liveEnabled = process.env.PAYMENTS_LIVE_ENABLED === "true";
  const monthly = process.env.DODO_PRODUCT_MONTHLY_ID || process.env.DODO_PAYMENTS_PRODUCT_MONTHLY_ID;
  const annual = process.env.DODO_PRODUCT_ANNUAL_ID || process.env.DODO_PAYMENTS_PRODUCT_ANNUAL_ID;
  if (!liveEnabled) return false;
  if (!monthly || !annual) return false;
  return dodoEnv === "live" || dodoEnv === "production";
}
