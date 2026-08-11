import crypto from "crypto";

// Hash token for storage — store hash, compare hash, never log plain token in prod
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
