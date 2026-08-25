import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RateLimitEntry = { count: number; resetAt: number };
const memoryStore = new Map<string, RateLimitEntry>();

let upstashLimiter: Ratelimit | null = null;
let redis: Redis | null = null;
let redisFailedAt: number | null = null;

function getUpstash(): Ratelimit | null {
  // Preview must not increment Production Redis even if Upstash names leak into the env.
  if (process.env.VERCEL_ENV === "preview") return null;
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

// Production policy: FAIL CLOSED whenever a distributed limiter is unavailable.
// Tradeoff: Availability vs Abuse resistance
// - Fail open (allow with memory fallback): legitimate users not locked out during a
//   Redis outage or misconfiguration, but the per-instance Map is not shared across
//   Vercel's serverless instances, so it provides no real production-wide protection.
// - Fail closed (block all): abuse blocked, but legitimate users blocked during an outage.
// Decision: In Production runtime (NODE_ENV=production AND VERCEL_ENV=production) ALWAYS
// fail closed when Upstash is missing, cannot initialize, or the Redis call throws.
// FAIL OPEN (memory) only outside production runtime (local dev, tests, Vercel preview).
// Rationale: rate-limited operations are security-sensitive; silently downgrading to an
// ineffective per-instance limiter in production would leave brute force / email-flood /
// checkout-spam unmitigated. Local DX and preview keep the memory fallback.
function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production";
}

export async function rateLimitAsync(key: string, limit: number, windowMs: number): Promise<{ ok: boolean; remaining: number; resetAt: number }> {
  const upstash = getUpstash();
  const failClosed = isProductionRuntime();
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
      if (failClosed) {
        // Fail closed: block the request (429) to preserve abuse resistance
        return { ok: false, remaining: 0, resetAt: Date.now() + windowMs };
      }
      // Dev/preview: fallback to memory
      console.error("[rate-limit] Redis failed, falling back to memory (non-production only)");
    }
  } else if (failClosed) {
    // Production requires a distributed limiter. Upstash is missing or could not
    // initialize (absent URL/token, or constructor threw). Do NOT downgrade to the
    // per-instance memory Map — it is not shared across serverless instances and would
    // silently defeat abuse protection. Fail closed instead.
    console.error("[rate-limit] Distributed limiter unavailable in production — failing closed");
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
