"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";

const reveal = (reduce: boolean | null, delay = 0) => ({
  initial: reduce ? false : { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: reduce ? { duration: 0 } : { duration: 0.56, delay, ease: [0.22, 1, 0.36, 1] as const },
});

export function ZanctaHero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(130deg,rgba(233,168,184,0.11),transparent_42%),url('/assets/zancta-brand/hero/zancta-hero-bg.png')] bg-cover bg-center opacity-75" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/88 to-background" />
      <div aria-hidden className="editorial-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-24 md:grid-cols-[1.05fr_0.95fr] md:px-8 md:py-32">
        <div className="space-y-6">
          <motion.div {...reveal(reduceMotion, 0)} className="flex items-center gap-3"><img src="/assets/zancta-brand/logos/compact-mark.svg" alt="ZANCTA" className="h-11 w-11" /><span className="eyebrow">LOCAL-FIRST FILE TOOLS</span></motion.div>
          <motion.h1 {...reveal(reduceMotion, 0.08)} className="max-w-3xl text-5xl font-medium leading-[0.98] tracking-[-0.055em] text-white md:text-7xl">Your files stay local. <span className="text-accent-soft">Keep the control.</span></motion.h1>
          <motion.p {...reveal(reduceMotion, 0.16)} className="max-w-xl text-lg leading-8 text-muted-foreground">PDF, image, OCR, and text-extraction tools that process supported files locally in your browser. No file upload for the implemented local workflows.</motion.p>
          <motion.div {...reveal(reduceMotion, 0.24)} className="flex flex-wrap gap-3"><Link href="/tools"><Button className="px-6">Explore tools <span aria-hidden>↗</span></Button></Link><Link href="/how-it-works"><Button variant="outline" className="px-6">How it works</Button></Link></motion.div>
          <motion.ul {...reveal(reduceMotion, 0.32)} className="grid gap-3 border-t border-border pt-5 text-sm text-muted-foreground md:max-w-lg"><li>Supported workflows process selected file bytes locally.</li><li>Tool pages state formats, limits, and honest failure cases.</li><li>Downloads are generated in the browser when a tool produces output.</li></motion.ul>
        </div>
        <motion.div {...reveal(reduceMotion, 0.28)} className="rounded-xl border border-border-strong bg-surface/80 p-6 shadow-2xl backdrop-blur md:p-8">
          <div className="flex items-center justify-between border-b border-border pb-4"><p className="eyebrow">LOCAL PROCESSING</p><span className="font-mono text-[0.65rem] text-muted-foreground">Z / 01</span></div>
          <ol className="mt-6 space-y-4">{[["01", "Your file", "Selected from your device"], ["02", "Your browser", "Validation and local engine"], ["03", "Your output", "Review, copy, or download"]].map(([number, title, detail], index) => <li key={title} className="flex items-center gap-4"><span className="grid h-10 w-10 place-items-center border border-border bg-elevated font-mono text-xs text-accent">{number}</span><div><p className="text-sm font-medium">{title}</p><p className="text-xs text-muted-foreground">{detail}</p></div>{index < 2 && <span aria-hidden className="ml-auto text-muted-foreground">↓</span>}</li>)}</ol>
          <p className="mt-7 border border-success/30 bg-success/10 p-3 text-center text-xs text-success">No file upload for implemented local tools</p>
        </motion.div>
      </div>
    </section>
  );
}
