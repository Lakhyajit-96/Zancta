import { LayoutChrome } from "@/components/layout/chrome";
import { PricingClient } from "./pricing-client";

export const metadata = {
  title: "Pricing",
  description: "Free local tools forever. Premium: no ads, higher limits, advanced controls. Privacy-first.",
};

export default function PricingPage() {
  return (
    <LayoutChrome showNav={true} showFooter={true}>
      <main>
      {/* ZANCTA Brand Header */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <img 
            src="/assets/zancta-brand/logos/primary-wordmark.svg" 
            alt="ZANCTA" 
            className="mb-8 h-8 w-auto opacity-90"
          />
          <p className="eyebrow">ACCESS / 02</p>
          <h1 className="mt-5 max-w-2xl text-5xl font-medium tracking-[-0.05em] md:text-7xl">Simple, honest pricing.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            All tools run locally — no uploads. Free forever for personal use. Premium adds convenience, not fake limits.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Taxes handled by our Merchant of Record (Dodo Payments) where applicable. Cancel anytime.
          </p>
        </div>
      </section>

      {/* ZANCTA Pricing Banner */}
      <section className="border-b border-border bg-[#0b0b0c] px-5 py-5 md:px-8">
        <img 
          src="/assets/zancta-brand/og-images/zancta-pricing-banner.png" 
          alt="ZANCTA Pricing Plans" 
          className="mx-auto h-auto w-full max-w-7xl border border-border opacity-80"
        />
      </section>

      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">

        <PricingClient />

        <section className="section-rule mt-16 pt-8">
          <h2 className="eyebrow">WHAT PREMIUM INCLUDES</h2>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground list-disc pl-5">
            <li>No advertising on Premium surfaces; any future free-tier slots will be contextual and outside processing</li>
            <li>Higher limits: 100 MB / file, 100 files merge, 500 pages, 15 000 px</li>
            <li>Advanced controls: quality sliders, custom resize, selective EXIF</li>
            <li>Saved preferences & recent metadata (never file bytes)</li>
            <li>Priority support</li>
            <li>Privacy remains local — payment never sees your files</li>
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Free limits: 50 MB / file, 50 files merge, 200 pages, 12 000 px — same tools, no account needed.
          </p>
        </section>

        <section className="mt-6 text-xs text-muted-foreground">
          <p>Billing via Dodo Payments (Merchant of Record) — invoices, VAT/GST and refunds handled by provider. You pay on a provider-hosted checkout. We never store card data.</p>
          <p className="mt-1">Prices shown in INR for India and USD for everyone else. Final charge converted by provider if needed. Need help? Contact support.</p>
        </section>
      </div>
      </main>
    </LayoutChrome>
  );
}
