import { NextResponse } from "next/server";

// Production config enforcement — fail fast if critical secrets missing in production
const requiredInProduction = [
  { key: "AUTH_SECRET", env: "AUTH_SECRET", alt: "NEXTAUTH_SECRET" },
  { key: "DATABASE_URL", env: "DATABASE_URL" },
] as const;

const requiredForEmailInProduction = [
  { key: "RESEND_API_KEY", env: "RESEND_API_KEY" },
  { key: "EMAIL_FROM", env: "EMAIL_FROM" },
] as const;

const requiredForRateLimitInProduction = [
  { key: "UPSTASH_REDIS_REST_URL", env: "UPSTASH_REDIS_REST_URL" },
  { key: "UPSTASH_REDIS_REST_TOKEN", env: "UPSTASH_REDIS_REST_TOKEN" },
] as const;

export function assertProductionConfig(): { ok: boolean; missing: string[]; warnings: string[] } {
  const isProd = process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production";
  if (!isProd) return { ok: true, missing: [], warnings: [] };

  const missing: string[] = [];
  const warnings: string[] = [];

  for (const entry of requiredInProduction) {
    const val = process.env[entry.env] || ("alt" in entry && process.env[(entry as unknown as { alt: string }).alt]);
    if (!val) missing.push(entry.key);
  }

  for (const { key, env } of requiredForEmailInProduction) {
    const val = process.env[env];
    if (!val) missing.push(key);
    else if (env === "EMAIL_FROM" && !val.includes("@")) missing.push(key);
  }

  // Upstash is REQUIRED in production. Without it, rate limiting cannot be distributed
  // across serverless instances, and the limiter now fails closed in production
  // (see lib/rate-limit.ts). Treat its absence as a hard config failure, not a warning,
  // so any wired startup/route validation refuses to run without abuse protection.
  for (const { key, env } of requiredForRateLimitInProduction) {
    if (!process.env[env]) missing.push(key);
  }

  // Check AUTH_TRUST_HOST for Vercel
  if (!process.env.AUTH_TRUST_HOST && process.env.VERCEL) {
    warnings.push("AUTH_TRUST_HOST not set — ensure trustHost:true is correct for Vercel");
  }

  return { ok: missing.length === 0, missing, warnings };
}

// Call this in API routes that require strict prod config
export function requireProductionConfig(): NextResponse | null {
  const { ok, missing } = assertProductionConfig();
  if (!ok) {
    console.error("[config] Missing required production env:", missing);
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  return null;
}
