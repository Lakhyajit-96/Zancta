import { LayoutChrome } from "@/components/layout/chrome";
import { ToolGrid } from "@/components/marketing/tool-grid";
import { MaskLines, Reveal } from "@/components/marketing/motion";

import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/tools", {
  title: "Local PDF and image tools",
  description: "Eleven local PDF and image tools for merge, split, compress, convert, resize, OCR, and text extraction — plus one deferred background-removal page.",
});

export default function ToolsPage() {
  return (
    <LayoutChrome showNav={true} showFooter={true}>
      <main>
      <section className="border-b border-border">
        <div className="mx-auto max-w-[80rem] px-5 py-14 md:px-8 md:py-16">
          <p className="eyebrow-path">/tools</p>
          <MaskLines as="h1" className="display-serif mt-5 max-w-2xl text-4xl md:text-6xl" lines={[<>Tool Suite</>]} />
          <Reveal delay={0.12}>
            <p className="mt-4 max-w-2xl text-2xl font-light tracking-[-0.03em] text-foreground md:text-3xl">Small tools. Serious privacy.</p>
            <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground md:text-lg">Eleven working local PDF and image tools, plus one clearly marked deferred capability. Choose a task and keep the file where it belongs.</p>
          </Reveal>
        </div>
      </section>
      <section className="mx-auto max-w-[80rem] px-5 pb-20 md:px-8">
        <div className="border-t border-border pt-8 md:pt-12">
          <ToolGrid />
        </div>
      </section>
      </main>
    </LayoutChrome>
  );
}
