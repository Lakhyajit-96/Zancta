import { ContentPage } from "@/components/marketing/content-page";
import { AdSlot } from "@/components/marketing/ad-slot";

export const metadata = { title: "FAQ", description: "Answers about ZANCTA tools, privacy, accounts, limits, and troubleshooting." };

const faqs = [
  ["Is ZANCTA free?", "The local tools are available without an account within the displayed limits. Premium pricing and entitlements are described on the pricing page."],
  ["Are my files uploaded?", "The implemented local PDF and image tools do not upload file bytes for processing. The page and assets still make normal network requests."],
  ["Which formats are supported?", "Each tool lists its accepted formats and limits. HEIC and SVG are not supported in the current MVP image tools."],
  ["Do I need an account?", "No account is needed for the local tool workflow. Accounts support authentication, entitlements, and account settings."],
  ["Why did processing fail?", "Common causes are an unsupported format, a protected or malformed PDF, a file above the displayed limit, or a browser capability problem. The tool should show an error instead of a fake result."],
  ["Does it work on mobile?", "The interface is responsive and the Chromium mobile test suite passes. Actual browser support can vary by format, memory, and device."],
  ["How do I contact ZANCTA?", "There is not yet a public support inbox or staffed contact channel. The Help and Security pages document the current product behavior; a real contact route must be configured before launch claims are made."],
];

export default function FAQPage() {
  return <ContentPage eyebrow="ANSWERS" title="Frequently asked questions" intro="Short, product-specific answers about local processing, accounts, limits, and what to do when a tool cannot complete."><dl className="space-y-4">{faqs.map(([q,a]) => <div key={q} className="rounded-xl border bg-surface p-5"><dt className="font-medium">{q}</dt><dd className="mt-2 text-sm leading-6 text-muted-foreground">{a}</dd></div>)}</dl><AdSlot id="faq-content" /></ContentPage>;
}
