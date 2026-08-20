import { NextResponse } from "next/server";
import { notifyIndexNow, buildIndexNowPayload } from "@/lib/indexnow";
import { PUBLIC_SITE_URL } from "@/lib/seo";
import { TOOLS } from "@/lib/tools";

function publicUrls(): string[] {
  const paths = ["", "/tools", "/pricing", "/about", "/features", "/how-it-works", "/faq", "/privacy", "/terms", "/security", "/help", "/docs", "/contact", "/guides/local-processing"];
  const tools = TOOLS.filter((t) => t.available).map((t) => `/tools/${t.slug}`);
  return [...paths, ...tools].map((p) => `${PUBLIC_SITE_URL}${p || "/"}`);
}

export async function POST(req: Request) {
  const secret = process.env.INDEXNOW_NOTIFY_SECRET;
  if (!secret) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const header = req.headers.get("authorization") || "";
  if (header !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null) as { urls?: string[] } | null;
  const urls = Array.isArray(body?.urls) && body.urls.length ? body.urls : publicUrls();
  const payload = buildIndexNowPayload(urls);
  const result = await notifyIndexNow(payload.urlList);
  return NextResponse.json({ ...result, count: payload.urlList.length });
}
