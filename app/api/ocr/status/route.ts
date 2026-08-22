import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPremiumOcrAccess } from "@/lib/ocr-access";
import { OCR_LANGUAGE_PACKS } from "@/lib/ocr-languages";
import { rateLimitAsync } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({
      premium: false,
      languages: OCR_LANGUAGE_PACKS.map((language) => ({
        code: language.code,
        name: language.name,
        premium: language.premium,
      })),
    });
  }

  const rl = await rateLimitAsync(`ocr-status:${session.user.id}`, 30, 15 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const premium = await hasPremiumOcrAccess(session.user.id);
  return NextResponse.json({
    premium,
    languages: OCR_LANGUAGE_PACKS.map((language) => ({
      code: language.code,
      name: language.name,
      premium: language.premium,
    })),
  });
}
