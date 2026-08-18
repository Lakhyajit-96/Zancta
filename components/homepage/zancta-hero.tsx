"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { CornerTicks, MaskLines, ScrollDrift, EASE } from "@/components/marketing/motion";

const LOOP = 7;

/**
 * The Boundary demo — a file crosses into the frame, is transformed inside it,
 * and the result settles inside the same frame. Nothing ever exits the perimeter.
 * Illustrative choreography of the real local workflow; no real processing implied.
 */
function BoundaryDemo() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="aperture relative overflow-hidden rounded-xl border border-border-strong bg-surface/85 p-6 shadow-[0_32px_80px_rgba(0,0,0,0.42)] md:p-8">
      <CornerTicks inset />

      <div className="flex items-center justify-between border-b border-border pb-4">
        <p className="eyebrow">The boundary</p>
        <span className="font-mono text-[0.65rem] text-muted-foreground">this browser / local</span>
      </div>

      {/* Stage */}
      <div className="relative mt-6 h-40 overflow-hidden rounded-lg border border-border bg-background/70">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-20 perspective-floor opacity-30" />

        {/* Perimeter glow while transformation is in flight */}
        {!reduceMotion && (
          <motion.div
            aria-hidden
            className="absolute inset-0 rounded-lg border border-accent/45"
            animate={{ opacity: [0, 0, 1, 1, 0, 0] }}
            transition={{ duration: LOOP, times: [0, 0.34, 0.44, 0.62, 0.74, 1], repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {/* Incoming file — enters the boundary, never leaves it */}
        <motion.div
          aria-hidden
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-md border border-border-strong bg-elevated px-3 py-2"
          initial={reduceMotion ? false : undefined}
          animate={
            reduceMotion
              ? { opacity: 0 }
              : { opacity: [0, 1, 1, 0, 0], x: ["-6.5rem", "0rem", "0rem", "0rem", "0rem"] }
          }
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: LOOP, times: [0, 0.14, 0.4, 0.5, 1], repeat: Infinity, ease: EASE }
          }
        >
          <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 text-platinum" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M7 3h7l4 4v14H7z" />
            <path d="M14 3v4h4" />
          </svg>
          <span className="font-mono text-xs text-muted-foreground">report.pdf</span>
        </motion.div>

        {/* Result — settles inside the same frame */}
        <motion.div
          aria-hidden
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-md border border-success/40 bg-elevated px-3 py-2"
          initial={reduceMotion ? false : undefined}
          animate={
            reduceMotion
              ? { opacity: 1 }
              : { opacity: [0, 0, 1, 1, 0], scale: [0.96, 0.96, 1, 1, 0.98] }
          }
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: LOOP, times: [0, 0.58, 0.7, 0.94, 1], repeat: Infinity, ease: EASE }
          }
        >
          <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 text-success" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="12" cy="12" r="9" />
            <path d="m8.5 12.2 2.4 2.4 4.8-5" />
          </svg>
          <span className="font-mono text-xs text-muted-foreground">ready — still on this device</span>
        </motion.div>
      </div>

      {/* Honest readout */}
      <ul className="mt-6 space-y-2.5 font-mono text-[0.7rem] text-muted-foreground">
        <li className="flex items-center gap-3">
          <span className="text-platinum">01</span> Selected on your device
        </li>
        <li className="flex items-center gap-3">
          <span className="text-platinum">02</span> Processed inside this tab
          <span aria-hidden className="anim-node-pulse h-1.5 w-1.5 rounded-full bg-accent" />
        </li>
        <li className="flex items-center gap-3">
          <span className="text-platinum">03</span> Result stays here
        </li>
      </ul>

      <p className="mt-6 border-t border-border pt-4 text-xs leading-6 text-muted-foreground">
        No file upload for implemented local tools. The workflow above illustrates the boundary: nothing crosses it.
      </p>
    </div>
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
      <div aria-hidden className="ambient-rose pointer-events-none absolute inset-x-0 top-0 h-[34rem]" />
      <ScrollDrift className="pointer-events-none absolute inset-x-0 top-10" distance={22}>
        <div aria-hidden className="editorial-grid h-[30rem] opacity-25" />
      </ScrollDrift>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-48 perspective-floor opacity-30" />
      <div className="relative mx-auto grid max-w-[80rem] items-center gap-14 px-5 py-20 md:grid-cols-[1.05fr_0.95fr] md:px-8 md:py-28">
        <div className="space-y-7">
          <motion.p {...fade(0)} className="eyebrow">Local-first file tools</motion.p>
          <MaskLines
            className="display-serif max-w-3xl text-5xl text-white md:text-7xl"
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
              How it works
            </Link>
          </motion.div>
          <motion.ul {...fade(0.44)} className="grid gap-2.5 border-t border-border pt-5 text-sm text-muted-foreground md:max-w-lg">
            <li>Supported workflows process selected file bytes locally.</li>
            <li>Tool pages state formats, limits, and honest failure cases.</li>
            <li>Downloads are generated in the browser when a tool produces output.</li>
          </motion.ul>
        </div>

        <motion.div {...fade(0.3)}>
          <BoundaryDemo />
        </motion.div>
      </div>
    </section>
  );
}
