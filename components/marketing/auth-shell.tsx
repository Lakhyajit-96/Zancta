import Link from "next/link";
import { Reveal } from "./motion";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  reassurance,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  reassurance: string;
}) {
  return (
    <main className="relative isolate flex min-h-screen flex-col overflow-hidden px-5 py-12 md:px-8 md:py-16">
      {/* Quiet cinematic backdrop: one rose glow, fading grid, perspective floor. */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-12%,rgba(232,160,180,0.1),transparent_34rem)]" />
      <div aria-hidden className="editorial-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-[26rem] opacity-40" />
      <div aria-hidden className="perspective-floor pointer-events-none absolute inset-x-0 top-44 -z-10 h-44 opacity-25" />

      <div className="mx-auto w-full max-w-[26.5rem]">
        <Reveal>
          <Link href="/" aria-label="ZANCTA home" className="mx-auto flex w-fit items-center gap-3">
            <img src="/assets/zancta-brand/logos/compact-mark.svg" alt="" className="h-9 w-9" />
            <span className="text-sm font-semibold tracking-[0.24em]">ZANCTA</span>
          </Link>
        </Reveal>

        <Reveal delay={0.08} className="mt-10 text-center">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="display-title mt-4 text-3xl md:text-4xl">{title}</h1>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
        </Reveal>

        <Reveal delay={0.16} className="card-surface mt-8 p-6 shadow-[0_28px_70px_rgba(0,0,0,0.42)] md:p-8">
          {children}
        </Reveal>

        <Reveal delay={0.22} className="mt-6 border-l border-accent/50 bg-surface/40 px-4 py-3 text-xs leading-5 text-muted-foreground">
          <span className="mr-2 text-success" aria-hidden>✓</span>
          {reassurance}
        </Reveal>
      </div>

      <p className="mx-auto mt-auto pt-12 text-center text-xs text-muted-foreground/80">
        Local processing by design — your tool files never leave the browser for supported workflows.
      </p>
    </main>
  );
}
