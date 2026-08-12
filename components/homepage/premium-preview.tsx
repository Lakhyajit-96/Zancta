"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

export function PremiumPreviewSection() {
  const reduce = useReducedMotion();

  return (
    <section className="border-t bg-[#0A0A0A]">
      <div className="mx-auto max-w-6xl px-6 py-20">
        {/* Section Header */}
        <motion.div
          initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-xs tracking-widest text-accent font-medium mb-3">FAIR PRICING</p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
            Power beyond free limits
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Free tools work without an account. Premium adds higher limits and advanced controls for pro workflows.
          </p>
        </motion.div>

        {/* Preview Cards */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Free Plan */}
          <motion.div
            initial={reduce ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-xl border bg-surface/50 p-8"
          >
            <div className="flex items-baseline justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Free</h3>
              <span className="text-sm text-success flex items-center gap-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Forever
              </span>
            </div>

            <p className="text-3xl font-semibold text-white">₹0 / $0</p>
            <p className="text-sm text-muted-foreground mt-1">No account required</p>

            <hr className="my-6 border-border" />

            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <svg className="h-5 w-5 text-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                9 local-first PDF & image tools
              </li>
              <li className="flex items-start gap-3">
                <svg className="h-5 w-5 text-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Up to 50 MB per file
              </li>
              <li className="flex items-start gap-3">
                <svg className="h-5 w-5 text-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                50 files max merge
              </li>
              <li className="flex items-start gap-3">
                <svg className="h-5 w-5 text-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                No watermarks • Privacy preserved
              </li>
            </ul>

            <Link href="/tools" className="mt-8 block">
              <button className="h-11 px-6 rounded-md border bg-surface font-medium hover:border-accent/40 hover:bg-surface/80 transition-all duration-300 w-full md:w-auto">
                Start Free
              </button>
            </Link>
          </motion.div>

          {/* Premium Plan Teaser */}
          <motion.div
            initial={reduce ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-xl border-2 border-accent/30 bg-surface/70 backdrop-blur p-8 shadow-glow"
          >
            {/* Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#E8E8E8] to-[#A8A8A8] px-4 py-1 text-xs font-semibold text-[#0A0A0A]">
              Best Value
            </div>

            <div className="flex items-baseline justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Premium</h3>
              <span className="text-sm text-accent">Upgrade Pro</span>
            </div>

            <p className="text-3xl font-semibold text-white">₹199/mo</p>
            <p className="text-sm text-muted-foreground mt-1">Or ₹999/yr (save 58%)</p>

            <hr className="my-6 border-border" />

            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <svg className="h-5 w-5 text-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Everything in Free + no ads
              </li>
              <li className="flex items-start gap-3">
                <svg className="h-5 w-5 text-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Up to 100 MB per file
              </li>
              <li className="flex items-start gap-3">
                <svg className="h-5 w-5 text-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                100 files max merge
              </li>
              <li className="flex items-start gap-3">
                <svg className="h-5 w-5 text-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Quality sliders • custom resize
              </li>
              <li className="flex items-start gap-3">
                <svg className="h-5 w-5 text-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Priority support
              </li>
            </ul>

            <Link href="/pricing" className="mt-8 block">
              <button className="h-11 px-6 rounded-md bg-accent text-accent-foreground font-semibold shadow-glow hover:bg-accent/90 transition-all duration-300 w-full md:w-auto">
                View Pricing →
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Trust Note */}
        <motion.div
          initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-muted-foreground">
            Billing via Dodo Payments (Merchant of Record). We never store card data or see your files. Cancel anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
