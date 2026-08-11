/**
 * Dodo Payments adapter — Merchant of Record
 * Implements PaymentProvider via Dodo REST API + Standard Webhooks signature.
 * No card data handled, no file bytes.
 * Docs: https://docs.dodopayments.com/developer-resources/webhooks
 * Pricing verified 2026-08-11 live pricing page: 4%+40c US domestic, +1.5% intl, +0.5% subs, India 4%+15c, disputes $30, no monthly.
 */
import crypto from "crypto";
import type {
  PaymentProvider,
  ProviderName,
  CreateCheckoutInput,
  CheckoutResult,
  PaymentRecord,
  SubscriptionRecord,
  RefundInput,
  VerifyWebhookResult,
} from "../types";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

function getBaseUrl(): string {
  // Dodo API base — test vs live via DODO_ENVIRONMENT
  const env = (process.env.DODO_ENVIRONMENT || "test").toLowerCase();
  if (env === "live" || env === "production") return "https://live.dodopayments.com";
  return "https://test.dodopayments.com";
}

// Standard Webhooks verification: webhook-id + webhook-timestamp + rawBody joined by "." → HMAC-SHA256 with secret (base64 decoded)
// https://docs.dodopayments.com/developer-resources/webhooks
async function verifyStandardWebhook(
  rawBody: string,
  headers: Record<string, string | undefined>,
  secret: string
): Promise<{ ok: boolean; error?: string }> {
  const id = headers["webhook-id"] || headers["Webhook-Id"] || headers["webhook_id"];
  const timestamp = headers["webhook-timestamp"] || headers["Webhook-Timestamp"] || headers["webhook_timestamp"];
  const signatureHeader = headers["webhook-signature"] || headers["Webhook-Signature"] || headers["webhook_signature"];

  if (!id || !timestamp || !signatureHeader) return { ok: false, error: "Missing webhook headers (expected webhook-id, webhook-timestamp, webhook-signature)" };

  // Timestamp window ±5 min
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return { ok: false, error: "Invalid webhook-timestamp" };
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > 5 * 60) return { ok: false, error: "Webhook timestamp outside 5min window — possible replay" };

  // Secret is base64-encoded in Dodo dashboard (whsec_...); strip prefix if present
  const bare = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  let key: Buffer;
  try {
    key = Buffer.from(bare, "base64");
    // if not base64, fallback to utf8
    if (key.length === 0 || !bare.match(/^[A-Za-z0-9+/=]+$/)) throw new Error("not base64");
  } catch {
    key = Buffer.from(secret, "utf8");
  }

  const signed = `${id}.${timestamp}.${rawBody}`;
  const expected = crypto.createHmac("sha256", key).update(signed, "utf8").digest("base64");

  // signature header format: "v1,<base64>" may contain multiple
  const sigs = signatureHeader.split(" ").flatMap((s) => s.split(","));
  const v1sigs = sigs.filter((s) => s && s !== "v1");
  // Also handle "v1=..." form
  const candidates: string[] = [];
  for (const part of signatureHeader.split(" ")) {
    if (part.startsWith("v1,")) candidates.push(part.slice(3));
    else if (part.startsWith("v1=")) candidates.push(part.slice(3));
    else if (!part.startsWith("v1")) candidates.push(part);
  }

  // Normalize: if candidates empty, try split by comma
  const toCheck = candidates.length ? candidates : v1sigs.length ? v1sigs : [signatureHeader];

  let ok = false;
  for (const sig of toCheck) {
    const a = sig.trim().replace(/^v1[=,]/, "");
    if (!a) continue;
    try {
      const aBuf = Buffer.from(a, "base64");
      const eBuf = Buffer.from(expected, "base64");
      if (aBuf.length === eBuf.length && crypto.timingSafeEqual(aBuf, eBuf)) {
        ok = true;
        break;
      }
    } catch {
      // ignore non-base64
    }
    // fallback string compare timingSafe
    if (a === expected) { ok = true; break; }
  }

  if (!ok) return { ok: false, error: "Invalid webhook signature" };
  return { ok: true };
}

export class DodoProvider implements PaymentProvider {
  readonly name: ProviderName = "dodo";

  private get apiKey(): string {
    return requireEnv("DODO_API_KEY");
  }

  private get webhookSecret(): string {
    // Support both names: DODO_WEBHOOK_SECRET and DODO_PAYMENTS_WEBHOOK_SECRET
    return process.env.DODO_WEBHOOK_SECRET || process.env.DODO_PAYMENTS_WEBHOOK_SECRET || requireEnv("DODO_PAYMENTS_WEBHOOK_SECRET");
  }

  private productIdForPlan(planId: string): string | null {
    if (planId === "PREMIUM_MONTHLY") return process.env.DODO_PRODUCT_MONTHLY_ID || process.env.DODO_PAYMENTS_PRODUCT_MONTHLY_ID || null;
    if (planId === "PREMIUM_ANNUAL") return process.env.DODO_PRODUCT_ANNUAL_ID || process.env.DODO_PAYMENTS_PRODUCT_ANNUAL_ID || null;
    return null;
  }

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult> {
    const productId = this.productIdForPlan(input.planId);
    if (!productId) throw new Error(`Dodo product not configured for plan ${input.planId} (set DODO_PRODUCT_MONTHLY_ID / DODO_PRODUCT_ANNUAL_ID)`);

    const base = getBaseUrl();
    // Dodo Checkout Session API — https://docs.dodopayments.com/api-reference/checkouts
    // We use product_id checkout: POST /checkouts  { product_id, customer: { email }, return_url, metadata }
    const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const returnUrl = input.successUrl || `${appUrl}/account?checkout=success`;
    const res = await fetch(`${base}/checkouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: productId,
        customer: { email: input.email },
        return_url: returnUrl,
        metadata: { userId: input.userId, planId: input.planId },
      }),
    });

    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const msg = (json.message as string) || (json.error as string) || `Dodo checkout failed ${res.status}`;
      throw new Error(msg);
    }
    const checkoutUrl = (json.checkout_url as string) || (json.url as string) || (json.checkoutUrl as string);
    const checkoutId = (json.checkout_id as string) || (json.id as string) || (json.checkoutId as string) || productId;
    if (!checkoutUrl) throw new Error("Dodo checkout response missing checkout_url");
    return { checkoutUrl, providerCheckoutId: String(checkoutId), provider: "dodo" };
  }

  async getPayment(paymentId: string): Promise<PaymentRecord | null> {
    const base = getBaseUrl();
    const res = await fetch(`${base}/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (res.status === 404) return null;
    const j = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!res.ok || !j) return null;
    return {
      providerPaymentId: String(j.payment_id || j.id || paymentId),
      amount: Number(j.total_amount ?? j.amount ?? 0),
      currency: String(j.currency || "USD"),
      status: (String(j.status || "processing").toLowerCase() as PaymentRecord["status"]) || "processing",
    };
  }

  async getSubscription(subscriptionId: string): Promise<SubscriptionRecord | null> {
    const base = getBaseUrl();
    const res = await fetch(`${base}/subscriptions/${encodeURIComponent(subscriptionId)}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (res.status === 404) return null;
    const j = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!res.ok || !j) return null;
    return {
      providerSubscriptionId: String(j.subscription_id || j.id || subscriptionId),
      providerCustomerId: j.customer_id ? String(j.customer_id) : undefined,
      status: String(j.status || "pending").toLowerCase(),
      currentPeriodStart: j.current_period_start ? new Date(String(j.current_period_start)) : null,
      currentPeriodEnd: j.current_period_end ? new Date(String(j.current_period_end)) : null,
      cancelAtPeriodEnd: Boolean(j.cancel_at_next_billing_date ?? j.cancel_at_period_end ?? false),
    };
  }

  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd = true): Promise<void> {
    const base = getBaseUrl();
    const res = await fetch(`${base}/subscriptions/${encodeURIComponent(subscriptionId)}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ cancel_at_next_billing_date: cancelAtPeriodEnd }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      throw new Error((j.message as string) || `Cancel failed ${res.status}`);
    }
  }

  async refundPayment(input: RefundInput): Promise<void> {
    const base = getBaseUrl();
    const res = await fetch(`${base}/payments/${encodeURIComponent(input.paymentId)}/refund`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ amount: input.amount, reason: input.reason }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      throw new Error((j.message as string) || `Refund failed ${res.status}`);
    }
  }

  async verifyWebhook(req: { rawBody: string; headers: Record<string, string | undefined> }): Promise<VerifyWebhookResult> {
    let secret: string;
    try {
      secret = this.webhookSecret;
    } catch (e) {
      return { ok: false, provider: "dodo", eventType: "unknown", providerEventId: "unknown", payload: null, error: (e as Error).message };
    }

    const v = await verifyStandardWebhook(req.rawBody, req.headers, secret);
    if (!v.ok) {
      return { ok: false, provider: "dodo", eventType: "unknown", providerEventId: "unknown", payload: null, error: v.error };
    }

    let payload: unknown = null;
    try {
      payload = JSON.parse(req.rawBody);
    } catch {
      return { ok: false, provider: "dodo", eventType: "unknown", providerEventId: "unknown", payload: null, error: "Invalid JSON payload" };
    }

    const p = payload as Record<string, unknown>;
    // Dodo webhook wraps: { event_type, data: { ... } } or { type, payload } — normalize
    const eventType = String((p.event_type as string) || (p.type as string) || (p.event as string) || "unknown");
    const data = (p.data as Record<string, unknown>) || p;
    const providerEventId =
      String((p.event_id as string) || (p.id as string) || (data.payment_id as string) || (data.subscription_id as string) || (data.id as string) || `${eventType}:${Date.now()}`);
    const ts = (req.headers["webhook-timestamp"] || req.headers["Webhook-Timestamp"]) as string | undefined;

    return { ok: true, provider: "dodo", eventType, providerEventId, timestamp: ts, payload };
  }
}
