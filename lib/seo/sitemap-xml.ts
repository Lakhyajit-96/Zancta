import { allIndexablePaths, assertIndexableUrl, canonicalSitemapUrl } from "@/lib/seo/public-urls";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildSitemapXml(): string {
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const path of allIndexablePaths()) {
    const url = canonicalSitemapUrl(path);
    if (!assertIndexableUrl(url) || seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
  }

  // Omit lastmod: Bing treats it as a freshness signal and tells webmasters not to
  // stamp every URL with sitemap-generation time. We do not yet store per-URL
  // content modification dates, so an absent lastmod is more accurate than a fake one.
  const body = urls
    .map(
      (url) => `  <url>
    <loc>${escapeXml(url)}</loc>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

export function sitemapUrlCount(): number {
  const xml = buildSitemapXml();
  return (xml.match(/<loc>/g) || []).length;
}
