import { Navigation } from "@/components/marketing/nav";
import { ZanctaHero } from "@/components/homepage/zancta-hero";
import { PrivacyArchitectureSection } from "@/components/homepage/privacy-architecture";
import { ToolEcosystemSection } from "@/components/homepage/tool-ecosystem";
import { PremiumPreviewSection } from "@/components/homepage/premium-preview";
import { Footer } from "@/components/marketing/nav";
import { HOMEPAGE_DESCRIPTION, jsonLdOrganization, jsonLdWebSite, pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/", { description: HOMEPAGE_DESCRIPTION });
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization()) }} />
      <Navigation />
      <main id="main-content" tabIndex={-1}>
        <ZanctaHero />
        <PrivacyArchitectureSection />
        <ToolEcosystemSection />
        <PremiumPreviewSection />
      </main>
      <Footer />
    </>
  );
}
