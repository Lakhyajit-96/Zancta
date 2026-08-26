import { randomBytes } from "node:crypto";

/** HTML with a per-request nonce must not be shared across users. */
export const HTML_NONCE_CACHE_CONTROL =
  "private, no-cache, no-store, max-age=0, must-revalidate";

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
const gaEnabled = Boolean(gaId && /^G-[A-Z0-9]+$/.test(gaId));
const sentryEnabled = Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);

function scriptSrc(nonce?: string): string {
  const isDev = process.env.NODE_ENV !== "production";
  const parts = ["'self'"];
  if (nonce) parts.push(`'nonce-${nonce}'`);
  parts.push(isDev ? "'unsafe-eval'" : "'wasm-unsafe-eval'");
  if (gaEnabled) parts.push("https://www.googletagmanager.com");
  return parts.join(" ");
}

function connectSrc(): string {
  const parts = ["'self'"];
  if (gaEnabled) {
    parts.push(
      "https://www.google-analytics.com",
      "https://analytics.google.com",
      "https://www.googletagmanager.com",
      "https://*.google-analytics.com",
      "https://*.analytics.google.com",
      "https://*.googletagmanager.com",
      "https://www.google.com",
    );
  }
  if (sentryEnabled) {
    parts.push("https://*.ingest.sentry.io", "https://*.ingest.us.sentry.io");
  }
  return parts.join(" ");
}

function imgSrc(): string {
  const parts = ["'self'", "data:", "blob:"];
  if (gaEnabled) {
    parts.push(
      "https://www.google-analytics.com",
      "https://*.google-analytics.com",
      "https://www.googletagmanager.com",
    );
  }
  return parts.join(" ");
}

function assembleCsp(script: string): string {
  return [
    "default-src 'self'",
    `script-src ${script}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgSrc()}`,
    "font-src 'self' data:",
    `connect-src ${connectSrc()}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

/** Cryptographically random nonce compatible with Next.js CSP parsing. */
export function generateCspNonce(): string {
  return randomBytes(16).toString("base64url");
}

/** Document CSP: nonce replaces script-src 'unsafe-inline'. Style policy is unchanged. */
export function buildHtmlCsp(nonce: string): string {
  if (!nonce || /[^A-Za-z0-9_-]/.test(nonce)) {
    throw new Error("Invalid CSP nonce");
  }
  return assembleCsp(scriptSrc(nonce));
}

/** JSON/API CSP: no nonce, no 'unsafe-inline' in script-src. */
export function buildApiCsp(): string {
  return assembleCsp(scriptSrc());
}

export function isRootTxtPath(pathname: string): boolean {
  return /^\/[^/]+\.txt$/.test(pathname);
}

/** HTML documents that must receive a unique request nonce. */
export function isHtmlDocumentPath(pathname: string): boolean {
  if (pathname.startsWith("/api/")) return false;
  if (pathname.startsWith("/_next/")) return false;
  if (pathname.startsWith("/ocr/")) return false;
  if (pathname.startsWith("/assets/")) return false;
  if (pathname.startsWith("/icons/")) return false;
  if (pathname.startsWith("/.well-known/")) return false;
  if (pathname === "/favicon.ico") return false;
  if (/\.(?:ico|png|jpe?g|gif|webp|svg|woff2?|txt|xml|webmanifest|map)$/i.test(pathname)) return false;
  return true;
}

export function cspNonceFromHeader(csp: string | null | undefined): string | null {
  if (!csp) return null;
  const match = csp.match(/'nonce-([A-Za-z0-9+/_-]+={0,2})'/);
  return match?.[1] ?? null;
}
