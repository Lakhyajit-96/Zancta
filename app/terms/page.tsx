import { ContentPage, ContentSection } from "@/components/marketing/content-page";

export const metadata = { title: "Terms", description: "Plain-language terms for ZANCTA's browser-based file tools and account services." };

export default function TermsPage() {
  return <ContentPage eyebrow="TERMS" title="Straightforward terms for a practical tool." intro="These are product terms for the current service, not final legal terms. A responsible legal owner must complete entity, jurisdiction, liability, refund, and dispute provisions before commercial launch.">
    <ContentSection title="Using the service"><p>You may use the available tools only for files you have the right to use and in compliance with applicable law. Do not use the service to harm others, infringe rights, bypass security controls, or disrupt the application.</p></ContentSection>
    <ContentSection title="Files and results"><p>You remain responsible for the files you select and for checking the output before relying on it. Local processing can fail because of file structure, browser APIs, device memory, unsupported inputs, or service changes. A successful output is not a guarantee that it is suitable for a particular purpose.</p></ContentSection>
    <ContentSection title="Accounts"><p>Keep account credentials private and provide accurate information needed for authentication. We may restrict or suspend access for abuse, security risk, or material violations of these terms. Account deletion is available where supported by the authenticated account flow.</p></ContentSection>
    <ContentSection title="Free and Premium access"><p>Local free tools are available within their displayed limits. Premium subscriptions, pricing, billing periods, cancellations, refunds, taxes, and paid entitlements apply only when live provider configuration is available and the terms shown at checkout are active.</p></ContentSection>
    <ContentSection title="Third-party services"><p>Authentication, email, and payment functions can depend on configured third-party providers. Their own terms and privacy notices may apply to the parts of a transaction they handle. ZANCTA does not store payment card data.</p></ContentSection>
    <ContentSection title="Availability and changes"><p>Tool availability, browser compatibility, input limits, and features can change. We may update these terms and product behavior as the service evolves. Material legal terms require a visible, legally reviewed update process before launch.</p></ContentSection>
    <ContentSection title="Ownership and limitations" className="md:col-span-2"><p>You retain rights in your files. ZANCTA retains rights in its branding, design, and software. Limitations of liability, warranties, governing law, dispute resolution, notice details, and a legal entity identity remain subject to human legal review.</p></ContentSection>
  </ContentPage>;
}
