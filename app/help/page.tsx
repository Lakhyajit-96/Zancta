import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/marketing/content-page";

import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/help", {
  title: "Help",
  description: "Practical guidance for ZANCTA tools, files, local processing, downloads, accounts, and troubleshooting.",
});

export default function HelpPage() {
  return <ContentPage eyebrow="/help" title="How can we help?" intro="Start with the tool page in front of you. It is the source of truth for its accepted formats, limits, and local processing behavior.">
    <ContentSection title="Getting started"><p>Choose the task first, then select a supported file. Read the visible limit before processing. A local tool should either complete with a real output or explain why the selected file cannot be processed.</p></ContentSection>
    <ContentSection title="PDF and image files"><p>PDF tools accept PDFs; image tools accept the formats shown on their pages. Password-protected or malformed PDFs may fail. HEIC and SVG are not supported by the current image workflows. For very large files, close other tabs and try a smaller input if the browser reports a memory-related failure.</p></ContentSection>
    <ContentSection title="OCR and PDF text"><p>Image OCR supports the bundled English language assets and processes the selected image locally. PDF Text Extractor reads existing embedded text from text-native PDFs; it does not OCR scanned or image-only PDFs.</p></ContentSection>
    <ContentSection title="Downloads and results"><p>Wait for the completed state before downloading. Generated files are created in the browser. If a download does not begin, check the browser&apos;s download permissions and pop-up settings, then try again with the same supported input.</p></ContentSection>
    <ContentSection title="Privacy"><p>For implemented local workflows, selected file bytes are not uploaded to ZANCTA for processing. The browser still loads the application and its assets normally. See <Link href="/privacy" className="underline">Privacy</Link> for the current data boundary.</p></ContentSection>
    <ContentSection title="Accounts and Premium"><p>Local tools do not require an account. Accounts are for authentication and entitlement management. Payment checkout, paid subscription changes, and cancellation are only available when the configured payment provider is live and verified.</p></ContentSection>
    <ContentSection title="Browser compatibility"><p>The interface adapts to common phone and tablet widths, but browser support can vary by file format, memory availability, and platform APIs. Large files can remain demanding on lower-memory devices.</p></ContentSection>
    <ContentSection title="Contact" className="md:col-span-2"><p>A monitored public support or security inbox is not configured yet. Use <Link href="/faq" className="underline">FAQ</Link>, <Link href="/docs" className="underline">Docs</Link>, and the relevant tool page for current guidance. Publishing a real contact channel is a launch requirement.</p></ContentSection>
  </ContentPage>;
}
