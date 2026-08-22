"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Navigation } from "@/components/marketing/nav";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void import("@/lib/observability/sentry").then(({ reportException }) => {
      void reportException({ error, category: "SYSTEM", severity: "error", route: "app-error" });
    }).catch(() => {});
  }, [error]);

  return (
    <>
      <Navigation />
      <main className="mx-auto flex min-h-[70vh] max-w-[40rem] flex-col justify-center px-5 py-16">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="display-serif mt-4 text-4xl">This page could not finish loading.</h1>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">
        The application hit an unexpected error. Your files were not uploaded. You can try again or return to the tools.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" className="premium-button premium-button-primary" onClick={() => reset()}>
          Try again
        </button>
        <Link href="/tools" className="premium-button premium-button-secondary">
          Open a tool
        </Link>
      </div>
    </main>
    </>
  );
}
