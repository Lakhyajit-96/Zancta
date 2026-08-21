import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/marketing/content-page";
import { ShieldVisual } from "@/components/marketing/visuals";
import { LEGAL_PUBLIC } from "@/lib/legal-public";

import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/privacy", {
  title: "Privacy",
  description: "How ZANCTA handles local files, accounts, cookies, payments, email, and the absence of live advertising.",
});

export default function PrivacyPage() {
  return (
    <ContentPage
      eyebrow="/privacy"
      title="How ZANCTA handles privacy."
      intro={`Last updated: ${LEGAL_PUBLIC.lastUpdated}. This page describes current product behavior. It is not a lawyer-approved privacy notice and does not name a legal entity, postal address, or data-protection officer because those have not been published.`}
      visual={<ShieldVisual />}
    >
      <ContentSection title="Local file processing">
        <p>For implemented local PDF and image tools, selected file bytes are read and processed in the browser. ZANCTA does not receive those bytes for processing. Background removal is deferred rather than sending an image to an undisclosed cloud fallback.</p>
        <p>This boundary does not control browser extensions, malware, operating-system backups, device sharing, or future features that are explicitly offered as optional cloud services.</p>
      </ContentSection>
      <ContentSection title="Account information">
        <p>If you create an account, the application stores information needed for authentication and entitlements, such as email address, optional name, password hash, sessions, verification tokens, and password-reset tokens. Passwords are not stored in plain text.</p>
      </ContentSection>
      <ContentSection title="Cookies and browser storage">
        <p>Essential and security cookies are used for authentication (session, CSRF, OAuth state/PKCE) and, when you start Google or GitHub from Sign in or Sign up, a short-lived OAuth intent cookie. Those cookies are required for the account to work and are not advertising cookies.</p>
        <p>A consent preference may be stored in localStorage so we remember whether optional analytics is allowed. Local tool results stay in the browser session for preview or download and are released when you leave or clear that workspace.</p>
      </ContentSection>
      <ContentSection title="Analytics and advertising">
        <p>No advertising network is enabled. Google Analytics (GA4) loads only if a measurement ID is configured and you choose Allow analytics. Allowed events are tool_used (tool slug only), signup, subscription_start, and subscription_cancel. The product does not send file bytes, filenames, extracted PDF text, OCR output, or file-size buckets. There is no ads.txt file because ads are not authorized to sell this inventory.</p>
      </ContentSection>
      <ContentSection title="Payments and email">
        <p>
          When enabled and configured, {LEGAL_PUBLIC.paymentProviderName} handles checkout and billing as {LEGAL_PUBLIC.paymentProviderRole}, and an email provider delivers verification or password-reset messages. Those providers receive only the information needed for their service. See{" "}
          <Link href="/refund-and-cancellation" className="underline">Refunds and cancellation</Link>.
        </p>
      </ContentSection>
      <ContentSection title="Retention and deletion">
        <p>ZANCTA does not retain selected file bytes for implemented local processing. Authenticated account deletion removes associated application account records through the account flow, after attempting to cancel any known Dodo subscription at period end. Payment rows may remain without a user id for billing reconciliation. {LEGAL_PUBLIC.paymentProviderName} retains customer, payment, subscription, and checkout records as Merchant of Record; ZANCTA cannot delete those provider records.</p>
      </ContentSection>
      <ContentSection title="Contact for privacy questions" className="md:col-span-2">
        <p>
          A monitored privacy, support, or security mailbox is not published. Self-service pages: <Link href="/help" className="underline">Help</Link>, <Link href="/contact" className="underline">Contact</Link>, <Link href="/security" className="underline">Security</Link>. A responsible legal owner still needs to confirm the operating entity, jurisdictions, user-rights process, and a real contact method before this notice should be treated as a complete commercial privacy policy.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
