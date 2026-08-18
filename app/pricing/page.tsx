import { LayoutChrome } from "@/components/layout/chrome";
import { PricingClient } from "./pricing-client";

export const metadata = {
  title: "Pricing",
  description: "Current access and Premium checkout availability for ZANCTA's local-first tools.",
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
            The implemented local tools are available within their displayed limits. Paid checkout remains unavailable until its live provider and subscription lifecycle are verified.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Checkout availability, taxes, and cancellation terms are shown only when a live payment provider is configured.
          </p>
        </div>
      </section>


      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">

        <PricingClient />

        <section className="section-rule mt-16 pt-8">
          <h2 className="eyebrow">PAID ACCESS STATUS</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">Premium is not currently purchasable. Before paid access is offered, ZANCTA must verify live product mapping, checkout, webhooks, entitlements, cancellation, refunds, support, and the final commercial terms. This page will show only benefits that are active and verifiable.</p>
        </section>

        <section className="mt-6 text-xs text-muted-foreground">
          <p>When enabled, checkout is hosted by the configured payment provider. ZANCTA does not store card data. Provider terms, taxes, and refund terms are shown during checkout.</p>
          <p className="mt-1">Prices and availability are confirmed at checkout. A monitored support channel must be published before a paid launch.</p>
        </section>
      </div>
      </main>
    </LayoutChrome>
  );
}
