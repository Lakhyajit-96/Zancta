import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
const gaEnabled = Boolean(gaId && /^G-[A-Z0-9]+$/.test(gaId));
const sentryEnabled = Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);

const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  isDev ? "'unsafe-eval'" : "'wasm-unsafe-eval'",
  ...(gaEnabled ? ["https://www.googletagmanager.com"] : []),
].join(" ");

const connectSrc = [
  "'self'",
  ...(gaEnabled
    ? [
        "https://www.google-analytics.com",
        "https://analytics.google.com",
        "https://www.googletagmanager.com",
        "https://*.google-analytics.com",
        "https://*.analytics.google.com",
        "https://*.googletagmanager.com",
        "https://www.google.com",
      ]
    : []),
  ...(sentryEnabled ? ["https://*.ingest.sentry.io", "https://*.ingest.us.sentry.io"] : []),
].join(" ");

const imgSrc = [
  "'self'",
  "data:",
  "blob:",
  ...(gaEnabled ? ["https://www.google-analytics.com", "https://*.google-analytics.com", "https://www.googletagmanager.com"] : []),
].join(" ");

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/ocr/lang/[...file]": ["./private/ocr-traineddata/**/*"],
  },
  async redirects() {
    return [
      { source: "/features", destination: "/tools", permanent: true },
      { source: "/docs", destination: "/help", permanent: true },
    ];
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline'",
      `img-src ${imgSrc}`,
      "font-src 'self' data:",
      `connect-src ${connectSrc}`,
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; ");
    const headers: { key: string; value: string }[] = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Content-Security-Policy", value: csp },
    ];
    // HSTS only on HTTPS production — not on localhost, but header is ready for deployment
    if (!isDev) {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload",
      });
    }
    return [
      {
        source: "/(.*)",
        headers,
      },
      {
        source: "/assets/zancta-brand/bimi/zancta-bimi.svg",
        headers: [{ key: "Content-Type", value: "image/svg+xml; charset=utf-8" }],
      },
    ];
  },
};

export default nextConfig;
