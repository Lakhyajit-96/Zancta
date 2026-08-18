"use client";

import Link from "next/link";
import { Reveal } from "@/components/marketing/reveal";

export function PremiumPreviewSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <Reveal className="max-w-3xl"><p className="eyebrow">ACCESS</p><h2 className="mt-4 text-3xl font-medium tracking-[-0.04em] md:text-5xl">Start with the tools, not a paywall.</h2><p className="mt-5 text-lg leading-8 text-muted-foreground">Local workflows are available without an account within the limits shown on each tool. Account and Premium availability are presented plainly on the pricing page.</p></Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <Reveal><section className="h-full border border-border bg-surface p-6 md:p-8"><p className="eyebrow">FREE</p><h3 className="mt-8 text-2xl font-medium">Useful from the first file.</h3><ul className="mt-6 space-y-3 text-sm leading-6 text-muted-foreground"><li>Eleven local workflows within displayed limits.</li><li>No account required for local processing.</li><li>Outputs remain generated in the browser.</li></ul><Link href="/tools" className="premium-button premium-button-secondary mt-8">Explore tools <span aria-hidden>↗</span></Link></section></Reveal>
          <Reveal delay={0.08}><section className="h-full border border-accent/35 bg-accent/5 p-6 md:p-8"><p className="eyebrow">PREMIUM</p><h3 className="mt-8 text-2xl font-medium">Availability is explicit.</h3><p className="mt-6 text-sm leading-6 text-muted-foreground">Premium benefits and provider-hosted checkout are only available when live payment configuration has been completed. Pricing never changes the local file-processing boundary.</p><Link href="/pricing" className="premium-button premium-button-primary mt-8">View pricing <span aria-hidden>↗</span></Link></section></Reveal>
        </div>
      </div>
    </section>
  );
}
