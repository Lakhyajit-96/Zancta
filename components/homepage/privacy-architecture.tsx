"use client";

import { Reveal } from "@/components/marketing/reveal";

const principles = [
  ["Selected in your browser", "Tools receive the file you choose from this device."],
  ["Processed locally", "Implemented local engines work with the selected bytes in the browser."],
  ["Result stays in session", "Outputs are reviewed, copied, or downloaded from the active browser session."],
  ["Scope stays explicit", "A tool page states its formats, limits, and any unsupported cases before processing."],
] as const;

export function PrivacyArchitectureSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <Reveal className="max-w-3xl"><p className="eyebrow">THE PRIVACY BOUNDARY</p><h2 className="mt-4 text-3xl font-medium tracking-[-0.04em] md:text-5xl">Local processing, explained plainly.</h2><p className="mt-5 text-lg leading-8 text-muted-foreground">For implemented local tools, selected file bytes are processed in the browser and are not uploaded to ZANCTA for processing. Normal page and asset requests still occur.</p></Reveal>
        <div className="mt-12 grid gap-px overflow-hidden border border-border bg-border md:grid-cols-4">{principles.map(([title, description], index) => <Reveal key={title} delay={index * 0.06} className="bg-surface"><article className="min-h-52 p-5 md:p-6"><span className="font-mono text-xs text-accent">0{index + 1}</span><h3 className="mt-8 text-base font-medium">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p></article></Reveal>)}</div>
        <Reveal className="mt-10 border border-success/30 bg-success/10 p-5 text-sm leading-7 text-muted-foreground"><span className="font-medium text-success">No hidden cloud fallback.</span> Background removal is deferred while commercially verified local model licensing is evaluated; it does not send an image to a cloud service instead.</Reveal>
      </div>
    </section>
  );
}
