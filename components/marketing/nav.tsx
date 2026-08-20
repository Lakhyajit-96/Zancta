"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const PRIMARY_LINKS = [
  { href: "/tools", label: "Tools" },
  { href: "/features", label: "Features" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
  { href: "/about", label: "About" },
];

export function Navigation() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.5rem] max-w-[80rem] items-center justify-between px-5 md:px-8">
        <Link href="/" className="group flex items-center gap-3" aria-label="ZANCTA home">
          <img
            src="/assets/zancta-brand/logos/compact-mark.svg"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 transition-transform duration-300 group-hover:scale-[1.04]"
          />
          <span className="text-sm font-semibold tracking-[0.22em]">ZANCTA</span>
        </Link>

        <nav className="hidden items-center gap-7 text-[0.8rem] text-muted-foreground lg:flex" aria-label="Primary">
          {PRIMARY_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link py-3 transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/signin"
            className="hidden px-3 py-3 text-[0.8rem] text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
          >
            Sign in
          </Link>
          <Link href="/tools" className="premium-button premium-button-primary hidden min-h-10 px-4 text-xs md:inline-flex">
            Open a tool <span aria-hidden>→</span>
          </Link>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-md border border-border-strong bg-surface text-sm transition-colors hover:bg-surface-hover lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? "Close navigation" : "Open navigation"}
            onClick={() => setOpen((value) => !value)}
          >
            <span aria-hidden className="grid place-items-center">
              {open ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
            </span>
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-navigation"
          aria-label="Primary"
          className="absolute inset-x-4 top-[4.25rem] rounded-xl border border-border-strong bg-surface p-3 text-sm shadow-2xl lg:hidden"
        >
          <ul className="space-y-1">
            {PRIMARY_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2.5 transition-colors hover:bg-muted"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="border-t border-border pt-2">
              <Link
                href="/signin"
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2.5 transition-colors hover:bg-muted"
              >
                Sign in
              </Link>
            </li>
            <li>
              <Link
                href="/account"
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2.5 transition-colors hover:bg-muted"
              >
                Account
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

const FOOTER_COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/tools", label: "Tools" },
      { href: "/features", label: "Features" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/docs", label: "Docs" },
      { href: "/guides/local-processing", label: "Local processing" },
      { href: "/help", label: "Help" },
      { href: "/faq", label: "FAQ" },
      { href: "/security", label: "Security" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-28 border-t border-border">
      <div className="mx-auto max-w-[80rem] px-5 py-14 md:px-8 md:py-20">
        <div className="grid gap-12 md:grid-cols-[1.2fr_2fr]">
          <div>
            <Link href="/" className="flex items-center gap-3" aria-label="ZANCTA home">
              <img src="/assets/zancta-brand/logos/compact-mark.svg" alt="" width={28} height={28} className="h-7 w-7" />
              <span className="text-sm font-semibold tracking-[0.22em]">ZANCTA</span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-7 text-muted-foreground">
              Powerful file tools. Always local. Always private. Supported workflows process your files in your browser — never uploaded.
            </p>
          </div>
          <nav className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4" aria-label="Footer">
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">{column.title}</p>
                <ul className="mt-4 space-y-2.5 text-[0.8rem] text-muted-foreground">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="transition-colors hover:text-foreground">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-14 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} ZANCTA. All rights reserved.</p>
          <p className="text-muted-foreground/80">Local browser processing for the supported tools.</p>
        </div>
      </div>
    </footer>
  );
}
