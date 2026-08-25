import { afterEach, describe, expect, it } from "vitest";
import { assertProviderMutationsAllowed, isLivePaymentsEnabled, PROVIDER_MUTATION_DISABLED } from "@/lib/payments/live";
import { restoreLivePaymentEnv, snapshotLivePaymentEnv } from "./live-payment-env";

describe("live payments gate", () => {
  const prev = snapshotLivePaymentEnv();

  afterEach(() => {
    restoreLivePaymentEnv(prev);
  });

  function baseLiveConfig() {
    delete process.env.VERCEL_ENV;
    process.env.DODO_ENVIRONMENT = "live";
    process.env.DODO_PRODUCT_MONTHLY_ID = "pdt_monthly_test";
    process.env.DODO_PRODUCT_ANNUAL_ID = "pdt_annual_test";
  }

  it("stays off without the production flag", () => {
    baseLiveConfig();
    delete process.env.PAYMENTS_LIVE_ENABLED;
    expect(isLivePaymentsEnabled()).toBe(false);
    expect(() => assertProviderMutationsAllowed()).toThrow(PROVIDER_MUTATION_DISABLED);
  });

  it("stays off when the flag is an empty string", () => {
    baseLiveConfig();
    process.env.PAYMENTS_LIVE_ENABLED = "";
    expect(isLivePaymentsEnabled()).toBe(false);
  });

  it('stays off when the flag is "false"', () => {
    baseLiveConfig();
    process.env.PAYMENTS_LIVE_ENABLED = "false";
    expect(isLivePaymentsEnabled()).toBe(false);
  });

  it('stays off when the flag is "TRUE" (case-sensitive exact match)', () => {
    baseLiveConfig();
    process.env.PAYMENTS_LIVE_ENABLED = "TRUE";
    expect(isLivePaymentsEnabled()).toBe(false);
  });

  it('stays off when the flag is " true " (whitespace is not trimmed)', () => {
    baseLiveConfig();
    process.env.PAYMENTS_LIVE_ENABLED = " true ";
    expect(isLivePaymentsEnabled()).toBe(false);
  });

  it('stays off for malformed values ("1", "yes", "on")', () => {
    baseLiveConfig();
    for (const value of ["1", "yes", "on", "True", "true\n"]) {
      process.env.PAYMENTS_LIVE_ENABLED = value;
      expect(isLivePaymentsEnabled()).toBe(false);
    }
  });

  it("stays off in test mode even if the flag is true", () => {
    delete process.env.VERCEL_ENV;
    process.env.DODO_ENVIRONMENT = "test";
    process.env.PAYMENTS_LIVE_ENABLED = "true";
    process.env.DODO_PRODUCT_MONTHLY_ID = "pdt_monthly_test";
    process.env.DODO_PRODUCT_ANNUAL_ID = "pdt_annual_test";
    expect(isLivePaymentsEnabled()).toBe(false);
  });

  it("stays off when product IDs are missing even if the flag is true", () => {
    delete process.env.VERCEL_ENV;
    process.env.DODO_ENVIRONMENT = "live";
    process.env.PAYMENTS_LIVE_ENABLED = "true";
    delete process.env.DODO_PRODUCT_MONTHLY_ID;
    delete process.env.DODO_PRODUCT_ANNUAL_ID;
    delete process.env.DODO_PAYMENTS_PRODUCT_MONTHLY_ID;
    delete process.env.DODO_PAYMENTS_PRODUCT_ANNUAL_ID;
    expect(isLivePaymentsEnabled()).toBe(false);
  });

  it("turns on only for live env, both products, and exact flag true", () => {
    baseLiveConfig();
    process.env.PAYMENTS_LIVE_ENABLED = "true";
    expect(isLivePaymentsEnabled()).toBe(true);
    expect(() => assertProviderMutationsAllowed()).not.toThrow();
  });

  it("treats DODO_ENVIRONMENT=production the same as live", () => {
    delete process.env.VERCEL_ENV;
    process.env.DODO_ENVIRONMENT = "production";
    process.env.PAYMENTS_LIVE_ENABLED = "true";
    process.env.DODO_PRODUCT_MONTHLY_ID = "pdt_monthly_test";
    process.env.DODO_PRODUCT_ANNUAL_ID = "pdt_annual_test";
    expect(isLivePaymentsEnabled()).toBe(true);
  });

  it("stays off on Vercel Preview even when live flags are set", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.DODO_ENVIRONMENT = "live";
    process.env.PAYMENTS_LIVE_ENABLED = "true";
    process.env.DODO_PRODUCT_MONTHLY_ID = "pdt_monthly_test";
    process.env.DODO_PRODUCT_ANNUAL_ID = "pdt_annual_test";
    expect(isLivePaymentsEnabled()).toBe(false);
  });

  it("stays off on Vercel development even when live flags are set", () => {
    process.env.VERCEL_ENV = "development";
    process.env.DODO_ENVIRONMENT = "live";
    process.env.PAYMENTS_LIVE_ENABLED = "true";
    process.env.DODO_PRODUCT_MONTHLY_ID = "pdt_monthly_test";
    process.env.DODO_PRODUCT_ANNUAL_ID = "pdt_annual_test";
    expect(isLivePaymentsEnabled()).toBe(false);
  });
});
