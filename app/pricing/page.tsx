import { LayoutChrome } from "@/components/layout/chrome";
import { MaskLines, Reveal } from "@/components/marketing/motion";
import { PricingClient } from "./pricing-client";
import { pageMeta } from "@/lib/seo";
import { isLivePaymentsEnabled } from "@/lib/payments/live";

export const dynamic = "force-dynamic";

export const metadata = pageMeta("/pricing", {
  title: "Pricing",
  description: "Current access and Premium checkout availability for ZANCTA's local-first tools.",
});

export default function PricingPage() {
  const checkoutLive = isLivePaymentsEnabled();
  return (
    <LayoutChrome showNav={true} showFooter={true}>
      <main>
        <section className="relative overflow-hidden border-b border-border">
          <div aria-hidden className="editorial-grid pointer-events-none absolute inset-x-0 top-0 h-full opacity-35" />
          <div className="relative mx-auto max-w-[80rem] px-5 py-20 md:px-8 md:py-28">
            <p className="eyebrow-path">/pricing</p>
            <MaskLines
              as="h1"
              className="display-serif mt-5 max-w-3xl text-4xl md:text-6xl"
              lines={[<>Start free.</>, <>Upgrade when you&apos;re ready.</>]}
            />
            <Reveal delay={0.2}>
              <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground md:text-lg">
                {checkoutLive
                  ? "Implemented local tools stay in the browser. Premium checkout is live for the listed INR plans."
                  : "The implemented local tools are available within their displayed limits. Paid checkout remains unavailable until its live provider and subscription lifecycle are verified."}
              </p>
            </Reveal>
          </div>
        </section>

        <div className="mx-auto max-w-[80rem] px-5 py-14 md:px-8 md:py-20">
          <PricingClient checkoutLive={checkoutLive} />

          <Reveal className="section-rule mt-16 pt-8">
            <h2 className="eyebrow">Paid access status</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              {checkoutLive
                ? "Premium is purchasable through Dodo Payments. Entitlement is activated only after a verified provider webhook, not by a local grant. Cancel at period end from your account. Refunds and disputes follow the provider."
                : "Premium is not currently purchasable. Before paid access is offered, ZANCTA must verify live product mapping, checkout, webhooks, entitlements, cancellation, refunds, support, and the final commercial terms. This page will show only benefits that are active and verifiable."}
            </p>
          </Reveal>

          <Reveal delay={0.06} className="mt-6 text-xs text-muted-foreground">
            <p>When enabled, checkout is hosted by the configured payment provider. ZANCTA does not store card data. Provider terms, taxes, and refund terms are shown during checkout.</p>
            <p className="mt-1">Prices and availability are confirmed at checkout. A monitored support channel must be published before a paid launch.</p>
          </Reveal>
        </div>
      </main>
    </LayoutChrome>
  );
}
