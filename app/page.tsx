import { Navigation } from "@/components/marketing/nav";
import { ZanctaHero } from "@/components/homepage/zancta-hero";
import { PrivacyArchitectureSection } from "@/components/homepage/privacy-architecture";
import { ToolEcosystemSection } from "@/components/homepage/tool-ecosystem";
import { PremiumPreviewSection } from "@/components/homepage/premium-preview";
import { Footer } from "@/components/marketing/nav";
import { jsonLdOrganization, pageMeta, PUBLIC_SITE_URL } from "@/lib/seo";

export const metadata = pageMeta("/", {});
export const dynamic = "force-dynamic";

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ZANCTA",
  url: PUBLIC_SITE_URL,
  description: "PDF and image tools that process supported files in the browser.",
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization()) }} />
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
