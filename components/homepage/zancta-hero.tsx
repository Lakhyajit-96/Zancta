"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function ZanctaHero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* Cinematic background with zancta-hero-bg.png */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/assets/zancta-brand/hero/zancta-hero-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Overlay gradient for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0b0c]/95 via-[#0b0b0c]/88 to-[#0b0b0c]" />
      </div>
      <div aria-hidden className="editorial-grid pointer-events-none absolute inset-0 z-0 opacity-30" />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-5 py-24 md:grid-cols-[1.05fr_0.95fr] md:px-8 md:py-32">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="space-y-6"
        >
          {/* ZANCTA compact-mark logo */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center gap-3"
          >
            <img 
              src="/assets/zancta-brand/logos/compact-mark.svg" 
              alt="ZANCTA" 
              className="h-12 w-12"
            />
            <span className="eyebrow">LOCAL-FIRST PRIVACY TOOLING</span>
          </motion.div>

          {/* Hero Headline */}
          <motion.h1
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="max-w-3xl text-5xl font-medium leading-[0.98] tracking-[-0.055em] text-white md:text-7xl"
          >
            Your files stay local —{" "}
            <span className="text-accent-soft">
              forever.
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="max-w-xl text-lg leading-8 text-muted-foreground"
          >
            9 PDF and image tools running entirely in your browser. No upload. No watermark. No signup required.
          </motion.p>

          {/* Primary CTAs */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.0 }}
            className="flex flex-wrap gap-3"
          >
            <Link href="/tools/pdf-merge">
              <Button className="px-6">
                Start with Merge PDF <span aria-hidden>↗</span>
              </Button>
            </Link>
            <Link href="/tools">
              <Button variant="outline" className="px-6">
                Explore tools
              </Button>
            </Link>
          </motion.div>

          {/* Trust signals */}
          <motion.ul
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.2 }}
            className="grid gap-3 border-t border-border pt-5 text-sm text-muted-foreground md:max-w-lg"
          >
            <li className="flex items-center gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
              <svg className="hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              No file uploads — processing stays on-device
            </li>
            <li className="flex items-center gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
              <svg className="hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              No server storage of documents or images
            </li>
            <li className="flex items-center gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
              <svg className="hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Works offline after first visit (PWA-ready)
            </li>
          </motion.ul>
        </motion.div>

        {/* Animated Data Flow Visualization */}
        <motion.div
          initial={false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="relative border border-border-strong bg-surface/70 p-6 shadow-2xl backdrop-blur md:p-8"
        >
          {/* Glowing accent behind visualization */}
          <div className="absolute inset-0 bg-accent/5 blur-3xl rounded-full" />
          
          <div className="relative z-10">
            <div className="mb-8 flex items-center justify-between border-b border-border pb-4">
              <h3 className="eyebrow">BROWSER ISOLATION ARCHITECTURE</h3>
              <span className="font-mono text-[0.65rem] text-muted-foreground">Z / 01</span>
            </div>
            
            <div className="space-y-6">
              {/* Step 1: File Input */}
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-border-strong bg-elevated">
                  <svg className="h-6 w-6 text-accent-soft" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.5a1.5 1.5 0 00-.5-1.06l-4-4A1.5 1.5 0 0013.5 4H9a2 2 0 00-2 2v1" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Your File</p>
                  <p className="text-xs text-muted-foreground">Local device storage</p>
                </div>
              </div>

              {/* Arrow */}
              {!reduce && (
                <motion.div
                  initial={false}
                  animate={{ opacity: 1 }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                  className="relative h-8 w-px mx-auto"
                >
                  <div className="absolute inset-x-0 h-2 bg-gradient-to-b from-accent/0 via-accent to-accent/0" />
                </motion.div>
              )}

              {/* Step 2: Browser Worker Boundary */}
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-accent/40 bg-accent/10">
                  <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-accent-foreground">Web Worker Isolation</p>
                <p className="text-xs text-muted-foreground">Local browser processing • Zero file uploads</p>
                </div>
                <div className="border border-success/30 bg-success/10 px-2 py-0.5 text-[0.65rem] text-success">
                  LOCAL
                </div>
              </div>

              {/* Arrow */}
              {!reduce && (
                <motion.div
                  initial={false}
                  animate={{ opacity: 1 }}
                  transition={{ repeat: Infinity, duration: 2, delay: 1.5 }}
                  className="relative h-8 w-px mx-auto"
                >
                  <div className="absolute inset-x-0 h-2 bg-gradient-to-b from-accent/0 via-accent to-accent/0" />
                </motion.div>
              )}

              {/* Step 3: Processed Result */}
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-border-strong bg-elevated">
                  <svg className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Processed Output</p>
                  <p className="text-xs text-muted-foreground">Download instantly</p>
                </div>
                <div className="border border-accent/30 bg-accent/10 px-2 py-0.5 text-[0.65rem] text-accent">
                  OUTPUT
                </div>
              </div>
            </div>

            {/* Bottom badge */}
            <div className="mt-8 border border-success/30 bg-success/10 p-3 text-center text-xs text-foreground">
              File bytes stay inside the browser during processing
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
