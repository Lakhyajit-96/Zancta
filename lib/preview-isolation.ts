/**
 * Vercel Preview has a separate Supabase Postgres (`zancta-preview`).
 * Mutating `/api/*` and OAuth callbacks stay blocked unless
 * PREVIEW_ALLOW_PRODUCTION_MUTATIONS=true. Leave that unset: Preview
 * must not become a second write path to customer flows by default.
 *
 * Preview must not have Production Resend, Dodo, or Upstash names.
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
