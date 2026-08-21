import { Navigation, Footer } from "@/components/marketing/nav";
import { MaskLines } from "@/components/marketing/motion";
import { LaptopVisual } from "@/components/marketing/visuals";
import Link from "next/link";

import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/how-it-works", {
  title: "How it works",
  description: "How ZANCTA validates, processes, and returns supported files in the browser.",
});

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
          <div className="relative mx-auto max-w-[80rem] px-5 py-14 md:px-8 md:py-16">
            <p className="eyebrow-path">/how-it-works</p>
            <MaskLines
              as="h1"
              className="display-serif mt-5 max-w-4xl text-4xl md:text-5xl"
              lines={[<>Four steps.</>, <>The file stays in this tab.</>]}
            />
            <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">You can see what a tool accepts, what happens next, and where processing occurs before you start.</p>
          </div>
        </section>

        <section className="mx-auto max-w-[80rem] px-5 py-14 md:px-8 md:py-16">
          <div className="card-surface relative mb-14 overflow-hidden">
            <LaptopVisual />
          </div>
          <ol className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2">
            {steps.map(([number, title, description]) => (
              <li key={number} className="bg-surface">
                <div className="min-h-56 p-6 md:p-8">
                  <span className="grid h-10 w-10 place-items-center rounded-full border border-accent/50 bg-accent/10 font-mono text-xs text-accent">{number}</span>
                  <h2 className="mt-8 text-2xl font-medium tracking-[-0.03em]">{title}</h2>
                  <p className="mt-4 max-w-md leading-7 text-muted-foreground">{description}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-16 border-y border-border py-10">
            <p className="max-w-3xl leading-7 text-muted-foreground">
              Local means an implemented supported operation runs in the browser using the selected file. It does not mean the entire session is offline. The privacy boundary, OCR, and PDF-text limits are documented in the{" "}
              <Link href="/guides/local-processing" className="underline underline-offset-4 hover:text-foreground">
                local processing guide
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
