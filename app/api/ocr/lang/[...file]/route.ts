import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { relative, resolve, sep } from "path";
import { auth } from "@/lib/auth";
import { hasPremiumOcrAccess } from "@/lib/ocr-access";
import { languagePackFileName, parsePremiumLangFile } from "@/lib/ocr-languages";
import { verifyOcrLangToken } from "@/lib/ocr-lang-token";
import { getClientIp, rateLimitAsync } from "@/lib/rate-limit";
import { safeServerError } from "@/lib/safe-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ file: string[] }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  const file = (await params).file.join("/");
  const lang = parsePremiumLangFile(file);
  if (!lang) {
    return NextResponse.json({ error: "Unknown language pack." }, { status: 404 });
  }

  const ip = getClientIp(req.headers);
  const rl = await rateLimitAsync(`ocr-lang:${ip}`, 20, 15 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const token = req.headers.get("x-ocr-lang-token");
  let authorizedUserId: string | null = null;

  if (token) {
    const verified = verifyOcrLangToken(token, lang);
    if (verified.ok) authorizedUserId = verified.userId;
  }

  if (!authorizedUserId) {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }
    authorizedUserId = session.user.id;
  }

  const allowed = await hasPremiumOcrAccess(authorizedUserId);
  if (!allowed) {
    return NextResponse.json({ error: "Premium required" }, { status: 403 });
  }

  try {
    const root = resolve(process.cwd(), "private", "ocr-traineddata");
    const path = resolve(root, languagePackFileName(lang));
    const rel = relative(root, path);
    if (!rel || rel.startsWith("..") || rel.includes(`..${sep}`)) {
      return NextResponse.json({ error: "Unknown language pack." }, { status: 404 });
    }
    const data = await readFile(path);
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "content-type": "application/gzip",
        "cache-control": "private, max-age=86400",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return NextResponse.json({ error: "Language pack is not available." }, { status: 503 });
    }
    return safeServerError("ocr-lang", "read", error);
  }
}
