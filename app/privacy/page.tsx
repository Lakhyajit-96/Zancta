import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/marketing/content-page";
import { ShieldVisual } from "@/components/marketing/visuals";
import { LEGAL_PUBLIC } from "@/lib/legal-public";

import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/privacy", {
  title: "Privacy notice for local file tools",
  description: "How ZANCTA handles local files, accounts, cookies, payments, email, and the absence of live advertising.",
});

export default function PrivacyPage() {
  return (
    <ContentPage
      eyebrow="/privacy"
      title="How ZANCTA handles privacy."
      intro={`Last updated: ${LEGAL_PUBLIC.lastUpdated}. ZANCTA is operated by ${LEGAL_PUBLIC.operatorName}, an individual operator. This page describes current product behavior. It is not a lawyer-approved privacy notice and does not publish a company/entity, postal address, or data-protection officer because those have not been provided.`}
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
        <p>No advertising network is enabled. Google Analytics (GA4) loads only if a measurement ID is configured and you choose Allow analytics. Client events may include page_view, tool_view, tool_used, processing_started, processing_completed, processing_failed, processing_cancelled, download_completed, pricing_view, and related product events. Payloads are limited to tool slugs, language codes, and similar non-content fields. The product does not send file bytes, filenames, extracted PDF text, OCR output, email addresses, or payment details. Billing events are recorded server-side. There is no ads.txt file because ads are not authorized to sell this inventory.</p>
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
      <ContentSection title="International users" className="md:col-span-2">
        <p>
          ZANCTA is reachable worldwide and prices only in Indian rupees, with no
          EU-specific domain, language, or marketing. Under the General Data Protection
          Regulation and UK GDPR, a non-EU/UK site is generally reached only where it
          intentionally targets EU/UK-based visitors, not merely because the site is
          accessible from there. Based on that standard, GDPR/UK GDPR do not currently
          appear to apply to ZANCTA; that assessment would need to be revisited if
          EU/UK-directed pricing or marketing is introduced.
        </p>
        <p>
          The California Consumer Privacy Act and its amendments apply only to
          businesses meeting a revenue or data-volume threshold (broadly, over roughly
          $26 million in annual revenue, or buying/selling/sharing personal information
          of 100,000 or more California consumers or households in a year). ZANCTA, as
          an individual-operator product at its current scale, does not appear to meet
          any of those thresholds.
        </p>
      </ContentSection>
      <ContentSection title="Contact for privacy questions" className="md:col-span-2">
        <p>
          Privacy questions: <a href={`mailto:${LEGAL_PUBLIC.privacyEmail}`} className="underline">{LEGAL_PUBLIC.privacyEmail}</a>.
          Support: <a href={`mailto:${LEGAL_PUBLIC.supportEmail}`} className="underline">{LEGAL_PUBLIC.supportEmail}</a>.
          Security: <a href={`mailto:${LEGAL_PUBLIC.securityEmail}`} className="underline">{LEGAL_PUBLIC.securityEmail}</a>.
          Self-service pages: <Link href="/help" className="underline">Help</Link>, <Link href="/contact" className="underline">Contact</Link>, <Link href="/security" className="underline">Security</Link>.
        </p>
        <p>
          India&apos;s Digital Personal Data Protection Act, 2023 and its 2025 Rules (MeitY)
          were notified on a staggered timeline. The substantive Data Fiduciary
          obligations — including Rule 9, which would require publishing contact
          information for a person who can answer questions about personal-data
          processing — are not yet in force; the government&apos;s notification sets
          their commencement 18 months after notification, in mid-2027. Publishing{" "}
          {LEGAL_PUBLIC.privacyEmail} as the privacy contact today is a voluntary step
          taken ahead of that date, not a claim of present-day statutory designation. No
          Data Protection Officer or grievance officer is designated here. This notice
          is not legal advice and has not been lawyer-reviewed.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
