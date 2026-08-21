"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0b0b0c] px-5 py-16 text-[#f4f0eb]">
        <main className="mx-auto max-w-[40rem]">
          <p className="text-xs uppercase tracking-[0.16em] text-[#8f8a8a]">Something went wrong</p>
          <h1 className="mt-4 text-3xl font-medium">ZANCTA could not load this page.</h1>
          <p className="mt-4 text-sm leading-7 text-[#c8c4c2]">
            An unexpected error stopped the application. Try again, or go back to the homepage.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-md border border-[#3a3836] bg-[#1a1918] px-4 py-2 text-sm"
            >
              Try again
            </button>
            {/* global-error replaces the root layout, so next/link is unavailable. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className="rounded-md border border-[#3a3836] px-4 py-2 text-sm">
              Home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
