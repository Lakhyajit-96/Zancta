import { createHmac, timingSafeEqual } from "crypto";
import type { PremiumOcrLanguage } from "@/lib/ocr-languages";
import { isPremiumOcrLanguage } from "@/lib/ocr-languages";

const TOKEN_TTL_MS = 2 * 60 * 1000;

function secret(): string | null {
  const value = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  return value && value.length >= 16 ? value : null;
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export function mintOcrLangToken(userId: string, lang: PremiumOcrLanguage, now = Date.now()): string | null {
  const key = secret();
  if (!key) return null;
  const exp = String(now + TOKEN_TTL_MS);
  const payload = `${userId}.${lang}.${exp}`;
  return `${payload}.${sign(payload, key)}`;
}

export function verifyOcrLangToken(
  token: string,
  expectedLang: PremiumOcrLanguage,
  now = Date.now(),
): { ok: true; userId: string } | { ok: false } {
  const key = secret();
  if (!key) return { ok: false };
  const parts = token.split(".");
  if (parts.length !== 4) return { ok: false };
  const [userId, lang, exp, sig] = parts;
  if (!userId || !isPremiumOcrLanguage(lang) || lang !== expectedLang) return { ok: false };
  const expMs = Number(exp);
  if (!Number.isFinite(expMs) || expMs < now) return { ok: false };
  const payload = `${userId}.${lang}.${exp}`;
  const expected = sign(payload, key);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false };
  return { ok: true, userId };
}
