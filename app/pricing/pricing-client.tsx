"use client";

import Link from "next/link";
import { useState } from "react";

type PlanId = "PREMIUM_MONTHLY" | "PREMIUM_ANNUAL";

export function PricingClient() {
  const [loading, setLoading] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkout(planId: PlanId) {
    setError(null);
    setLoading(planId);
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const j = (await res.json().catch(() => ({}))) as { checkoutUrl?: string; error?: string };
      if (!res.ok) throw new Error(j.error || `Checkout failed ${res.status}`);
      if (j.checkoutUrl) window.location.href = j.checkoutUrl;
      else throw new Error("No checkout URL returned");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <div className="mt-10 grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3">
        {/* Free — muted, no CTA emphasis */}
        <div className="flex flex-col bg-surface p-6 md:p-8">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-medium tracking-wide">Free</h3>
            <span className="text-xs text-muted-foreground">No account needed</span>
          </div>
          <p className="text-[28px] font-semibold mt-3 leading-none">₹0 <span className="text-sm font-normal text-muted-foreground">/ $0</span></p>
          <ul className="mt-5 space-y-1.5 text-sm text-muted-foreground leading-relaxed">
            <li>9 local tools · 50 MB / file · 50 files</li>
            <li>No watermark · privacy: local only</li>
          </ul>
          <Link href="/tools" className="mt-6 h-9 grid place-items-center rounded-md border text-sm font-medium hover:bg-muted">
            Use tools
          </Link>
          <p className="mt-2 text-xs text-muted-foreground">Contextual ads outside the tool only.</p>
        </div>

        {/* Monthly — standard */}
        <div className="flex flex-col bg-elevated p-6 md:p-8">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-medium">Premium — Monthly</h3>
            <span className="text-xs text-muted-foreground">Cancel anytime</span>
          </div>
          <p className="text-[28px] font-semibold mt-3 leading-none">₹199 <span className="text-sm font-normal text-muted-foreground">/ $5<span className="font-normal"> / mo</span></span></p>
          <ul className="mt-5 space-y-1.5 text-sm text-muted-foreground leading-relaxed">
            <li>No ads · 100 MB / file · 100 files</li>
            <li>Advanced controls · saved preferences</li>
          </ul>
          <button
            onClick={() => checkout("PREMIUM_MONTHLY")}
            disabled={!!loading}
            aria-label="Upgrade to Premium Monthly"
            className="premium-button premium-button-primary mt-6 min-h-10 disabled:opacity-50"
          >
            {loading === "PREMIUM_MONTHLY" ? "Redirecting…" : "Upgrade — Monthly"}
          </button>
          <p className="mt-2 text-xs text-muted-foreground">Secure Dodo checkout. No card data here.</p>
        </div>

        {/* Annual — elevated with accent hairline, not identical card */}
        <div className="relative flex flex-col overflow-hidden bg-surface p-6 md:p-8">
          <div className="absolute inset-x-0 top-0 h-px bg-accent/60" aria-hidden />
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-medium">Premium — Annual</h3>
            <span className="rounded-full bg-accent/15 text-accent text-xs px-2 py-0.5">Best value</span>
          </div>
          <p className="text-[28px] font-semibold mt-3 leading-none">₹999 <span className="text-sm font-normal text-muted-foreground">/ $39<span className="font-normal"> / yr</span></span></p>
          <p className="text-xs text-muted-foreground mt-1.5">₹83 / $3.25 per month · 58% off monthly</p>
          <ul className="mt-5 space-y-1.5 text-sm text-muted-foreground leading-relaxed">
            <li>Everything in Monthly + priority support</li>
            <li>Billed yearly · 2 months free</li>
          </ul>
          <button
            onClick={() => checkout("PREMIUM_ANNUAL")}
            disabled={!!loading}
            aria-label="Upgrade to Premium Annual"
            className="premium-button premium-button-primary mt-6 min-h-10 disabled:opacity-50"
          >
            {loading === "PREMIUM_ANNUAL" ? "Redirecting…" : "Upgrade — Annual"}
          </button>
          <p className="mt-2 text-xs text-muted-foreground">Same Dodo checkout. Taxes by Merchant of Record.</p>
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-4 rounded-md border border-error bg-error/10 p-3 text-sm">
          {error}
          {error.includes("not configured") && <span> — Set DODO_PRODUCT_MONTHLY_ID/ANNUAL_ID (test mode) to enable checkout. See docs/PHASE9A_REPORT.md §AJ.</span>}
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Need a sign-in first? <Link href="/signin?callbackUrl=/pricing" className="underline">Sign in</Link> — checkout requires your email.
      </p>
    </>
  );
}
