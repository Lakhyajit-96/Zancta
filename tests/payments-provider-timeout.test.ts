import { afterEach, describe, expect, it, vi } from "vitest";
import { DodoProvider } from "@/lib/payments/providers/dodo";
import { PROVIDER_MUTATION_DISABLED } from "@/lib/payments/live";
import {
  DODO_READ_TIMEOUT_MS,
  DODO_WRITE_TIMEOUT_MS,
  PROVIDER_UNAVAILABLE,
  isProviderUnavailableError,
} from "@/lib/http/timed-fetch";
import { enableLivePaymentMutations, restoreLivePaymentEnv, snapshotLivePaymentEnv } from "./live-payment-env";
import { hungFetchMock } from "./hung-fetch";

const checkoutInput = {
  userId: "user_timeout",
  email: "timeout@example.com",
  planId: "PREMIUM_MONTHLY" as const,
  currency: "INR" as const,
};

function jsonOk(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
}

describe("Dodo provider application timeouts", () => {
  const prev = snapshotLivePaymentEnv();
  const prevKey = process.env.DODO_API_KEY;

  afterEach(() => {
    restoreLivePaymentEnv(prev);
    if (prevKey === undefined) delete process.env.DODO_API_KEY;
    else process.env.DODO_API_KEY = prevKey;
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("live=false writes never call fetch", async () => {
    process.env.PAYMENTS_LIVE_ENABLED = "false";
    process.env.DODO_ENVIRONMENT = "live";
    process.env.DODO_PRODUCT_MONTHLY_ID = "pdt_monthly_test";
    process.env.DODO_PRODUCT_ANNUAL_ID = "pdt_annual_test";
    process.env.DODO_API_KEY = "test_dummy_key_must_not_be_used";
    const fetchSpy = hungFetchMock();
    vi.stubGlobal("fetch", fetchSpy);
    const p = new DodoProvider();
    await expect(p.createCheckout(checkoutInput)).rejects.toThrow(PROVIDER_MUTATION_DISABLED);
    await expect(p.cancelSubscription("sub_x", true)).rejects.toThrow(PROVIDER_MUTATION_DISABLED);
    await expect(p.refundPayment({ paymentId: "pay_x" })).rejects.toThrow(PROVIDER_MUTATION_DISABLED);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("malformed PAYMENTS_LIVE_ENABLED values still skip mutation fetches", async () => {
    process.env.DODO_ENVIRONMENT = "live";
    process.env.DODO_PRODUCT_MONTHLY_ID = "pdt_monthly_test";
    process.env.DODO_PRODUCT_ANNUAL_ID = "pdt_annual_test";
    process.env.DODO_API_KEY = "test_dummy_key_must_not_be_used";
    const fetchSpy = hungFetchMock();
    vi.stubGlobal("fetch", fetchSpy);
    const p = new DodoProvider();
    for (const value of ["TRUE", " true ", "false", "1", "yes", ""]) {
      process.env.PAYMENTS_LIVE_ENABLED = value;
      await expect(p.cancelSubscription("sub_x")).rejects.toThrow(PROVIDER_MUTATION_DISABLED);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("live=true mocked writes still reach fetch with a signal and write timeout", async () => {
    enableLivePaymentMutations();
    process.env.DODO_API_KEY = "test_dummy_key_for_code_path";
    const fetchSpy = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      return jsonOk({ checkout_url: "https://example.test/checkout", checkout_id: "chk_ok" });
    });
    vi.stubGlobal("fetch", fetchSpy);
    const p = new DodoProvider();
    await p.createCheckout(checkoutInput);
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it.each([
    ["createCheckout", DODO_WRITE_TIMEOUT_MS, async (p: DodoProvider) => p.createCheckout(checkoutInput)],
    ["getPayment", DODO_READ_TIMEOUT_MS, async (p: DodoProvider) => p.getPayment("pay_x")],
    ["getSubscription", DODO_READ_TIMEOUT_MS, async (p: DodoProvider) => p.getSubscription("sub_x")],
    ["cancelSubscription", DODO_WRITE_TIMEOUT_MS, async (p: DodoProvider) => p.cancelSubscription("sub_x", true)],
    ["refundPayment", DODO_WRITE_TIMEOUT_MS, async (p: DodoProvider) => p.refundPayment({ paymentId: "pay_x" })],
  ] as const)("%s times out as provider_unavailable without retry", async (_name, timeoutMs, run) => {
    enableLivePaymentMutations();
    process.env.DODO_API_KEY = "test_dummy_key_for_code_path";
    vi.useFakeTimers();
    const fetchSpy = hungFetchMock();
    vi.stubGlobal("fetch", fetchSpy);
    const p = new DodoProvider();
    const pending = run(p).then(
      () => {
        throw new Error(`${_name} resolved a hung provider call`);
      },
      (error: unknown) => error,
    );
    await vi.advanceTimersByTimeAsync(timeoutMs);
    const error = await pending;
    expect(isProviderUnavailableError(error)).toBe(true);
    expect((error as Error).message).toBe(PROVIDER_UNAVAILABLE);
    expect(fetchSpy).toHaveBeenCalledOnce();
    expect((fetchSpy.mock.calls[0][1] as RequestInit).signal).toBeInstanceOf(AbortSignal);
  });

  it("getSubscription timeout throws rather than returning null", async () => {
    process.env.DODO_API_KEY = "test_dummy_key_for_code_path";
    vi.useFakeTimers();
    vi.stubGlobal("fetch", hungFetchMock());
    const p = new DodoProvider();
    const pending = p.getSubscription("sub_missing").then(
      (value) => value,
      (error: unknown) => error,
    );
    await vi.advanceTimersByTimeAsync(DODO_READ_TIMEOUT_MS);
    const result = await pending;
    expect(result).not.toBeNull();
    expect(isProviderUnavailableError(result)).toBe(true);
  });
});
