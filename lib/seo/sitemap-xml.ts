import { allIndexablePaths, assertIndexableUrl, canonicalSitemapUrl } from "@/lib/seo/public-urls";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildSitemapXml(lastModified = new Date()): string {
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const path of allIndexablePaths()) {
    const url = canonicalSitemapUrl(path);
    if (!assertIndexableUrl(url) || seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
  }

  const lastmod = lastModified.toISOString().slice(0, 10);
  const body = urls
    .map(
      (url) => `  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${lastmod}</lastmod>
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
