import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/marketing/content-page";

export const metadata = { title: "Docs", description: "Public documentation for ZANCTA's supported local PDF, image, OCR, and text-extraction workflows." };

export default function DocsPage() {
  return <ContentPage eyebrow="DOCUMENTATION" title="Know the boundary before you begin." intro="These pages describe the public product: what a tool accepts, what it produces, and how supported local processing behaves.">
    <ContentSection title="Tool collection"><p><Link href="/tools" className="underline">Tools</Link> is the current catalog. PDF workflows cover merge, split, compression, page rendering, image-to-PDF, and embedded-text extraction. Image workflows cover compression, conversion, resizing, metadata cleaning, and local English OCR.</p></ContentSection>
    <ContentSection title="Inputs and limits"><p>Every tool page shows its accepted file type, maximum size, and batch limit. Most local PDF and image workflows use a 50 MB per-file boundary. OCR uses a 20 MB image boundary and supports JPG, PNG, and WebP. The displayed tool limit always takes precedence.</p></ContentSection>
    <ContentSection title="Processing and output"><p>Implemented local tools process selected file bytes in the browser and generate outputs on-device. A tool may provide a download, copy action, preview, or all three depending on its purpose. Progress is tied to reported engine work where that is available.</p></ContentSection>
    <ContentSection title="OCR and PDF text"><p>Image OCR uses bundled English assets in a browser Worker. PDF Text Extractor reads embedded text page by page from text-native PDFs. It does not turn scanned PDFs into text and reports an honest no-text state for image-only documents.</p></ContentSection>
    <ContentSection title="Accounts and subscriptions"><p>Local tool use is available without an account. Accounts support authentication and entitlement records. Premium and payment behavior are presented on <Link href="/pricing" className="underline">Pricing</Link> only when provider configuration makes those actions available.</p></ContentSection>
    <ContentSection title="Known limitations"><p>Browser APIs, memory limits, protected PDFs, malformed files, and unsupported formats can prevent completion. Background removal is deferred while local model licensing is evaluated. See <Link href="/help" className="underline">Help</Link> and <Link href="/faq" className="underline">FAQ</Link> for practical recovery guidance.</p></ContentSection>
  </ContentPage>;
}
