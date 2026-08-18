"use client";

import * as React from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

export const EASE = [0.22, 1, 0.36, 1] as const;

/** Physical spring used for interactive states (hover, drag-over, ticks). */
export const SPRING = { type: "spring", stiffness: 320, damping: 28, mass: 0.85 } as const;

/**
 * The Boundary — ZANCTA's signature motif. Four precision corner ticks that
 * frame any surface which "contains" a file. Render inside a relative parent.
 */
export function CornerTicks({ inset = false }: { inset?: boolean }) {
  const reduceMotion = useReducedMotion();
  const offset = inset ? "10px" : "-1px";
  const corners = [
    { style: { top: offset, left: offset }, border: "border-t border-l" },
    { style: { top: offset, right: offset }, border: "border-t border-r" },
    { style: { bottom: offset, left: offset }, border: "border-b border-l" },
    { style: { bottom: offset, right: offset }, border: "border-b border-r" },
  ];

  return (
    <>
      {corners.map((corner, index) => (
        <motion.span
          key={index}
          aria-hidden
          className={`corner-tick ${corner.border}`}
          style={corner.style}
          initial={reduceMotion ? false : { opacity: 0, scale: 0.3 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={reduceMotion ? { duration: 0 } : { ...SPRING, delay: 0.12 + index * 0.055 }}
        />
      ))}
    </>
  );
}

/** Subtle scroll-linked drift for atmospheric layers. Inward only, GPU-friendly. */
export function ScrollDrift({
  children,
  className,
  distance = 28,
}: {
  children: React.ReactNode;
  className?: string;
  distance?: number;
}) {
  const reduceMotion = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

/** Soft rise + fade for blocks. The baseline editorial entrance. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.56, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Editorial line-mask reveal: each line rises out of an overflow clip.
 * The IntersectionObserver must sit on the unclipped outer wrapper — a
 * translated child inside overflow-hidden has zero visible area and its
 * whileInView would never fire.
 */
export function MaskLines({
  lines,
  className,
  delay = 0,
  as = "h1",
}: {
  lines: React.ReactNode[];
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "p" | "div";
}) {
  const reduceMotion = useReducedMotion();
  const Tag = as;

  return (
    <Tag className={className}>
      {lines.map((line, index) => (
        <motion.span
          key={index}
          className="block overflow-hidden pb-[0.08em] -mb-[0.08em]"
          initial={reduceMotion ? false : "hidden"}
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
        >
          <motion.span
            className="block will-change-transform"
            variants={
              reduceMotion
                ? undefined
                : {
                    hidden: { y: "110%" },
                    show: {
                      y: 0,
                      transition: { duration: 0.72, delay: delay + index * 0.09, ease: EASE },
                    },
                  }
            }
          >
            {line}
          </motion.span>
        </motion.span>
      ))}
    </Tag>
  );
}

/** Orchestrated stagger group for cards, rows, and lists. */
export function StaggerGroup({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: delay } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={
        reduceMotion
          ? undefined
          : {
              hidden: { opacity: 0, y: 18 },
              show: { opacity: 1, y: 0, transition: { duration: 0.56, ease: EASE } },
            }
      }
    >
      {children}
    </motion.div>
  );
}
