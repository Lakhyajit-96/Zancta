import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const ALG = "aes-256-gcm";
const PREFIX = "v1";

export class IntegrationCryptoError extends Error {
  constructor(
    message: string,
    readonly code: "ENCRYPTION_KEY_MISSING" | "ENCRYPTION_KEY_INVALID" | "DECRYPT_FAILED",
  ) {
    super(message);
    this.name = "IntegrationCryptoError";
  }
}

export function hasIntegrationEncryptionKey(): boolean {
  try {
    getKey();
    return true;
  } catch {
    return false;
  }
}

function getKey(): Buffer {
  const raw = process.env.INTEGRATION_ENCRYPTION_KEY?.trim();
  if (!raw) throw new IntegrationCryptoError("INTEGRATION_ENCRYPTION_KEY is not set", "ENCRYPTION_KEY_MISSING");
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  const b64 = Buffer.from(raw, "base64");
  if (b64.length === 32) return b64;
  throw new IntegrationCryptoError("INTEGRATION_ENCRYPTION_KEY must be 32-byte hex or base64", "ENCRYPTION_KEY_INVALID");
}

export function encryptSecret(plain: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALG, key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [PREFIX, iv.toString("base64url"), tag.toString("base64url"), enc.toString("base64url")].join(".");
}

export function decryptSecret(payload: string): string {
  const key = getKey();
  const parts = payload.split(".");
  if (parts.length !== 4 || parts[0] !== PREFIX) {
    throw new IntegrationCryptoError("Ciphertext is malformed", "DECRYPT_FAILED");
  }
  try {
    const iv = Buffer.from(parts[1], "base64url");
    const tag = Buffer.from(parts[2], "base64url");
    const enc = Buffer.from(parts[3], "base64url");
    const decipher = createDecipheriv(ALG, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
  } catch {
    throw new IntegrationCryptoError("Unable to decrypt integration secret", "DECRYPT_FAILED");
  }
}

function stateSecret(): string {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.INTEGRATION_ENCRYPTION_KEY || "";
}

export function signOAuthState(payload: string): string {
  const secret = stateSecret();
  if (!secret) throw new IntegrationCryptoError("AUTH_SECRET is required to sign OAuth state", "ENCRYPTION_KEY_MISSING");
  const body = Buffer.from(payload, "utf8").toString("base64url");
  const mac = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function verifyOAuthState(token: string, maxAgeMs = 10 * 60 * 1000): string | null {
  const secret = stateSecret();
  if (!secret || !token.includes(".")) return null;
  const idx = token.lastIndexOf(".");
  const body = token.slice(0, idx);
  const mac = token.slice(idx + 1);
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const json = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { exp?: number; [k: string]: unknown };
    if (typeof json.exp !== "number" || json.exp < Date.now() - maxAgeMs) return null;
    return Buffer.from(body, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

export function looksLikeSecret(value: string): boolean {
  return /refresh_token|access_token|ya29\.|1\/\/|Bearer\s+[A-Za-z0-9._\-]+/i.test(value);
}
