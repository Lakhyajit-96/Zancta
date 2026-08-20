import { Navigation } from "@/components/marketing/nav";
import { ZanctaHero } from "@/components/homepage/zancta-hero";
import { PrivacyArchitectureSection } from "@/components/homepage/privacy-architecture";
import { ToolEcosystemSection } from "@/components/homepage/tool-ecosystem";
import { PremiumPreviewSection } from "@/components/homepage/premium-preview";
import { Footer } from "@/components/marketing/nav";
import { PUBLIC_SITE_URL } from "@/lib/seo";

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ZANCTA",
  url: PUBLIC_SITE_URL,
  description: "Privacy-first PDF and image tools that run in the browser.",
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <Navigation />
      <main>
        <ZanctaHero />
        <PrivacyArchitectureSection />
        <ToolEcosystemSection />
        <PremiumPreviewSection />
      </main>
      <Footer />
    </>
  );
}
