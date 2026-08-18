"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useId, useState } from "react";

type FAQItem = readonly [question: string, answer: string];

export function FAQAccordion({ items }: { items: readonly FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const baseId = useId();
  const reduceMotion = useReducedMotion();

  return (
    <dl className="border-y border-border">
      {items.map(([question, answer], index) => {
        const panelId = `${baseId}-panel-${index}`;
        const isOpen = openIndex === index;

        return (
          <div key={question} className="border-b border-border last:border-b-0">
            <dt>
              <button
                type="button"
                className="group flex w-full items-start gap-4 py-5 text-left outline-none transition-colors hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
              >
                <span className="mt-1 font-mono text-xs text-accent">{String(index + 1).padStart(2, "0")}</span>
                <span className="flex-1 text-base font-medium tracking-[-0.015em]">{question}</span>
                <span aria-hidden className="mt-0.5 text-lg leading-none text-muted-foreground transition-transform duration-300 group-aria-expanded:rotate-45">+</span>
              </button>
            </dt>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.dd
                  id={panelId}
                  initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="max-w-2xl pb-6 pl-8 pr-10 text-sm leading-7 text-muted-foreground">{answer}</p>
                </motion.dd>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </dl>
  );
}
