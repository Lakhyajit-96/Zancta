import Link from "next/link";

export function Navigation() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-5 md:px-8">
        <Link href="/" className="group flex items-center gap-3" aria-label="ZANCTA home">
          <img 
            src="/assets/zancta-brand/logos/compact-mark.svg" 
            alt="ZANCTA" 
            className="h-7 w-7 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105"
          />
          <span className="text-sm font-semibold tracking-[0.18em]">ZANCTA<span className="text-accent">/</span></span>
        </Link>
        <nav className="hidden items-center gap-7 text-[0.8rem] text-muted-foreground md:flex" aria-label="Primary">
          <Link href="/tools" className="py-3 transition-colors hover:text-foreground">Tools</Link>
          <Link href="/features" className="py-3 transition-colors hover:text-foreground">Features</Link>
          <Link href="/how-it-works" className="py-3 transition-colors hover:text-foreground">How it works</Link>
          <Link href="/pricing" className="py-3 transition-colors hover:text-foreground">Pricing</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/signin" className="hidden px-3 py-3 text-[0.8rem] text-muted-foreground transition-colors hover:text-foreground md:inline-flex">
            Sign in
          </Link>
          <Link href="/tools" className="premium-button premium-button-primary hidden min-h-10 px-4 text-xs md:inline-flex">
            Open a tool <span aria-hidden>↗</span>
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}

function MobileNav() {
  return (
    <details className="md:hidden group">
      <summary className="list-none h-11 w-11 grid place-items-center rounded-md border hover:bg-muted cursor-pointer" aria-label="Open navigation">
        <span aria-hidden className="text-sm">≡</span>
      </summary>
      <nav className="absolute right-4 top-[4.25rem] min-w-48 space-y-1 rounded-lg border border-border-strong bg-surface p-3 text-sm shadow-2xl md:right-6 md:py-4">
        <Link href="/tools" className="block rounded-md px-3 py-2 transition-colors hover:bg-muted">Tools</Link>
        <Link href="/features" className="block rounded-md px-3 py-2 transition-colors hover:bg-muted">Features</Link>
        <Link href="/how-it-works" className="block rounded-md px-3 py-2 transition-colors hover:bg-muted">How it works</Link>
        <Link href="/pricing" className="block rounded-md px-3 py-2 transition-colors hover:bg-muted">Pricing</Link>
        <Link href="/help" className="block rounded-md px-3 py-2 transition-colors hover:bg-muted">Help</Link>
        <Link href="/signin" className="block rounded-md px-3 py-2 transition-colors hover:bg-muted">Sign in</Link>
        <Link href="/account" className="block rounded-md px-3 py-2 transition-colors hover:bg-muted">Account</Link>
      </nav>
    </details>
  );
}

export function Footer() {
  return (
    <footer className="mt-28 border-t border-border">
      <div className="mx-auto max-w-7xl px-5 py-12 text-sm text-muted-foreground md:px-8 md:py-16">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div>
            <p className="font-semibold tracking-[0.18em] text-foreground">ZANCTA<span className="text-accent">/</span></p>
            <p className="mt-4 max-w-sm leading-7">A quiet workspace for documents and images. Local processing, considered tools, no upload.</p>
          </div>
          <nav className="grid grid-cols-2 gap-x-10 gap-y-3 text-[0.8rem] md:grid-cols-3" aria-label="Footer">
            <Link href="/about" className="hover:text-foreground">About</Link>
            <Link href="/features" className="hover:text-foreground">Features</Link>
            <Link href="/how-it-works" className="hover:text-foreground">How it works</Link>
            <Link href="/faq" className="hover:text-foreground">FAQ</Link>
            <Link href="/help" className="hover:text-foreground">Help</Link>
            <Link href="/docs" className="hover:text-foreground">Docs</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/security" className="hover:text-foreground">Security</Link>
            <Link href="/contact" className="hover:text-foreground">Contact</Link>
          </nav>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-5 text-xs md:flex-row md:justify-between">
          <p>© {new Date().getFullYear()} ZANCTA. Local browser processing for the supported tools.</p>
          <p className="text-muted-foreground/70">Built for files that deserve a private room.</p>
        </div>
      </div>
    </footer>
  );
}
