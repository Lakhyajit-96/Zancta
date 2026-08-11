import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RateLimitEntry = { count: number; resetAt: number };
const memoryStore = new Map<string, RateLimitEntry>();

let upstashLimiter: Ratelimit | null = null;
let redis: Redis | null = null;
let redisFailedAt: number | null = null;

function getUpstash(): Ratelimit | null {
  if (upstashLimiter) return upstashLimiter;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    redis = new Redis({ url, token });
    upstashLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "15 m"), prefix: "rl" });
    return upstashLimiter;
  } catch {
    return null;
  }
}

// Production policy: FAIL CLOSED for auth when Redis configured but unavailable
// Tradeoff: Availability vs Abuse resistance
// - Fail open (allow with memory fallback): legitimate users not locked out during Redis outage, but brute force possible via memory per-instance (not shared)
// - Fail closed (block all): abuse blocked, but legitimate users locked out during Redis outage
// Decision: FAIL CLOSED in production when Upstash is configured, FAIL OPEN in development.
// Rationale: Auth endpoints are security-sensitive; allowing unlimited attempts during Redis outage in production would enable brute force.
// In dev, fail open to keep local DX.
function shouldFailClosed(): boolean {
  const isProd = process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production";
  const hasUpstash = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
  return isProd && hasUpstash;
}

export async function rateLimitAsync(key: string, limit: number, windowMs: number): Promise<{ ok: boolean; remaining: number; resetAt: number }> {
  const upstash = getUpstash();
  const isProdFailClosed = shouldFailClosed();
  if (upstash) {
    try {
      const windowSec = Math.ceil(windowMs / 1000);
      const redisKey = `rl:${key}`;
      const now = Date.now();
      const r = redis!;
      const count = await r.incr(redisKey);
      if (count === 1) await r.expire(redisKey, windowSec);
      const ttl = await r.ttl(redisKey);
      const resetAt = now + ttl * 1000;
      const ok = count <= limit;
      redisFailedAt = null;
      return { ok, remaining: Math.max(0, limit - count), resetAt };
    } catch (e) {
      redisFailedAt = Date.now();
      console.error("[rate-limit] Redis failed", e);
      if (isProdFailClosed) {
        // Fail closed: block the request (429) to preserve abuse resistance
        return { ok: false, remaining: 0, resetAt: Date.now() + windowMs };
      }
      // Dev: fallback to memory
      console.error("[rate-limit] Redis failed, falling back to memory (dev only)");
    }
  } else if (isProdFailClosed && process.env.UPSTASH_REDIS_REST_URL) {
    // Upstash configured but not initialized (e.g., missing token) — fail closed in prod
    console.error("[rate-limit] Upstash not initialized but required in prod — failing closed");
    return { ok: false, remaining: 0, resetAt: Date.now() + windowMs };
  }
  return rateLimitMemory(key, limit, windowMs);
}

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; remaining: number; resetAt: number } {
  // Sync version — uses memory only. For distributed, caller must use rateLimitAsync.
  // In prod with Upstash, this will be per-instance not shared — callers on auth endpoints should use rateLimitAsync.
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.NODE_ENV === "production") {
    console.warn("[rate-limit] Sync rateLimit used in prod with Upstash — prefer rateLimitAsync for distributed");
  }
  return rateLimitMemory(key, limit, windowMs);
}

function rateLimitMemory(key: string, limit: number, windowMs: number): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = memoryStore.get(key);
  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    memoryStore.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt };
  }
  if (entry.count >= limit) return { ok: false, remaining: 0, resetAt: entry.resetAt };
  entry.count++;
  return { ok: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

export function getClientIp(headers: Headers): string {
  // Trust x-forwarded-for only behind trusted proxy (Vercel). Vercel sets it correctly from the edge.
  // If not behind Vercel, this could be spoofed if app is directly exposed. Documented: trust Vercel proxy.
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return headers.get("x-real-ip") || headers.get("cf-connecting-ip") || "unknown";
}

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of memoryStore.entries()) if (now > v.resetAt) memoryStore.delete(k);
  }, 10 * 60 * 1000).unref?.();
}
