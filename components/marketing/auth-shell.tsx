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
    <main className="relative isolate min-h-[calc(100vh-4.5rem)] overflow-hidden px-5 py-12 md:px-8 md:py-20">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(233,168,184,0.12),transparent_30rem),linear-gradient(135deg,var(--background),var(--surface))]" />
      <div aria-hidden className="editorial-grid pointer-events-none absolute inset-0 -z-10 opacity-30" />
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[0.85fr_1.15fr] md:items-center">
        <section className="max-w-md">
          <Link href="/" className="inline-flex items-center gap-3 text-sm font-semibold tracking-tight">
            <img src="/assets/zancta-brand/logos/compact-mark.svg" alt="ZANCTA" className="h-10 w-10" />
            <span className="tracking-[0.18em]">ZANCTA<span className="text-accent">/</span></span>
          </Link>
          <p className="eyebrow mt-12">{eyebrow}</p>
          <h1 className="mt-5 text-4xl font-medium tracking-[-0.04em] md:text-6xl">{title}</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">{description}</p>
          <div className="mt-8 border-l border-accent/60 bg-surface/50 p-4 text-sm text-muted-foreground">
            <span className="mr-2 text-success" aria-hidden>✓</span>{reassurance}
          </div>
        </section>
        <section className="border border-border-strong bg-surface/90 p-6 shadow-2xl backdrop-blur md:p-10">
          {children}
        </section>
      </div>
    </main>
  );
}
