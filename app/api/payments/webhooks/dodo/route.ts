import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getPaymentProvider } from "@/lib/payments";
import prisma from "@/lib/db";
import { syncEntitlement } from "@/lib/payments/entitlement-sync";

// Dodo webhooks use Standard Webhooks: raw body + headers webhook-id/timestamp/signature
// Never JSON-parse before signature — use raw body.

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Collect headers (NextRequest headers are case-insensitive but we normalize lower)
  const headers: Record<string, string | undefined> = {};
  for (const [k, v] of req.headers.entries()) headers[k.toLowerCase()] = v;
  // Keep original cased variants for provider
  for (const k of ["webhook-id", "webhook-timestamp", "webhook-signature"]) {
    const v = req.headers.get(k) || req.headers.get(k.replace(/(^|-)\w/g, (s) => s.toUpperCase()));
    if (v) headers[k] = v;
  }

  const provider = getPaymentProvider("dodo");
  const verified = await provider.verifyWebhook({ rawBody, headers });
  if (!verified.ok) {
    console.error("[webhook:dodo] signature failed", verified.error);
    return NextResponse.json({ error: verified.error || "Invalid signature" }, { status: 401 });
  }

  const eventType = verified.eventType;
  const providerEventId = verified.providerEventId;
  const payload = verified.payload as Record<string, unknown>;
  const data = ((payload as Record<string, unknown>).data as Record<string, unknown>) || payload;

  // Payload hash for audit, not raw payload storage
  const payloadHash = crypto.createHash("sha256").update(rawBody).digest("hex");

  // Idempotency: unique providerEventId
  try {
    await prisma.webhookEvent.create({
      data: {
        provider: "dodo",
        providerEventId,
        eventType,
        status: "processed",
        payloadHash,
      },
    });
  } catch (e: unknown) {
    const msg = (e as Error).message || "";
    // Prisma unique constraint P2002
    if (msg.includes("Unique constraint") || msg.includes("providerEventId") || (e as { code?: string }).code === "P2002") {
      // Already processed — idempotent duplicate
      await prisma.webhookEvent.updateMany({ where: { providerEventId }, data: { status: "duplicate" } }).catch(() => {});
      return NextResponse.json({ ok: true, duplicate: true });
    }
    console.error("[webhook:dodo] event insert failed", e);
    return NextResponse.json({ error: "Event persistence failed" }, { status: 500 });
  }

  // Extract user mapping — Dodo sends metadata.userId or customer email
  // We expect checkout metadata userId; fallback to email lookup
  const metadata = (data.metadata as Record<string, unknown>) || (data.meta as Record<string, unknown>) || {};
  const userIdFromMeta = (metadata.userId as string) || (metadata.user_id as string) || null;
  const planFromMeta = (metadata.planId as string) || (metadata.plan as string) || null;
  const customerId = (data.customer_id as string) || (data.customerId as string) || (data.customer as Record<string, unknown>)?.customer_id as string | undefined;
  const subscriptionId = (data.subscription_id as string) || (data.subscriptionId as string) || (data.id as string) || null;
  const paymentId = (data.payment_id as string) || (data.paymentId as string) || (data.id as string) || null;
  const email = (data.customer_email as string) || (data.email as string) || ((data.customer as Record<string, unknown>)?.email as string) || null;

  let userId = userIdFromMeta;
  if (!userId && email) {
    const user = await prisma.user.findUnique({ where: { email: String(email) } });
    if (user) userId = user.id;
  }

  // Events that do not map to a user (e.g., test ping) — ack but no entitlement change
  if (!userId) {
    console.warn("[webhook:dodo] no user mapping for event", eventType, providerEventId);
    return NextResponse.json({ ok: true, noUser: true });
  }

  // Helper to upsert subscription row
  async function upsertSubscription(status: string, extras: Partial<{ currentPeriodStart: Date; currentPeriodEnd: Date; cancelAtPeriodEnd: boolean }>) {
    if (!subscriptionId) return;
    const plan = planFromMeta || "PREMIUM_MONTHLY";
    await prisma.paymentSubscription.upsert({
      where: { providerSubscriptionId: String(subscriptionId) },
      create: {
        userId: userId!,
        provider: "dodo",
        providerSubscriptionId: String(subscriptionId),
        providerCustomerId: customerId ? String(customerId) : undefined,
        plan: String(plan),
        status,
        currentPeriodStart: extras.currentPeriodStart || undefined,
        currentPeriodEnd: extras.currentPeriodEnd || undefined,
        cancelAtPeriodEnd: !!extras.cancelAtPeriodEnd,
      },
      update: {
        status,
        ...(extras.currentPeriodStart ? { currentPeriodStart: extras.currentPeriodStart } : {}),
        ...(extras.currentPeriodEnd ? { currentPeriodEnd: extras.currentPeriodEnd } : {}),
        ...(extras.cancelAtPeriodEnd !== undefined ? { cancelAtPeriodEnd: extras.cancelAtPeriodEnd } : {}),
      },
    });
  }

  // Helper: stale protection — don't let older period overwrite newer
  async function shouldApplyEntitlement(currentPeriodEnd?: Date | null): Promise<boolean> {
    if (!currentPeriodEnd) return true;
    const existing = await prisma.entitlement.findUnique({ where: { userId: userId! } });
    if (!existing?.currentPeriodEnd) return true;
    // Only apply if incoming is newer or equal (tolerate 1s)
    return currentPeriodEnd.getTime() >= new Date(existing.currentPeriodEnd).getTime() - 1000;
  }

  // Route by event type — actual Dodo names (see docs: payment.succeeded/failed/processing/cancelled, subscription.active/renewed/updated/on_hold/cancelled/failed/expired, refund.succeeded/failed, dispute.*)
  const t = eventType.toLowerCase();
  try {
    if (t === "payment.succeeded" || t === "payment_succeeded") {
      if (paymentId) {
        const amount = Number((data.total_amount as number) ?? (data.amount as number) ?? 0);
        const currency = String((data.currency as string) || "USD");
        await prisma.payment.upsert({
          where: { providerPaymentId: String(paymentId) },
          create: {
            userId: userId!,
            provider: "dodo",
            providerPaymentId: String(paymentId),
            providerSubscriptionId: subscriptionId ? String(subscriptionId) : undefined,
            amount,
            currency,
            status: "succeeded",
          },
          update: { status: "succeeded", amount, currency },
        });
      }
      // For one-time or initial subscription payment — activate if subscription event not yet received
      // If this is a subscription creation, subscription.active will also arrive; we handle both idempotently
      if (subscriptionId) {
        await upsertSubscription("active", {});
        await syncEntitlement({
          userId: userId!,
          provider: "dodo",
          providerCustomerId: customerId || null,
          providerSubscriptionId: subscriptionId ? String(subscriptionId) : null,
          plan: "PREMIUM",
          status: "ACTIVE",
          providerEventId,
        });
      }
    } else if (t.includes("subscription.active") || t === "subscription.renewed" || t === "subscription_renewed") {
      const cps = data.current_period_start ? new Date(String(data.current_period_start)) : null;
      const cpe = data.current_period_end ? new Date(String(data.current_period_end)) : null;
      const cancelAtEnd = Boolean((data.cancel_at_next_billing_date as boolean) ?? (data.cancel_at_period_end as boolean) ?? false);
      await upsertSubscription("active", { currentPeriodStart: cps || undefined, currentPeriodEnd: cpe || undefined, cancelAtPeriodEnd: cancelAtEnd });
      if (await shouldApplyEntitlement(cpe)) {
        await syncEntitlement({
          userId: userId!,
          provider: "dodo",
          providerCustomerId: customerId || null,
          providerSubscriptionId: subscriptionId ? String(subscriptionId) : null,
          plan: "PREMIUM",
          status: "ACTIVE",
          currentPeriodStart: cps as Date | null,
          currentPeriodEnd: cpe as Date | null,
          cancelAtPeriodEnd: cancelAtEnd,
          providerEventId,
        });
      }
    } else if (t.includes("subscription.updated") || t === "subscription_updated") {
      const cps = data.current_period_start ? new Date(String(data.current_period_start)) : null;
      const cpe = data.current_period_end ? new Date(String(data.current_period_end)) : null;
      const cancelAtEnd = Boolean((data.cancel_at_next_billing_date as boolean) ?? (data.cancel_at_period_end as boolean) ?? false);
      await upsertSubscription("active", { currentPeriodStart: cps || undefined, currentPeriodEnd: cpe || undefined, cancelAtPeriodEnd: cancelAtEnd });
      if (await shouldApplyEntitlement(cpe)) {
        await syncEntitlement({
          userId: userId!,
          provider: "dodo",
          providerSubscriptionId: subscriptionId ? String(subscriptionId) : null,
          plan: "PREMIUM",
          status: "ACTIVE",
          currentPeriodStart: cps as Date | null,
          currentPeriodEnd: cpe as Date | null,
          cancelAtPeriodEnd: cancelAtEnd,
          providerEventId,
        });
      }
    } else if (t.includes("subscription.on_hold") || t === "subscription_on_hold" || t === "subscription.on_hold") {
      await upsertSubscription("on_hold", {});
      // Treat on_hold as still active during retry (grace) — do not expire yet
      await syncEntitlement({
        userId: userId!,
        provider: "dodo",
        providerSubscriptionId: subscriptionId ? String(subscriptionId) : null,
        plan: "PREMIUM",
        status: "ACTIVE",
        providerEventId,
      });
    } else if (t.includes("subscription.cancelled") || t === "subscription_cancelled" || t === "subscription.canceled") {
      const cpe = data.current_period_end ? new Date(String(data.current_period_end)) : null;
      const cps = data.current_period_start ? new Date(String(data.current_period_start)) : null;
      // Dodo supports both immediate and end-of-period cancellation
      const isImmediate = !cpe || (data.cancelled_at ? new Date(String(data.cancelled_at)) < (cpe as Date) : false);
      await upsertSubscription("cancelled", { currentPeriodStart: cps || undefined, currentPeriodEnd: cpe || undefined, cancelAtPeriodEnd: true });
      if (isImmediate) {
        const { revokeToFree } = await import("@/lib/payments/entitlement-sync");
        await revokeToFree(userId!, "dodo", "subscription_cancelled_immediate", providerEventId);
      } else {
        // Remain PREMIUM until period end — mark CANCELLED but still entitled until expiry
        await syncEntitlement({
          userId: userId!,
          provider: "dodo",
          providerSubscriptionId: subscriptionId ? String(subscriptionId) : null,
          plan: "PREMIUM",
          status: "ACTIVE",
          currentPeriodStart: cps as Date | null,
          currentPeriodEnd: cpe as Date | null,
          cancelAtPeriodEnd: true,
          providerEventId,
        });
        // Also set entitlement cancelAtPeriodEnd true; expiry will happen via nightly check or subscription.expired
        await prisma.entitlement.update({ where: { userId: userId! }, data: { cancelAtPeriodEnd: true, currentPeriodEnd: cpe || undefined } }).catch(() => {});
      }
    } else if (t.includes("subscription.failed") || t === "subscription_failed" || t === "payment.failed" || t.includes("payment.failed")) {
      if (paymentId) {
        await prisma.payment.upsert({
          where: { providerPaymentId: String(paymentId) },
          create: { userId: userId!, provider: "dodo", providerPaymentId: String(paymentId), status: "failed", amount: Number(data.total_amount ?? 0), currency: String(data.currency || "USD") },
          update: { status: "failed" },
        }).catch(() => {});
      }
      if (subscriptionId) await upsertSubscription("failed", {});
      // Failed payment does not immediately revoke — grace handled via on_hold/expired
    } else if (t.includes("subscription.expired") || t === "subscription_expired") {
      await upsertSubscription("expired", {});
      const { revokeToFree } = await import("@/lib/payments/entitlement-sync");
      await revokeToFree(userId!, "dodo", "subscription_expired", providerEventId);
    } else if (t.includes("refund.succeeded") || t === "refund_succeeded") {
      if (paymentId) {
        await prisma.payment.update({ where: { providerPaymentId: String(paymentId) }, data: { status: "refunded" } }).catch(() => {});
      }
      // Refund policy: immediate expiration (product policy — full refund = revoke)
      const { revokeToFree } = await import("@/lib/payments/entitlement-sync");
      await revokeToFree(userId!, "dodo", "refund_succeeded", providerEventId);
    } else if (t.includes("refund.failed")) {
      // No entitlement change
    } else if (t.includes("dispute") || t.includes("chargeback")) {
      // Chargeback/dispute — suspend pending review
      await prisma.paymentSubscription.updateMany({ where: { userId: userId!, provider: "dodo" }, data: { status: "on_hold" } }).catch(() => {});
      await prisma.entitlement.update({ where: { userId: userId! }, data: { plan: "EXPIRED", status: "EXPIRED" } }).catch(() => {});
    } else {
      // Unknown event — acknowledged but no state change
      console.log("[webhook:dodo] unhandled event", eventType);
    }
  } catch (e) {
    console.error("[webhook:dodo] processing failed", eventType, e);
    await prisma.webhookEvent.update({ where: { providerEventId }, data: { status: "failed" } }).catch(() => {});
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
