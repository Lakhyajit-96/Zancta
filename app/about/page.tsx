import { ContentPage, ContentSection } from "@/components/marketing/content-page";
import { AdSlot } from "@/components/marketing/ad-slot";

export const metadata = { title: "About", description: "Why ZANCTA exists and what its local-first file tools are designed to do." };

export default function AboutPage() {
  return <ContentPage eyebrow="ABOUT ZANCTA" title="File tools with a smaller trust boundary." intro="ZANCTA is a product for people who need practical PDF and image utilities without automatically sending the files to a remote service.">
    <ContentSection title="Why it exists"><p>Many file utilities begin with an upload. ZANCTA starts with a different question: can this operation happen in the browser on the device that already has the file? For the supported tools, the answer is yes.</p><p>This is a product, not a claim of perfect privacy. Browser extensions, malware, device backups, and future features are outside the promise made by a local tool. We describe the boundary plainly so people can decide whether it fits their work.</p></ContentSection>
    <ContentSection title="Product principles"><ul className="list-disc space-y-2 pl-5"><li>Local by default for the implemented PDF and image operations.</li><li>Useful limits and supported formats shown before a file is selected.</li><li>Honest failure states when a capability is not ready.</li><li>No invented customer numbers, reviews, certifications, or company history.</li></ul></ContentSection>
    <ContentSection title="Current scope"><p>The current product includes ten tool routes. Nine have working local engines covered by real output tests. Background removal is visible as a deferred capability and does not pretend to produce an output.</p></ContentSection>
    <AdSlot id="about-content" className="mt-4" />
  </ContentPage>;
}
