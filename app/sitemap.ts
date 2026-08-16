import type { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tools";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const now = new Date();
  // Private auth/account pages are excluded (noindex)
  const staticPaths = ["", "/tools", "/pricing", "/about", "/features", "/how-it-works", "/faq", "/privacy", "/terms", "/security", "/help", "/docs", "/contact"];
  const toolPaths = TOOLS.map((t) => `/tools/${t.slug}`);
  return [...staticPaths, ...toolPaths].map((p) => ({
    url: `${base}${p || "/"}`,
    lastModified: now,
  }));
}
