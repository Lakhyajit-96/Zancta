import { ContentPage, ContentSection } from "@/components/marketing/content-page";
import { AdSlot } from "@/components/marketing/ad-slot";

export const metadata = { title: "Features", description: "A practical overview of ZANCTA's local-first PDF and image tools." };

export default function FeaturesPage() {
  return <ContentPage eyebrow="PRODUCT FEATURES" title="A focused toolkit for everyday files." intro="ZANCTA keeps the important part of a file utility visible: what it accepts, what it produces, and where processing happens.">
    <div className="grid gap-4 md:grid-cols-2"><ContentSection title="PDF utilities"><p>Merge, split, compress, render PDF pages to images, or build a PDF from images. The pages show supported inputs and batch limits before processing.</p></ContentSection><ContentSection title="Image utilities"><p>Compress, convert between supported image formats, resize, and clean common metadata through local browser processing.</p></ContentSection><ContentSection title="Privacy boundary"><p>Supported local operations use files selected in the browser and do not send file bytes to ZANCTA servers. Network requests still occur for the page and its assets.</p></ContentSection><ContentSection title="Account and Premium"><p>Account access is for entitlement and settings. Premium billing and provider behavior are shown in pricing, but payment implementation remains provider-dependent.</p></ContentSection></div>
    <AdSlot id="features-content" />
  </ContentPage>;
}
