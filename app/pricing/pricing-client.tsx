"use client";

import Link from "next/link";
import { useState } from "react";
import { StaggerGroup, StaggerItem } from "@/components/marketing/motion";

export function PricingClient() {
  const [annual, setAnnual] = useState(true);

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
              <li className="flex gap-2.5"><span aria-hidden className="text-platinum">✓</span> All implemented local tools</li>
              <li className="flex gap-2.5"><span aria-hidden className="text-platinum">✓</span> No sign-up required</li>
              <li className="flex gap-2.5"><span aria-hidden className="text-platinum">✓</span> Works offline once loaded</li>
              <li className="flex gap-2.5"><span aria-hidden className="text-platinum">✓</span> No watermark, no upload</li>
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
              <span className="text-xs text-warning">Not available yet</span>
            </div>
            <p className="font-display mt-6 text-5xl font-semibold tracking-[-0.02em]">₹199</p>
            <p className="mt-1 text-xs text-muted-foreground">/month</p>
            <ul className="mt-7 space-y-2.5 text-sm leading-6 text-muted-foreground">
              <li className="flex gap-2.5"><span aria-hidden className="text-platinum">✓</span> Everything in Free — same tools, same local processing</li>
              <li className="flex gap-2.5"><span aria-hidden className="text-platinum">✓</span> Reserved ad-free when ads are introduced</li>
              <li className="flex gap-2.5"><span aria-hidden className="text-platinum">✓</span> Supports the product ahead of larger limits</li>
            </ul>
            <button type="button" disabled className="premium-button premium-button-secondary mt-8">
              Not available
            </button>
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
              <li className="flex gap-2.5"><span aria-hidden className="text-platinum">✓</span> Everything in Free — same tools, same local processing</li>
              <li className="flex gap-2.5"><span aria-hidden className="text-platinum">✓</span> Seven months free vs monthly</li>
              <li className="flex gap-2.5"><span aria-hidden className="text-platinum">✓</span> Reserved ad-free when ads are introduced</li>
            </ul>
            <button type="button" disabled className="premium-button premium-button-secondary mt-8">
              Not available
            </button>
          </section>
        </StaggerItem>
      </StaggerGroup>

      <p className="mt-8 text-center text-xs text-muted-foreground">Prices reflect the configured provider products; final amount and currency are confirmed at checkout. Premium currently includes the same local tools as Free plus a reserved ad-free experience once ads launch; higher limits are not part of Premium yet. Premium checkout is not available at the moment.</p>
    </div>
  );
}
