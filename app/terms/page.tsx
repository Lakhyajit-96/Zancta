import { ContentPage, ContentSection } from "@/components/marketing/content-page";

export const metadata = { title: "Terms", description: "Plain-language product terms for using ZANCTA's browser file tools." };

export default function TermsPage() {
  return <ContentPage eyebrow="TERMS OF USE" title="Use the tools responsibly." intro="These product terms describe the current MVP and require human legal review before they are treated as final contractual terms.">
    <ContentSection title="Eligibility and accounts"><p>Use the service only if you are legally able to accept applicable terms. You may use local tools without an account. Keep account credentials private and provide accurate information needed for authentication.</p></ContentSection>
    <ContentSection title="Your files and acceptable use"><p>You remain responsible for the files you select, your right to use them, and the results you create. Do not use ZANCTA to violate law, rights of others, security controls, or the restrictions shown on a tool page. Do not attempt to overload, probe, or disrupt the service.</p></ContentSection>
    <ContentSection title="Service behavior"><p>Tool support, limits, browser compatibility, and availability can change. Local processing can fail because of file structure, memory, browser capability, or unsupported input. A successful result is not a guarantee of suitability for a particular purpose.</p></ContentSection>
    <ContentSection title="Premium and payments"><p>Premium features, prices, billing periods, cancellation, refunds, and taxes are shown at checkout or on Pricing. Provider-hosted payment terms may also apply. Do not treat the current UI as a substitute for provider or legal terms.</p></ContentSection>
    <ContentSection title="Intellectual property and termination"><p>ZANCTA branding and software remain protected by their respective rights. You retain rights in your files. Access may be suspended for abuse, security risk, or violation of applicable terms. Account deletion is available through the account flow where supported.</p></ContentSection>
    <ContentSection title="Limitations and review"><p>The service is provided as an MVP without a promise of uninterrupted availability. This page omits jurisdiction, entity, warranty, liability, and dispute language that requires a human legal owner to confirm.</p></ContentSection>
  </ContentPage>;
}
