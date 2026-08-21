import { ContentPage, ContentSection } from "@/components/marketing/content-page";
import { ShieldVisual } from "@/components/marketing/visuals";

import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/privacy", {
  title: "Privacy",
  description: "How ZANCTA handles local files, accounts, cookies, payments, email, and future advertising.",
});

export default function PrivacyPage() {
  return <ContentPage eyebrow="/privacy" title="Your privacy is our product." intro="We believe privacy isn't just a policy — it is the way we build. This page describes current product behavior and requires review by the responsible legal owner before a commercial launch." visual={<ShieldVisual />}>
    <ContentSection title="Local file processing"><p>For implemented local PDF and image tools, selected file bytes are read and processed in the browser. ZANCTA does not receive those bytes for processing. Background removal is deferred rather than sending an image to an undisclosed cloud fallback.</p><p>This boundary does not control browser extensions, malware, operating-system backups, device sharing, or future features that are explicitly offered as optional cloud services.</p></ContentSection>
    <ContentSection title="Account information"><p>If you create an account, the application stores information needed for authentication and entitlements, such as email address, optional name, password hash, sessions, verification tokens, and password-reset tokens. Passwords are not stored in plain text.</p></ContentSection>
    <ContentSection title="Cookies and browser storage"><p>Essential and security cookies are used for authentication (session, CSRF, OAuth state/PKCE) and, when you start Google or GitHub from Sign in or Sign up, a short-lived OAuth intent cookie. Those cookies are required for the account to work and are not advertising cookies.</p><p>A consent preference may be stored in localStorage so we remember whether optional analytics is allowed. Local tool results stay in the browser session for preview or download and are released when you leave or clear that workspace.</p></ContentSection>
    <ContentSection title="Analytics and advertising"><p>No advertising network is enabled. Google Analytics (GA4) loads only if a measurement ID is configured and you choose Allow analytics. Allowed events are tool_used (tool slug only), signup, subscription_start, and subscription_cancel. The product does not send file bytes, filenames, extracted PDF text, OCR output, or file-size buckets.</p></ContentSection>
    <ContentSection title="Payments and email"><p>When enabled and configured, a payment provider handles checkout and billing, and an email provider delivers verification or password-reset messages. Those providers receive only the information needed for their service. Live provider configuration and delivery verification are not claimed here unless they have been completed.</p></ContentSection>
    <ContentSection title="Retention and deletion"><p>ZANCTA does not retain selected file bytes for implemented local processing. Authenticated account deletion removes associated application account records through the account flow, after attempting to cancel any known Dodo subscription at period end. Payment rows may remain without a user id for billing reconciliation. Dodo Payments retains customer, payment, subscription, and checkout records as Merchant of Record; ZANCTA cannot delete those provider records. Provider retention, user-rights requests, and jurisdiction-specific retention language require legal review before launch.</p></ContentSection>
    <ContentSection title="Legal review" className="md:col-span-2"><p>Before public commercial use, a legal owner must confirm the operating entity, applicable jurisdictions, provider disclosures, cookie and consent requirements, retention periods, user rights, and a real contact method.</p></ContentSection>
  </ContentPage>;
}
