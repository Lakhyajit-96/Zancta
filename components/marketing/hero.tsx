"use client";
import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

export function Hero() {
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-hidden border-b">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28 grid gap-10 md:grid-cols-2 items-center">
        <div className="space-y-6">
          <p className="text-xs tracking-widest text-accent-soft font-medium">LOCAL-FIRST • PWA • PRIVATE</p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
            Your files never leave your device.
          </h1>
          <p className="text-base text-muted-foreground max-w-xl">
            10 PDF and image tools that run entirely in your browser. No upload, no watermark, no signup. Merge, split, compress, convert, resize, remove background and clean EXIF — locally.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/tools/pdf-merge" className="h-11 px-6 inline-flex items-center rounded-md bg-accent text-accent-foreground font-medium">
              Start with Merge PDF
            </Link>
            <Link href="/tools" className="h-11 px-6 inline-flex items-center rounded-md border bg-surface font-medium">
              Explore tools
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">No server storage of your files. Network activity is limited to anonymized analytics and asset delivery.</p>
        </div>

        {/* Visual: file → browser boundary → result */}
        <motion.div
          initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.5 }}
          className="relative rounded-xl border bg-surface p-6"
          aria-hidden
        >
          <div className="grid grid-cols-3 gap-4 text-center text-xs">
            <div className="rounded-lg border bg-elevated p-4">
              <div className="mx-auto h-10 w-8 rounded bg-muted border" />
              <p className="mt-2 text-foreground">
                Your file
              </p>
            </div>
            <div className="flex items-center justify-center">
              <span className="font-medium text-accent-soft">
                → browser →
              </span>
            </div>
            <div className="rounded-lg border bg-elevated p-4">
              <div className="mx-auto h-10 w-8 rounded bg-accent/20 border border-accent/40" />
              <p className="mt-2 text-foreground">
                Result
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-md border border-success/30 bg-success/10 p-3 text-xs text-center text-foreground">
            Encrypted transport not needed — no upload at MVP
          </div>
        </motion.div>
      </div>
    </section>
  );
}
