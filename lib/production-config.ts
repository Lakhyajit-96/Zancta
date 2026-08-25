import { NextResponse } from "next/server";

/**
 * ZANCTA production configuration contract.
 *
 * A. Mandatory on every Vercel Production runtime
 *    (NODE_ENV=production AND VERCEL_ENV=production):
 *    AUTH_SECRET (or NEXTAUTH_SECRET), DATABASE_URL,
 *    UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN,
 *    RESEND_API_KEY, EMAIL_FROM (must contain @).
 *
 * B. Feature-gated: Dodo live credentials only when
 *    PAYMENTS_LIVE_ENABLED=true. Payments currently stay disabled;
 *    missing Dodo vars must not fail Production in that case.
 *
 * C. Optional: Google/GitHub user OAuth, operator Google/Bing,
 *    INTEGRATION_ENCRYPTION_KEY, IndexNow, Sentry, GA.
 *    AUTH_TRUST_HOST is a warning (trustHost is hard-coded true).
 *
 * D. Development / Vitest / Vercel Preview: this helper is a no-op.
 *
 * Never log or throw secret VALUES — variable NAMES only.
 */

const GENERIC_HTTP_ERROR = "Server misconfigured";

function envPresent(name: string): boolean {
  const v = process.env[name];
  return typeof v === "string" && v.trim().length > 0;
}

function envPresentAny(...names: string[]): boolean {
  return names.some((name) => envPresent(name));
}

/** Vercel Production runtime only. Local `next start` without VERCEL_ENV is not this. */
export function isVercelProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production";
}

/**
 * Next.js sets NEXT_PHASE during `next build`. Validation must not throw then:
 * local/CI builds are not Vercel Production runtime, and Vercel Production
 * builds must not be confused with isolate cold-start.
 */
export function isNextBuildProcess(): boolean {
  const phase = process.env.NEXT_PHASE;
  if (phase === "phase-production-build" || phase === "phase-development-build") return true;
  return process.env.npm_lifecycle_event === "build";
}

function missingMandatoryProduction(): string[] {
  const missing: string[] = [];

  if (!envPresentAny("AUTH_SECRET", "NEXTAUTH_SECRET")) missing.push("AUTH_SECRET");
  if (!envPresent("DATABASE_URL")) missing.push("DATABASE_URL");
  if (!envPresent("RESEND_API_KEY")) missing.push("RESEND_API_KEY");
  const emailFrom = process.env.EMAIL_FROM?.trim() ?? "";
  if (!emailFrom.includes("@")) missing.push("EMAIL_FROM");
  // Required in production so the Phase 6A-1 fail-closed limiter has a distributed backend.
  if (!envPresent("UPSTASH_REDIS_REST_URL")) missing.push("UPSTASH_REDIS_REST_URL");
  if (!envPresent("UPSTASH_REDIS_REST_TOKEN")) missing.push("UPSTASH_REDIS_REST_TOKEN");

  return missing;
}

function missingLivePaymentConfig(): string[] {
  if (process.env.PAYMENTS_LIVE_ENABLED !== "true") return [];
  const missing: string[] = [];
  if (!envPresent("DODO_API_KEY")) missing.push("DODO_API_KEY");
  if (!envPresentAny("DODO_WEBHOOK_SECRET", "DODO_PAYMENTS_WEBHOOK_SECRET")) {
    missing.push("DODO_WEBHOOK_SECRET");
  }
  if (!envPresentAny("DODO_PRODUCT_MONTHLY_ID", "DODO_PAYMENTS_PRODUCT_MONTHLY_ID")) {
    missing.push("DODO_PRODUCT_MONTHLY_ID");
  }
  if (!envPresentAny("DODO_PRODUCT_ANNUAL_ID", "DODO_PAYMENTS_PRODUCT_ANNUAL_ID")) {
    missing.push("DODO_PRODUCT_ANNUAL_ID");
  }
  const dodoEnv = (process.env.DODO_ENVIRONMENT || "").trim().toLowerCase();
  if (dodoEnv !== "live" && dodoEnv !== "production") missing.push("DODO_ENVIRONMENT");
  return missing;
}

export function formatMissingProductionConfigError(missing: string[]): string {
  return `Missing required production configuration: ${missing.join(", ")}`;
}

export function assertProductionConfig(): { ok: boolean; missing: string[]; warnings: string[] } {
  if (!isVercelProductionRuntime()) return { ok: true, missing: [], warnings: [] };

  const missing = [...missingMandatoryProduction(), ...missingLivePaymentConfig()];
  const warnings: string[] = [];

  if (!envPresent("AUTH_TRUST_HOST") && envPresent("VERCEL")) {
    warnings.push("AUTH_TRUST_HOST not set — ensure trustHost:true is correct for Vercel");
  }

  return { ok: missing.length === 0, missing, warnings };
}

/**
 * Node.js isolate start (instrumentation register). Skips `next build`.
 * On Vercel this runs per serverless cold start, not once per deployment.
 */
export function enforceProductionConfigOrThrow(): void {
  if (isNextBuildProcess()) return;
  const { ok, missing, warnings } = assertProductionConfig();
  if (warnings.length > 0) {
    console.warn("[config]", warnings.join("; "));
  }
  if (ok) return;
  const message = formatMissingProductionConfigError(missing);
  console.error("[config]", message);
  throw new Error(message);
}

/** Request-time API/proxy guard. HTTP body is generic; logs names only. */
export function requireProductionConfig(): NextResponse | null {
  if (isNextBuildProcess()) return null;
  const { ok, missing } = assertProductionConfig();
  if (!ok) {
    console.error("[config]", formatMissingProductionConfigError(missing));
    return NextResponse.json({ error: GENERIC_HTTP_ERROR }, { status: 500 });
  }
  return null;
}
