import { Navigation } from "@/components/marketing/nav";
import { ZanctaHero } from "@/components/homepage/zancta-hero";
import { PrivacyArchitectureSection } from "@/components/homepage/privacy-architecture";
import { ToolEcosystemSection } from "@/components/homepage/tool-ecosystem";
import { PremiumPreviewSection } from "@/components/homepage/premium-preview";
import { Footer } from "@/components/marketing/nav";

export default function Home() {
  return (
    <>
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
