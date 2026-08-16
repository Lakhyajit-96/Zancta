"use client";

import { motion, useReducedMotion } from "framer-motion";

export function PrivacyArchitectureSection() {
  const reduce = useReducedMotion();

  const features = [
    {
      title: "Browser-only processing",
      description: "Processing stays in your browser and never sends file bytes to our servers.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: "Zero Upload Guarantee",
      description: "No HTTP requests for file data. Your PDFs and images stay on your device. Zero bytes ever touch our servers.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      title: "Local Storage Only",
      description: "Files processed in memory via Blob API. Nothing cached to disk unless you choose to download the result.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
    },
    {
      title: "Anonymized Analytics",
      description: "Usage events track only coarse buckets (<1MB, 1-5MB, etc.) — never filenames, content, or personal data.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="border-t bg-[#0A0A0A]">
      <div className="mx-auto max-w-6xl px-6 py-20">
        {/* Section Header */}
        <motion.div
          initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <p className="text-xs tracking-widest text-accent font-medium mb-3">ARCHITECTURE DEEP DIVE</p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
            Privacy by design, not afterthought
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            We built a zero-trust architecture where your files literally cannot reach our servers. Here&apos;s how.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="group rounded-xl border bg-surface/50 p-6 space-y-4 hover:border-accent/30 transition-colors duration-300"
            >
              {/* Icon with glow effect */}
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-elevated text-accent group-hover:shadow-glow transition-shadow duration-300">
                {feature.icon}
              </div>

              <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-leading leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Technical diagram */}
        <motion.div
          initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 rounded-xl border bg-surface/30 backdrop-blur p-8"
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-8 text-center">DATA FLOW VISUALIZATION</h3>
          
          <div className="relative">
            {/* Top row - Local side */}
            <div className="grid grid-cols-3 gap-4 md:gap-8 mb-8">
              <div className="rounded-lg border bg-surface p-6 text-center">
                <div className="mx-auto h-16 w-16 rounded-xl bg-elevated flex items-center justify-center mb-3">
                  <svg className="h-8 w-8 text-accent-soft" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-sm font-medium">Your Device</p>
                <p className="text-xs text-muted-foreground mt-1">File bytes stay here</p>
              </div>

              {/* Middle - Browser boundary */}
              <div className="rounded-xl border-2 border-accent/40 bg-surface/80 p-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent" />
                <div className="relative z-10">
                  <div className="mx-auto h-16 w-16 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center mb-3">
                    <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-accent-foreground">Browser processing</p>
                  <p className="text-xs text-muted-foreground mt-1">Local processing boundary</p>
                </div>
              </div>

              {/* Right - Disabled server */}
              <div className="rounded-lg border border-success/20 bg-surface p-6 text-center">
                <div className="mx-auto h-16 w-16 rounded-xl bg-elevated opacity-40 flex items-center justify-center mb-3">
                  <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.582a2 2 0 00-1.59.586l-.828.828A2 2 0 0013.414 21H10.586a2 2 0 00-1.59-.586l-.828-.828A2 2 0 007.586 18H5" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-muted-foreground line-through decoration-error">Server</p>
                <p className="text-xs text-success mt-1 flex items-center justify-center gap-1">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  No uploads
                </p>
              </div>
            </div>

            {/* Bottom connection */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-4 py-2">
                <svg className="h-4 w-4 text-success" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-medium text-success">Zero upload traffic generated</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
