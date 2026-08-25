/** Shared env helpers for live-gate tests. Never prints secret values. */

export type LivePaymentEnvSnapshot = {
  flag: string | undefined;
  env: string | undefined;
  monthly: string | undefined;
  annual: string | undefined;
  monthlyAlt: string | undefined;
  annualAlt: string | undefined;
  vercel: string | undefined;
};

function setOrDelete(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

export function snapshotLivePaymentEnv(): LivePaymentEnvSnapshot {
  return {
    flag: process.env.PAYMENTS_LIVE_ENABLED,
    env: process.env.DODO_ENVIRONMENT,
    monthly: process.env.DODO_PRODUCT_MONTHLY_ID,
    annual: process.env.DODO_PRODUCT_ANNUAL_ID,
    monthlyAlt: process.env.DODO_PAYMENTS_PRODUCT_MONTHLY_ID,
    annualAlt: process.env.DODO_PAYMENTS_PRODUCT_ANNUAL_ID,
    vercel: process.env.VERCEL_ENV,
  };
}

export function restoreLivePaymentEnv(prev: LivePaymentEnvSnapshot) {
  setOrDelete("PAYMENTS_LIVE_ENABLED", prev.flag ?? "false");
  setOrDelete("DODO_ENVIRONMENT", prev.env);
  setOrDelete("DODO_PRODUCT_MONTHLY_ID", prev.monthly);
  setOrDelete("DODO_PRODUCT_ANNUAL_ID", prev.annual);
  setOrDelete("DODO_PAYMENTS_PRODUCT_MONTHLY_ID", prev.monthlyAlt);
  setOrDelete("DODO_PAYMENTS_PRODUCT_ANNUAL_ID", prev.annualAlt);
  setOrDelete("VERCEL_ENV", prev.vercel);
}

/** Satisfies isLivePaymentsEnabled() without using production credentials. */
export function enableLivePaymentMutations() {
  delete process.env.VERCEL_ENV;
  process.env.PAYMENTS_LIVE_ENABLED = "true";
  process.env.DODO_ENVIRONMENT = "live";
  process.env.DODO_PRODUCT_MONTHLY_ID = "pdt_test_monthly";
  process.env.DODO_PRODUCT_ANNUAL_ID = "pdt_test_annual";
}

export function disableLivePaymentMutations() {
  process.env.PAYMENTS_LIVE_ENABLED = "false";
}
