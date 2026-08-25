import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/marketing/content-page";
import { ShieldVisual } from "@/components/marketing/visuals";
import { LEGAL_PUBLIC } from "@/lib/legal-public";

import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/privacy", {
  title: "Privacy notice for local file tools",
  description: "How ZANCTA handles local files, accounts, cookies, payments, email, Google sign-in, and Google API data used by the site operator.",
});

export default function PrivacyPage() {
  return (
    <ContentPage
      eyebrow="/privacy"
      title="How ZANCTA handles privacy."
      intro={`Last updated: ${LEGAL_PUBLIC.lastUpdated}. ${LEGAL_PUBLIC.identitySummary} This page describes current product behavior.`}
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
        <p>Essential and security cookies are used for authentication (session, CSRF, OAuth state/PKCE) and, when you start Google or GitHub from Sign in or Sign up, a short-lived OAuth intent cookie. When the site operator starts a Google API connection from the ADMIN dashboard, a short-lived operator OAuth cookie is used to complete that connection. Those cookies are required for the account or operator connection to work and are not advertising cookies.</p>
        <p>A consent preference may be stored in localStorage so we remember whether optional analytics is allowed. Local tool results stay in the browser session for preview or download and are released when you leave or clear that workspace.</p>
      </ContentSection>
      <ContentSection title="Analytics and advertising">
        <p>No advertising network is enabled. Google Analytics (GA4) loads only if a measurement ID is configured and you choose Allow analytics. Client events may include page_view, tool_view, tool_used, processing_started, processing_completed, processing_failed, processing_cancelled, download_completed, pricing_view, and related product events. Payloads are limited to tool slugs, language codes, and similar non-content fields. The product does not send file bytes, filenames, extracted PDF text, OCR output, email addresses, or payment details. Billing events are recorded server-side. There is no ads.txt file because ads are not authorized to sell this inventory. This optional measurement tag is separate from the site-operator Google Analytics API access described below.</p>
      </ContentSection>
      <ContentSection title="Google API Data — Site Operator Integrations" className="md:col-span-2">
        <p>
          This section applies only to ZANCTA&apos;s site-operator (ADMIN) functionality. It does not apply to ordinary Free or Premium ZANCTA users, and it is not part of public Sign in with Google.
        </p>
        <p>
          Public Sign in with Google is a separate authentication path. It lets a person create or sign in to a ZANCTA account. Ordinary ZANCTA users who sign in with Google do not grant ZANCTA access to Google Analytics or Google Search Console.
        </p>
        <p>
          When an authorized ZANCTA site operator connects Google services from the ADMIN dashboard, ZANCTA may access Google API data required to operate those connected integrations. That data is used only to provide the operator/admin integrations and related operator dashboards inside ZANCTA. ZANCTA does not use this Google API data for advertising, to profile ordinary ZANCTA users, or to sell data.
        </p>
        <p>
          <strong className="font-semibold text-foreground">Google account identification.</strong> The operator connection may use basic Google identity information, such as the connected account&apos;s email address and Google account identifier, to show which Google account is connected.
        </p>
        <p>
          <strong className="font-semibold text-foreground">Google Analytics 4.</strong> The operator integration may access Google Analytics data needed for the ZANCTA admin analytics dashboard. That can include Analytics account and property information used to identify the connected property, property configuration metadata used by the dashboard, and reporting data such as aggregated users, sessions, events, pages, countries, devices, and similar breakdowns, including a limited realtime active-users view where the dashboard requests it.
        </p>
        <p>
          <strong className="font-semibold text-foreground">Google Search Console.</strong> The operator integration may access Search Console information needed for the ZANCTA admin dashboard, including verified properties or sites visible to the connected account, search performance data (for example queries, pages, countries, devices, and related totals), URL inspection results for URLs the operator inspects through the dashboard, sitemap listing information, and submission of ZANCTA&apos;s canonical sitemap URL to Search Console.
        </p>
        <p>
          <strong className="font-semibold text-foreground">Who can access this data.</strong> These Google API integrations are ADMIN/operator functionality. They are not available to ordinary Free or Premium ZANCTA users. Google API data retrieved for the operator dashboard is not exposed as another user&apos;s public account data. The public Google sign-in flow is separate from this operator Google API integration.
        </p>
        <p>
          <strong className="font-semibold text-foreground">Storage and security.</strong> OAuth access and refresh tokens required for the operator Google integration are stored encrypted at rest using ZANCTA&apos;s server-side encryption. Cached dashboard snapshots of retrieved Google API responses may also be stored so the admin dashboard can display recent results.
        </p>
        <p>
          <strong className="font-semibold text-foreground">Sharing.</strong> ZANCTA does not sell this Google API data and does not share it with third parties for their independent use. The data is requested from Google&apos;s APIs and used inside ZANCTA&apos;s operator tools. Google continues to process the underlying Analytics and Search Console data under Google&apos;s own terms.
        </p>
        <p>
          <strong className="font-semibold text-foreground">Disconnect and retention.</strong> The operator can disconnect the Google integration from the ZANCTA admin interface. When that happens, ZANCTA attempts to revoke the current Google access token with Google, then clears stored access and refresh tokens and related Google account identity fields from the operator connection record, marks the connection as disconnected, and deletes cached Google dashboard snapshots. The connection record itself is kept in a disconnected state; some non-secret property identifiers used to select Analytics or Search Console properties may remain on that record. Operational audit entries that a connection, disconnection, or sitemap submission occurred may be retained; a connection audit entry may include the connected Google account email. Disconnecting Google in the admin interface is separate from deleting a ZANCTA user account; deleting a ZANCTA account does not, by itself, disconnect the operator Google integration.
        </p>
        <p>
          <strong className="font-semibold text-foreground">Revocation by the Google account holder.</strong> The connected Google account can revoke ZANCTA&apos;s access in Google&apos;s account permissions. After revocation at Google, ZANCTA cannot continue calling those Google APIs with the previous authorization. ZANCTA cannot control Google&apos;s copy of Analytics or Search Console data.
        </p>
      </ContentSection>
      <ContentSection title="Payments and email">
        <p>
          When enabled and configured, {LEGAL_PUBLIC.paymentProviderName} handles checkout and billing as {LEGAL_PUBLIC.paymentProviderRole}, and an email provider delivers verification or password-reset messages. Those providers receive only the information needed for their service. See{" "}
          <Link href="/refund-and-cancellation" className="underline">Refunds and cancellation</Link>.
        </p>
      </ContentSection>
      <ContentSection title="Retention and deletion">
        <p>ZANCTA does not retain selected file bytes for implemented local processing. Authenticated account deletion removes associated application account records through the account flow, after attempting to cancel any known Dodo subscription at period end. Payment rows may remain without a user id for billing reconciliation. {LEGAL_PUBLIC.paymentProviderName} retains customer, payment, subscription, and checkout records as Merchant of Record; ZANCTA cannot delete those provider records. Google API tokens and snapshots used by the site-operator integration are handled as described in Google API Data — Site Operator Integrations, including on disconnect.</p>
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
          The operator is identified in <Link href="/terms" className="underline">Terms</Link>.
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
          Data Protection Officer is designated.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
