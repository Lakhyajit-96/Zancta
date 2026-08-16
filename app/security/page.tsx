import { ContentPage, ContentSection } from "@/components/marketing/content-page";

export const metadata = { title: "Security", description: "Implemented security controls in the ZANCTA MVP." };

export default function SecurityPage() {
  return <ContentPage eyebrow="SECURITY" title="Implemented controls, stated without certification language." intro="ZANCTA uses several practical controls, but this page does not claim SOC 2, ISO 27001, GDPR, HIPAA, or PCI certification.">
    <ContentSection title="Application and transport"><p>The deployed application is served over HTTPS and uses security headers including CSP, HSTS, frame protection, content-type protection, and a permissions policy. Header behavior should be rechecked whenever the deployment configuration changes.</p></ContentSection>
    <ContentSection title="Authentication and authorization"><p>Auth.js credentials flow, hashed passwords, verification/reset tokens, secure session handling, authenticated account operations, and entitlement checks are implemented in the application. Sensitive configuration remains server-side.</p></ContentSection>
    <ContentSection title="Abuse and integrations"><p>Rate limiting is present for relevant routes. Payment webhooks verify provider signatures and use idempotency records. The database layer keeps account and entitlement operations on the server.</p></ContentSection>
    <ContentSection title="Local file boundary"><p>Implemented local tools do not upload selected file bytes for processing. This is an architectural behavior, not a formal certification. Background removal remains deferred and does not claim a cloud fallback.</p></ContentSection>
    <ContentSection title="Reporting"><p>A public security inbox is not configured yet. Until a real reporting channel exists, do not publish a placeholder address or imply a monitored response commitment.</p></ContentSection>
  </ContentPage>;
}
