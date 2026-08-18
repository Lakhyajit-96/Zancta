import { Navigation, Footer } from "@/components/marketing/nav";
import { Reveal } from "@/components/marketing/reveal";

export const metadata = {
  title: "How it works",
  description: "How ZANCTA validates, processes, and returns supported files in the browser.",
  alternates: { canonical: "/how-it-works" },
};

const steps = [
  ["01", "Select", "Open a specific PDF or image tool, then review its supported inputs, limits, and output behavior before you choose a file."],
  ["02", "Validate", "The browser checks the selected file type, size, count, and tool-specific constraints before processing starts."],
  ["03", "Process locally", "Implemented local engines read the selected bytes in the browser. Progress reflects actual work where the engine can report it."],
  ["04", "Review and download", "Inspect the result, copy or download it where supported, then clear the workspace or process another file."],
] as const;

export default function HowItWorksPage() {
  return (
    <>
      <Navigation />
      <main>
        <section className="relative overflow-hidden border-b border-border">
          <div aria-hidden className="editorial-grid pointer-events-none absolute inset-x-0 top-0 h-full opacity-35" />
          <div className="relative mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
            <Reveal className="max-w-4xl"><p className="eyebrow">HOW IT WORKS</p><h1 className="mt-5 max-w-3xl text-4xl font-medium tracking-[-0.045em] md:text-6xl">From selected file to local output.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">The workflow is intentionally legible. You can see what a tool accepts, what happens next, and where processing occurs before you start.</p></Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <ol className="relative grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2" aria-label="ZANCTA file workflow">
            {steps.map(([number, title, description], index) => <Reveal key={number} delay={index * 0.06} className="bg-surface"><li className="min-h-64 p-6 md:p-8"><span className="font-mono text-xs text-accent">{number}</span><h2 className="mt-12 text-2xl font-medium tracking-[-0.03em]">{title}</h2><p className="mt-4 max-w-md leading-7 text-muted-foreground">{description}</p></li></Reveal>)}
          </ol>

          <Reveal className="mt-16 border-y border-border py-10">
            <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-center"><div><p className="eyebrow">THE LOCAL BOUNDARY</p><h2 className="mt-4 text-3xl font-medium tracking-[-0.035em]">Your file does not need a detour.</h2></div><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center text-xs text-muted-foreground sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]"><span className="border border-border bg-elevated p-3 text-foreground">Your file</span><span aria-hidden>↓</span><span className="border border-accent/40 bg-accent/10 p-3 text-foreground">Your browser</span><span aria-hidden>↓</span><span className="border border-border bg-elevated p-3 text-foreground">Local processing</span><span aria-hidden>↓</span><span className="border border-border bg-elevated p-3 text-foreground">Your output</span></div></div>
            <p className="mt-8 max-w-3xl leading-7 text-muted-foreground">Local means an implemented supported operation runs in the browser using the selected file. It does not mean the entire session is offline, and it does not apply to future cloud features unless they are explicitly introduced with an opt-in.</p>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
