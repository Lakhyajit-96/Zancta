import { ContentPage, ContentSection } from "@/components/marketing/content-page";

export const metadata = { title: "About", description: "Why ZANCTA builds local-first tools for practical document and image work.", alternates: { canonical: "/about" } };

export default function AboutPage() {
  return <ContentPage eyebrow="ABOUT ZANCTA" title="Useful file tools, with a smaller trust boundary." intro="ZANCTA is a local-first workspace for people who need to work with documents and images without treating an upload as the default.">
    <ContentSection title="Why it exists"><p>Many file utilities start by asking for a document. ZANCTA starts with a narrower question: can a supported task happen in the browser on the device that already holds the file? When it can, that is where the work should stay.</p><p>The result is a collection of focused utilities for routine PDF and image work: clear inputs, visible limits, local output, and no invented success state when a task cannot be completed.</p></ContentSection>
    <ContentSection title="What you can use today"><p>The current workspace includes PDF merge, split, compression, page rendering, image-to-PDF, image compression, conversion, resizing, metadata cleaning, local English OCR, and text extraction from text-native PDFs. Background removal remains deferred rather than silently switching to a cloud service.</p></ContentSection>
    <ContentSection title="A practical privacy philosophy"><p>For implemented local tools, selected file bytes are processed in the browser and are not uploaded to ZANCTA for processing. That is a specific product boundary, not a claim that a device, browser extension, backup service, or future opt-in feature is risk-free.</p></ContentSection>
    <ContentSection title="Designed for clarity"><p>Good utility software should make its limits legible. ZANCTA shows supported formats, size limits, progress where an engine can report it, and honest error states. The visual system is deliberately restrained so the task, not the interface, remains in focus.</p></ContentSection>
    <ContentSection title="Responsible scope" className="md:col-span-2"><p>ZANCTA does not manufacture customer stories, usage numbers, awards, or certifications. Product claims are limited to the workflows that are implemented and tested, and deferred work stays labelled as deferred.</p></ContentSection>
  </ContentPage>;
}
