/**
 * Per-email cooldowns for auth email delivery (password reset, verification).
 * Keys are HMAC-SHA256(AUTH_SECRET, purpose || normalized email) so Redis never
 * stores the address in plaintext. Uses the same AUTH_SECRET pepper as
 * deleted-identity / oauth-intent.
 */
import { createHmac } from "crypto";
import { rateLimitAsync } from "@/lib/rate-limit";

export const AUTH_EMAIL_DELIVERY_LIMIT = 3;
export const AUTH_EMAIL_DELIVERY_WINDOW_MS = 60 * 60 * 1000;

export type AuthEmailDeliveryPurpose = "forgot-password" | "resend-verify";

function pepper(): string {
  const s = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "test") return "test-oauth-intent-secret";
  throw new Error("AUTH_SECRET missing");
}

export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function authEmailRateLimitKey(purpose: AuthEmailDeliveryPurpose, email: string): string {
  const normalized = normalizeAuthEmail(email);
  const digest = createHmac("sha256", pepper())
    .update(`${purpose}\0${normalized}`, "utf8")
    .digest("hex");
  return `${purpose}-email:${digest}`;
}

export async function limitAuthEmailDelivery(purpose: AuthEmailDeliveryPurpose, email: string) {
  return rateLimitAsync(
    authEmailRateLimitKey(purpose, email),
    AUTH_EMAIL_DELIVERY_LIMIT,
    AUTH_EMAIL_DELIVERY_WINDOW_MS,
  );
}
