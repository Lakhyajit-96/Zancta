import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

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
    // Document CSP (including the per-request script nonce) is set in proxy.ts.
    // Keeping it out of this static header map avoids duplicate/conflicting CSP.
    const headers: { key: string; value: string }[] = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "X-Frame-Options", value: "DENY" },
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
