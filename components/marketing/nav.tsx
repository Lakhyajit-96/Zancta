import Link from "next/link";

export function Navigation() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <img 
            src="/assets/zancta-brand/logos/compact-mark.svg" 
            alt="ZANCTA" 
            className="h-7 w-7 group-hover:scale-110 transition-transform duration-300"
          />
          <span className="font-semibold tracking-tight">ZANCTA<span className="text-accent">.</span></span>
        </Link>
        <nav className="hidden gap-8 text-sm md:flex" aria-label="Primary">
          <Link href="/tools" className="hover:text-accent py-2 block">Tools</Link>
          <Link href="/features" className="hover:text-accent py-2 block">Features</Link>
          <Link href="/how-it-works" className="hover:text-accent py-2 block">How it works</Link>
          <Link href="/pricing" className="hover:text-accent py-2 block">Pricing</Link>
          <Link href="/help" className="hover:text-accent py-2 block">Help</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/tools" className="hidden md:inline-flex h-11 px-5 items-center rounded-md bg-accent text-accent-foreground text-sm font-medium">
            Explore tools
          </Link>
          <Link href="/account" className="hidden md:inline-flex h-11 px-4 items-center rounded-md border text-sm">Account</Link>
          <Link href="/signin" className="hidden md:inline-flex h-11 px-4 items-center rounded-md border text-sm">Sign in</Link>
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
      <nav className="absolute right-4 top-14 rounded-lg border bg-surface p-4 space-y-2 text-sm shadow-lg md:right-6 md:py-4">
        <Link href="/tools" className="block py-2">Tools</Link>
        <Link href="/features" className="block py-2">Features</Link>
        <Link href="/how-it-works" className="block py-2">How it works</Link>
        <Link href="/pricing" className="block py-2">Pricing</Link>
        <Link href="/help" className="block py-2">Help</Link>
        <Link href="/signin" className="block py-2">Sign in</Link>
        <Link href="/account" className="block py-2">Account</Link>
      </nav>
    </details>
  );
}

export function Footer() {
  return (
    <footer className="border-t mt-24">
      <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-muted-foreground">
        <div className="flex flex-col gap-6 md:flex-row md:justify-between">
          <div>
            <p className="font-medium text-foreground">ZANCTA</p>
            <p className="max-w-sm mt-2">Privacy-first file tools that run locally in your browser. No upload, no watermark.</p>
          </div>
          <nav className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-3" aria-label="Footer">
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
        <p className="mt-8 text-xs">© {new Date().getFullYear()} ZANCTA. Local browser processing for the supported tools.</p>
      </div>
    </footer>
  );
}
