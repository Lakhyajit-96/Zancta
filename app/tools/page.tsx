import { LayoutChrome } from "@/components/layout/chrome";
import { ToolGrid } from "@/components/marketing/tool-grid";

export const metadata = { title: "Tools" };

export default function ToolsPage() {
  return (
    <LayoutChrome showNav={true} showFooter={true}>
      <main>
      <section className="border-b">
        {/* ZANCTA Brand Header */}
        <div className="mx-auto max-w-6xl px-6 py-12 text-center">
          <img 
            src="/assets/zancta-brand/logos/primary-wordmark.svg" 
            alt="ZANCTA" 
            className="h-10 w-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-semibold tracking-tight">Tool Suite</h1>
          <p className="mt-2 text-sm text-muted-foreground">Nine working local PDF/image tools plus one clearly marked deferred capability.</p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-xl border bg-surface p-8 mt-8">
          <ToolGrid />
        </div>
      </section>
      </main>
    </LayoutChrome>
  );
}
