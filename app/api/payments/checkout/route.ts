import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { getPaymentProvider, isLivePaymentsEnabled } from "@/lib/payments";
import type { PlanId } from "@/lib/payments/types";
import { rateLimitAsync } from "@/lib/rate-limit";
import { auditEvent } from "@/lib/audit";

export async function GET() {
  return NextResponse.json({ live: isLivePaymentsEnabled() });
}

// POST /api/payments/checkout  { planId, currency? }
// Requires auth. Returns { checkoutUrl }
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  // Rate limit checkout creation 10/15m per user
  const rl = await rateLimitAsync(`checkout:${session.user.id}`, 10, 15 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many checkout attempts. Try again later." }, { status: 429 });

  const body = await req.json().catch(() => null) as { planId?: string; currency?: string } | null;
  const planId = body?.planId as PlanId | undefined;
  if (!planId || !["PREMIUM_MONTHLY", "PREMIUM_ANNUAL"].includes(planId)) {
    return NextResponse.json({ error: "Invalid planId (expected PREMIUM_MONTHLY or PREMIUM_ANNUAL)" }, { status: 400 });
  }

  const monthly = process.env.DODO_PRODUCT_MONTHLY_ID || process.env.DODO_PAYMENTS_PRODUCT_MONTHLY_ID;
  const annual = process.env.DODO_PRODUCT_ANNUAL_ID || process.env.DODO_PAYMENTS_PRODUCT_ANNUAL_ID;
  if (!monthly || !annual) {
    return NextResponse.json(
      { error: "Payment products not configured. Checkout is unavailable." },
      { status: 503 }
    );
  }

  const dodoEnv = (process.env.DODO_ENVIRONMENT || "test").toLowerCase();
  if ((dodoEnv === "live" || dodoEnv === "production") && !isLivePaymentsEnabled()) {
    return NextResponse.json(
      { error: "Live checkout is not enabled yet." },
      { status: 503 }
    );
  }

  try {
    const provider = getPaymentProvider();
    const result = await provider.createCheckout({
      userId: session.user.id,
      email: session.user.email,
      planId,
      currency: (body?.currency as "INR" | "USD") || undefined,
    });

    await prisma.paymentCheckout.upsert({
      where: { providerCheckoutId: result.providerCheckoutId },
      create: {
        userId: session.user.id,
        provider: result.provider,
        providerCheckoutId: result.providerCheckoutId,
        planId,
        status: "created",
      },
      update: { userId: session.user.id, planId, status: "created" },
    }).catch((e) => {
      console.error("[checkout] local checkout persist failed", e instanceof Error ? e.message : String(e));
    });

    await auditEvent({
      userId: session.user.id,
      action: "payment.checkout_started",
      targetId: result.providerCheckoutId,
      metadata: JSON.stringify({ provider: result.provider, planId }),
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    } as Parameters<typeof auditEvent>[0]);

    return NextResponse.json({ checkoutUrl: result.checkoutUrl, providerCheckoutId: result.providerCheckoutId });
  } catch (e) {
    const msg = (e as Error).message || "Checkout failed";
    // Do not leak raw provider key errors with secrets
    console.error("[checkout] failed", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
