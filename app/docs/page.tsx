import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/marketing/content-page";

export const metadata = { title: "Docs", description: "Product documentation for ZANCTA's local PDF and image workflows." };

export default function DocsPage() {
  return <ContentPage eyebrow="DOCUMENTATION" title="Understand the workflow before you use it." intro="These guides describe the public product behavior, not internal deployment or development operations.">
    <ContentSection title="Start here"><p><Link href="/how-it-works" className="underline">How it works</Link> explains the browser flow from validation to download. <Link href="/tools" className="underline">Tools</Link> is the complete current catalog.</p></ContentSection>
    <ContentSection title="Privacy model"><p>Supported local tools process selected file bytes in the browser. The page still loads HTML, JavaScript, fonts, and images from the deployment. See <Link href="/privacy" className="underline">Privacy</Link> for the current data boundary.</p></ContentSection>
    <ContentSection title="Limits and formats"><p>Limits are tool-specific and shown on each tool page. The product currently rejects HEIC and SVG image inputs, and protected PDFs are not supported.</p></ContentSection>
    <ContentSection title="Capability status"><p>Background removal is visible but deferred until a commercially verified local model is integrated. It does not produce a placeholder output.</p></ContentSection>
  </ContentPage>;
}
