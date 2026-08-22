"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const PRIMARY_LINKS = [
  { href: "/tools", label: "Tools" },
  { href: "/pricing", label: "Pricing" },
  { href: "/help", label: "Help" },
];

const FOCUSABLE = "a[href], button:not([disabled])";

export function Navigation() {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const menu = menuRef.current;
    const firstLink = menu?.querySelector<HTMLElement>(FOCUSABLE);
    firstLink?.focus();

    const focusables = () => {
      const items: HTMLElement[] = [];
      if (toggleRef.current) items.push(toggleRef.current);
      menu?.querySelectorAll<HTMLElement>(FOCUSABLE).forEach((node) => items.push(node));
      return items;
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      return;
    }
    if (wasOpen.current) {
      toggleRef.current?.focus();
      wasOpen.current = false;
    }
  }, [open]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((session: { user?: unknown } | null) => {
        if (!cancelled) setSignedIn(Boolean(session?.user));
      })
      .catch(() => {
        if (!cancelled) setSignedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
          {signedIn ? (
            <Link
              href="/account"
              className="hidden px-3 py-3 text-[0.8rem] text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
            >
              Account
            </Link>
          ) : (
            <Link
              href="/signin"
              className="hidden px-3 py-3 text-[0.8rem] text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
            >
              Sign in
            </Link>
          )}
          <Link href="/tools" className="premium-button premium-button-primary hidden min-h-10 px-4 text-xs md:inline-flex">
            Open a tool <span aria-hidden>→</span>
          </Link>
          <button
            ref={toggleRef}
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
          ref={menuRef}
          id="mobile-navigation"
          aria-label="Primary"
          className="absolute inset-x-4 top-[4.25rem] rounded-xl border border-border-strong bg-surface p-3 text-sm shadow-2xl lg:hidden"
        >
          <Link
            href="/tools"
            onClick={() => setOpen(false)}
            className="premium-button premium-button-primary mb-2 w-full min-h-11 text-xs"
          >
            Open a tool <span aria-hidden>→</span>
          </Link>
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
              {signedIn ? (
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2.5 transition-colors hover:bg-muted"
                >
                  Account
                </Link>
              ) : (
                <Link
                  href="/signin"
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2.5 transition-colors hover:bg-muted"
                >
                  Sign in
                </Link>
              )}
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
      { href: "/how-it-works", label: "How it works" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/guides/local-processing", label: "Local processing" },
      { href: "/help", label: "Help" },
      { href: "/faq", label: "FAQ" },
      { href: "/security", label: "Security" },
    ],
  },
  {
    title: "ZANCTA",
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
      { href: "/refund-and-cancellation", label: "Refunds" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border md:mt-20">
      <div className="mx-auto max-w-[80rem] px-5 py-14 md:px-8 md:py-16">
        <div className="grid gap-12 md:grid-cols-[minmax(0,18rem)_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-3" aria-label="ZANCTA home">
              <img src="/assets/zancta-brand/logos/compact-mark.svg" alt="" width={28} height={28} className="h-7 w-7" />
              <span className="text-sm font-semibold tracking-[0.22em]">ZANCTA</span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-7 text-muted-foreground">
              PDF and image tools that run in your browser.
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
          <p>Local browser processing for the supported tools.</p>
        </div>
      </div>
    </footer>
  );
}
