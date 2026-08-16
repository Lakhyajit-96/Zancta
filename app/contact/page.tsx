import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/marketing/content-page";

export const metadata = { title: "Contact", description: "Current contact and support path for ZANCTA." };

export default function ContactPage() {
  return <ContentPage eyebrow="CONTACT" title="A truthful contact page." intro="ZANCTA does not currently have a public support inbox or staffed response channel configured. We will publish one here when it is real and monitored.">
    <ContentSection title="For product questions"><p>Start with <Link href="/help" className="underline">Help</Link>, <Link href="/faq" className="underline">FAQ</Link>, and the relevant tool page. They describe the current limits and failure states without asking you to send a file to support.</p></ContentSection>
    <ContentSection title="For security concerns"><p>Read the <Link href="/security" className="underline">Security</Link> page for the controls currently implemented. Do not send private files, passwords, tokens, or payment information through an unconfigured channel.</p></ContentSection>
    <ContentSection title="Before launch"><p>A real support and security contact method, response ownership, and retention policy must be configured before public launch claims are made.</p></ContentSection>
  </ContentPage>;
}
