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
      <main className="mx-auto max-w-4xl px-6 py-12 md:py-20">
        {eyebrow && <p className="text-xs font-medium tracking-[0.2em] text-accent">{eyebrow}</p>}
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">{title}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{intro}</p>
        <div className="mt-12 space-y-10">{children}</div>
      </main>
      <Footer />
    </>
  );
}

export function ContentSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}
