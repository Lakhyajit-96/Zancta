import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/marketing/content-page";
import { AdSlot } from "@/components/marketing/ad-slot";

export const metadata = { title: "Help", description: "Practical help for using ZANCTA file tools, accounts, limits, and failures." };

export default function HelpPage() {
  return <ContentPage eyebrow="HELP CENTER" title="Get unstuck without guessing." intro="Every tool shows its own supported formats, limits, privacy boundary, and output state. These are the common questions across the product.">
    <ContentSection title="How do I use a tool?"><p>Open a tool, read the supported formats and limit, then select or drop a file. Choose the tool action, wait for the completion state, and use the generated download link. You can return to the picker with Process another.</p></ContentSection>
    <ContentSection title="What happens when processing fails?"><p>The tool should show a readable error and keep the file on your device. Try a supported format, a smaller file, or a simpler PDF. Password-protected PDFs and unsupported HEIC/SVG image files are not supported in this MVP.</p></ContentSection>
    <ContentSection title="Browser and device support"><p>The interface is tested in Chromium, including mobile-sized viewports. Firefox and WebKit have not been validated in the current environment. Memory-heavy files can still fail on constrained devices.</p></ContentSection>
    <ContentSection title="Accounts and Premium"><p>You can use local tools without an account. Sign up only when you need account settings or entitlement handling. Premium pricing is on <Link href="/pricing" className="underline">Pricing</Link>; cancellation and provider behavior depend on the configured payment flow.</p></ContentSection>
    <ContentSection title="Still stuck?"><p>There is not yet a staffed public support inbox. Check the <Link href="/faq" className="underline">FAQ</Link>, <Link href="/docs" className="underline">Docs</Link>, and the individual tool page before retrying.</p></ContentSection>
    <AdSlot id="help-content" />
  </ContentPage>;
}
