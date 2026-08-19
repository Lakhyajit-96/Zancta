"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

// Monochrome marks drawn in the ZANCTA register — no third-party button skins.
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 12h8" />
      <path d="M20 12a8 8 0 1 1-2.34-5.66" />
    </svg>
  );
}

function GitHubMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.73.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.67.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

export function OAuthButtons({ google, github, callbackUrl }: { google: boolean; github: boolean; callbackUrl?: string }) {
  const [pending, setPending] = useState<"google" | "github" | null>(null);
  if (!google && !github) return null;

  // Full-page redirect to the provider. Auth.js generates state + PKCE on the
  // outbound request and validates both when the callback returns.
  const start = (provider: "google" | "github") => {
    setPending(provider);
    signIn(provider, { callbackUrl: callbackUrl || "/account" });
  };

  return (
    <div className="mt-6">
      <div aria-hidden className="flex items-center gap-3 text-[0.6rem] font-mono uppercase tracking-[0.16em] text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or continue with
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="mt-4 space-y-3">
        {google && (
          <button
            type="button"
            onClick={() => start("google")}
            disabled={pending !== null}
            className="premium-button premium-button-secondary flex h-11 w-full items-center justify-center gap-2.5"
          >
            <GoogleMark />
            {pending === "google" ? "Redirecting…" : "Continue with Google"}
          </button>
        )}
        {github && (
          <button
            type="button"
            onClick={() => start("github")}
            disabled={pending !== null}
            className="premium-button premium-button-secondary flex h-11 w-full items-center justify-center gap-2.5"
          >
            <GitHubMark />
            {pending === "github" ? "Redirecting…" : "Continue with GitHub"}
          </button>
        )}
      </div>
    </div>
  );
}
