import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/marketing/content-page";

import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/guides/local-processing", {
  title: "Local processing — privacy, OCR, and PDF text",
  description: "How ZANCTA processes PDFs and images in the browser, what OCR and PDF text extraction can and cannot do, and where the privacy boundary ends.",
});

export default function LocalProcessingGuidePage() {
  return (
      <ContentPage
        crumbs={[{ name: "Home", href: "/" }, { name: "Guides" }]}
        eyebrow="/guides/local-processing"
        title="Local processing, explained."
      intro="This guide is for people who need to merge, split, compress, or read files without sending the document to a website. It describes the current ZANCTA tools, not a cloud conversion service."
    >
      <ContentSection title="Why local processing">
        <p>Upload-based PDF sites send the file to a server so that server can rewrite it. That is convenient, and it also means the operator, their processors, and anyone who obtains those logs can see the document. ZANCTA’s implemented PDF and image tools read the file you selected in the browser and write the result in the browser. The bytes for those workflows are not posted to ZANCTA for processing.</p>
      </ContentSection>
      <ContentSection title="What still leaves the device">
        <p>The application itself is downloaded like any website: HTML, JavaScript, fonts, and images. Analytics, if you allow it, may record that a tool finished — with the tool name only. Accounts, email, and payments (when live) send account and billing data to those providers. None of that is a substitute for uploading the PDF.</p>
      </ContentSection>
      <ContentSection title="OCR">
        <p>Image OCR runs recognition in a Worker. English language data is bundled. Hindi, Bengali, Tamil, Spanish, French, and German packs load only for Premium, and only when selected. Scanned PDF OCR is also Premium and capped at 20 pages. Handwriting, dense tables, tiny type, and mixed scripts will fail or produce garbage. The recognized text is not sent to an OCR API. Accuracy is not human-level.</p>
        <p>Start at <Link href="/tools/ocr" className="underline">Image OCR</Link> or the <Link href="/guides/browser-ocr-without-uploading" className="underline">browser OCR guide</Link>.</p>
      </ContentSection>
      <ContentSection title="PDF text extraction">
        <p>PDF Text Extractor copies text that is already embedded in a text-native PDF. A scanned “PDF” that is only images has no such text; the tool reports that instead of inventing words. For scans, use Image OCR Local OCR Power (Premium, up to 20 pages) rather than expecting this extractor to invent text.</p>
        <p>Start at <Link href="/tools/pdf-text-extractor" className="underline">PDF Text Extractor</Link>.</p>
      </ContentSection>
      <ContentSection title="Images and metadata">
        <p>Compression, conversion, and resize stay in the browser for JPG, PNG, and WebP. HEIC and SVG are out of scope. EXIF cleaning re-encodes supported images so typical GPS and camera tags do not survive; it cannot prove a downstream site will not re-tag a file you later upload elsewhere. See <Link href="/guides/remove-exif-before-sharing" className="underline">Remove EXIF before sharing</Link>.</p>
      </ContentSection>
      <ContentSection title="PDF size and pages">
        <p>
          <Link href="/guides/compress-pdf-without-uploading" className="underline">Compress PDF without uploading</Link> explains the object-stream rewrite — images inside the PDF are not transcoded.
          {" "}
          <Link href="/guides/split-pdf-without-uploading" className="underline">Split PDF without uploading</Link> extracts a range into one new PDF.
          {" "}
          <Link href="/guides/merge-pdf-without-uploading" className="underline">Merge PDFs without uploading</Link> combines files in the same local model.
        </p>
      </ContentSection>
      <ContentSection title="Honest limits" className="md:col-span-2">
        <p>Password-protected PDFs, corrupt files, very large documents, and low-memory phones can fail. Each tool page lists size and batch limits. Background removal is not offered until a local model can be licensed. For recovery steps and accounts see <Link href="/help" className="underline">Help</Link> and the <Link href="/faq" className="underline">FAQ</Link>.</p>
      </ContentSection>
    </ContentPage>
  );
}
