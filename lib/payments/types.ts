/**
 * Provider-agnostic payment abstraction — no card data, no file bytes.
 * Tool/auth/entitlement code depends only on these types.
 */

export type ProviderName = "dodo" | "paddle";

export type PlanId = "PREMIUM_MONTHLY" | "PREMIUM_ANNUAL";

export interface PlanConfig {
  id: PlanId;
  label: string;
  // Dodo product ids (test/prod) — resolved from env, not hard-coded prices
  providerProductId?: string;
}

export type CheckoutCurrency = "INR" | "USD";

export interface CreateCheckoutInput {
  userId: string;
  email: string;
  planId: PlanId;
  currency?: CheckoutCurrency;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutResult {
  checkoutUrl: string;
  providerCheckoutId: string;
  provider: ProviderName;
}

export interface PaymentRecord {
  providerPaymentId: string;
  amount: number; // minor units
  currency: string;
  status: "succeeded" | "failed" | "processing" | "cancelled" | "refunded";
}

export interface SubscriptionRecord {
  providerSubscriptionId: string;
  providerCustomerId?: string;
  status: string; // active | on_hold | cancelled | expired | failed | pending
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd: boolean;
}

export interface RefundInput {
  paymentId: string;
  amount?: number;
  reason?: string;
}

export interface VerifyWebhookResult {
  ok: boolean;
  provider: ProviderName;
  eventType: string;
  providerEventId: string;
  timestamp?: string;
  payload: unknown;
  error?: string;
}

export interface PaymentProvider {
  readonly name: ProviderName;

  createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult>;

  getPayment(paymentId: string): Promise<PaymentRecord | null>;

  getSubscription(subscriptionId: string): Promise<SubscriptionRecord | null>;

  cancelSubscription(subscriptionId: string, cancelAtPeriodEnd?: boolean): Promise<void>;

  refundPayment(input: RefundInput): Promise<void>;

  /**
   * Verify webhook signature against raw body.
   * Must operate on exact raw string — do NOT re-serialize JSON.
   */
  verifyWebhook(req: { rawBody: string; headers: Record<string, string | undefined> }): Promise<VerifyWebhookResult>;
}

export function getPlanPrice(planId: PlanId, currency: CheckoutCurrency): { amountMinor: number; display: string } {
  // Canonical pricing — from Phase 9A gate approved pricing (see docs/PHASE9A_REPORT.md §F)
  // These are display/reference only — provider charge is authoritative via Dodo product.
  // Keep in one place to avoid scattered magic numbers.
  if (planId === "PREMIUM_MONTHLY") {
    if (currency === "INR") return { amountMinor: 19900, display: "₹199 / month" };
    return { amountMinor: 500, display: "$5 / month" };
  }
  // annual
  if (currency === "INR") return { amountMinor: 99900, display: "₹999 / year" };
  return { amountMinor: 3900, display: "$39 / year" };
}

export const PLAN_IDS: PlanId[] = ["PREMIUM_MONTHLY", "PREMIUM_ANNUAL"];
