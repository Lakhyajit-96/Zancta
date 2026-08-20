import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/marketing/content-page";

export const metadata = {
  title: "Local processing — privacy, OCR, and PDF text",
  description: "How ZANCTA processes PDFs and images in the browser, what OCR and PDF text extraction can and cannot do, and where the privacy boundary ends.",
  alternates: { canonical: "/guides/local-processing" },
};

export default function LocalProcessingGuidePage() {
  return (
    <ContentPage
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
        <p>Image OCR runs English recognition in a Worker with bundled language data. It is meant for photographs or scans of English text. Handwriting, dense tables, tiny type, and non-English scripts will fail or produce garbage. The recognized text is not sent to an OCR API.</p>
        <p>Start at <Link href="/tools/ocr" className="underline">OCR</Link>.</p>
      </ContentSection>
      <ContentSection title="PDF text extraction">
        <p>PDF Text Extractor copies text that is already embedded in a text-native PDF. A scanned “PDF” that is only images has no such text; the tool reports that instead of inventing words. It is not OCR for PDFs. For scans, render pages to images with <Link href="/tools/pdf-to-images" className="underline">PDF to images</Link>, then use OCR on those images if you accept the English-only limit.</p>
        <p>Start at <Link href="/tools/pdf-text-extractor" className="underline">PDF Text Extractor</Link>.</p>
      </ContentSection>
      <ContentSection title="Images and metadata">
        <p>Compression, conversion, and resize stay in the browser for JPG, PNG, and WebP. HEIC and SVG are out of scope. EXIF cleaning removes common metadata from supported images; it cannot prove a downstream site will not re-tag a file you later upload elsewhere.</p>
      </ContentSection>
      <ContentSection title="Honest limits" className="md:col-span-2">
        <p>Password-protected PDFs, corrupt files, very large documents, and low-memory phones can fail. Each tool page lists size and batch limits. Background removal is not offered until a local model can be licensed. For formats, recovery steps, and accounts see <Link href="/docs" className="underline">Docs</Link>, <Link href="/help" className="underline">Help</Link>, and <Link href="/faq" className="underline">FAQ</Link>.</p>
      </ContentSection>
    </ContentPage>
  );
}
