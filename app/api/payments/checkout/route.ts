import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { getPaymentProvider, isLivePaymentsEnabled } from "@/lib/payments";
import { PROVIDER_MUTATION_DISABLED } from "@/lib/payments/live";
import type { PlanId } from "@/lib/payments/types";
import { rateLimitAsync } from "@/lib/rate-limit";
import { auditEvent } from "@/lib/audit";
import { getEntitlement } from "@/lib/entitlement";
import { recordProductEvent } from "@/lib/analytics/server-events";
import { previewMutationsBlocked, PREVIEW_ISOLATED_CODE, PREVIEW_ISOLATED_MESSAGE } from "@/lib/preview-isolation";

export async function GET() {
  return NextResponse.json({ live: isLivePaymentsEnabled() });
}

const CHECKOUT_PLANS: PlanId[] = ["PREMIUM_MONTHLY", "PREMIUM_ANNUAL"];

// POST /api/payments/checkout  { planId }
// Requires authenticated, verified user. Returns { checkoutUrl }
export async function POST(req: NextRequest) {
  if (previewMutationsBlocked()) {
    return NextResponse.json({ error: PREVIEW_ISOLATED_MESSAGE, code: PREVIEW_ISOLATED_CODE }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const liveUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, emailVerified: true, deletedAt: true },
  });
  if (!liveUser || liveUser.deletedAt || !liveUser.email) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (!liveUser.emailVerified) {
    return NextResponse.json(
      { error: "Verify your email before checkout.", code: "EMAIL_UNVERIFIED" },
      { status: 403 }
    );
  }

  // Rate limit checkout creation 10/15m per user
  const rl = await rateLimitAsync(`checkout:${liveUser.id}`, 10, 15 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many checkout attempts. Try again later." }, { status: 429 });

  const body = await req.json().catch(() => null) as { planId?: string; currency?: string; userId?: string } | null;
  if (body?.userId && body.userId !== liveUser.id) {
    return NextResponse.json({ error: "Checkout is bound to the signed-in account." }, { status: 403 });
  }

  const planId = body?.planId as PlanId | undefined;
  if (!planId || !CHECKOUT_PLANS.includes(planId)) {
    return NextResponse.json({ error: "Invalid planId (expected PREMIUM_MONTHLY or PREMIUM_ANNUAL)" }, { status: 400 });
  }

  const entitlement = await getEntitlement(liveUser.id);
  if (entitlement.plan === "ADMIN") {
    return NextResponse.json({ error: "Operator accounts cannot start Premium checkout." }, { status: 409 });
  }
  if (entitlement.plan === "PREMIUM" && entitlement.status === "ACTIVE" && entitlement.providerBacked) {
    return NextResponse.json({ error: "Premium is already active on this account." }, { status: 409 });
  }

  const recentCheckout = await prisma.paymentCheckout.findFirst({
    where: {
      userId: liveUser.id,
      status: "created",
      createdAt: { gt: new Date(Date.now() - 2 * 60 * 1000) },
    },
    select: { id: true },
  });
  if (recentCheckout) {
    return NextResponse.json({ error: "A checkout is already in progress. Try again in a moment." }, { status: 409 });
  }

  if (!isLivePaymentsEnabled()) {
    return NextResponse.json(
      { live: false, error: "Checkout is not enabled." },
      { status: 503 }
    );
  }

  const monthly = process.env.DODO_PRODUCT_MONTHLY_ID || process.env.DODO_PAYMENTS_PRODUCT_MONTHLY_ID;
  const annual = process.env.DODO_PRODUCT_ANNUAL_ID || process.env.DODO_PAYMENTS_PRODUCT_ANNUAL_ID;
  if (!monthly || !annual) {
    return NextResponse.json(
      { error: "Payment products not configured. Checkout is unavailable." },
      { status: 503 }
    );
  }

  try {
    const provider = getPaymentProvider();
    const result = await provider.createCheckout({
      userId: liveUser.id,
      email: liveUser.email,
      planId,
      currency: "INR",
    });

    await prisma.paymentCheckout.upsert({
      where: { providerCheckoutId: result.providerCheckoutId },
      create: {
        userId: liveUser.id,
        provider: result.provider,
        providerCheckoutId: result.providerCheckoutId,
        planId,
        status: "created",
      },
      update: { userId: liveUser.id, planId, status: "created" },
    }).catch((e) => {
      console.error("[checkout] local checkout persist failed", e instanceof Error ? e.message : String(e));
    });

    await auditEvent({
      userId: liveUser.id,
      action: "payment.checkout_started",
      targetId: result.providerCheckoutId,
      metadata: JSON.stringify({ provider: result.provider, planId }),
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    } as Parameters<typeof auditEvent>[0]);

    await recordProductEvent({
      event: "checkout_started",
      userId: liveUser.id,
      metadata: { plan: planId },
    });

    return NextResponse.json({ checkoutUrl: result.checkoutUrl, providerCheckoutId: result.providerCheckoutId });
  } catch (e) {
    const msg = (e as Error).message || "Checkout failed";
    // Do not leak raw provider key errors with secrets
    console.error("[checkout] failed", msg);
    if (msg === PROVIDER_MUTATION_DISABLED) {
      return NextResponse.json({ live: false, error: "Checkout is not enabled." }, { status: 503 });
    }
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
