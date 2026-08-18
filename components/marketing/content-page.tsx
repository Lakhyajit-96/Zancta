import { Footer, Navigation } from "@/components/marketing/nav";
import { MaskLines, Reveal } from "@/components/marketing/motion";

export function ContentPage({
  eyebrow,
  title,
  intro,
  visual,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro: string;
  visual?: React.ReactNode;
  children: React.ReactNode;
}) {
  const isPath = eyebrow?.startsWith("/");

  return (
    <>
      <Navigation />
      <main className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[26rem] [background-image:radial-gradient(ellipse_64%_52%_at_50%_0%,rgba(201,196,192,0.055),transparent_72%)]" />
        <section className="relative mx-auto max-w-[80rem] px-5 py-16 md:px-8 md:py-24">
          <header className="grid gap-10 border-b border-border pb-12 lg:grid-cols-[7fr_5fr] lg:items-end">
            <div>
              {eyebrow && <p className={isPath ? "eyebrow-path" : "eyebrow"}>{eyebrow}</p>}
              <MaskLines as="h1" className="display-serif mt-5 max-w-3xl text-4xl md:text-6xl" lines={[title]} />
            </div>
            <p className="max-w-xl text-base leading-8 text-muted-foreground lg:pb-1">{intro}</p>
          </header>

          {visual && (
            <Reveal className="mt-12">
              <div className="card-surface relative overflow-hidden p-6 md:p-10">{visual}</div>
            </Reveal>
          )}

          <Reveal delay={0.06} className="content-sections mt-12 grid gap-x-16 gap-y-12 md:grid-cols-2">
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
    <section className={`border-t border-border pt-6 ${className ?? ""}`}>
      <h2 className="text-base font-semibold tracking-[-0.01em] text-foreground">{title}</h2>
      <div className="mt-4 max-w-2xl space-y-3 text-sm leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}
