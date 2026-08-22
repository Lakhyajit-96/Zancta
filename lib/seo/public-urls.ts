import { TOOLS } from "@/lib/tools";
import { LEGAL_PUBLIC } from "@/lib/legal-public";

/** Canonical origin for indexable URLs. Never env-dependent, never localhost/Vercel. */
export const SITEMAP_ORIGIN = LEGAL_PUBLIC.siteUrl;

export const INDEXABLE_STATIC_PATHS = [
  "/",
  "/tools",
  "/pricing",
  "/about",
  "/how-it-works",
  "/faq",
  "/privacy",
  "/terms",
  "/refund-and-cancellation",
  "/security",
  "/help",
  "/contact",
  "/guides/local-processing",
  "/guides/merge-pdf-without-uploading",
  "/guides/jpg-vs-png-vs-webp",
  "/guides/browser-ocr-without-uploading",
  "/guides/compress-pdf-without-uploading",
  "/guides/split-pdf-without-uploading",
  "/guides/remove-exif-before-sharing",
] as const;

const BLOCKED_PATH = /\/(signin|signup|account|admin|api\/|verify-email|forgot-password|reset-password)/i;

export function indexableToolPaths(): string[] {
  return TOOLS.filter((tool) => tool.available).map((tool) => `/tools/${tool.slug}`);
}

export function allIndexablePaths(): string[] {
  return [...INDEXABLE_STATIC_PATHS, ...indexableToolPaths()];
}

export function canonicalSitemapUrl(path: string): string {
  if (!path || path === "/") return `${SITEMAP_ORIGIN}/`;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITEMAP_ORIGIN}${normalized}`;
}

export function assertIndexableUrl(url: string): boolean {
  if (!url.startsWith(`${SITEMAP_ORIGIN}/`) && url !== `${SITEMAP_ORIGIN}/`) return false;
  if (/localhost|127\.0\.0\.1|vercel\.app|example\.com/i.test(url)) return false;
  if (BLOCKED_PATH.test(url)) return false;
  if (url.includes("background-remover")) return false;
  if (!url.startsWith("https://")) return false;
  return true;
}
