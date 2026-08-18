import Link from "next/link";

export function PricingClient() {
  return (
    <div className="mt-10 grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3">
      <section className="flex flex-col bg-surface p-6 md:p-8">
        <div className="flex items-baseline justify-between"><h3 className="text-sm font-medium tracking-wide">Free</h3><span className="text-xs text-muted-foreground">No account needed</span></div>
        <p className="mt-3 text-[28px] font-semibold leading-none">Available now</p>
        <ul className="mt-5 space-y-1.5 text-sm leading-relaxed text-muted-foreground"><li>Eleven local workflows within displayed limits</li><li>Up to 50 MB per file where shown</li><li>No account required for local processing</li></ul>
        <Link href="/tools" className="premium-button premium-button-secondary mt-6">Use tools <span aria-hidden>↗</span></Link>
      </section>
      <section className="flex flex-col bg-elevated p-6 md:p-8">
        <div className="flex items-baseline justify-between"><h3 className="text-sm font-medium">Premium — Monthly</h3><span className="text-xs text-warning">Not available yet</span></div>
        <p className="mt-3 text-[28px] font-semibold leading-none">Checkout pending</p>
        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">Monthly purchase is not offered until the live payment provider, product mapping, entitlements, cancellation, and customer support path have been verified end to end.</p>
        <button type="button" disabled className="premium-button premium-button-primary mt-6">Monthly checkout unavailable</button>
      </section>
      <section className="relative flex flex-col bg-surface p-6 md:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-accent/60" aria-hidden />
        <div className="flex items-baseline justify-between"><h3 className="text-sm font-medium">Premium — Annual</h3><span className="text-xs text-warning">Not available yet</span></div>
        <p className="mt-3 text-[28px] font-semibold leading-none">Checkout pending</p>
        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">Annual purchase is not offered until the same live billing and subscription lifecycle checks have been completed.</p>
        <button type="button" disabled className="premium-button premium-button-primary mt-6">Annual checkout unavailable</button>
      </section>
    </div>
  );
}
