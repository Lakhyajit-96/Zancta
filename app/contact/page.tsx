import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/marketing/content-page";
import { LEGAL_PUBLIC } from "@/lib/legal-public";

import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/contact", {
  title: "Contact — no monitored inbox yet",
  description: "ZANCTA does not currently have a monitored public support or security contact channel.",
  robots: { index: false, follow: true },
});

export default function ContactPage() {
  return (
    <ContentPage
      eyebrow="/contact"
      title="Get in touch — honestly."
      intro={`Last updated: ${LEGAL_PUBLIC.lastUpdated}. ZANCTA does not currently have a monitored public support, privacy, grievance, or security contact channel. We will not publish a placeholder address or imply a response commitment that does not exist.`}
    >
      <ContentSection title="Product guidance">
        <p>
          For current self-service help, start with the relevant tool page, then review <Link href="/help" className="underline">Help</Link>, <Link href="/faq" className="underline">FAQ</Link>, and the <Link href="/guides/local-processing" className="underline">local processing guide</Link>. They describe formats, limits, local processing, outputs, and known limitations without asking you to send a file.
        </p>
      </ContentSection>
      <ContentSection title="Billing">
        <p>
          Cancel Premium at period end from <Link href="/account" className="underline">Account</Link> when that control is available. Checkout, invoices, and provider refunds are handled by {LEGAL_PUBLIC.paymentProviderName} as {LEGAL_PUBLIC.paymentProviderRole}. See <Link href="/refund-and-cancellation" className="underline">Refunds and cancellation</Link> and <Link href="/pricing" className="underline">Pricing</Link>.
        </p>
      </ContentSection>
      <ContentSection title="Security concerns">
        <p>
          Read <Link href="/security" className="underline">Security</Link> for the controls currently implemented. Until a real reporting channel is published, do not send files, passwords, account tokens, or payment information through an unconfigured contact method.
        </p>
      </ContentSection>
      <ContentSection title="Launch requirement" className="md:col-span-2">
        <p>Before a complete commercial launch, ZANCTA needs a monitored support and security channel, clear ownership, a response process, and appropriate retention guidance. That work is intentionally not replaced with a fake contact address. This page stays out of the sitemap and is marked noindex until a genuine channel exists.</p>
      </ContentSection>
    </ContentPage>
  );
}
