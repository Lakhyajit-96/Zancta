import type { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tools";
import { PUBLIC_SITE_URL } from "@/lib/seo";

type Freq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

const HIGH_VALUE: Array<{ path: string; priority: number; freq: Freq }> = [
  { path: "", priority: 1.0, freq: "weekly" },
  { path: "/tools", priority: 0.9, freq: "weekly" },
  { path: "/pricing", priority: 0.8, freq: "monthly" },
  { path: "/faq", priority: 0.6, freq: "monthly" },
  { path: "/help", priority: 0.6, freq: "monthly" },
  { path: "/how-it-works", priority: 0.5, freq: "monthly" },
  { path: "/guides/local-processing", priority: 0.5, freq: "monthly" },
  { path: "/about", priority: 0.4, freq: "monthly" },
  { path: "/contact", priority: 0.4, freq: "monthly" },
  { path: "/privacy", priority: 0.3, freq: "monthly" },
  { path: "/terms", priority: 0.3, freq: "monthly" },
  { path: "/refund-and-cancellation", priority: 0.3, freq: "monthly" },
  { path: "/security", priority: 0.3, freq: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = HIGH_VALUE.map((s) => ({
    url: `${PUBLIC_SITE_URL}${s.path || "/"}`,
    lastModified: now,
    changeFrequency: s.freq,
    priority: s.priority,
  }));

  const toolEntries: MetadataRoute.Sitemap = TOOLS.filter((t) => t.available).map((t) => ({
    url: `${PUBLIC_SITE_URL}/tools/${t.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as Freq,
    priority: 0.8,
  }));

  return [...staticEntries, ...toolEntries];
}
