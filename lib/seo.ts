import type { Metadata } from "next";
import { LEGAL_PUBLIC } from "@/lib/legal-public";

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

export function pageAbsoluteUrl(path: string): string {
  if (!path || path === "/") return PUBLIC_SITE_URL;
  return `${PUBLIC_SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

const OG_IMAGE = {
  url: "/assets/zancta-brand/og-images/zancta-og-hero.png",
  width: 1200,
  height: 630,
  alt: "ZANCTA — local PDF and image tools",
} as const;

/** Page-level SEO so child routes do not inherit the homepage og:url. */
export function pageMeta(path: string, meta: Metadata = {}): Metadata {
  const url = pageAbsoluteUrl(path);
  const openGraph = typeof meta.openGraph === "object" && meta.openGraph ? meta.openGraph : {};
  const twitter = typeof meta.twitter === "object" && meta.twitter ? meta.twitter : {};
  const title = typeof meta.title === "string" ? meta.title : undefined;
  const description = typeof meta.description === "string" ? meta.description : undefined;
  return {
    ...meta,
    alternates: { canonical: path, ...meta.alternates },
    openGraph: {
      type: "website",
      images: [OG_IMAGE],
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...openGraph,
      url,
    },
    twitter: {
      card: "summary_large_image",
      images: [OG_IMAGE.url],
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...twitter,
    },
  };
}

export function buildMetadata({ title, description, path, canonical }: SEOProps): Metadata {
  const url = pageAbsoluteUrl(path);
  const can = canonical || url;
  return {
    title,
    description,
    alternates: { canonical: can },
    openGraph: { title, description, url, type: "website", images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE.url] },
    robots: { index: true, follow: true },
  };
}

export function jsonLdOrganization(): object {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${PUBLIC_SITE_URL}/#organization`,
    name: "ZANCTA",
    url: `${PUBLIC_SITE_URL}/`,
    logo: `${PUBLIC_SITE_URL}/icons/favicon-512.png`,
    description: "Independently operated browser-based PDF and image tools that process supported files locally in the visitor's browser.",
    founder: {
      "@type": "Person",
      name: LEGAL_PUBLIC.operatorName,
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: LEGAL_PUBLIC.supportEmail,
        url: `${PUBLIC_SITE_URL}/contact`,
      },
      {
        "@type": "ContactPoint",
        contactType: "privacy inquiries",
        email: LEGAL_PUBLIC.privacyEmail,
      },
      {
        "@type": "ContactPoint",
        contactType: "security",
        email: LEGAL_PUBLIC.securityEmail,
      },
      {
        "@type": "ContactPoint",
        contactType: "billing support",
        email: LEGAL_PUBLIC.billingEmail,
      },
    ],
  };
}

export function jsonLdWebSite(): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${PUBLIC_SITE_URL}/#website`,
    name: "ZANCTA",
    alternateName: "ZANCTA",
    url: `${PUBLIC_SITE_URL}/`,
    inLanguage: "en",
    description: "PDF and image tools that process supported files in the browser.",
    publisher: {
      "@id": `${PUBLIC_SITE_URL}/#organization`,
    },
  };
}

export function jsonLdFaqPage(items: ReadonlyArray<{ q: string; a: string } | readonly [string, string]>): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => {
      const name = "q" in item ? item.q : item[0];
      const text = "a" in item ? item.a : item[1];
      return { "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } };
    }),
  };
}

export function jsonLdBreadcrumbList(items: Array<{ name: string; path: string }>): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: pageAbsoluteUrl(item.path),
    })),
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
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
    url: `${PUBLIC_SITE_URL}/tools/${tool.slug}`,
  };
}
