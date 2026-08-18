import { ContentPage, ContentSection } from "@/components/marketing/content-page";

export const metadata = { title: "Security", description: "The security controls implemented in the current ZANCTA application.", alternates: { canonical: "/security" } };

export default function SecurityPage() {
  return <ContentPage eyebrow="SECURITY" title="Specific controls, stated without theatre." intro="ZANCTA uses practical application protections. This page does not claim a certification, audit, penetration test, or compliance program that has not been independently verified.">
    <ContentSection title="Local processing boundary"><p>Implemented local tools process selected file bytes in the browser and do not upload those bytes to ZANCTA for processing. This reduces the need to transmit routine documents and images, but it is not a formal certification or a guarantee about unrelated software on a device.</p></ContentSection>
    <ContentSection title="Transport and browser protections"><p>The deployed application uses HTTPS and security headers including Content Security Policy, frame protection, content-type protection, referrer policy, permissions policy, and HSTS in production. CSP restricts script, connection, and worker origins to support local browser processing.</p></ContentSection>
    <ContentSection title="Accounts and secrets"><p>Authentication uses credential handling, password hashing, session controls, verification and reset tokens, and authenticated account actions. Sensitive provider configuration is intended to remain server-side rather than in browser code.</p></ContentSection>
    <ContentSection title="Payments and abuse controls"><p>Payment webhook handling verifies provider signatures and records idempotent events. Relevant server routes use rate limiting. These controls require live-provider and production-environment verification before they are represented as an operational payment service.</p></ContentSection>
    <ContentSection title="Errors and data handling"><p>Tool failures are designed to return honest error states rather than fabricated output. Local file content is not logged by the local tool workflows. Account deletion is available through the authenticated account experience where supported.</p></ContentSection>
    <ContentSection title="Reporting" className="md:col-span-2"><p>A monitored public security contact is not configured yet. Do not send private files, passwords, tokens, or payment information through an unconfigured channel. Publishing a monitored reporting method is a required launch step.</p></ContentSection>
  </ContentPage>;
}
