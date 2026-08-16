import type { Metadata } from "next";

type SEOProps = {
  title: string;
  description: string;
  path: string;
  canonical?: string;
};

export function buildMetadata({ title, description, path, canonical }: SEOProps): Metadata {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = `${base}${path}`;
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
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: tool.description,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    url: `${base}/tools/${tool.slug}`,
  };
}
