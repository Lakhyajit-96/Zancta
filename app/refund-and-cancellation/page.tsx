import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/marketing/content-page";
import { LEGAL_PUBLIC } from "@/lib/legal-public";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/refund-and-cancellation", {
  title: "Refunds and cancellation",
  description:
    "How ZANCTA Premium cancellation works, what Dodo Payments handles as Merchant of Record, and the current limits of merchant refund requests.",
});

export default function RefundAndCancellationPage() {
  return (
    <ContentPage
      eyebrow="/refund-and-cancellation"
      title="Refunds and cancellation."
      intro={`Last updated: ${LEGAL_PUBLIC.lastUpdated}. This page describes current product and provider behavior. Billing questions: ${LEGAL_PUBLIC.billingEmail}.`}
    >
      <ContentSection title="What Premium is today">
        <p>
          Premium includes the same implemented local tools and the same file and page limits as Free, plus Local OCR Power: additional OCR language packs (Hindi, Bengali, Tamil, Spanish, French, and German) and scanned PDF OCR up to 20 pages, in the browser. English image OCR remains free. Premium also reserves an ad-free experience if ads are introduced later. Advertising networks are not enabled on the site today.
        </p>
        <p>
          Listed prices are {LEGAL_PUBLIC.monthlyDisplayINR} or {LEGAL_PUBLIC.annualDisplayINR}. The charge shown at {LEGAL_PUBLIC.paymentProviderName} checkout is authoritative.
        </p>
      </ContentSection>
      <ContentSection title="How to cancel">
        <p>
          Sign in, open <Link href="/account" className="underline">Account</Link>, and cancel Premium at period end when that control is shown. Cancellation is sent to {LEGAL_PUBLIC.paymentProviderName}. You keep Premium until the paid period ends, then access returns to Free. Implemented local tools remain available on Free; Local OCR Power does not.
        </p>
        <p>
          ZANCTA does not offer an in-app “cancel immediately and refund unused days” control. Period-end cancel is the implemented path.
        </p>
      </ContentSection>
      <ContentSection title="Who is the seller">
        <p>
          Checkout is hosted by {LEGAL_PUBLIC.paymentProviderName}, acting as {LEGAL_PUBLIC.paymentProviderRole}. ZANCTA does not store card data. Customer invoices, tax collection, and provider-side refund receipts are issued by that provider on covered transactions.
        </p>
      </ContentSection>
      <ContentSection title="Refunds">
        <p>
          Billing questions: <a href={`mailto:${LEGAL_PUBLIC.billingEmail}`} className="underline">{LEGAL_PUBLIC.billingEmail}</a>.
          Do not send card numbers, account tokens, or files by email.
        </p>
        <p>
          Provider-initiated refunds, where allowed, are processed by {LEGAL_PUBLIC.paymentProviderName} according to its published refund and dispute rules (including a typical merchant-dashboard window of 30 days from the original transaction, and card-network dispute processes that are separate from any “no refund” wording). Settlement timing depends on the customer’s payment method and bank.
        </p>
        <p>
          A refund does not remove the implemented local tools that remain available on Free, including English image OCR. Local OCR Power is a Premium capability and is not included on Free.
        </p>
      </ContentSection>
      <ContentSection title="Disputes" className="md:col-span-2">
        <p>
          Card chargebacks follow the customer’s issuer and card network. {LEGAL_PUBLIC.paymentProviderName} documents merchant response windows for disputes. A response-time SLA is not published.
        </p>
        <p>
          Independent of ZANCTA, Indian consumers can use the government-run National Consumer Helpline (1915 /{" "}
          <a href="https://consumerhelpline.gov.in" className="underline" rel="noopener noreferrer">consumerhelpline.gov.in</a>) or file at{" "}
          <a href="https://consumeraffairs.nic.in/edaakhil" className="underline" rel="noopener noreferrer">e-Daakhil</a>. These are general public channels, not a ZANCTA-specific process.
        </p>
        <p>
          Related pages: <Link href="/pricing" className="underline">Pricing</Link>, <Link href="/terms" className="underline">Terms</Link>, <Link href="/privacy" className="underline">Privacy</Link>, <Link href="/contact" className="underline">Contact</Link>.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
