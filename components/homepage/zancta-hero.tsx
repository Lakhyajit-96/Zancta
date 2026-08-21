"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { CornerTicks, MaskLines, ScrollDrift, EASE } from "@/components/marketing/motion";

const PLAY = 7;

const HERO_TOOLS = [
  { href: "/tools/pdf-merge", label: "Merge PDF" },
  { href: "/tools/pdf-compress", label: "Compress PDF" },
  { href: "/tools/ocr", label: "Image OCR" },
  { href: "/tools/image-compress", label: "Compress Image" },
  { href: "/tools/pdf-split", label: "Split PDF" },
] as const;

/**
 * The Boundary demo — a file crosses into the frame, is transformed inside it,
 * and the result settles inside the same frame. Plays once, then idles.
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

      <div className="relative mt-6 h-40 overflow-hidden rounded-lg border border-border bg-background/70">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-20 perspective-floor opacity-30" />

        {!reduceMotion && (
          <motion.div
            aria-hidden
            className="absolute inset-0 rounded-lg border border-accent/45"
            animate={{ opacity: [0, 0, 1, 1, 0] }}
            transition={{ duration: PLAY, times: [0, 0.34, 0.44, 0.62, 1], ease: "easeInOut" }}
          />
        )}

        <motion.div
          aria-hidden
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-md border border-border-strong bg-elevated px-3 py-2"
          initial={reduceMotion ? false : { opacity: 0, x: "-6.5rem" }}
          animate={reduceMotion ? { opacity: 0 } : { opacity: [0, 1, 1, 0], x: ["-6.5rem", "0rem", "0rem", "0rem"] }}
          transition={reduceMotion ? { duration: 0 } : { duration: PLAY, times: [0, 0.14, 0.4, 0.52], ease: EASE }}
        >
          <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 text-platinum" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M7 3h7l4 4v14H7z" />
            <path d="M14 3v4h4" />
          </svg>
          <span className="font-mono text-xs text-muted-foreground">report.pdf</span>
        </motion.div>

        <motion.div
          aria-hidden
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-md border border-success/40 bg-elevated px-3 py-2"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: [0, 0, 1], scale: [0.96, 0.96, 1] }}
          transition={reduceMotion ? { duration: 0 } : { duration: PLAY, times: [0, 0.58, 0.72], ease: EASE }}
        >
          <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 text-success" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="12" cy="12" r="9" />
            <path d="m8.5 12.2 2.4 2.4 4.8-5" />
          </svg>
          <span className="font-mono text-xs text-muted-foreground">ready — still on this device</span>
        </motion.div>
      </div>

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
        No file upload for implemented local tools.{" "}
        <Link href="/guides/local-processing" className="underline underline-offset-4 hover:text-foreground">
          How local processing works
        </Link>
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
      <div className="relative mx-auto grid max-w-[80rem] items-center gap-10 px-5 py-16 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:px-8 md:py-20 lg:gap-14">
        <div className="space-y-6">
          <motion.p {...fade(0)} className="eyebrow">Local-first file tools</motion.p>
          <MaskLines
            className="display-serif max-w-3xl text-4xl text-white md:text-6xl"
            lines={[<>PDF and image tools.</>, <>They run in your browser.</>]}
          />
          <motion.p {...fade(0.28)} className="max-w-xl text-base leading-8 text-muted-foreground md:text-lg">
            Free to use, with no account. Implemented tools process the file you select in this browser and do not upload it for processing.
          </motion.p>
          <motion.ul {...fade(0.32)} className="flex flex-wrap gap-2" aria-label="Example tools">
            {HERO_TOOLS.map((tool) => (
              <li key={tool.href}>
                <Link
                  href={tool.href}
                  className="inline-flex min-h-9 items-center rounded-md border border-border bg-elevated px-3 text-xs text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
                >
                  {tool.label}
                </Link>
              </li>
            ))}
          </motion.ul>
          <motion.div {...fade(0.36)} className="flex flex-wrap gap-3">
            <Link href="/tools" className="premium-button premium-button-primary px-6">
              Choose a tool <span aria-hidden>→</span>
            </Link>
            <Link href="/how-it-works" className="premium-button premium-button-secondary px-6">
              How it works
            </Link>
          </motion.div>
        </div>

        <motion.div {...fade(0.3)}>
          <BoundaryDemo />
        </motion.div>
      </div>
    </section>
  );
}
