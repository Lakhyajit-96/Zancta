import { describe, expect, it } from "vitest";
import { deriveFromSubscription, isProviderBackedPremium, isStaleEvent } from "@/lib/payments/billing-state";
import { extractDodoResourceIds } from "@/lib/payments/process-dodo-event";
import { PREMIUM_CONTRACT } from "@/lib/payments/premium-contract";

describe("premium contract", () => {
  it("does not claim higher limits or shipped ads", () => {
    expect(PREMIUM_CONTRACT.higherLimitsImplemented).toBe(false);
    expect(PREMIUM_CONTRACT.sameFileAndPageLimitsAsFree).toBe(true);
    expect(PREMIUM_CONTRACT.localOcrPowerImplemented).toBe(true);
    expect(PREMIUM_CONTRACT.adsShipped).toBe(false);
    expect(PREMIUM_CONTRACT.reservedAdFreeWhenAdsLaunch).toBe(true);
  });
});

describe("billing-state derivation", () => {
  const future = new Date(Date.now() + 10 * 86400000);
  const past = new Date(Date.now() - 1000);

  it("grants premium for active and on_hold", () => {
    expect(deriveFromSubscription({ status: "active", currentPeriodEnd: future }).plan).toBe("PREMIUM");
    expect(deriveFromSubscription({ status: "on_hold", currentPeriodEnd: future }).status).toBe("ACTIVE");
  });

  it("keeps premium after cancel until period end", () => {
    const derived = deriveFromSubscription({ status: "cancelled", currentPeriodEnd: future, cancelAtPeriodEnd: true });
    expect(derived.plan).toBe("PREMIUM");
    expect(derived.cancelAtPeriodEnd).toBe(true);
  });

  it("expires cancelled subscriptions after period end", () => {
    expect(deriveFromSubscription({ status: "cancelled", currentPeriodEnd: past }).plan).toBe("EXPIRED");
  });

  it("does not grant premium from pending", () => {
    expect(deriveFromSubscription({ status: "pending" }).plan).toBe("FREE");
  });

  it("requires a provider subscription id for paid access", () => {
    expect(isProviderBackedPremium({
      providerSubscriptionId: null,
      status: "active",
      currentPeriodEnd: future,
    })).toBe(false);
    expect(isProviderBackedPremium({
      providerSubscriptionId: "sub_1",
      status: "active",
      currentPeriodEnd: future,
    })).toBe(true);
  });

  it("detects stale events", () => {
    expect(isStaleEvent({
      incomingTimestamp: 100,
      existingTimestamp: new Date(200 * 1000),
    })).toBe(true);
    expect(isStaleEvent({
      incomingTimestamp: 200,
      existingTimestamp: new Date(100 * 1000),
    })).toBe(false);
  });
});

describe("Dodo resource id extraction", () => {
  it("does not treat payment id as a subscription id", () => {
    const ids = extractDodoResourceIds("payment.succeeded", {
      id: "pay_abc",
      payment_id: "pay_abc",
      customer_id: "cus_1",
    });
    expect(ids.paymentId).toBe("pay_abc");
    expect(ids.subscriptionId).toBeNull();
  });

  it("reads subscription_id from payment events when present", () => {
    const ids = extractDodoResourceIds("payment.succeeded", {
      id: "pay_abc",
      payment_id: "pay_abc",
      subscription_id: "sub_abc",
    });
    expect(ids.subscriptionId).toBe("sub_abc");
    expect(ids.paymentId).toBe("pay_abc");
  });

  it("reads subscription id from subscription events", () => {
    const ids = extractDodoResourceIds("subscription.active", { id: "sub_abc", customer_id: "cus_1" });
    expect(ids.subscriptionId).toBe("sub_abc");
    expect(ids.paymentId).toBeNull();
  });
});
