import { LayoutChrome } from "@/components/layout/chrome";
import { ToolGrid } from "@/components/marketing/tool-grid";

export const metadata = { title: "Tools" };

export default function ToolsPage() {
  return (
    <LayoutChrome showNav={true} showFooter={true}>
      <main>
      <section className="border-b border-border">
        {/* ZANCTA Brand Header */}
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <img 
            src="/assets/zancta-brand/logos/primary-wordmark.svg" 
            alt="ZANCTA" 
            className="mb-8 h-8 w-auto opacity-90 md:h-9"
          />
          <p className="eyebrow">THE WORKSPACE / 01</p>
          <h1 className="mt-5 max-w-2xl text-5xl font-medium tracking-[-0.05em] md:text-7xl">Tool Suite</h1>
          <p className="mt-4 max-w-2xl text-2xl font-light tracking-[-0.03em] text-foreground md:text-3xl">Small tools. Serious privacy.</p>
          <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">Nine working local PDF and image tools, plus one clearly marked deferred capability. Choose a task and keep the file where it belongs.</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
        <div className="border-t border-border pt-8 md:pt-12">
          <ToolGrid />
        </div>
      </section>
      </main>
    </LayoutChrome>
  );
}
