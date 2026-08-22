import { buildSitemapXml } from "@/lib/seo/sitemap-xml";

export const dynamic = "force-static";
export const runtime = "nodejs";
export const revalidate = 3600;

export function GET() {
  try {
    const xml = buildSitemapXml();
    return new Response(xml, {
      status: 200,
      headers: {
        "content-type": "application/xml; charset=utf-8",
        "cache-control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        category: "SEO",
        severity: "error",
        message: "sitemap_xml_failed",
        detail: error instanceof Error ? error.message.slice(0, 200) : "unknown",
      }),
    );
    return new Response("Sitemap unavailable", {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}
