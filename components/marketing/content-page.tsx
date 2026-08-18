import { Footer, Navigation } from "@/components/marketing/nav";
import { Reveal } from "@/components/marketing/reveal";

export function ContentPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Navigation />
      <main className="relative overflow-hidden">
        <div aria-hidden className="editorial-grid pointer-events-none absolute inset-x-0 top-0 h-[32rem] opacity-35" />
        <section className="relative mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <Reveal className="grid gap-10 border-b border-border pb-12 md:grid-cols-[5fr_7fr] md:items-end">
            <div>
              {eyebrow && <p className="eyebrow">{eyebrow}</p>}
              <h1 className="mt-5 max-w-2xl text-4xl font-medium tracking-[-0.045em] md:text-6xl">{title}</h1>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground md:pb-1">{intro}</p>
          </Reveal>
          <Reveal delay={0.06} className="mt-12 grid gap-x-16 gap-y-12 md:grid-cols-2">
            {children}
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}

export function ContentSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`border-t border-border pt-5 ${className ?? ""}`}>
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground">{title}</h2>
      <div className="mt-4 max-w-xl space-y-3 text-sm leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}
