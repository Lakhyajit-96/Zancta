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
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center">
          <img 
            src="/assets/zancta-brand/logos/primary-wordmark.svg" 
            alt="ZANCTA" 
            className="h-10 w-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-semibold tracking-tight">Simple, honest pricing</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            All tools run locally — no uploads. Free forever for personal use. Premium adds convenience, not fake limits.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Taxes handled by our Merchant of Record (Dodo Payments) where applicable. Cancel anytime.
          </p>
        </div>
      </section>

      {/* ZANCTA Pricing Banner */}
      <section className="bg-[#0A0A0A]">
        <img 
          src="/assets/zancta-brand/og-images/zancta-pricing-banner.png" 
          alt="ZANCTA Pricing Plans" 
          className="w-full h-auto rounded-xl border"
        />
      </section>

      <div className="mx-auto max-w-6xl px-6 py-12">

        <PricingClient />

        <section className="mt-12 rounded-xl border bg-surface p-6">
          <h2 className="text-sm font-medium">What Premium includes</h2>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground list-disc pl-5">
            <li>No ads (free shows only contextual, outside the tool — never inside processing)</li>
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
