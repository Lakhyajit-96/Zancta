import type { Metadata } from "next";

type SEOProps = {
  title: string;
  description: string;
  path: string;
  canonical?: string;
};

// Stable pre-domain production origin. Phase 12 will replace this with the
// approved custom domain via NEXT_PUBLIC_APP_URL.
const PRODUCTION_FALLBACK_URL = "https://toolsite-4q4w.vercel.app";

function resolvePublicSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!fromEnv) return PRODUCTION_FALLBACK_URL;
  // Ignore localhost values baked into production builds — common Vercel misconfiguration.
  if (
    process.env.NODE_ENV === "production" &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(fromEnv)
  ) {
    return PRODUCTION_FALLBACK_URL;
  }
  return fromEnv;
}

export const PUBLIC_SITE_URL = resolvePublicSiteUrl();

export function buildMetadata({ title, description, path, canonical }: SEOProps): Metadata {
  const url = `${PUBLIC_SITE_URL}${path}`;
  const can = canonical || url;
  return {
    title,
    description,
    alternates: { canonical: can },
    openGraph: { title, description, url, type: "website" },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
  };
}

export function jsonLdSoftwareApp(tool: { name: string; description: string; slug: string }): object {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: tool.description,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    url: `${PUBLIC_SITE_URL}/tools/${tool.slug}`,
  };
}
