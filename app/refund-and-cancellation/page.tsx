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
      intro={`Last updated: ${LEGAL_PUBLIC.lastUpdated}. This page describes current product and provider behavior. It is not a lawyer-approved policy and does not invent a ZANCTA refund inbox.`}
    >
      <ContentSection title="What Premium is today">
        <p>
          Premium currently includes the same implemented local tools and the same file and page limits as Free. It is optional financial support for development, plus a reserved ad-free experience if ads are introduced later. Advertising networks are not enabled on the site today.
        </p>
        <p>
          Listed prices are {LEGAL_PUBLIC.monthlyDisplayINR} or {LEGAL_PUBLIC.annualDisplayINR}. The charge shown at {LEGAL_PUBLIC.paymentProviderName} checkout is authoritative.
        </p>
      </ContentSection>
      <ContentSection title="How to cancel">
        <p>
          Sign in, open <Link href="/account" className="underline">Account</Link>, and cancel Premium at period end when that control is shown. Cancellation is sent to {LEGAL_PUBLIC.paymentProviderName}. You keep Premium until the paid period ends, then access returns to Free. Local tools remain available on Free.
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
          ZANCTA does not currently operate a monitored public refund inbox. Do not send card numbers, account tokens, or files to an unpublished address.
        </p>
        <p>
          Provider-initiated refunds, where allowed, are processed by {LEGAL_PUBLIC.paymentProviderName} according to its published refund and dispute rules (including a typical merchant-dashboard window of 30 days from the original transaction, and card-network dispute processes that are separate from any “no refund” wording). Settlement timing depends on the customer’s payment method and bank.
        </p>
        <p>
          Because Free and Premium currently use the same local processing, a refund does not remove tool access that was already available without paying.
        </p>
      </ContentSection>
      <ContentSection title="Disputes" className="md:col-span-2">
        <p>
          Card chargebacks follow the customer’s issuer and card network. {LEGAL_PUBLIC.paymentProviderName} documents merchant response windows for disputes. Until a monitored ZANCTA contact exists, we cannot promise a human reply on a named SLA.
        </p>
        <p>
          Related pages: <Link href="/pricing" className="underline">Pricing</Link>, <Link href="/terms" className="underline">Terms</Link>, <Link href="/privacy" className="underline">Privacy</Link>, <Link href="/contact" className="underline">Contact</Link>.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
