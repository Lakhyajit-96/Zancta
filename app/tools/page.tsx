import { LayoutChrome } from "@/components/layout/chrome";
import { Navigation, Footer } from "@/components/marketing/nav";

export const metadata = { title: "Tools — ZANCTA" };

export default function ToolsPage() {
  return (
    <LayoutChrome showNav={true} showFooter={true}>
      <section className="border-b">
        {/* ZANCTA Brand Header */}
        <div className="mx-auto max-w-6xl px-6 py-12 text-center">
          <img 
            src="/assets/zancta-brand/logos/primary-wordmark.svg" 
            alt="ZANCTA" 
            className="h-10 w-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-semibold tracking-tight">Tool Suite</h1>
          <p className="mt-2 text-sm text-muted-foreground">10 local-first PDF and image tools — no upload, no watermark.</p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-xl border bg-surface p-8 mt-8">
          {/* Tool grid will be populated here - using existing tool-grid components but styled with metallic graphite aesthetic */}
          <p className="text-center text-sm text-muted-foreground">Loading tools...</p>
        </div>
      </section>
    </LayoutChrome>
  );
}
