import Link from "next/link";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  reassurance,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  reassurance: string;
}) {
  return (
    <main className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden px-6 py-12 md:py-20">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,oklch(0.54_0.19_250/0.18),transparent_35%),linear-gradient(135deg,var(--background),var(--surface))]" />
      <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[0.85fr_1.15fr] md:items-center">
        <section className="max-w-md">
          <Link href="/" className="inline-flex items-center gap-3 text-sm font-semibold tracking-tight">
            <img src="/assets/zancta-brand/logos/compact-mark.svg" alt="ZANCTA" className="h-10 w-10" />
            <span>ZANCTA<span className="text-accent">.</span></span>
          </Link>
          <p className="mt-12 text-xs font-medium tracking-[0.2em] text-accent">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">{title}</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">{description}</p>
          <div className="mt-8 rounded-xl border bg-surface/60 p-4 text-sm text-muted-foreground">
            <span className="mr-2 text-success" aria-hidden>✓</span>{reassurance}
          </div>
        </section>
        <section className="rounded-2xl border bg-surface/80 p-6 shadow-2xl backdrop-blur md:p-8">
          {children}
        </section>
      </div>
    </main>
  );
}
