import { describe, it, expect } from "vitest";
import { readFile } from "fs/promises";
import path from "path";
import { GET } from "@/app/sitemap.xml/route";
import { buildSitemapXml, sitemapUrlCount } from "@/lib/seo/sitemap-xml";
import { allIndexablePaths, INDEXABLE_STATIC_PATHS } from "@/lib/seo/public-urls";
import { HOMEPAGE_DESCRIPTION, pageMeta, PUBLIC_SITE_URL } from "@/lib/seo";

describe("sitemap contract", () => {
  it("emits unique https zancta.tech URLs and excludes private/unavailable routes", () => {
    const xml = buildSitemapXml();
    const origin = PUBLIC_SITE_URL.replace(/\/$/, "");
    expect(origin).toBe("https://zancta.tech");
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    expect(urls.length).toBeGreaterThan(0);
    expect(new Set(urls).size).toBe(urls.length);
    expect(sitemapUrlCount()).toBe(urls.length);
    expect(urls.length).toBe(allIndexablePaths().length);
    for (const url of urls) {
      expect(url.startsWith(`${origin}/`) || url === `${origin}/` || url === origin).toBe(true);
      expect(url).not.toMatch(/localhost|127\.0\.0\.1|vercel\.app|example\.com/i);
      expect(url).not.toMatch(/\/signin|\/signup|\/account|\/api\/|\/verify-email|\/forgot-password|\/reset-password/);
      expect(url).not.toContain("background-remover");
    }
    expect(urls).toContain(`${origin}/`);
    expect(urls).toContain(`${origin}/guides/local-processing`);
    expect(urls).toContain(`${origin}/guides/merge-pdf-without-uploading`);
    expect(urls).toContain(`${origin}/guides/jpg-vs-png-vs-webp`);
    expect(urls).toContain(`${origin}/guides/browser-ocr-without-uploading`);
    expect(urls).toContain(`${origin}/guides/compress-pdf-without-uploading`);
    expect(urls).toContain(`${origin}/guides/split-pdf-without-uploading`);
    expect(urls).toContain(`${origin}/guides/remove-exif-before-sharing`);
    expect(urls).toContain(`${origin}/refund-and-cancellation`);
    expect(urls).toContain(`${origin}/contact`);
    expect(urls).not.toContain(`${origin}/features`);
    expect(urls).not.toContain(`${origin}/docs`);
  });

  it("route handler returns application/xml", () => {
    const res = GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/application\/xml/);
  });

  it("XML is a urlset with the sitemaps.org namespace", () => {
    const xml = buildSitemapXml();
    expect(xml.startsWith("<?xml version=\"1.0\" encoding=\"UTF-8\"?>")).toBe(true);
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(xml).not.toContain("&amp;amp;");
    expect(xml).not.toContain("<lastmod>");
  });

  it("indexes the same static paths as the public URL list", () => {
    expect(INDEXABLE_STATIC_PATHS).toHaveLength(19);
  });

  it("pageMeta uses the page path as og:url, not the homepage", () => {
    const meta = pageMeta("/tools", { title: "Tools" });
    expect(meta.alternates).toEqual({ canonical: "/tools" });
    expect(meta.openGraph).toMatchObject({ url: "https://zancta.tech/tools" });
  });

  it("homepage description is within Bing's typical 50-160 character range", () => {
    expect(HOMEPAGE_DESCRIPTION.length).toBeGreaterThanOrEqual(50);
    expect(HOMEPAGE_DESCRIPTION.length).toBeLessThanOrEqual(160);
    const home = pageMeta("/", { description: HOMEPAGE_DESCRIPTION });
    expect(home.description).toBe(HOMEPAGE_DESCRIPTION);
    expect(home.alternates).toEqual({ canonical: "https://zancta.tech/" });
    expect(home.openGraph).toMatchObject({ description: HOMEPAGE_DESCRIPTION, url: "https://zancta.tech/" });
  });

  it("root layout does not stamp a homepage canonical onto every route", async () => {
    const src = await readFile(path.join(process.cwd(), "app/layout.tsx"), "utf8");
    expect(src).not.toMatch(/alternates:\s*\{\s*canonical:/);
  });

  it("private layouts noindex and self-canonicalize", async () => {
    const files = [
      ["app/signin/layout.tsx", "/signin"],
      ["app/signup/layout.tsx", "/signup"],
      ["app/account/layout.tsx", "/account"],
      ["app/admin/layout.tsx", "/admin"],
      ["app/forgot-password/layout.tsx", "/forgot-password"],
      ["app/reset-password/layout.tsx", "/reset-password"],
      ["app/verify-email/layout.tsx", "/verify-email"],
    ] as const;
    for (const [rel, canonical] of files) {
      const src = await readFile(path.join(process.cwd(), rel), "utf8");
      expect(src, rel).toMatch(/index:\s*false/);
      expect(src, rel).toContain(`canonical: "${canonical}"`);
    }
  });
});
