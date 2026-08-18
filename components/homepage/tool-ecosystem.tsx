"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const pdfTools = [
  { slug: "pdf-merge", name: "Merge PDF", description: "Combine multiple PDFs into one document", icon: "/assets/zancta-brand/icons/pdf-icon.svg" },
  { slug: "pdf-split", name: "Split PDF", description: "Extract pages from your documents", icon: "/assets/zancta-brand/icons/pdf-icon.svg" },
  { slug: "pdf-compress", name: "Compress PDF", description: "Reduce file size while preserving quality", icon: "/assets/zancta-brand/icons/pdf-icon.svg" },
  { slug: "pdf-to-images", name: "PDF to Images", description: "Convert each page to PNG/JPEG/WebP", icon: "/assets/zancta-brand/icons/pdf-icon.svg" },
];

const imageTools = [
  { slug: "image-compress", name: "Image Compress", description: "Shrink JPEG, PNG, WebP files", icon: "/assets/zancta-brand/icons/image-icon.svg" },
  { slug: "image-convert", name: "Image Convert", description: "Transform between image formats", icon: "/assets/zancta-brand/icons/image-icon.svg" },
  { slug: "image-resize", name: "Image Resize", description: "Scale images with aspect ratio lock", icon: "/assets/zancta-brand/icons/image-icon.svg" },
  { slug: "exif-cleaner", name: "EXIF Cleaner", description: "Remove metadata from photos", icon: "/assets/zancta-brand/icons/image-icon.svg" },
  { slug: "images-to-pdf", name: "Images to PDF", description: "Bundle images into a single PDF", icon: "/assets/zancta-brand/icons/image-icon.svg" },
];

export function ToolEcosystemSection() {
  return (
    <section className="border-t bg-[#0A0A0A]">
      <div className="mx-auto max-w-6xl px-6 py-20">
        {/* Section Header */}
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-xs tracking-widest text-accent font-medium mb-3">LOCAL-FIRST TOOL SUITE</p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
            9 working tools for documents and images
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Every tool runs entirely in your browser — zero uploads, zero server costs, instant performance.
          </p>
        </motion.div>

        {/* PDF Tools */}
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <img 
              src="/assets/zancta-brand/icons/pdf-icon.svg" 
              alt="PDF Tools" 
              className="h-8 w-8"
            />
            <h3 className="text-xl font-semibold text-foreground">PDF Tools</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pdfTools.map((tool, idx) => (
              <motion.div
                key={tool.slug}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
              >
                <Link href={`/tools/${tool.slug}`} className="block group">
                  <div className="rounded-lg border bg-surface/50 p-6 hover:border-accent/40 transition-colors duration-300 h-full">
                    <div className="flex items-start gap-4">
                      <img 
                        src={tool.icon} 
                        alt="" 
                        className="h-10 w-10 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                      <div className="flex-1 text-left">
                        <h4 className="font-medium text-foreground group-hover:text-accent transition-colors">
                          {tool.name}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Image Tools */}
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <img 
              src="/assets/zancta-brand/icons/image-icon.svg" 
              alt="Image Tools" 
              className="h-8 w-8"
            />
            <h3 className="text-xl font-semibold text-foreground">Image Tools</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {imageTools.map((tool, idx) => (
              <motion.div
                key={tool.slug}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
              >
                <Link href={`/tools/${tool.slug}`} className="block group">
                  <div className="rounded-lg border bg-surface/50 p-6 hover:border-accent/40 transition-colors duration-300 h-full">
                    <div className="flex items-start gap-4">
                      <img 
                        src={tool.icon} 
                        alt="" 
                        className="h-10 w-10 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                      <div className="flex-1 text-left">
                        <h4 className="font-medium text-foreground group-hover:text-accent transition-colors">
                          {tool.name}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <Link href="/tools">
            <button className="h-12 px-8 rounded-md bg-accent text-accent-foreground font-semibold shadow-glow hover:bg-accent/90 transition-all duration-300">
              View All Tools
            </button>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            Background removal is listed honestly as deferred until a verified local model is integrated.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
