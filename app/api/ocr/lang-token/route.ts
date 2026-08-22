import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPremiumOcrAccess } from "@/lib/ocr-access";
import { isPremiumOcrLanguage } from "@/lib/ocr-languages";
import { mintOcrLangToken } from "@/lib/ocr-lang-token";
import { rateLimitAsync } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const rl = await rateLimitAsync(`ocr-token:${session.user.id}`, 20, 15 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const body = await req.json().catch(() => null) as { lang?: string } | null;
  const lang = body?.lang;
  if (!lang || !isPremiumOcrLanguage(lang)) {
    return NextResponse.json({ error: "Unknown language." }, { status: 400 });
  }

  const allowed = await hasPremiumOcrAccess(session.user.id);
  if (!allowed) {
    return NextResponse.json({ error: "Premium required" }, { status: 403 });
  }

  const token = mintOcrLangToken(session.user.id, lang);
  if (!token) {
    return NextResponse.json({ error: "Language packs are unavailable." }, { status: 503 });
  }

  return NextResponse.json({ token, lang });
}
