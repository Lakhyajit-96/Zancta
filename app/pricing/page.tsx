import { LayoutChrome } from "@/components/layout/chrome";
import { MaskLines } from "@/components/marketing/motion";
import { PricingClient } from "./pricing-client";
import { pageMeta } from "@/lib/seo";
import { isLivePaymentsEnabled } from "@/lib/payments/live";

export const dynamic = "force-dynamic";

export const metadata = pageMeta("/pricing", {
  title: "Pricing",
  description: "Free local PDF and image tools. Optional Premium checkout at ₹199/month or ₹999/year currently matches Free tools and limits.",
});

export default function PricingPage() {
  const checkoutLive = isLivePaymentsEnabled();
  return (
    <LayoutChrome showNav={true} showFooter={true}>
      <main>
        <section className="relative overflow-hidden border-b border-border">
          <div className="relative mx-auto max-w-[80rem] px-5 py-16 md:px-8 md:py-20">
            <p className="eyebrow-path">/pricing</p>
            <MaskLines
              as="h1"
              className="display-serif mt-5 max-w-3xl text-4xl md:text-5xl"
              lines={[<>Start free.</>, <>Premium is optional support.</>]}
            />
            <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground md:text-lg">
              Implemented local tools stay in the browser. Free and Premium currently use the same tools and the same limits. Premium is optional financial support for development, plus a reserved ad-free experience if ads are introduced later. Ads are not live today.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-[80rem] px-5 py-14 md:px-8 md:py-16">
          <PricingClient checkoutLive={checkoutLive} />

          <section className="section-rule mt-16 pt-8">
            <h2 className="eyebrow">What you are paying for</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              {checkoutLive
                ? "Checkout can process a payment through Dodo Payments. Entitlement is activated only after a verified provider webhook creates a provider-backed subscription. Cancel at period end from your account. Premium does not currently include higher file or page limits, extra tools, or live ad-free access. There is no monitored support or security channel yet — this is not a complete commercial launch. Refunds and disputes follow the provider."
                : "Premium is not currently purchasable. Before paid access is offered, ZANCTA must verify live product mapping, checkout, webhooks, cancellation, refunds, a monitored support channel, and the final commercial terms."}
            </p>
          </section>

          <p className="mt-6 max-w-2xl text-xs leading-6 text-muted-foreground">
            When checkout is enabled, it is hosted by Dodo Payments. ZANCTA does not store card data. Provider terms, taxes, and refund terms are shown during checkout. Prices are in Indian rupees (INR).
          </p>
        </div>
      </main>
    </LayoutChrome>
  );
}
