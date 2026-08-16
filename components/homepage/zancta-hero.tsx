"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function ZanctaHero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-b">
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
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/90 via-[#0A0A0A]/85 to-[#0A0A0A]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-24 md:py-32 grid gap-12 md:grid-cols-2 items-center">
        <motion.div
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="space-y-6"
        >
          {/* ZANCTA compact-mark logo */}
          <motion.div
            initial={reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center gap-3"
          >
            <img 
              src="/assets/zancta-brand/logos/compact-mark.svg" 
              alt="ZANCTA" 
              className="h-12 w-12"
            />
            <span className="text-xs tracking-widest text-accent font-medium">LOCAL-FIRST PRIVACY TOOLING</span>
          </motion.div>

          {/* Hero Headline */}
          <motion.h1
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.1] text-white"
          >
            Your files stay local —{" "}
            <span className="bg-gradient-to-r from-[#E8E8E8] to-[#A8A8A8] bg-clip-text text-transparent">
              forever.
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="text-lg text-muted-foreground max-w-xl leading-relaxed"
          >
            10 PDF and image tools running entirely in your browser. No upload. No watermark. No signup required.
          </motion.p>

          {/* Primary CTAs */}
          <motion.div
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.0 }}
            className="flex flex-wrap gap-4"
          >
            <Link href="/tools/pdf-merge">
              <Button className="h-12 px-8 rounded-md bg-accent text-accent-foreground font-semibold shadow-glow hover:bg-accent/90 transition-all duration-300">
                Start with Merge PDF
              </Button>
            </Link>
            <Link href="/tools">
              <Button className="h-12 px-8 rounded-md border bg-surface/50 backdrop-blur font-semibold hover:border-accent/50 hover:bg-surface/80 transition-all duration-300">
                Explore Tools
              </Button>
            </Link>
          </motion.div>

          {/* Trust signals */}
          <motion.ul
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.2 }}
            className="grid gap-2 text-sm text-muted-foreground pt-4"
          >
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              No file uploads — processing stays on-device
            </li>
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              No server storage of documents or images
            </li>
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Works offline after first visit (PWA-ready)
            </li>
          </motion.ul>
        </motion.div>

        {/* Animated Data Flow Visualization */}
        <motion.div
          initial={reduce ? { opacity: 1 } : { opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="relative rounded-xl border bg-surface/60 backdrop-blur p-8"
        >
          {/* Glowing accent behind visualization */}
          <div className="absolute inset-0 bg-accent/5 blur-3xl rounded-full" />
          
          <div className="relative z-10">
            <h3 className="text-sm font-medium tracking-wide mb-6 text-muted-foreground">BROWSER ISOLATION ARCHITECTURE</h3>
            
            <div className="space-y-6">
              {/* Step 1: File Input */}
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-elevated">
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                  className="relative h-8 w-px mx-auto"
                >
                  <div className="absolute inset-x-0 h-2 bg-gradient-to-b from-accent/0 via-accent to-accent/0" />
                </motion.div>
              )}

              {/* Step 2: Browser Worker Boundary */}
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10">
                  <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-accent-foreground">Web Worker Isolation</p>
                <p className="text-xs text-muted-foreground">Local browser processing • Zero file uploads</p>
                </div>
                <div className="rounded-full bg-success/20 px-2 py-0.5 text-xs text-success border border-success/30">
                  ✅ Local
                </div>
              </div>

              {/* Arrow */}
              {!reduce && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ repeat: Infinity, duration: 2, delay: 1.5 }}
                  className="relative h-8 w-px mx-auto"
                >
                  <div className="absolute inset-x-0 h-2 bg-gradient-to-b from-accent/0 via-accent to-accent/0" />
                </motion.div>
              )}

              {/* Step 3: Processed Result */}
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-elevated">
                  <svg className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Processed Output</p>
                  <p className="text-xs text-muted-foreground">Download instantly</p>
                </div>
                <div className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent border border-accent/30">
                  Result
                </div>
              </div>
            </div>

            {/* Bottom badge */}
            <div className="mt-8 rounded-md border border-success/30 bg-success/10 p-3 text-xs text-center text-foreground">
              Privacy guarantee: File bytes never leave your device during MVP processing
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
