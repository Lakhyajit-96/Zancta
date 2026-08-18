import Link from "next/link";
import { Navigation, Footer } from "@/components/marketing/nav";
import { Reveal } from "@/components/marketing/reveal";

export const metadata = {
  title: "Features",
  description: "Explore ZANCTA's local-first PDF, image, OCR, and text-extraction tools.",
};

const workflows = [
  {
    number: "01",
    title: "PDF workflows",
    description: "Merge, split, compress, render pages, create PDFs from images, and extract existing embedded text from text-based PDFs.",
    tools: ["Merge PDF", "Split PDF", "Compress PDF", "PDF to Images", "Images to PDF", "PDF Text Extractor"],
    href: "/tools/pdf-text-extractor",
  },
  {
    number: "02",
    title: "Image workflows",
    description: "Compress, convert, resize, clean common metadata, and extract English text from supported images without an OCR API.",
    tools: ["Compress Image", "Convert Image", "Resize Image", "EXIF Cleaner", "Image OCR"],
    href: "/tools/ocr",
  },
];

export default function FeaturesPage() {
  return (
    <>
      <Navigation />
      <main>
        <section className="relative overflow-hidden border-b border-border">
          <div aria-hidden className="editorial-grid pointer-events-none absolute inset-x-0 top-0 h-full opacity-35" />
          <div className="relative mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
            <Reveal className="max-w-4xl">
              <p className="eyebrow">PRODUCT FEATURES</p>
              <h1 className="mt-5 max-w-3xl text-4xl font-medium tracking-[-0.045em] md:text-6xl">Private tools for the files you actually work with.</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">ZANCTA makes the boundary visible: choose a supported file, process it in the browser, review the result, and download it without sending file bytes to a processing API.</p>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <Reveal className="grid gap-8 border-y border-border py-8 md:grid-cols-[0.8fr_1.2fr] md:items-center">
            <div>
              <p className="eyebrow">LOCAL-FIRST PROCESSING</p>
              <h2 className="mt-4 text-3xl font-medium tracking-[-0.035em]">The file path stays short.</h2>
              <p className="mt-4 max-w-md leading-7 text-muted-foreground">For implemented local tools, processing begins after you select a file and remains in this browser session. The page still loads normal application assets; your selected document is not uploaded for processing.</p>
            </div>
            <ol className="grid grid-cols-2 gap-px overflow-hidden border border-border bg-border sm:grid-cols-4" aria-label="Local processing flow">
              {["Your file", "Browser", "Local processing", "Your output"].map((step, index) => <li key={step} className="bg-surface p-4 sm:p-5"><span className="font-mono text-xs text-accent">0{index + 1}</span><p className="mt-6 text-sm font-medium">{step}</p></li>)}
            </ol>
          </Reveal>

          <div className="mt-16 grid gap-5 lg:grid-cols-2">
            {workflows.map((workflow, index) => <Reveal key={workflow.title} delay={index * 0.08} className="h-full">
              <article className="flex h-full flex-col border border-border-strong bg-surface p-6 transition-colors hover:border-accent/45 md:p-8">
                <div className="flex items-baseline justify-between gap-4"><span className="font-mono text-xs text-accent">{workflow.number}</span><Link href={workflow.href} className="text-xs text-muted-foreground transition-colors hover:text-foreground">Open a tool ↗</Link></div>
                <h2 className="mt-10 text-2xl font-medium tracking-[-0.03em]">{workflow.title}</h2>
                <p className="mt-4 max-w-xl leading-7 text-muted-foreground">{workflow.description}</p>
                <ul className="mt-8 flex flex-wrap gap-2">{workflow.tools.map((tool) => <li key={tool} className="border border-border bg-elevated px-2.5 py-1 text-xs text-muted-foreground">{tool}</li>)}</ul>
              </article>
            </Reveal>)}
          </div>

          <div className="mt-16 grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
            <Reveal><section className="border border-border bg-elevated p-6 md:p-8"><p className="eyebrow">PRIVACY BOUNDARY</p><h2 className="mt-4 text-2xl font-medium tracking-[-0.03em]">A specific promise, not a vague one.</h2><p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Supported local operations read the selected bytes in the browser and do not send file bytes to ZANCTA for processing. Background removal remains deferred rather than using an undisclosed cloud fallback.</p></section></Reveal>
            <Reveal delay={0.08}><section className="border border-border bg-surface p-6 md:p-8"><p className="eyebrow">ACCOUNT ACCESS</p><h2 className="mt-4 text-2xl font-medium tracking-[-0.03em]">Useful without an account.</h2><p className="mt-4 leading-7 text-muted-foreground">Local tools are available within their displayed limits without sign-in. Accounts are used for authentication and entitlement management; payment availability depends on live provider configuration.</p></section></Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
