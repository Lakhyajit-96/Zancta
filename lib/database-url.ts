/**
 * DATABASE_URL resolution. No Prisma imports — safe for Edge/config and Node.
 * Never logs or returns error text containing the connection string.
 */

const SQLITE_DEV_FALLBACK = "file:./prisma/dev.db";

export const DATABASE_URL_REQUIRED_ERROR = "DATABASE_URL is required in Production";
export const DATABASE_URL_POSTGRES_ERROR = "DATABASE_URL must use PostgreSQL in Production";

type EnvLike = {
  DATABASE_URL?: string;
  NODE_ENV?: string;
  VERCEL_ENV?: string;
};

export function isPostgresDatabaseUrl(url: string): boolean {
  return /^postgres(ql)?:\/\//i.test(url.trim());
}

/** SQLite/file fallback is local development/test only. Never Production, Preview, or NODE_ENV=production. */
export function sqliteFallbackAllowed(env: EnvLike = process.env): boolean {
  const vercel = env.VERCEL_ENV;
  if (vercel === "production" || vercel === "preview") return false;
  if (env.NODE_ENV === "production") return false;
  return true;
}

function trimmedDatabaseUrl(env: EnvLike): string {
  const raw = env.DATABASE_URL;
  return typeof raw === "string" ? raw.trim() : "";
}

function postgresUrlHasHost(url: string): boolean {
  try {
    const parsed = new URL(url.replace(/^postgres(ql)?:/i, "http:"));
    return Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

export function isUsablePostgresDatabaseUrl(url: string): boolean {
  const trimmed = url.trim();
  return isPostgresDatabaseUrl(trimmed) && postgresUrlHasHost(trimmed);
}

/**
 * Selects the Prisma datasource URL.
 * Production / Preview / NODE_ENV=production: PostgreSQL required; SQLite and empty fail hard.
 * Development/test: missing URL still falls back to the historic local SQLite file.
 */
export function resolveDatabaseUrl(env: EnvLike = process.env): string {
  const url = trimmedDatabaseUrl(env);
  const allowSqlite = sqliteFallbackAllowed(env);

  if (!url) {
    if (!allowSqlite) throw new Error(DATABASE_URL_REQUIRED_ERROR);
    return SQLITE_DEV_FALLBACK;
  }

  if (isUsablePostgresDatabaseUrl(url)) return url;

  if (!allowSqlite) throw new Error(DATABASE_URL_POSTGRES_ERROR);

  if (isPostgresDatabaseUrl(url) && !postgresUrlHasHost(url)) {
    throw new Error(DATABASE_URL_POSTGRES_ERROR);
  }

  return url;
}

/** Vercel Production config layer: presence + PostgreSQL scheme. Names only. */
export function productionDatabaseUrlMissing(env: EnvLike = process.env): boolean {
  return !isUsablePostgresDatabaseUrl(trimmedDatabaseUrl(env));
}
