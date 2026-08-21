import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/marketing/content-page";
import { LEGAL_PUBLIC } from "@/lib/legal-public";

import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/contact", {
  title: "Contact ZANCTA support, privacy, security, and billing",
  description: "Reach ZANCTA at support, privacy, security, and billing addresses on zancta.tech. Self-service help remains on Help, FAQ, and each tool page.",
});

export default function ContactPage() {
  return (
    <ContentPage
      eyebrow="/contact"
      title="Get in touch."
      intro={`Last updated: ${LEGAL_PUBLIC.lastUpdated}. ZANCTA is operated by ${LEGAL_PUBLIC.operatorName}, an individual operator. Use the addresses below for the matching topic. These mailboxes have been created and tested. A postal address is not published.`}
    >
      <ContentSection title="Support">
        <p>
          Product questions, tool behavior, and account access:{" "}
          <a href={`mailto:${LEGAL_PUBLIC.supportEmail}`} className="underline">{LEGAL_PUBLIC.supportEmail}</a>.
          Start with the relevant tool page, <Link href="/help" className="underline">Help</Link>, and the <Link href="/faq" className="underline">FAQ</Link> when the answer is already documented.
        </p>
      </ContentSection>
      <ContentSection title="Privacy">
        <p>
          Questions about personal-data processing described on this site:{" "}
          <a href={`mailto:${LEGAL_PUBLIC.privacyEmail}`} className="underline">{LEGAL_PUBLIC.privacyEmail}</a>.
          See the <Link href="/privacy" className="underline">privacy notice</Link>. This is not a lawyer-approved designation of a Data Protection Officer.
        </p>
      </ContentSection>
      <ContentSection title="Security">
        <p>
          Security reports:{" "}
          <a href={`mailto:${LEGAL_PUBLIC.securityEmail}`} className="underline">{LEGAL_PUBLIC.securityEmail}</a>.
          Do not send passwords, session tokens, or card numbers by email. There is no published bounty and no promised response SLA. See <Link href="/security" className="underline">Security</Link>.
        </p>
      </ContentSection>
      <ContentSection title="Billing">
        <p>
          Subscription, refund, and invoice questions:{" "}
          <a href={`mailto:${LEGAL_PUBLIC.billingEmail}`} className="underline">{LEGAL_PUBLIC.billingEmail}</a>.
          Cancel Premium at period end from <Link href="/account" className="underline">Account</Link> when that control is available. Checkout, invoices, and provider refunds are handled by {LEGAL_PUBLIC.paymentProviderName} as {LEGAL_PUBLIC.paymentProviderRole}. See <Link href="/refund-and-cancellation" className="underline">Refunds and cancellation</Link>.
        </p>
      </ContentSection>
      <ContentSection title="What is not published" className="md:col-span-2">
        <p>
          A physical address, company registration number, phone number, and social profiles are not published because they have not been provided for this operator. India&apos;s Digital Personal Data Protection Rules, 2025, Rule 9, may require a published business contact for questions about personal-data processing; the mailboxes above are the published channels. Whether those rules apply is a legal question, not a product claim.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
