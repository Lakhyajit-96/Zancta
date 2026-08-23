import Link from "next/link";
import { Footer, Navigation } from "@/components/marketing/nav";
import { ContentSection } from "@/components/marketing/content-page";
import { MaskLines, Reveal, StaggerGroup, StaggerItem } from "@/components/marketing/motion";

import { pageMeta } from "@/lib/seo";
import { LEGAL_PUBLIC } from "@/lib/legal-public";

export const metadata = pageMeta("/about", {
  title: "About local-first PDF and image tools",
  description: "Why ZANCTA builds local-first tools for practical document and image work.",
});

const VALUES = [
  "Privacy first — selected file bytes stay in the browser for implemented local workflows.",
  "Clear limits — restrained design, legible formats, honest states.",
  "Transparent by design — deferred work stays labelled as deferred.",
  "Useful without an account — free tools work immediately.",
];

export default function AboutPage() {
  return (
    <>
      <Navigation />
      <main className="relative overflow-hidden">
        <div aria-hidden className="editorial-grid pointer-events-none absolute inset-x-0 top-0 h-[32rem] opacity-35" />
        <section className="relative mx-auto max-w-[80rem] px-5 py-16 md:px-8 md:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="eyebrow-path">/about</p>
              <MaskLines
                as="h1"
                className="display-serif mt-5 text-4xl md:text-5xl"
                lines={[<>Built for privacy.</>, <>Useful without an account.</>]}
              />
              <Reveal delay={0.2}>
                <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground">
                  ZANCTA was created with one simple belief: you should be able to work with your files without giving
                  up your privacy. Useful file tools, with a smaller trust boundary.
                </p>
              </Reveal>
              <StaggerGroup className="mt-8 space-y-3">
                {VALUES.map((value) => (
                  <StaggerItem key={value}>
                    <p className="flex items-start gap-3 text-sm leading-7 text-muted-foreground">
                      <span aria-hidden className="mt-0.5 text-accent">✓</span>
                      {value}
                    </p>
                  </StaggerItem>
                ))}
              </StaggerGroup>
            </div>
            <Reveal delay={0.15} className="relative overflow-hidden rounded-xl border border-border-strong">
              <img
                src="/assets/zancta-brand/hero/zancta-about-ridge.jpg"
                alt="A dark mountain ridge with a faint rose rim light — the quiet, local boundary ZANCTA keeps around your files"
                width={1264}
                height={848}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
              <p className="absolute bottom-4 left-5 font-mono text-[0.65rem] tracking-[0.14em] text-muted-foreground">
                The quiet boundary — your device
              </p>
            </Reveal>
          </div>

          <div className="mt-20 border-t border-border pt-14">
            <MaskLines
              as="h2"
              className="display-serif max-w-2xl text-3xl md:text-5xl"
              lines={[<>Why ZANCTA exists</>]}
            />
            <div className="content-sections mt-12 grid gap-x-16 gap-y-12 md:grid-cols-2">
              <ContentSection title="Why it exists">
                <p>
                  Many file utilities start by asking for a document. ZANCTA starts with a narrower question: can a
                  supported task happen in the browser on the device that already holds the file? When it can, that is
                  where the work should stay.
                </p>
                <p>
                  The result is a collection of focused utilities for routine PDF and image work: clear inputs, visible
                  limits, local output, and no invented success state when a task cannot be completed.
                </p>
              </ContentSection>
              <ContentSection title="What you can use today">
                <p>
                  The current workspace includes PDF merge, split, compression, page rendering, image-to-PDF, image
                  compression, conversion, resizing, metadata cleaning, local English OCR, and text extraction from
                  text-native PDFs. Background removal remains deferred rather than silently switching to a cloud
                  service.
                </p>
              </ContentSection>
              <ContentSection title="A practical privacy philosophy">
                <p>
                  For implemented local tools, selected file bytes are processed in the browser and are not uploaded to
                  ZANCTA for processing. That is a specific product boundary, not a claim that a device, browser
                  extension, backup service, or future opt-in feature is risk-free.
                </p>
              </ContentSection>
              <ContentSection title="Designed for clarity">
                <p>
                  Good utility software should make its limits legible. ZANCTA shows supported formats, size limits,
                  progress where an engine can report it, and honest error states. The visual system is deliberately
                  restrained so the task, not the interface, remains in focus.
                </p>
              </ContentSection>
              <ContentSection title="Support">
                <p>
                  {LEGAL_PUBLIC.identitySummary} Support, privacy, security, and billing contacts are on{" "}
                  <Link href="/contact" className="underline">Contact</Link>. Product terms and privacy practices are on{" "}
                  <Link href="/terms" className="underline">Terms</Link> and{" "}
                  <Link href="/privacy" className="underline">Privacy</Link>.
                </p>
              </ContentSection>
              <ContentSection title="Responsible scope" className="md:col-span-2">
                <p>
                  ZANCTA does not manufacture customer stories, usage numbers, awards, or certifications. Product claims
                  are limited to the workflows that are implemented and tested, and deferred work stays labelled as
                  deferred.
                </p>
              </ContentSection>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
