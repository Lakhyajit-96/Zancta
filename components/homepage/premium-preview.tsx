import Link from "next/link";
import { MaskLines } from "@/components/marketing/motion";
import { isLivePaymentsEnabled } from "@/lib/payments/live";

export function PremiumPreviewSection() {
  const checkoutLive = isLivePaymentsEnabled();
  return (
    <section className="relative overflow-hidden border-t border-border">
      <div className="relative mx-auto grid max-w-[80rem] gap-10 px-5 py-16 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-center md:px-8 md:py-20">
        <div>
          <p className="eyebrow">Pricing</p>
          <MaskLines
            as="h2"
            className="display-serif mt-5 text-4xl md:text-5xl"
            lines={[<>Start free.</>, <>Premium is optional support.</>]}
          />
          <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground">
            Every implemented local tool is free, within the limits shown on each tool. Premium currently matches Free tool access and limits. It is optional financial support for the product, plus a reserved ad-free experience if ads are introduced later — ads are not live today.
            {checkoutLive
              ? " Checkout can process a payment. Billing questions: billing@zancta.tech."
              : " Premium checkout is not available at the moment."}
          </p>
        </div>
        <div className="card-surface p-6 md:p-8">
          <ul className="space-y-4 text-sm text-muted-foreground">
            <li className="flex gap-3"><span aria-hidden className="font-mono text-xs leading-6 text-platinum">01</span> Free: all implemented local workflows, no account required.</li>
            <li className="flex gap-3"><span aria-hidden className="font-mono text-xs leading-6 text-platinum">02</span> Premium uses the same tools and the same limits as Free.</li>
            <li className="flex gap-3"><span aria-hidden className="font-mono text-xs leading-6 text-platinum">03</span>
              {checkoutLive
                ? "Payment checkout exists. Support, privacy, security, and billing mailboxes are listed on Contact."
                : "Premium checkout is not available at the moment — we say so plainly."}
            </li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/tools" className="premium-button premium-button-primary">
              Open a tool <span aria-hidden>→</span>
            </Link>
            <Link href="/pricing" className="premium-button premium-button-ghost">
              See pricing
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
