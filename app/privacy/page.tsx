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
        <p>That file-byte boundary is not a claim that ZANCTA collects no data. Accounts, email, optional analytics consent, security and audit records, and the other categories on this page are separate from selected file bytes.</p>
        <p>This boundary does not control browser extensions, malware, operating-system backups, device sharing, or future features that are explicitly offered as optional cloud services.</p>
      </ContentSection>
      <ContentSection title="Account information">
        <p>If you create an account, the application stores information needed for authentication and entitlements, such as email address, optional name, password hash, sessions, verification tokens, and password-reset tokens. Passwords are not stored in plain text.</p>
        <p>If you sign in with Google or GitHub, the application may also store the name and profile image those providers supply, and OAuth account records needed to complete sign-in, including tokens the identity provider issues for that authentication. Public Sign in with Google does not grant ZANCTA access to Google Analytics or Google Search Console. Public GitHub sign-in is likewise only for authentication. Those public login paths are separate from the ADMIN-only operator integrations described below.</p>
      </ContentSection>
      <ContentSection title="Cookies and browser storage">
        <p>Essential and security cookies are used for authentication (session, CSRF, OAuth state/PKCE) and, when you start Google or GitHub from Sign in or Sign up, a short-lived OAuth intent cookie. When the site operator starts a Google API or Bing Webmaster connection from the ADMIN dashboard, a short-lived httpOnly operator OAuth cookie is used to complete that connection. Those cookies are required for the account or operator connection to work and are not advertising cookies.</p>
        <p>A consent preference may be stored in localStorage so we remember whether optional analytics is allowed. Local tool results stay in the browser session for preview or download and are released when you leave or clear that workspace.</p>
      </ContentSection>
      <ContentSection title="Analytics and advertising">
        <p>No advertising network is enabled. Google Analytics (GA4) loads only if a measurement ID is configured and you choose Allow analytics. Client events may include page_view, tool_view, tool_used, processing_started, processing_completed, processing_failed, processing_cancelled, download_completed, pricing_view, and related product events. Payloads are limited to tool slugs, language codes, and similar non-content fields. The product does not send file bytes, filenames, extracted PDF text, OCR output, email addresses, or payment details. Billing events are recorded server-side. There is no ads.txt file because ads are not authorized to sell this inventory. This optional measurement tag is separate from the site-operator Google Analytics API access described below. The measurement script is loaded from Google Tag Manager&apos;s gtag endpoint when consent is granted; fonts used by the site are served from ZANCTA itself, not from a Google Fonts CDN.</p>
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
        <p>
          Bing Webmaster is a separate ADMIN-only operator integration and is described in Bing Webmaster — Site Operator Integrations.
        </p>
      </ContentSection>
      <ContentSection title="Bing Webmaster — Site Operator Integrations" className="md:col-span-2">
        <p>
          This section applies only to ZANCTA&apos;s site-operator (ADMIN) functionality. It does not apply to ordinary Free or Premium ZANCTA users, and it is not part of public Google or GitHub sign-in.
        </p>
        <p>
          When an authorized ZANCTA site operator connects Bing Webmaster from the ADMIN dashboard, ZANCTA uses Bing Webmaster OAuth with the webmaster.manage permission so the operator dashboard can manage the connected site. A short-lived httpOnly cookie named zancta_op_oauth_bing is used to complete that connection. It is not an advertising cookie.
        </p>
        <p>
          ZANCTA stores an operator connection record with encrypted access and refresh tokens and the selected site URL. The operator dashboard may retrieve Bing Webmaster data needed to operate that integration, including the connected account&apos;s site list, query and page statistics, crawl information, sitemap or feed information, related keywords, URL-submission quota, and URL submission for the selected site. That data is used only to provide the operator Bing dashboard inside ZANCTA. ZANCTA does not use this Bing Webmaster data for advertising, to profile ordinary ZANCTA users, or to sell data.
        </p>
        <p>
          Bing dashboard results are currently retrieved from Bing when the operator opens the dashboard rather than stored as cached dashboard snapshots. Cached snapshots are used for the Google operator integration described above. On Bing disconnect, ZANCTA still deletes any snapshots stored for that provider.
        </p>
        <p>
          These Bing Webmaster integrations are ADMIN/operator functionality. They are not available to ordinary Free or Premium ZANCTA users. Bing data retrieved for the operator dashboard is not exposed as another user&apos;s public account data.
        </p>
        <p>
          OAuth access and refresh tokens required for the operator Bing integration are stored encrypted at rest using ZANCTA&apos;s server-side encryption. The operator connection is not part of an ordinary user account record.
        </p>
        <p>
          ZANCTA does not sell this Bing Webmaster data and does not share it with third parties for their independent use. The data is requested from Bing Webmaster APIs and used inside ZANCTA&apos;s operator tools. Microsoft/Bing continues to process the underlying Webmaster data under its own terms.
        </p>
        <p>
          The operator can disconnect Bing from the ZANCTA admin interface. When that happens, ZANCTA clears stored access and refresh tokens and related connection fields, marks the connection as disconnected, and deletes any cached snapshots for that provider. ZANCTA does not currently send a Bing-side token revocation request. The connected Bing/Microsoft account can revoke ZANCTA&apos;s access in that account&apos;s permissions. After revocation there, ZANCTA cannot continue calling those APIs with the previous authorization. ZANCTA cannot control Bing&apos;s copy of Webmaster data. Operational audit entries that a connection, disconnection, or URL submission occurred may be retained. Disconnecting Bing in the admin interface is separate from deleting a ZANCTA user account; deleting a ZANCTA account does not, by itself, disconnect the operator Bing integration.
        </p>
      </ContentSection>
      <ContentSection title="Contact form">
        <p>
          The Contact form collects name, email, topic, subject, message, and an optional account email if you provide one. ZANCTA uses this to route the enquiry to the matching mailbox and to reply. Submissions are sent through Resend, the current production email provider: an internal notification to ZANCTA and an acknowledgement to you. Contact submissions are not stored as a ZANCTA application database record. Resend may retain copies according to its own practices; ZANCTA does not currently delete those provider copies. Contact submissions are subject to rate limiting that may use IP address and email-derived identifiers for abuse prevention.
        </p>
      </ContentSection>
      <ContentSection title="Transactional email">
        <p>
          Production transactional email is delivered by Resend. Active categories currently include email verification, password reset, password-changed confirmation, welcome, account-deletion confirmation code and deletion notice, contact acknowledgement and internal contact notification, and billing notices (subscription activated, renewed, cancelled, payment failed, and refund processed) when the payment provider sends the corresponding events. A generic security-notification email template exists in the product but is not currently invoked. Resend processes the recipient address and message content for delivery and may retain copies according to its practices.
        </p>
      </ContentSection>
      <ContentSection title="Payments and email">
        <p>
          When enabled and configured, {LEGAL_PUBLIC.paymentProviderName} handles checkout and billing as {LEGAL_PUBLIC.paymentProviderRole}. ZANCTA does not store card data. Live checkout is not currently enabled. When checkout is enabled, {LEGAL_PUBLIC.paymentProviderName} receives the information needed to process payment, and ZANCTA may store local payment records such as provider customer and subscription identifiers, amounts, currency, and status. See{" "}
          <Link href="/refund-and-cancellation" className="underline">Refunds and cancellation</Link>.
        </p>
      </ContentSection>
      <ContentSection title="Security, audit, and rate limiting">
        <p>
          For security, abuse prevention, rate limiting, auditing, and troubleshooting, ZANCTA may record operational events such as account creation, verification, password reset, account deletion, payment checkout or cancellation actions, and operator integration connect or disconnect. Those records can include IP address and, in some cases, browser user-agent.
        </p>
        <p>
          Production rate limiting uses Upstash Redis and may process identifiers such as IP address and, where applicable, email-derived rate-limit data. Rate-limit entries expire after the applicable rate window.
        </p>
        <p>
          Application audit records are not currently subject to an automatic purge job. They are retained as necessary for the purposes described above and subject to applicable operational, security, legal, and provider retention requirements.
        </p>
      </ContentSection>
      <ContentSection title="Hosting and processors">
        <p>
          ZANCTA is hosted on Vercel. Vercel provides application delivery and may process request metadata, such as IP addresses, as part of hosting and request infrastructure. Application database records described on this page are stored in PostgreSQL hosted by Supabase. Selected PDF and image file bytes for implemented local tools are not sent to Vercel or Supabase for tool processing.
        </p>
        <p>
          Production-path providers currently include: Vercel (hosting and request infrastructure); Supabase PostgreSQL (application database); Resend (transactional and contact email); Upstash Redis (rate limiting and abuse prevention); {LEGAL_PUBLIC.paymentProviderName} (payments and {LEGAL_PUBLIC.paymentProviderRole} when live checkout is enabled; checkout is not currently enabled); Google (public authentication, optional consented GA4 measurement, and ADMIN-only operator APIs described above); GitHub (optional public authentication); and Bing Webmaster (ADMIN-only operator integration described above).
        </p>
      </ContentSection>
      <ContentSection title="Retention and deletion">
        <p>ZANCTA does not retain selected file bytes for implemented local processing.</p>
        <p>
          Authenticated account deletion removes the user record and associated cascading application records through the account flow. When live checkout is enabled, ZANCTA first attempts to cancel any known Dodo subscription at period end; if that provider cancel cannot be confirmed, the account is not deleted. Live checkout is not currently enabled, so account deletion does not send a cancel request to Dodo and local deletion still proceeds. Cascading records include sessions, OAuth account rows, entitlements, verification, password-reset, and account-deletion tokens, and related payment customer, subscription, and checkout rows.
        </p>
        <p>
          Account deletion does not erase every related record. Payment rows may remain without a user id for billing reconciliation. Payment webhook processing records are not linked to a user account and may remain. Audit records may remain with the user identifier removed. A derived record of a deleted Google or GitHub sign-in identity may remain so that identity cannot silently recreate a ZANCTA account; that record may later be consumed if the same identity is used again to sign up, and there is no automatic purge job. Operator Google and Bing connections, and any operator dashboard snapshots, are not part of an ordinary user account and are not cleared by deleting that account. They are managed separately from the admin disconnect controls described above.
        </p>
        <p>
          Verification links expire after 24 hours, password-reset links after 60 minutes, and account-deletion confirmation codes after 15 minutes. Rate-limit data expires with the applicable rate window. There is no automatic purge job for audit records, webhook processing records, or deleted-identity records. Other application records without a fixed expiry are retained as necessary for the purposes described on this page and subject to applicable operational, security, legal, and provider retention requirements.
        </p>
        <p>
          {LEGAL_PUBLIC.paymentProviderName} retains customer, payment, subscription, and checkout records as Merchant of Record; ZANCTA cannot delete those provider records. Resend, Google, GitHub, Bing/Microsoft, Vercel, Supabase, and Upstash may retain their own copies according to their practices. ZANCTA cannot necessarily delete those provider-side copies. Google API tokens and snapshots used by the site-operator integration are handled as described in Google API Data — Site Operator Integrations, including on disconnect. Bing Webmaster tokens are handled as described in Bing Webmaster — Site Operator Integrations.
        </p>
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
