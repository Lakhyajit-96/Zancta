import { FAQAccordion } from "@/components/marketing/faq-accordion";
import { Footer, Navigation } from "@/components/marketing/nav";
import { MaskLines, Reveal } from "@/components/marketing/motion";

import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/faq", {
  title: "FAQ",
  description: "Practical answers about ZANCTA tools, local processing, accounts, limits, and billing availability.",
});

const faqs = [
  ["Does ZANCTA upload my files?", "For implemented local tools, selected file bytes are processed in the browser and are not uploaded to ZANCTA for processing. The page itself still makes normal requests for application code and assets."],
  ["Where does processing happen?", "Supported PDF, image, OCR, and PDF text-extraction workflows run in the browser. Individual tool pages explain their own processing boundaries and limitations."],
  ["What file types are supported?", "Each tool lists accepted formats before selection. Current image workflows support JPG, PNG, and WebP; tool-specific PDF workflows accept PDF. HEIC and SVG are not supported by the current image tools."],
  ["What are the file-size limits?", "Limits are shown on each tool page. Most local PDF and image workflows currently use a 50 MB per-file limit; OCR has a 20 MB image limit. Batch limits vary by tool."],
  ["Does OCR run locally?", "Yes. The implemented OCR workflow uses bundled English assets in a browser Worker. The selected image and recognized text are not sent to an OCR API."],
  ["Can scanned PDFs be converted to text?", "No. PDF Text Extractor reads existing embedded text from text-native PDFs. It clearly reports when a PDF is image-only or scanned instead of fabricating text."],
  ["What happens if processing fails?", "The tool shows a readable error without producing a fake result. Check the format, file size, page count, browser memory, and whether the PDF is password-protected or malformed."],
  ["Can I use ZANCTA without an account?", "Yes. The implemented local workflows do not require sign-in. Accounts are used for authentication and entitlement management."],
  ["What does Premium provide?", "Premium currently includes the same implemented local tools and the same limits as Free. It also reserves an ad-free experience if ads are introduced later. Higher file or page limits are not part of Premium yet."],
  ["What happens after cancellation?", "Cancel at period end from your account when Premium is active. You keep Premium until the paid period ends, then access returns to Free. Refunds and disputes follow Dodo Payments."],
  ["Are files stored?", "Tool outputs are held in the active browser session for review or download. ZANCTA does not store selected file bytes for implemented local processing."],
  ["Does ZANCTA work on mobile?", "The interface adapts to common phone and tablet widths. Large or memory-heavy files may still exceed the capabilities of a particular device or browser."],
  ["Which browsers are supported?", "Support can vary by file format, memory availability, and platform APIs. Use a current desktop or mobile browser; a tool will report when the selected file or browser cannot complete an operation."],
  ["How do I contact support?", "A monitored public support channel is not configured yet. Help, Docs, and individual tool pages provide the current self-service guidance. A real support contact is required before a paid public launch."],
  ["How does account deletion work?", "Authenticated account deletion is available through the account flow. It removes associated application account records; it does not need to delete local tool files because those files are not uploaded for processing."],
] as const;

const categories = ["Local processing", "Files and formats", "Accounts and access", "Browser support"];

export default function FAQPage() {
  return (
    <>
      <Navigation />
      <main className="relative overflow-hidden">
        <div aria-hidden className="editorial-grid pointer-events-none absolute inset-x-0 top-0 h-[34rem] opacity-35" />
        <section className="relative mx-auto max-w-[80rem] px-5 py-16 md:px-8 md:py-24">
          <header className="grid gap-10 border-b border-border pb-12 lg:grid-cols-[7fr_5fr] lg:items-end">
            <div>
              <p className="eyebrow-path">/faq</p>
              <MaskLines as="h1" className="display-serif mt-5 max-w-2xl text-4xl md:text-6xl" lines={[<>Frequently asked questions</>]} />
            </div>
            <p className="max-w-xl text-base leading-8 text-muted-foreground lg:pb-1">Product-specific guidance on local processing, formats, limits, accounts, and the boundaries of the current service.</p>
          </header>

          <div className="mt-12 grid gap-12 lg:grid-cols-[4fr_8fr] lg:gap-16">
            <Reveal className="lg:sticky lg:top-28 lg:self-start">
              <p className="max-w-sm text-xl leading-8 tracking-[-0.025em] text-foreground">Start with the boundary, then choose the tool that fits the job.</p>
              <p className="mt-4 max-w-sm leading-7 text-muted-foreground">Every answer reflects the product as it exists today. Tool-specific limits remain the source of truth when they differ.</p>
              <nav className="mt-10 border-l border-border pl-4" aria-label="FAQ topics">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">On this page</p>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  {categories.map((category) => <li key={category}>{category}</li>)}
                </ul>
              </nav>
            </Reveal>
            <Reveal delay={0.08}>
              <FAQAccordion items={faqs} />
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
