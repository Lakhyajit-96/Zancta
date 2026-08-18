import type { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tools";
import { PUBLIC_SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  // Private auth/account pages are excluded (noindex)
  const staticPaths = ["", "/tools", "/pricing", "/about", "/features", "/how-it-works", "/faq", "/privacy", "/terms", "/security", "/help", "/docs", "/contact"];
  const toolPaths = TOOLS.map((t) => `/tools/${t.slug}`);
  return [...staticPaths, ...toolPaths].map((p) => ({
    url: `${PUBLIC_SITE_URL}${p || "/"}`,
    lastModified: now,
  }));
}
