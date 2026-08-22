import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/marketing/content-page";
import { LEGAL_PUBLIC } from "@/lib/legal-public";

import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/terms", {
  title: "Product terms for ZANCTA",
  description: "Product terms for ZANCTA's browser-based file tools, accounts, and optional Premium checkout.",
});

export default function TermsPage() {
  return (
    <ContentPage
      eyebrow="/terms"
      title="Terms of service"
      intro={`Last updated: ${LEGAL_PUBLIC.lastUpdated}. ZANCTA is operated by ${LEGAL_PUBLIC.operatorName}, an individual operator. By using ZANCTA, you agree to these product terms. A physical address, governing law, limitation of liability, and lawyer-reviewed commercial terms have not been published. This page is not presented as attorney-approved.`}
    >
      <ContentSection title="Using the service">
        <p>You may use the available tools only for files you have the right to use and in compliance with applicable law. Do not use the service to harm others, infringe rights, bypass security controls, or disrupt the application.</p>
      </ContentSection>
      <ContentSection title="Files and results">
        <p>You remain responsible for the files you select and for checking the output before relying on it. Local processing can fail because of file structure, browser APIs, device memory, unsupported inputs, or service changes. A successful output is not a guarantee that it is suitable for a particular purpose.</p>
      </ContentSection>
      <ContentSection title="Accounts">
        <p>Keep account credentials private and provide accurate information needed for authentication. Email verification is required before paid checkout. We may restrict or suspend access for abuse, security risk, or material violations of these terms. Account deletion is available where supported by the authenticated account flow.</p>
      </ContentSection>
      <ContentSection title="Free and Premium access">
        <p>
          Local free tools are available within their displayed limits. Premium currently includes the same tools and the same limits, plus a reserved ad-free experience if ads are introduced. Premium is {LEGAL_PUBLIC.monthlyDisplayINR} or {LEGAL_PUBLIC.annualDisplayINR} when live provider checkout is enabled. Checkout is hosted by {LEGAL_PUBLIC.paymentProviderName} as {LEGAL_PUBLIC.paymentProviderRole}. Cancellation, refunds, and disputes are described on{" "}
          <Link href="/refund-and-cancellation" className="underline">Refunds and cancellation</Link>.
        </p>
      </ContentSection>
      <ContentSection title="Third-party services">
        <p>Authentication, email, and payment functions can depend on configured third-party providers. Their own terms and privacy notices may apply to the parts of a transaction they handle. ZANCTA does not store payment card data.</p>
      </ContentSection>
      <ContentSection title="Availability and changes">
        <p>Tool availability, browser compatibility, input limits, and features can change. We may update these terms and product behavior as the service evolves. Material legal terms require a visible, legally reviewed update process before they should be treated as complete commercial terms.</p>
      </ContentSection>
      <ContentSection title="Ownership and unpublished legal terms" className="md:col-span-2">
        <p>You retain rights in your files. ZANCTA retains rights in its branding, design, and software. The individual operator is named above; a company/entity identity, postal address, governing law, warranty disclaimer beyond this product description, and dispute-resolution forum are not stated here because those facts have not been provided for publication or have not had professional legal review. See <Link href="/contact" className="underline">Contact</Link> and <Link href="/privacy" className="underline">Privacy</Link>.</p>
      </ContentSection>
      <ContentSection title="Disputes and consumer channels" className="md:col-span-2">
        <p>
          Card and billing disputes follow the process described on{" "}
          <Link href="/refund-and-cancellation" className="underline">Refunds and cancellation</Link>. Independent of
          anything ZANCTA publishes, Indian consumers can also use the government-run National Consumer Helpline
          (1915) or file a complaint through the{" "}
          <a href="https://consumeraffairs.nic.in/edaakhil" className="underline" rel="noopener noreferrer">e-Daakhil</a>{" "}
          portal. These are general public channels, not a ZANCTA-specific promise or forum selection.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
