import { PrismaClient } from "./generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/**
 * Normalize a Postgres connection string before handing it to PrismaPg.
 * Fixes three real-world failure classes seen with managed Postgres (Supabase):
 *  1. Copy/paste artifacts (leading/trailing whitespace, newlines, stray quotes)
 *     that silently break scheme detection or parsing.
 *  2. Unsafe characters in the password (e.g. a raw `@`): userinfo is parsed as
 *     everything between :// and the LAST '@', then percent-encoded canonically.
 *     Idempotent — already-encoded values (%40) decode then re-encode identically.
 *  3. Ambiguous SSL modes: any sslmode/pgsslparam query params are stripped so
 *     the explicit `ssl` option below is the single source of truth. (pg v8.23+
 *     aliases sslmode=require to verify-full, which rejects Supabase's
 *     self-signed CA chain — "self-signed certificate in certificate chain".)
 * Never logs the URL or credentials.
 */
function normalizePostgresUrl(raw: string): string {
  let url = raw.trim();
  // Strip accidental surrounding quotes from env copy/paste
  if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
    url = url.slice(1, -1).trim();
  }
  const schemeMatch = url.match(/^([a-z][a-z0-9+.-]*:\/\/)/i);
  if (!schemeMatch) return url;
  const scheme = schemeMatch[1];
  let body = url.slice(scheme.length);
  // Drop query params (sslmode etc.) — explicit ssl config is applied instead
  const qIdx = body.indexOf("?");
  if (qIdx !== -1) body = body.slice(0, qIdx);
  // userinfo = everything up to the LAST '@' (tolerates raw '@' in password)
  const at = body.lastIndexOf("@");
  if (at === -1) return scheme + body;
  const userinfo = body.slice(0, at);
  const rest = body.slice(at + 1);
  const colon = userinfo.indexOf(":");
  if (colon === -1) return scheme + userinfo + "@" + rest;
  // Decode first, then encode: canonicalizes both raw ('@') and pre-encoded
  // ('%40') passwords to the same safe form without double-encoding.
  const enc = (part: string) => {
    let decoded = part;
    try {
      decoded = decodeURIComponent(part);
    } catch {
      /* not percent-encoded — use as-is */
    }
    return encodeURIComponent(decoded);
  };
  const user = enc(userinfo.slice(0, colon));
  const password = enc(userinfo.slice(colon + 1));
  return scheme + user + ":" + password + "@" + rest;
}

function postgresSsl(connectionString: string): { rejectUnauthorized: boolean } | undefined {
  if (process.env.DATABASE_SSL === "disable" || process.env.DATABASE_SSL === "false") return undefined;
  try {
    const host = new URL(connectionString.replace(/^postgres(ql)?:/i, "http:")).hostname;
    if (host === "127.0.0.1" || host === "localhost" || host === "::1") return undefined;
  } catch {
    /* keep hosted-TLS default when the URL cannot be parsed */
  }
  return { rejectUnauthorized: false };
}

function createClient() {
  const url = (process.env.DATABASE_URL || "file:./prisma/dev.db").trim();
  // Handle both SQLite (dev) and PostgreSQL (production) — provider selection via DATABASE_URL
  const isPostgres = /^postgres(ql)?:\/\//i.test(url);
  if (isPostgres) {
    const connectionString = normalizePostgresUrl(url);
    // Hosted Postgres (Supabase and similar) needs TLS. Loopback test/dev Postgres
    // typically has no SSL; forcing ssl there fails with "server does not support SSL".
    const ssl = postgresSsl(connectionString);
    const adapter = new PrismaPg({
      connectionString,
      ...(ssl ? { ssl } : {}),
    });
    return new PrismaClient({ adapter, log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"] } as unknown as never);
  }
  // Development: SQLite via BetterSqlite3
  const path = url.startsWith("file:") ? url.slice(5).replace(/^\.\//, "./") : url;
  const _dbPath = path.startsWith("/") ? path : `./${path.replace(/^\.\//, "")}`;
  void _dbPath; // keep for future debug, silence unused
  const adapter = new PrismaBetterSqlite3({ url: url });
  return new PrismaClient({ adapter, log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"] } as unknown as never);
}

export const prisma = (globalForPrisma.prisma ?? createClient()) as unknown as PrismaClient;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma as unknown as PrismaClient;

export default prisma;
