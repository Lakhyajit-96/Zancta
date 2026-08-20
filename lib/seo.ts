import type { Metadata } from "next";

type SEOProps = {
  title: string;
  description: string;
  path: string;
  canonical?: string;
};

const CANONICAL_PRODUCTION_URL = "https://zancta.tech";

function stripSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function isUnusablePublicOrigin(url: string): boolean {
  return /localhost|127\.0\.0\.1|toolsite-4q4w\.vercel\.app|example\.com/i.test(url);
}

function normalizePublicOrigin(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "www.zancta.tech") return CANONICAL_PRODUCTION_URL;
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return stripSlash(url);
  }
}

function firstUsableOrigin(candidates: Array<string | undefined>): string | null {
  for (const raw of candidates) {
    if (!raw) continue;
    const origin = stripSlash(raw);
    if (isUnusablePublicOrigin(origin)) continue;
    return normalizePublicOrigin(origin);
  }
  return null;
}

function resolvePublicSiteUrl(): string {
  const fromEnv = firstUsableOrigin([process.env.NEXT_PUBLIC_APP_URL, process.env.NEXTAUTH_URL, process.env.AUTH_URL]);
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") return CANONICAL_PRODUCTION_URL;
  return "http://localhost:3000";
}

/** Runtime origin for auth emails and payment return URLs. Never localhost in production. */
export function getAppOrigin(): string {
  const fromEnv = firstUsableOrigin([process.env.NEXTAUTH_URL, process.env.AUTH_URL, process.env.NEXT_PUBLIC_APP_URL]);
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") return CANONICAL_PRODUCTION_URL;
  return "http://localhost:3000";
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
