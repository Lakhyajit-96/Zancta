import { Navigation, Footer } from "@/components/marketing/nav";

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
      <main className="relative mx-auto max-w-6xl overflow-hidden px-5 py-16 md:px-8 md:py-24">
        <div aria-hidden className="editorial-grid pointer-events-none absolute inset-x-0 top-0 h-80 opacity-40" />
        <div className="relative max-w-4xl">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="mt-5 max-w-3xl text-4xl font-medium tracking-[-0.04em] md:text-6xl">{title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{intro}</p>
        </div>
        <div className="relative mt-16 grid max-w-5xl gap-12 border-t border-border pt-12 md:grid-cols-[0.7fr_1.3fr]">{children}</div>
      </main>
      <Footer />
    </>
  );
}

export function ContentSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground">{title}</h2>
      <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}
