"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { MaskLines, EASE } from "@/components/marketing/motion";

function PipelineNode({
  icon,
  label,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div
        className={`grid h-16 w-16 place-items-center rounded-full border md:h-20 md:w-20 ${
          highlight
            ? "border-accent/60 bg-accent/10 shadow-[0_0_44px_rgba(232,160,180,0.25)]"
            : "border-border-strong bg-elevated"
        }`}
      >
        {icon}
      </div>
      <p className="max-w-[7.5rem] text-xs leading-5 text-muted-foreground">{label}</p>
    </div>
  );
}

function Connector() {
  return (
    <svg aria-hidden viewBox="0 0 80 12" className="mt-6 h-3 w-full min-w-6 max-w-20 md:mt-8" fill="none">
      <line x1="0" y1="6" x2="68" y2="6" stroke="var(--accent)" strokeOpacity="0.5" strokeWidth="1" strokeDasharray="4 4" className="anim-dash-flow" />
      <path d="M70 2 L78 6 L70 10" stroke="var(--accent)" strokeOpacity="0.7" strokeWidth="1" fill="none" />
    </svg>
  );
}

export function ZanctaHero() {
  const reduceMotion = useReducedMotion();
  const fade = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: reduceMotion ? { duration: 0 } : { duration: 0.6, delay, ease: EASE },
  });

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div aria-hidden className="editorial-grid pointer-events-none absolute inset-0 opacity-30" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-56 perspective-floor opacity-40" />
      <div className="relative mx-auto grid max-w-[80rem] items-center gap-14 px-5 py-20 md:grid-cols-[1.05fr_0.95fr] md:px-8 md:py-28">
        <div className="space-y-7">
          <motion.p {...fade(0)} className="eyebrow">Local-first file tools</motion.p>
          <MaskLines
            className="display-title max-w-3xl text-5xl text-white md:text-7xl"
            lines={[
              <>Powerful file tools.</>,
              <>Always local.</>,
              <span key="rose" className="text-accent">Always private.</span>,
            ]}
          />
          <motion.p {...fade(0.28)} className="max-w-xl text-base leading-8 text-muted-foreground md:text-lg">
            ZANCTA runs supported file processing entirely in your browser. Your files stay in your control — always.
          </motion.p>
          <motion.div {...fade(0.36)} className="flex flex-wrap gap-3">
            <Link href="/tools" className="premium-button premium-button-primary px-6">
              Choose a tool <span aria-hidden>→</span>
            </Link>
            <Link href="/how-it-works" className="premium-button premium-button-secondary px-6">
              <span aria-hidden>▷</span> How it works
            </Link>
          </motion.div>
          <motion.ul {...fade(0.44)} className="grid gap-2.5 border-t border-border pt-5 text-sm text-muted-foreground md:max-w-lg">
            <li>Supported workflows process selected file bytes locally.</li>
            <li>Tool pages state formats, limits, and honest failure cases.</li>
            <li>Downloads are generated in the browser when a tool produces output.</li>
          </motion.ul>
        </div>

        <motion.div
          {...fade(0.3)}
          className="relative overflow-hidden rounded-xl border border-border-strong bg-surface/80 p-6 shadow-2xl backdrop-blur md:p-9"
        >
          <div className="flex items-center justify-between border-b border-border pb-4">
            <p className="eyebrow">Local processing</p>
            <span className="font-mono text-[0.65rem] text-muted-foreground">Z / 01</span>
          </div>
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-32 perspective-floor opacity-70" />
          <div className="relative mt-8 flex items-start justify-center gap-2 md:gap-3">
            <PipelineNode
              label="Selected locally"
              icon={
                <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6 md:h-7 md:w-7" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <path d="M7 3h7l4 4v14H7z" />
                  <path d="M14 3v4h4" />
                  <path d="M10 12h5M10 16h5" />
                </svg>
              }
            />
            <Connector />
            <PipelineNode
              highlight
              label="Processed in this browser"
              icon={<img src="/assets/zancta-brand/logos/compact-mark.svg" alt="" className="h-8 w-8 md:h-9 md:w-9" />}
            />
            <Connector />
            <PipelineNode
              label="Result available locally"
              icon={
                <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6 text-success md:h-7 md:w-7" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <circle cx="12" cy="12" r="9" />
                  <path d="m8.5 12.2 2.4 2.4 4.8-5" />
                </svg>
              }
            />
          </div>
          <p className="relative mt-8 border border-success/30 bg-success/10 p-3 text-center text-xs text-success">
            No file upload for implemented local tools
          </p>
        </motion.div>
      </div>
    </section>
  );
}
