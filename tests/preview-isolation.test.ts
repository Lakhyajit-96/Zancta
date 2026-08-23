import { afterEach, describe, expect, it } from "vitest";
import {
  isPreviewBlockedRequest,
  previewEmailBlocked,
  previewMutationsBlocked,
  previewProductionDataBlocked,
} from "@/lib/preview-isolation";
import { isLivePaymentsEnabled } from "@/lib/payments/live";

describe("preview isolation", () => {
  const prev = {
    vercel: process.env.VERCEL_ENV,
    mutations: process.env.PREVIEW_ALLOW_PRODUCTION_MUTATIONS,
    email: process.env.PREVIEW_ALLOW_PRODUCTION_EMAIL,
    data: process.env.PREVIEW_ALLOW_PRODUCTION_DATA,
    flag: process.env.PAYMENTS_LIVE_ENABLED,
    dodo: process.env.DODO_ENVIRONMENT,
    monthly: process.env.DODO_PRODUCT_MONTHLY_ID,
    annual: process.env.DODO_PRODUCT_ANNUAL_ID,
  };

  afterEach(() => {
    process.env.VERCEL_ENV = prev.vercel;
    process.env.PREVIEW_ALLOW_PRODUCTION_MUTATIONS = prev.mutations;
    process.env.PREVIEW_ALLOW_PRODUCTION_EMAIL = prev.email;
    process.env.PREVIEW_ALLOW_PRODUCTION_DATA = prev.data;
    process.env.PAYMENTS_LIVE_ENABLED = prev.flag;
    process.env.DODO_ENVIRONMENT = prev.dodo;
    process.env.DODO_PRODUCT_MONTHLY_ID = prev.monthly;
    process.env.DODO_PRODUCT_ANNUAL_ID = prev.annual;
  });

  it("blocks mutating APIs and OAuth callbacks on Preview by default", () => {
    process.env.VERCEL_ENV = "preview";
    delete process.env.PREVIEW_ALLOW_PRODUCTION_MUTATIONS;
    expect(previewMutationsBlocked()).toBe(true);
    expect(isPreviewBlockedRequest("POST", "/api/auth/signup")).toBe(true);
    expect(isPreviewBlockedRequest("POST", "/api/contact")).toBe(true);
    expect(isPreviewBlockedRequest("POST", "/api/payments/checkout")).toBe(true);
    expect(isPreviewBlockedRequest("POST", "/api/payments/webhooks/dodo")).toBe(true);
    expect(isPreviewBlockedRequest("GET", "/api/auth/callback/google")).toBe(true);
    expect(isPreviewBlockedRequest("GET", "/api/payments/checkout")).toBe(false);
    expect(isPreviewBlockedRequest("GET", "/tools")).toBe(false);
  });

  it("does not block Production API mutations", () => {
    process.env.VERCEL_ENV = "production";
    expect(previewMutationsBlocked()).toBe(false);
    expect(isPreviewBlockedRequest("POST", "/api/contact")).toBe(false);
  });

  it("never enables live payments on Preview even if flags are set", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.PAYMENTS_LIVE_ENABLED = "true";
    process.env.DODO_ENVIRONMENT = "live";
    process.env.DODO_PRODUCT_MONTHLY_ID = "pdt_monthly_test";
    process.env.DODO_PRODUCT_ANNUAL_ID = "pdt_annual_test";
    expect(isLivePaymentsEnabled()).toBe(false);
  });

  it("proxy matches API routes so Preview isolation can run", async () => {
    const { readFile } = await import("fs/promises");
    const path = await import("path");
    const src = await readFile(path.join(process.cwd(), "proxy.ts"), "utf8");
    expect(src).toMatch(/\/api\/:path\*/);
    expect(src).toMatch(/isPreviewBlockedRequest/);
  });

  it("suppresses production email on Preview by default", () => {
    process.env.VERCEL_ENV = "preview";
    delete process.env.PREVIEW_ALLOW_PRODUCTION_EMAIL;
    expect(previewEmailBlocked()).toBe(true);
    expect(previewProductionDataBlocked()).toBe(true);
  });
});
