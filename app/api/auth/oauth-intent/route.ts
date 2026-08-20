import { NextRequest, NextResponse } from "next/server";
import { rateLimitAsync, getClientIp } from "@/lib/rate-limit";
import { oauthIntentCookieName, oauthIntentCookieOptions, signOAuthIntent, type OAuthIntent } from "@/lib/oauth-intent";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = await rateLimitAsync(`oauth-intent:${ip}`, 30, 15 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });

  const body = await req.json().catch(() => null) as { intent?: string } | null;
  if (body?.intent !== "signin" && body?.intent !== "signup") {
    return NextResponse.json({ error: "Invalid intent" }, { status: 400 });
  }
  const intent = body.intent as OAuthIntent;
  const res = NextResponse.json({ ok: true });
  res.cookies.set(oauthIntentCookieName(), signOAuthIntent(intent), oauthIntentCookieOptions());
  return res;
}
