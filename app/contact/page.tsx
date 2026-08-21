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
  { href: `mailto:${LEGAL_PUBLIC.supportEmail}`, label: LEGAL_PUBLIC.supportEmail, topic: "Product, technical, account" },
  { href: `mailto:${LEGAL_PUBLIC.privacyEmail}`, label: LEGAL_PUBLIC.privacyEmail, topic: "Privacy requests" },
  { href: `mailto:${LEGAL_PUBLIC.securityEmail}`, label: LEGAL_PUBLIC.securityEmail, topic: "Security reports" },
  { href: `mailto:${LEGAL_PUBLIC.billingEmail}`, label: LEGAL_PUBLIC.billingEmail, topic: "Billing and refunds" },
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
            <p className="mt-3 text-lg text-muted-foreground">Tell us what you need.</p>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
              For product questions, account issues, billing, privacy requests, security reports, refunds, and other
              enquiries, choose the route that matches your request. ZANCTA is an independently operated product. A
              response-time SLA is not published.
            </p>
          </header>

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

          <section className="mt-16 border-t border-border pt-10">
            <h2 className="text-base font-semibold tracking-[-0.01em]">Direct email channels</h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {CHANNELS.map((channel) => (
                <li key={channel.label} className="border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground">{channel.topic}</p>
                  <a href={channel.href} className="mt-1 inline-block text-sm underline">
                    {channel.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-12 grid gap-8 border-t border-border pt-10 md:grid-cols-3">
            <div>
              <h2 className="text-base font-semibold tracking-[-0.01em]">Help and FAQ</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Self-service first: <Link href="/help" className="underline">Help</Link>,{" "}
                <Link href="/faq" className="underline">FAQ</Link>,{" "}
                <Link href="/refund-and-cancellation" className="underline">Refunds</Link>, and each tool page.
              </p>
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-[-0.01em]">Security and privacy</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Do not send passwords, session tokens, payment-card data, or private files by email. Privacy questions:
                {` `}
                <a href={`mailto:${LEGAL_PUBLIC.privacyEmail}`} className="underline">
                  {LEGAL_PUBLIC.privacyEmail}
                </a>
                . Security reports:{" "}
                <a href={`mailto:${LEGAL_PUBLIC.securityEmail}`} className="underline">
                  {LEGAL_PUBLIC.securityEmail}
                </a>
                .
              </p>
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-[-0.01em]">Operator</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {LEGAL_PUBLIC.operatorName}
                <br />
                Individual operator
              </p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                No company, registered office, or postal address is published. This page is prepared product disclosure,
                not legal advice, and has not been lawyer-reviewed.
              </p>
            </div>
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
