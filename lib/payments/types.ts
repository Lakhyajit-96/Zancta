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

// INR is the only currency the configured Dodo products and checkout route use.
export type CheckoutCurrency = "INR";

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
  /** Dodo GET `created_at`. Not an update version. */
  createdAt?: Date | null;
  /** Dodo GET `cancelled_at` when the subscription is cancelled. */
  cancelledAt?: Date | null;
  /** Dodo GET `paused_at` when paused / on_hold. */
  pausedAt?: Date | null;
  /** Dodo GET `previous_billing_date` (start of current period). Not an update version. */
  previousBillingDate?: Date | null;
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

export function getPlanPrice(planId: PlanId): { amountMinor: number; display: string } {
  // Display/reference only — the provider charge shown at Dodo checkout is authoritative.
  // Keep in one place to avoid scattered magic numbers. INR only: no other currency is
  // configured on the live Dodo products (see lib/legal-public.ts).
  if (planId === "PREMIUM_MONTHLY") return { amountMinor: 19900, display: "₹199 / month" };
  return { amountMinor: 99900, display: "₹999 / year" };
}

export const PLAN_IDS: PlanId[] = ["PREMIUM_MONTHLY", "PREMIUM_ANNUAL"];
