"use client";

import Link from "next/link";
import { useState } from "react";
import { StaggerGroup, StaggerItem } from "@/components/marketing/motion";

import { FREE_BENEFITS, PREMIUM_BENEFITS } from "@/lib/payments/premium-contract";

type PlanId = "PREMIUM_MONTHLY" | "PREMIUM_ANNUAL";

export function PricingClient({ checkoutLive }: { checkoutLive: boolean }) {
  const [annual, setAnnual] = useState(true);
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [error, setError] = useState("");

  async function startCheckout(planId: PlanId) {
    setError("");
    setBusy(planId);
    const res = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ planId, currency: "INR" }),
    });
    const data = await res.json().catch(() => ({})) as { checkoutUrl?: string; error?: string };
    if (res.status === 401) {
      window.location.href = `/signin?callbackUrl=${encodeURIComponent("/pricing")}`;
      return;
    }
    if (!res.ok || !data.checkoutUrl) {
      setError(data.error || "Checkout is unavailable.");
      setBusy(null);
      return;
    }
    window.location.href = data.checkoutUrl;
  }

  return (
    <div>
      <div className="flex items-center justify-center gap-1 rounded-lg border border-border-strong bg-surface p-1 text-xs w-fit mx-auto" role="group" aria-label="Billing period">
        <button
          type="button"
          aria-pressed={!annual}
          onClick={() => setAnnual(false)}
          className={`rounded-md px-4 py-2 font-medium transition-colors ${!annual ? "bg-elevated text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Monthly
        </button>
        <button
          type="button"
          aria-pressed={annual}
          onClick={() => setAnnual(true)}
          className={`rounded-md px-4 py-2 font-medium transition-colors ${annual ? "bg-elevated text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Annual <span className="ml-1 text-accent">Save 58%</span>
        </button>
      </div>

      <StaggerGroup className="mt-10 grid gap-6 lg:grid-cols-3">
        <StaggerItem className="h-full">
          <section className="card-surface flex h-full flex-col p-6 md:p-8">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold">Free</h3>
              <span className="text-xs text-muted-foreground">No account needed</span>
            </div>
            <p className="font-display mt-6 text-5xl font-semibold tracking-[-0.02em]">$0</p>
            <p className="mt-1 text-xs text-muted-foreground">forever</p>
            <ul className="mt-7 space-y-2.5 text-sm leading-6 text-muted-foreground">
              {FREE_BENEFITS.map((item) => (
                <li key={item} className="flex gap-2.5"><span aria-hidden className="text-platinum">✓</span> {item}</li>
              ))}
            </ul>
            <Link href="/tools" className="premium-button premium-button-primary mt-8">
              Get started <span aria-hidden>→</span>
            </Link>
          </section>
        </StaggerItem>

        <StaggerItem className="h-full">
          <section
            className={`card-surface flex h-full flex-col p-6 transition-shadow md:p-8 ${!annual ? "border-accent/50 shadow-[0_0_44px_rgba(232,160,180,0.12)]" : ""}`}
          >
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold">Premium Monthly</h3>
              {checkoutLive ? (
                <span className="text-xs text-muted-foreground">₹199 INR / month</span>
              ) : (
                <span className="text-xs text-warning">Not available yet</span>
              )}
            </div>
            <p className="font-display mt-6 text-5xl font-semibold tracking-[-0.02em]">₹199</p>
            <p className="mt-1 text-xs text-muted-foreground">/month</p>
            <ul className="mt-7 space-y-2.5 text-sm leading-6 text-muted-foreground">
              {PREMIUM_BENEFITS.map((item) => (
                <li key={item} className="flex gap-2.5"><span aria-hidden className="text-platinum">✓</span> {item}</li>
              ))}
            </ul>
            {checkoutLive ? (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => startCheckout("PREMIUM_MONTHLY")}
                className="premium-button premium-button-secondary mt-8"
              >
                {busy === "PREMIUM_MONTHLY" ? "Redirecting…" : "Subscribe monthly"}
              </button>
            ) : (
              <button type="button" disabled className="premium-button premium-button-secondary mt-8">
                Not available
              </button>
            )}
          </section>
        </StaggerItem>

        <StaggerItem className="h-full">
          <section
            className={`card-surface relative flex h-full flex-col overflow-hidden p-6 md:p-8 ${annual ? "border-accent/50 shadow-[0_0_44px_rgba(232,160,180,0.12)]" : ""}`}
          >
            <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-accent/70" />
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold">Premium Annual</h3>
              <span className="rounded-full border border-accent/50 bg-accent/10 px-2.5 py-0.5 text-[0.65rem] font-medium text-accent">Best value</span>
            </div>
            <p className="font-display mt-6 text-5xl font-semibold tracking-[-0.02em]">₹999</p>
            <p className="mt-1 text-xs text-muted-foreground">/year</p>
            <ul className="mt-7 space-y-2.5 text-sm leading-6 text-muted-foreground">
              {PREMIUM_BENEFITS.map((item) => (
                <li key={`annual-${item}`} className="flex gap-2.5"><span aria-hidden className="text-platinum">✓</span> {item}</li>
              ))}
              <li className="flex gap-2.5"><span aria-hidden className="text-platinum">✓</span> Seven months free vs monthly at the listed INR prices</li>
            </ul>
            {checkoutLive ? (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => startCheckout("PREMIUM_ANNUAL")}
                className="premium-button premium-button-primary mt-8"
              >
                {busy === "PREMIUM_ANNUAL" ? "Redirecting…" : "Subscribe annually"}
              </button>
            ) : (
              <button type="button" disabled className="premium-button premium-button-secondary mt-8">
                Not available
              </button>
            )}
          </section>
        </StaggerItem>
      </StaggerGroup>

      {error && <p role="alert" className="mt-6 text-center text-sm text-error">{error}</p>}

      <p className="mt-8 text-center text-xs text-muted-foreground">
        {checkoutLive
          ? "Checkout is hosted by Dodo Payments. ZANCTA does not store card data. The charge shown at checkout is authoritative. Premium currently includes the same local tools and the same limits as Free, plus a reserved ad-free experience if ads launch later."
          : "Prices reflect the configured provider products; final amount and currency are confirmed at checkout. Premium currently includes the same local tools and the same limits as Free, plus a reserved ad-free experience if ads launch later. Premium checkout is not available at the moment."}
      </p>
    </div>
  );
}
