import { createHmac, timingSafeEqual } from "crypto";

export type OAuthIntent = "signin" | "signup";

const MAX_AGE_SEC = 10 * 60;

function secret(): string {
  const s = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "test") return "test-oauth-intent-secret";
  throw new Error("AUTH_SECRET missing");
}

export function oauthIntentCookieName(): string {
  const secure =
    process.env.VERCEL_ENV === "production" || process.env.AUTH_USE_SECURE_COOKIES !== "false";
  return secure ? "__Host-zancta.oauth-intent" : "zancta.oauth-intent";
}

export function signOAuthIntent(intent: OAuthIntent, nowSec = Math.floor(Date.now() / 1000)): string {
  const payload = Buffer.from(JSON.stringify({ v: 1, intent, exp: nowSec + MAX_AGE_SEC }), "utf8").toString("base64url");
  const mac = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}

export function verifyOAuthIntent(raw: string | undefined | null, nowSec = Math.floor(Date.now() / 1000)): OAuthIntent | null {
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot < 1) return null;
  const payload = raw.slice(0, dot);
  const mac = raw.slice(dot + 1);
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { v?: number; intent?: string; exp?: number };
    if (parsed.v !== 1 || (parsed.intent !== "signin" && parsed.intent !== "signup")) return null;
    if (typeof parsed.exp !== "number" || parsed.exp < nowSec) return null;
    return parsed.intent;
  } catch {
    return null;
  }
}

export function oauthIntentCookieOptions() {
  const secure =
    process.env.VERCEL_ENV === "production" || process.env.AUTH_USE_SECURE_COOKIES !== "false";
  return {
    httpOnly: true as const,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_SEC,
  };
}
