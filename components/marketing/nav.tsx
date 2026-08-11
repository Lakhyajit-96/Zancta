import Link from "next/link";

export function Navigation() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-semibold tracking-tight">
          LocalFile<span className="text-accent">.</span>
        </Link>
        <nav className="hidden gap-6 text-sm md:flex" aria-label="Primary">
          <Link href="/tools" className="hover:text-accent">Tools</Link>
          <Link href="/privacy" className="hover:text-accent">Privacy</Link>
          <Link href="/pricing" className="hover:text-accent">Pricing</Link>
          <Link href="/about" className="hover:text-accent">About</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/tools" className="hidden md:inline-flex h-9 px-4 items-center rounded-md bg-accent text-accent-foreground text-sm font-medium">
            Explore tools
          </Link>
          <Link href="/account" className="hidden md:inline-flex h-9 px-3 items-center rounded-md border text-sm">Account</Link>
          <Link href="/signin" className="hidden md:inline-flex h-9 px-3 items-center rounded-md border text-sm">Sign in</Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}

function MobileNav() {
  return (
    <details className="md:hidden group">
      <summary className="list-none h-9 w-9 grid place-items-center rounded-md border hover:bg-muted cursor-pointer" aria-label="Open navigation">
        <span aria-hidden className="text-sm">≡</span>
      </summary>
      <nav className="absolute right-6 top-14 rounded-lg border bg-surface p-4 space-y-3 text-sm shadow-lg">
        <Link href="/tools" className="block">Tools</Link>
        <Link href="/privacy" className="block">Privacy</Link>
        <Link href="/pricing" className="block">Pricing</Link>
        <Link href="/about" className="block">About</Link>
        <Link href="/signin" className="block">Sign in</Link>
        <Link href="/account" className="block">Account</Link>
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
            <p className="font-medium text-foreground">LocalFile</p>
            <p className="max-w-sm mt-2">Privacy-first file tools that run in your browser. No upload, no watermark.</p>
          </div>
          <nav className="flex gap-6">
            <a href="/privacy" className="hover:text-foreground">Privacy</a>
            <a href="/terms" className="hover:text-foreground">Terms</a>
            <a href="/security" className="hover:text-foreground">Security</a>
            <a href="/help" className="hover:text-foreground">Help</a>
          </nav>
        </div>
        <p className="mt-8 text-xs">© {new Date().getFullYear()} LocalFile. No fake claims — processing is local at MVP.</p>
      </div>
    </footer>
  );
}
