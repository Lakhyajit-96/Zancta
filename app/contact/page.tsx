import Link from "next/link";
import { Footer, Navigation } from "@/components/marketing/nav";
import { MaskLines } from "@/components/marketing/motion";
import { ContactForm } from "@/components/contact/contact-form";
import { CONTACT_TOPICS } from "@/lib/contact/topics";
import { LEGAL_PUBLIC } from "@/lib/legal-public";
import { jsonLdBreadcrumbList, pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/contact", {
  title: "Contact ZANCTA support, privacy, security, and billing",
  description:
    "Tell ZANCTA what you need. Send a product, account, billing, privacy, or security enquiry, or use the published mailboxes.",
});

const CHANNELS = [
  { href: `mailto:${LEGAL_PUBLIC.supportEmail}`, label: LEGAL_PUBLIC.supportEmail, topic: "Customer support" },
  { href: `mailto:${LEGAL_PUBLIC.privacyEmail}`, label: LEGAL_PUBLIC.privacyEmail, topic: "Privacy" },
  { href: `mailto:${LEGAL_PUBLIC.securityEmail}`, label: LEGAL_PUBLIC.securityEmail, topic: "Security" },
  { href: `mailto:${LEGAL_PUBLIC.billingEmail}`, label: LEGAL_PUBLIC.billingEmail, topic: "Billing" },
] as const;

export default function ContactPage() {
  return (
    <>
      <Navigation />
      <main className="relative overflow-hidden">
        <section className="relative mx-auto max-w-[80rem] px-5 py-14 md:px-8 md:py-16">
          <header className="max-w-3xl border-b border-border pb-10">
            <p className="eyebrow-path">/contact</p>
            <MaskLines as="h1" className="display-serif mt-5 text-4xl md:text-5xl" lines={["Contact ZANCTA"]} />
            <p className="mt-3 text-lg text-muted-foreground">{LEGAL_PUBLIC.productDescriptor}</p>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
              {LEGAL_PUBLIC.identitySummary} For product questions, account issues, billing, privacy requests, security
              reports, and refunds, choose the route that matches your request. A response-time SLA is not published.
            </p>
          </header>

          <section className="mt-10 border-b border-border pb-10">
            <h2 className="text-base font-semibold tracking-[-0.01em]">Contact channels</h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {CHANNELS.map((channel) => (
                <li key={channel.label} className="border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground">{channel.topic}</p>
                  <a href={channel.href} className="mt-1 inline-block break-all text-sm underline">
                    {channel.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,38rem)_minmax(0,1fr)] lg:items-start">
            <div>
              <h2 className="text-base font-semibold tracking-[-0.01em]">Send an enquiry</h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
                Check <Link href="/help" className="underline">Help</Link> and the{" "}
                <Link href="/faq" className="underline">FAQ</Link> first when the answer is already documented. Do not
                include passwords, session tokens, payment-card numbers, or uploaded files.
              </p>
              <div className="mt-6">
                <ContactForm />
              </div>
            </div>

            <aside className="space-y-10">
              <section>
                <h2 className="text-base font-semibold tracking-[-0.01em]">Choose the right route</h2>
                <ul className="mt-5 space-y-5">
                  {CONTACT_TOPICS.map((topic) => (
                    <li key={topic.id} className="border-t border-border pt-4">
                      <p className="text-sm font-medium text-foreground">{topic.label}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{topic.belongs}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Destination: {topic.destinationRole}@zancta.tech. {topic.notFor}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            </aside>
          </div>

          <section className="mt-16 grid gap-8 border-t border-border pt-10 md:grid-cols-3">
            <div>
              <h2 className="text-base font-semibold tracking-[-0.01em]">Privacy and security</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Privacy requests:{" "}
                <a href={`mailto:${LEGAL_PUBLIC.privacyEmail}`} className="underline">
                  {LEGAL_PUBLIC.privacyEmail}
                </a>
                . Security reports:{" "}
                <a href={`mailto:${LEGAL_PUBLIC.securityEmail}`} className="underline">
                  {LEGAL_PUBLIC.securityEmail}
                </a>
                . Do not send passwords, session tokens, payment-card data, or private files by email. See{" "}
                <Link href="/privacy" className="underline">Privacy</Link> and{" "}
                <Link href="/security" className="underline">Security</Link>.
              </p>
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-[-0.01em]">Billing and policies</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Billing and refunds:{" "}
                <a href={`mailto:${LEGAL_PUBLIC.billingEmail}`} className="underline">
                  {LEGAL_PUBLIC.billingEmail}
                </a>
                . Legal and policy questions use{" "}
                <a href={`mailto:${LEGAL_PUBLIC.supportEmail}`} className="underline">
                  {LEGAL_PUBLIC.supportEmail}
                </a>
                ,{" "}
                <Link href="/terms" className="underline">Terms</Link>,{" "}
                <Link href="/privacy" className="underline">Privacy</Link>, and{" "}
                <Link href="/refund-and-cancellation" className="underline">Refunds</Link>.
              </p>
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-[-0.01em]">Help resources</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Self-service first: <Link href="/help" className="underline">Help</Link>,{" "}
                <Link href="/faq" className="underline">FAQ</Link>, and each tool page.
              </p>
            </div>
          </section>

          <section className="mt-12 border-t border-border pt-10">
            <h2 className="text-base font-semibold tracking-[-0.01em]">Legal identity</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              {LEGAL_PUBLIC.brand} is operated by {LEGAL_PUBLIC.operatorName}, an {LEGAL_PUBLIC.operatorForm.toLowerCase()}.
              Enquiries are handled through the published mailboxes. Product terms and privacy practices are on{" "}
              <Link href="/terms" className="underline">Terms</Link> and{" "}
              <Link href="/privacy" className="underline">Privacy</Link>.
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Indian consumers can also use the government-run National Consumer Helpline (1915 /{" "}
              <a href="https://consumerhelpline.gov.in" className="underline" rel="noopener noreferrer">
                consumerhelpline.gov.in
              </a>
              ) or file at{" "}
              <a href="https://consumeraffairs.nic.in/edaakhil" className="underline" rel="noopener noreferrer">
                e-Daakhil
              </a>
              .
            </p>
          </section>
        </section>
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            jsonLdBreadcrumbList([
              { name: "ZANCTA", path: "/" },
              { name: "Contact", path: "/contact" },
            ])
          ),
        }}
      />
    </>
  );
}
