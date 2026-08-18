import Link from "next/link";
import { CornerTicks, MaskLines, Reveal } from "@/components/marketing/motion";

export function PremiumPreviewSection() {
  return (
    <section className="relative overflow-hidden border-t border-border">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-64 perspective-floor opacity-30" />
      <div className="relative mx-auto grid max-w-[80rem] gap-12 px-5 py-20 md:grid-cols-[7fr_5fr] md:items-center md:px-8 md:py-28">
        <div>
          <p className="eyebrow">Pricing</p>
          <MaskLines
            as="h2"
            className="display-serif mt-5 text-4xl md:text-6xl"
            lines={[<>Start free.</>, <>Upgrade when you&apos;re ready.</>]}
          />
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground">
              Every implemented local tool is free to use right now. Premium plans are designed — monthly and annual —
              and will open only once live checkout, entitlements, and support are verified end to end.
            </p>
          </Reveal>
        </div>
        <Reveal delay={0.25} className="aperture card-surface relative overflow-hidden p-6 md:p-8">
          <CornerTicks />
          <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-accent/60" />
          <ul className="space-y-4 text-sm text-muted-foreground">
            <li className="flex gap-3"><span aria-hidden className="font-mono text-xs leading-6 text-platinum">01</span> Free: all implemented local workflows, no account required.</li>
            <li className="flex gap-3"><span aria-hidden className="font-mono text-xs leading-6 text-platinum">02</span> Premium monthly and annual tiers are published on the pricing page.</li>
            <li className="flex gap-3"><span aria-hidden className="font-mono text-xs leading-6 text-platinum">03</span> Premium checkout is not available at the moment — we say so plainly.</li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/pricing" className="premium-button premium-button-primary">
              See pricing <span aria-hidden>→</span>
            </Link>
            <Link href="/tools" className="premium-button premium-button-ghost">
              Open a tool
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
