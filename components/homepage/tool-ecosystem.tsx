"use client";

import Link from "next/link";
import { Reveal } from "@/components/marketing/reveal";

const collections = [
  { title: "PDF tools", detail: "Merge, split, compress, render, build PDFs from images, and extract existing embedded PDF text.", tools: ["Merge PDF", "Split PDF", "Compress PDF", "PDF to Images", "Images to PDF", "PDF Text Extractor"], href: "/tools/pdf-text-extractor" },
  { title: "Image tools", detail: "Compress, convert, resize, remove common metadata, and extract English text from supported images.", tools: ["Compress Image", "Convert Image", "Resize Image", "EXIF Cleaner", "Image OCR"], href: "/tools/ocr" },
] as const;

export function ToolEcosystemSection() {
  return (
    <section className="border-t border-border bg-surface/30">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <Reveal className="flex flex-col justify-between gap-6 border-b border-border pb-10 md:flex-row md:items-end"><div><p className="eyebrow">THE TOOL SUITE</p><h2 className="mt-4 text-3xl font-medium tracking-[-0.04em] md:text-5xl">Eleven working local tools.</h2></div><p className="max-w-md leading-7 text-muted-foreground">Each route describes what it supports before a file is selected. One deferred capability is labelled honestly rather than simulated.</p></Reveal>
        <div className="mt-8 grid gap-5 lg:grid-cols-2">{collections.map((collection, index) => <Reveal key={collection.title} delay={index * 0.08} className="h-full"><article className="flex h-full flex-col border border-border bg-background p-6 md:p-8"><div className="flex items-baseline justify-between gap-4"><h3 className="text-xl font-medium">{collection.title}</h3><Link href={collection.href} className="text-xs text-muted-foreground hover:text-foreground">Open a tool ↗</Link></div><p className="mt-4 max-w-lg leading-7 text-muted-foreground">{collection.detail}</p><ul className="mt-8 flex flex-wrap gap-2">{collection.tools.map((tool) => <li key={tool} className="border border-border bg-elevated px-2.5 py-1 text-xs text-muted-foreground">{tool}</li>)}</ul></article></Reveal>)}</div>
        <Reveal className="mt-10"><Link href="/tools" className="premium-button premium-button-secondary">View all tools <span aria-hidden>↗</span></Link></Reveal>
      </div>
    </section>
  );
}
