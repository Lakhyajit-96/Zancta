import { afterEach, describe, expect, it, vi } from "vitest";
import { DodoProvider } from "@/lib/payments/providers/dodo";
import { PROVIDER_MUTATION_DISABLED } from "@/lib/payments/live";
import { enableLivePaymentMutations, restoreLivePaymentEnv, snapshotLivePaymentEnv } from "./live-payment-env";

const checkoutInput = {
  userId: "user_gate",
  email: "gate@example.com",
  planId: "PREMIUM_MONTHLY" as const,
  currency: "INR" as const,
};

describe("Dodo provider writes require the live gate", () => {
  const prev = snapshotLivePaymentEnv();
  const prevKey = process.env.DODO_API_KEY;

  afterEach(() => {
    restoreLivePaymentEnv(prev);
    if (prevKey === undefined) delete process.env.DODO_API_KEY;
    else process.env.DODO_API_KEY = prevKey;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("live=false → createCheckout / cancel / refund never call fetch", async () => {
    process.env.PAYMENTS_LIVE_ENABLED = "false";
    process.env.DODO_ENVIRONMENT = "live";
    process.env.DODO_PRODUCT_MONTHLY_ID = "pdt_monthly_test";
    process.env.DODO_PRODUCT_ANNUAL_ID = "pdt_annual_test";
    process.env.DODO_API_KEY = "test_dummy_key_must_not_be_used";
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const p = new DodoProvider();
    await expect(p.createCheckout(checkoutInput)).rejects.toThrow(PROVIDER_MUTATION_DISABLED);
    await expect(p.cancelSubscription("sub_x", true)).rejects.toThrow(PROVIDER_MUTATION_DISABLED);
    await expect(p.refundPayment({ paymentId: "pay_x" })).rejects.toThrow(PROVIDER_MUTATION_DISABLED);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("missing gate → writes never call fetch", async () => {
    delete process.env.PAYMENTS_LIVE_ENABLED;
    process.env.DODO_ENVIRONMENT = "live";
    process.env.DODO_PRODUCT_MONTHLY_ID = "pdt_monthly_test";
    process.env.DODO_PRODUCT_ANNUAL_ID = "pdt_annual_test";
    process.env.DODO_API_KEY = "test_dummy_key_must_not_be_used";
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const p = new DodoProvider();
    await expect(p.createCheckout(checkoutInput)).rejects.toThrow(PROVIDER_MUTATION_DISABLED);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("malformed gate values do not permit writes", async () => {
    process.env.DODO_ENVIRONMENT = "live";
    process.env.DODO_PRODUCT_MONTHLY_ID = "pdt_monthly_test";
    process.env.DODO_PRODUCT_ANNUAL_ID = "pdt_annual_test";
    process.env.DODO_API_KEY = "test_dummy_key_must_not_be_used";
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const p = new DodoProvider();
    for (const value of ["TRUE", " true ", "false", "1", "yes", ""]) {
      process.env.PAYMENTS_LIVE_ENABLED = value;
      await expect(p.cancelSubscription("sub_x")).rejects.toThrow(PROVIDER_MUTATION_DISABLED);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("test Dodo credentials plus live=false cannot activate production checkout", async () => {
    process.env.PAYMENTS_LIVE_ENABLED = "false";
    process.env.DODO_ENVIRONMENT = "test";
    process.env.DODO_PRODUCT_MONTHLY_ID = "pdt_monthly_test";
    process.env.DODO_PRODUCT_ANNUAL_ID = "pdt_annual_test";
    process.env.DODO_API_KEY = "test_dummy_key_must_not_be_used";
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const p = new DodoProvider();
    await expect(p.createCheckout(checkoutInput)).rejects.toThrow(PROVIDER_MUTATION_DISABLED);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("live=true + valid config permits a provider write (fetch is mocked)", async () => {
    enableLivePaymentMutations();
    process.env.DODO_API_KEY = "test_dummy_key_for_code_path";
    const fetchSpy = vi.fn(async () =>
      new Response(JSON.stringify({ checkout_url: "https://example.test/checkout", checkout_id: "chk_test" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);
    const p = new DodoProvider();
    const result = await p.createCheckout(checkoutInput);
    expect(result.checkoutUrl).toBe("https://example.test/checkout");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [calledUrl, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(calledUrl).toBe("https://live.dodopayments.com/checkouts");
    const body = JSON.parse(String(init.body));
    expect(body.product_cart[0].product_id).toBe("pdt_test_monthly");
    expect(body.metadata.planId).toBe("PREMIUM_MONTHLY");
    expect(body.customer.email).toBe("gate@example.com");
  });

  it("verifyWebhook does not depend on checkout activation", async () => {
    process.env.PAYMENTS_LIVE_ENABLED = "false";
    process.env.DODO_WEBHOOK_SECRET = "whsec_" + Buffer.from("gate_webhook_secret_1234567890abcd").toString("base64");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const p = new DodoProvider();
    const raw = JSON.stringify({ event_type: "payment.succeeded", data: {} });
    const id = "wh_gate_independent";
    const ts = String(Math.floor(Date.now() / 1000));
    const bare = process.env.DODO_WEBHOOK_SECRET.slice(6);
    const key = Buffer.from(bare, "base64");
    const crypto = await import("crypto");
    const sig = crypto.createHmac("sha256", key).update(`${id}.${ts}.${raw}`, "utf8").digest("base64");
    const res = await p.verifyWebhook({
      rawBody: raw,
      headers: { "webhook-id": id, "webhook-timestamp": ts, "webhook-signature": `v1,${sig}` },
    });
    expect(res.ok).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
