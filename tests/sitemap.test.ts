import { describe, it, expect } from "vitest";
import sitemap from "@/app/sitemap";
import { pageMeta, PUBLIC_SITE_URL } from "@/lib/seo";

describe("sitemap contract", () => {
  it("emits unique https zancta.tech URLs and excludes private/unavailable routes", async () => {
    const entries = await Promise.resolve(sitemap());
    const origin = PUBLIC_SITE_URL.replace(/\/$/, "");
    expect(origin).toBe("https://zancta.tech");
    const urls = entries.map((e) => e.url);
    expect(new Set(urls).size).toBe(urls.length);
    for (const url of urls) {
      expect(url.startsWith(`${origin}/`) || url === `${origin}/` || url === origin).toBe(true);
      expect(url).not.toMatch(/localhost|127\.0\.0\.1|vercel\.app|example\.com/i);
      expect(url).not.toMatch(/\/signin|\/signup|\/account|\/api\/|\/verify-email|\/forgot-password|\/reset-password/);
      expect(url).not.toContain("background-remover");
    }
    expect(urls.some((u) => u === `${origin}/` || u === origin)).toBe(true);
    expect(urls).toContain(`${origin}/guides/local-processing`);
    expect(urls).not.toContain(`${origin}/contact`);
    expect(urls).not.toContain(`${origin}/features`);
    expect(urls).not.toContain(`${origin}/docs`);
  });

  it("pageMeta uses the page path as og:url, not the homepage", () => {
    const meta = pageMeta("/tools", { title: "Tools" });
    expect(meta.alternates).toEqual({ canonical: "/tools" });
    expect(meta.openGraph).toMatchObject({ url: "https://zancta.tech/tools" });
  });
});
