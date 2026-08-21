import type { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tools";
import { PUBLIC_SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  // Private auth/account pages are excluded (noindex)
  const staticPaths = ["", "/tools", "/pricing", "/about", "/how-it-works", "/faq", "/privacy", "/terms", "/refund-and-cancellation", "/security", "/help", "/contact", "/guides/local-processing"];
  const toolPaths = TOOLS.filter((t) => t.available).map((t) => `/tools/${t.slug}`);
  return [...staticPaths, ...toolPaths].map((p) => ({
    url: `${PUBLIC_SITE_URL}${p || "/"}`,
    lastModified: now,
  }));
}
