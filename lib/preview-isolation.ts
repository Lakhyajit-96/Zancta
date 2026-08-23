/**
 * Vercel Preview still shares Production DATABASE_URL until the owner attaches
 * a separate Postgres (observed Production provider: Supabase). Mutating APIs
 * stay blocked until PREVIEW_ALLOW_PRODUCTION_MUTATIONS=true after that split.
 *
 * Preview Resend/Dodo/Upstash should be scoped Production-only in Vercel.
 * Code also skips Upstash and Resend when VERCEL_ENV=preview.
 */

export function isVercelPreview(): boolean {
  return process.env.VERCEL_ENV === "preview";
}

export function previewMutationsBlocked(): boolean {
  if (!isVercelPreview()) return false;
  return process.env.PREVIEW_ALLOW_PRODUCTION_MUTATIONS !== "true";
}

export function previewEmailBlocked(): boolean {
  if (!isVercelPreview()) return false;
  return process.env.PREVIEW_ALLOW_PRODUCTION_EMAIL !== "true";
}

export function previewProductionDataBlocked(): boolean {
  if (!isVercelPreview()) return false;
  return process.env.PREVIEW_ALLOW_PRODUCTION_DATA !== "true";
}

export const PREVIEW_ISOLATED_CODE = "PREVIEW_ISOLATED";
export const PREVIEW_ISOLATED_MESSAGE = "Preview deployments do not mutate production data or send production email.";

export function isPreviewBlockedRequest(method: string, pathname: string): boolean {
  if (!previewMutationsBlocked()) return false;
  const path = pathname.split("?")[0] || "/";
  const verb = method.toUpperCase();

  if (path.startsWith("/api/auth/callback")) return true;

  if (verb === "GET" || verb === "HEAD" || verb === "OPTIONS") return false;
  return path.startsWith("/api/");
}
