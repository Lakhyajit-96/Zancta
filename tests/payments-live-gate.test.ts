import { describe, it, expect, afterEach } from "vitest";
import { isLivePaymentsEnabled } from "@/lib/payments/live";

describe("live payments gate", () => {
  const prev = {
    flag: process.env.PAYMENTS_LIVE_ENABLED,
    env: process.env.DODO_ENVIRONMENT,
    monthly: process.env.DODO_PRODUCT_MONTHLY_ID,
    annual: process.env.DODO_PRODUCT_ANNUAL_ID,
  };

  afterEach(() => {
    process.env.PAYMENTS_LIVE_ENABLED = prev.flag;
    process.env.DODO_ENVIRONMENT = prev.env;
    process.env.DODO_PRODUCT_MONTHLY_ID = prev.monthly;
    process.env.DODO_PRODUCT_ANNUAL_ID = prev.annual;
  });

  it("stays off without the production flag", () => {
    process.env.DODO_ENVIRONMENT = "live";
    process.env.DODO_PRODUCT_MONTHLY_ID = "pdt_monthly_test";
    process.env.DODO_PRODUCT_ANNUAL_ID = "pdt_annual_test";
    delete process.env.PAYMENTS_LIVE_ENABLED;
    expect(isLivePaymentsEnabled()).toBe(false);
  });

  it("stays off in test mode even if the flag is true", () => {
    process.env.DODO_ENVIRONMENT = "test";
    process.env.PAYMENTS_LIVE_ENABLED = "true";
    process.env.DODO_PRODUCT_MONTHLY_ID = "pdt_monthly_test";
    process.env.DODO_PRODUCT_ANNUAL_ID = "pdt_annual_test";
    expect(isLivePaymentsEnabled()).toBe(false);
  });

  it("turns on only for live env, both products, and explicit flag", () => {
    process.env.DODO_ENVIRONMENT = "live";
    process.env.PAYMENTS_LIVE_ENABLED = "true";
    process.env.DODO_PRODUCT_MONTHLY_ID = "pdt_monthly_test";
    process.env.DODO_PRODUCT_ANNUAL_ID = "pdt_annual_test";
    expect(isLivePaymentsEnabled()).toBe(true);
  });
});
