import { FAQAccordion } from "@/components/marketing/faq-accordion";
import { Footer, Navigation } from "@/components/marketing/nav";
import { MaskLines } from "@/components/marketing/motion";
import { jsonLdFaqPage, pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/faq", {
  title: "FAQ",
  description: "Practical answers about ZANCTA tools, local processing, accounts, limits, and billing availability.",
});

const faqs = [
  ["Does ZANCTA upload my files?", "For implemented local tools, selected file bytes are processed in the browser and are not uploaded to ZANCTA for processing. The page itself still makes normal requests for application code and assets. See the local processing guide for the full boundary."],
  ["Where does processing happen?", "Supported PDF, image, OCR, and PDF text-extraction workflows run in the browser. Individual tool pages explain their own processing boundaries and limitations."],
  ["What file types are supported?", "Each tool lists accepted formats before selection. Current image workflows support JPG, PNG, and WebP; tool-specific PDF workflows accept PDF. HEIC and SVG are not supported by the current image tools."],
  ["What are the file-size limits?", "Limits are shown on each tool page. Most local PDF and image workflows currently use a 50 MB per-file limit; OCR has a 20 MB image limit. Batch limits vary by tool."],
  ["Does OCR run locally?", "Yes. The implemented OCR workflow uses bundled English assets in a browser Worker. The selected image and recognized text are not sent to an OCR API."],
  ["Can scanned PDFs be converted to text?", "No. PDF Text Extractor reads existing embedded text from text-native PDFs. It clearly reports when a PDF is image-only or scanned instead of fabricating text."],
  ["What happens if processing fails?", "The tool shows a readable error without producing a fake result. Check the format, file size, page count, browser memory, and whether the PDF is password-protected or malformed."],
  ["Can I use ZANCTA without an account?", "Yes. The implemented local workflows do not require sign-in. Accounts are used for sign-in and paid-plan status, not to unlock the local tools."],
  ["What does Premium provide?", "Premium currently includes the same implemented local tools and the same limits as Free. It is optional financial support for the product, and it reserves an ad-free experience if ads are introduced later. Ads are not live. Higher file or page limits are not part of Premium yet."],
  ["What happens after cancellation?", "Cancel at period end from your account when Premium is active. You keep Premium until the paid period ends, then access returns to Free. Refunds and disputes follow Dodo Payments."],
  ["Are files stored?", "Tool outputs are held in the active browser session for review or download. ZANCTA does not store selected file bytes for implemented local processing."],
  ["Does ZANCTA work on mobile?", "The interface adapts to common phone and tablet widths. Large or memory-heavy files may still exceed the capabilities of a particular device or browser."],
  ["Which browsers are supported?", "Support can vary by file format, memory availability, and platform APIs. Use a current desktop or mobile browser; a tool will report when the selected file or browser cannot complete an operation."],
  ["How do I contact support?", "A monitored public support channel is not configured yet. Help, the FAQ, and individual tool pages provide the current self-service guidance. A real support contact is still required before a complete commercial launch."],
  ["How does account deletion work?", "Authenticated account deletion is available through the account flow. It removes associated application account records; it does not need to delete local tool files because those files are not uploaded for processing."],
] as const;

export default function FAQPage() {
  return (
    <>
      <Navigation />
      <main className="relative overflow-hidden">
        <section className="relative mx-auto max-w-[80rem] px-5 py-14 md:px-8 md:py-16">
          <header className="max-w-3xl border-b border-border pb-10">
            <p className="eyebrow-path">/faq</p>
            <MaskLines as="h1" className="display-serif mt-5 text-4xl md:text-5xl" lines={[<>Frequently asked questions</>]} />
            <p className="mt-6 text-base leading-8 text-muted-foreground">Answers for the product as it exists today. Tool pages remain the source of truth when a limit differs.</p>
          </header>

          <div className="mt-10 max-w-3xl">
            <FAQAccordion items={faqs} />
          </div>
        </section>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaqPage(faqs)) }} />
    </>
  );
}
