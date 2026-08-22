import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/marketing/content-page";
import { jsonLdBreadcrumbList, jsonLdFaqPage, pageMeta } from "@/lib/seo";

const PATH = "/guides/browser-ocr-without-uploading";

const faqs = [
  { q: "Is browser OCR as accurate as a dedicated scanner app?", a: "No. It is useful for photographs and clean prints of printed text. Handwriting, stamps, and dense tables often fail. ZANCTA does not claim human-level OCR." },
  { q: "Does the text leave my device?", a: "For ZANCTA Image OCR, recognition runs in a Web Worker. The image and the text are not sent to an OCR API." },
  { q: "What is free versus Premium?", a: "English image OCR is free. Additional language packs and scanned PDF OCR (up to 20 pages) are Local OCR Power on Premium." },
] as const;

export const metadata = pageMeta(PATH, {
  title: "OCR without uploading your documents",
  description: "How browser-based OCR reads text from images and scans on your device, what it cannot do, and how ZANCTA keeps recognition local.",
});

export default function BrowserOcrGuidePage() {
  return (
    <>
      <ContentPage
        crumbs={[{ name: "Home", href: "/" }, { name: "Guides", href: "/guides/local-processing" }, { name: "Browser OCR" }]}
        eyebrow={PATH}
        title="How browser OCR works without uploading documents."
        intro="Cloud OCR is convenient: you upload a photo, a server runs a model, and text comes back. That also means the document exists on someone else’s disk, at least briefly. Browser OCR loads an engine into the page and runs it next to the file. This page describes that model as ZANCTA implements it — not as a universal claim about every OCR website."
      >
        <ContentSection title="What runs in the tab">
          <p>
            ZANCTA Image OCR uses Tesseract.js with a Web Worker and language data. English data is bundled with the site. Additional language packs download only when a Premium account selects them, from ZANCTA, still into this browser. Recognition then happens on the device. There is no ZANCTA OCR API that receives the pixels.
          </p>
        </ContentSection>
        <ContentSection title="Images versus PDFs">
          <p>
            A photograph of a page is an image. A “PDF scan” is often a stack of images inside a PDF wrapper, with no real text layer. <Link href="/tools/pdf-text-extractor" className="underline">PDF Text Extractor</Link> copies text that is already embedded. If none exists, it says so. Scanned PDF OCR on Image OCR (Premium) renders each page locally and runs OCR, with a 20-page cap so a phone is less likely to freeze.
          </p>
        </ContentSection>
        <ContentSection title="Languages">
          <p>English is free. Hindi, Bengali, Tamil, Spanish, French, and German are Premium language packs. Packs load on demand; they are not shipped in the first JavaScript bundle. Accuracy varies by script, contrast, and scan quality. Mixed-language pages can produce garbage.</p>
        </ContentSection>
        <ContentSection title="Honest failure modes">
          <p>Low light, motion blur, decorative fonts, handwriting, stamps, and tables are common failure modes. Empty output is reported as empty. Cancellation stops the worker. A failed language download does not invent text from a previous run.</p>
        </ContentSection>
        <ContentSection title="Start here">
          <p>
            Open <Link href="/tools/ocr" className="underline">Image OCR</Link> for pictures and for Premium scanned PDFs.
            Use <Link href="/tools/pdf-text-extractor" className="underline">PDF Text Extractor</Link> when the PDF was exported from a word processor.
            Render pages to images first with <Link href="/tools/pdf-to-images" className="underline">PDF to Images</Link> if you only need a single page as a JPG.
            Premium language packs and scanned PDF OCR are described on <Link href="/pricing" className="underline">Pricing</Link>.
          </p>
        </ContentSection>
        <ContentSection title="Privacy boundary" className="md:col-span-2">
          <p>
            Local OCR does not hide the file from extensions or from the next website you paste the text into. Analytics, if allowed, may record that OCR finished — with the tool name and language code, never the recognized text. See the <Link href="/guides/local-processing" className="underline">local processing guide</Link>.
          </p>
        </ContentSection>
      </ContentPage>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumbList([{ name: "Home", path: "/" }, { name: "Guides", path: "/guides/local-processing" }, { name: "Browser OCR", path: PATH }])) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaqPage(faqs)) }} />
    </>
  );
}
