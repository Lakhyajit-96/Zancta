import Link from "next/link";
import { Footer, Navigation } from "@/components/marketing/nav";
import { MaskLines, Reveal } from "@/components/marketing/motion";

import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/docs", {
  title: "Docs",
  description: "Public documentation for ZANCTA's supported local PDF, image, OCR, and text-extraction workflows.",
});

const sections = [
  {
    id: "collection",
    title: "Tool collection",
    body: <>The <Link href="/tools" className="text-foreground underline decoration-border-strong underline-offset-4 transition-colors hover:decoration-accent">tool collection</Link> is the current catalog. PDF workflows cover merge, split, compression, page rendering, image-to-PDF, and embedded-text extraction. Image workflows cover compression, conversion, resizing, metadata cleaning, and local English OCR. For privacy, OCR limits, and PDF text vs scans, see <Link href="/guides/local-processing" className="text-foreground underline decoration-border-strong underline-offset-4 transition-colors hover:decoration-accent">Local processing</Link>.</>,
  },
  {
    id: "inputs",
    title: "Inputs and limits",
    body: <>Every tool page shows its accepted file type, maximum size, and batch limit. Most local PDF and image workflows use a 50 MB per-file boundary. OCR uses a 20 MB image boundary and supports JPG, PNG, and WebP. The displayed tool limit always takes precedence.</>,
  },
  {
    id: "processing",
    title: "Processing and output",
    body: <>Implemented local tools process selected file bytes in the browser and generate outputs on-device. A tool may provide a download, copy action, preview, or all three depending on its purpose. Progress is tied to reported engine work where that is available.</>,
  },
  {
    id: "text",
    title: "OCR and PDF text",
    body: <>Image OCR uses bundled English assets in a browser Worker. PDF Text Extractor reads embedded text page by page from text-native PDFs. It does not turn scanned PDFs into text and reports an honest no-text state for image-only documents.</>,
  },
  {
    id: "accounts",
    title: "Accounts and subscriptions",
    body: <>Local tool use is available without an account. Accounts support authentication and entitlement records. Premium and payment behavior are presented on <Link href="/pricing" className="text-foreground underline decoration-border-strong underline-offset-4 transition-colors hover:decoration-accent">Pricing</Link> only when provider configuration makes those actions available.</>,
  },
  {
    id: "limitations",
    title: "Known limitations",
    body: <>Browser APIs, memory limits, protected PDFs, malformed files, and unsupported formats can prevent completion. Background removal is deferred while local model licensing is evaluated. See <Link href="/help" className="text-foreground underline decoration-border-strong underline-offset-4 transition-colors hover:decoration-accent">Help</Link> and <Link href="/faq" className="text-foreground underline decoration-border-strong underline-offset-4 transition-colors hover:decoration-accent">FAQ</Link> for practical recovery guidance.</>,
  },
] as const;

export default function DocsPage() {
  return (
    <>
      <Navigation />
      <main className="relative overflow-hidden">
        <div aria-hidden className="editorial-grid pointer-events-none absolute inset-x-0 top-0 h-[34rem] opacity-35" />
        <section className="relative mx-auto max-w-[80rem] px-5 py-16 md:px-8 md:py-24">
          <header className="grid gap-10 border-b border-border pb-12 lg:grid-cols-[7fr_5fr] lg:items-end">
            <div>
              <p className="eyebrow-path">/docs</p>
              <MaskLines as="h1" className="display-serif mt-5 max-w-2xl text-4xl md:text-6xl" lines={[<>ZANCTA documentation</>]} />
            </div>
            <p className="max-w-xl text-base leading-8 text-muted-foreground lg:pb-1">Everything you need to know: what a tool accepts, what it produces, and how supported local processing behaves — written for the product you can use today.</p>
          </header>

          <div className="mt-12 grid gap-12 xl:grid-cols-[3fr_6fr_3fr] xl:gap-16">
            <Reveal className="xl:sticky xl:top-28 xl:self-start">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">In this guide</p>
              <nav className="mt-5 border-l border-border pl-4" aria-label="Documentation sections">
                <ol className="space-y-3 text-sm text-muted-foreground">
                  {sections.map((section, index) => <li key={section.id}><a className="transition-colors hover:text-foreground" href={`#${section.id}`}><span className="mr-3 font-mono text-xs text-accent">{String(index + 1).padStart(2, "0")}</span>{section.title}</a></li>)}
                </ol>
              </nav>
            </Reveal>

            <div className="space-y-14">
              {sections.map((section, index) => (
                <Reveal key={section.id} delay={Math.min(index * 0.04, 0.16)}>
                  <section id={section.id} className="scroll-mt-28 border-t border-border pt-5">
                    <p className="font-mono text-xs text-accent">{String(index + 1).padStart(2, "0")}</p>
                    <h2 className="mt-4 text-2xl font-medium tracking-[-0.03em]">{section.title}</h2>
                    <p className="mt-4 max-w-2xl leading-8 text-muted-foreground">{section.body}</p>
                  </section>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.08} className="xl:sticky xl:top-28 xl:self-start">
              <aside className="border border-border bg-surface p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">At a glance</p>
                <dl className="mt-6 space-y-5 text-sm">
                  <div><dt className="text-muted-foreground">Processing</dt><dd className="mt-1 leading-6 text-foreground">Implemented supported workflows run in the browser.</dd></div>
                  <div><dt className="text-muted-foreground">Image input</dt><dd className="mt-1 leading-6 text-foreground">JPG, PNG, and WebP for current image tools.</dd></div>
                  <div><dt className="text-muted-foreground">Text extraction</dt><dd className="mt-1 leading-6 text-foreground">OCR is English-only; PDF text extraction requires embedded text.</dd></div>
                </dl>
                <div className="mt-8 border-t border-border pt-5 text-sm leading-7 text-muted-foreground">
                  Need practical recovery steps? Visit <Link href="/help" className="text-foreground underline decoration-border-strong underline-offset-4 transition-colors hover:decoration-accent">Help</Link>.
                </div>
              </aside>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
