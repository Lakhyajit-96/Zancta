import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/marketing/content-page";

import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/help", {
  title: "Help using local PDF and image tools",
  description: "Practical guidance for ZANCTA tools, files, local processing, downloads, accounts, and troubleshooting.",
});

export default function HelpPage() {
  return <ContentPage eyebrow="/help" title="How can we help?" intro="Start with the tool page in front of you. It is the source of truth for its accepted formats, limits, and local processing behavior.">
    <ContentSection title="Getting started"><p>Choose the task first, then select a supported file. Read the visible limit before processing. A local tool should either complete with a real output or explain why the selected file cannot be processed. Browse the <Link href="/tools" className="underline">tool catalog</Link> if you are not sure which workflow fits.</p></ContentSection>
    <ContentSection title="PDF and image files"><p>PDF tools accept PDFs; image tools accept JPG, PNG, and WebP. Password-protected or malformed PDFs may fail. HEIC and SVG are not supported by the current image workflows. For very large files, close other tabs and try a smaller input if the browser reports a memory-related failure.</p></ContentSection>
    <ContentSection title="OCR and PDF text"><p>Image OCR extracts text from JPG, PNG, and WebP in the browser. English is free. Local OCR Power (Premium) adds Hindi, Bengali, Tamil, Spanish, French, German, and scanned PDF OCR up to 20 pages. Language packs download only when selected. PDF Text Extractor reads existing embedded text from text-native PDFs; it does not OCR scans. See the <Link href="/guides/browser-ocr-without-uploading" className="underline">browser OCR guide</Link> and the <Link href="/guides/local-processing" className="underline">local processing guide</Link>.</p></ContentSection>
    <ContentSection title="Downloads and results"><p>Wait for the completed state before downloading. Generated files are created in the browser. If a download does not begin, check the browser&apos;s download permissions and pop-up settings, then try again with the same supported input.</p></ContentSection>
    <ContentSection title="Accounts and Premium"><p>Local tools do not require an account. Accounts are for sign-in and paid-plan status. Premium adds Local OCR Power; other file and page limits match Free. Payment checkout and cancellation are only available when the configured payment provider is live. See <Link href="/pricing" className="underline">Pricing</Link> for what Premium actually includes today.</p></ContentSection>
    <ContentSection title="Browser compatibility"><p>The interface adapts to common phone and tablet widths, but browser support can vary by file format, memory availability, and platform APIs. Large files can remain demanding on lower-memory devices.</p></ContentSection>
    <ContentSection title="Contact" className="md:col-span-2"><p>Send an enquiry from <Link href="/contact" className="underline">Contact</Link>, or email <a href="mailto:support@zancta.tech" className="underline">support@zancta.tech</a> for product questions. Privacy, security, and billing addresses are listed on the same page. Use this page, the <Link href="/faq" className="underline">FAQ</Link>, <Link href="/refund-and-cancellation" className="underline">refunds and cancellation</Link>, and the relevant tool page first when the answer is already documented. A response-time SLA is not published.</p></ContentSection>
  </ContentPage>;
}
