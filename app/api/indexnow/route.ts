import { NextRequest, NextResponse } from "next/server";
import { getClientIp, rateLimitAsync } from "@/lib/rate-limit";
import { notifyIndexNow, sanitizeIndexNowUrls } from "@/lib/indexnow";

export async function POST(req: NextRequest) {
  const secret = process.env.INDEXNOW_NOTIFY_SECRET;
  if (!secret) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const ip = getClientIp(req.headers);
  const rl = await rateLimitAsync(`indexnow:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });

  const header = req.headers.get("authorization") || "";
  if (header !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null) as { urls?: unknown } | null;
  if (!body || !Array.isArray(body.urls)) {
    return NextResponse.json({ error: "urls array required" }, { status: 400 });
  }
  const urls = sanitizeIndexNowUrls(body.urls);
  if (urls.length === 0) return NextResponse.json({ error: "No allowed URLs" }, { status: 400 });

  const result = await notifyIndexNow(urls);
  return NextResponse.json({ ok: result.ok, status: result.status, accepted: result.accepted });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
