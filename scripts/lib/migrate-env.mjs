/**
 * Shared, secret-safe helpers for Prisma migration tooling.
 * Never logs DATABASE_URL or credentials.
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export const TEST_LOOPBACK_URL = "postgresql://zancta:zancta@127.0.0.1:54329/zancta_test";
export const CHECKSUMS_PATH = join(process.cwd(), "prisma", "migrations", "checksums.json");
export const BASELINE_SQL_PATH = join(process.cwd(), "prisma", "baseline", "postgresql.sql");
export const MIGRATIONS_DIR = join(process.cwd(), "prisma", "migrations");

export function parseEnvFile(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[match[1]] = value;
  }
  return out;
}

export function redact(text) {
  return String(text)
    .replace(/postgres(ql)?:\/\/[^\s]+/gi, "[redacted]")
    .replace(/:[^:@\s/]+@/g, ":[redacted]@");
}

export function listMigrationNames() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => statSync(join(MIGRATIONS_DIR, name)).isDirectory())
    .sort();
}

export function fileChecksum(name) {
  const sql = readFileSync(join(MIGRATIONS_DIR, name, "migration.sql"));
  return createHash("sha256").update(sql).digest("hex");
}

export function localChecksumMap() {
  const map = {};
  for (const name of listMigrationNames()) map[name] = fileChecksum(name);
  return map;
}

export function frozenChecksumMap() {
  const parsed = JSON.parse(readFileSync(CHECKSUMS_PATH, "utf8"));
  if (parsed.algorithm !== "sha256" || !parsed.migrations) {
    throw new Error("Invalid prisma/migrations/checksums.json");
  }
  return parsed.migrations;
}

export function assertHistoricalChecksumsUnchanged() {
  const frozen = frozenChecksumMap();
  const local = localChecksumMap();
  const mismatches = [];
  for (const name of Object.keys(local)) {
    if (!frozen[name]) mismatches.push(`${name}: missing from checksums.json`);
    else if (local[name] !== frozen[name]) mismatches.push(`${name}: SQL changed`);
  }
  for (const name of Object.keys(frozen)) {
    if (!local[name]) mismatches.push(`${name}: listed in checksums.json but folder missing`);
  }
  if (mismatches.length) {
    throw new Error(`Migration checksum lock failed: ${mismatches.join("; ")}`);
  }
  return { ok: true, count: Object.keys(frozen).length };
}

export function classifyHost(url) {
  try {
    const parsed = new URL(url.replace(/^postgres(ql)?:/i, "http:"));
    const host = parsed.hostname;
    const port = parsed.port || "5432";
    const local = host === "127.0.0.1" || host === "localhost" || host === "::1";
    let kind = "unknown";
    if (local) kind = "loopback";
    else if (port === "6543") kind = "transaction-pooler";
    else if (port === "5432") kind = "session-or-direct";
    return { kind, port, host, local };
  } catch {
    return { kind: "unparseable", port: "", host: "", local: false };
  }
}

export function toSessionModeUrl(url) {
  try {
    const parsed = new URL(url.replace(/^postgres(ql)?:/i, "http:"));
    if (parsed.port === "6543") return url.replace(/:6543(\/|$)/, ":5432$1");
  } catch {
    /* keep original */
  }
  return url;
}

export function isLoopbackTestUrl(url) {
  try {
    const parsed = new URL(url.replace(/^postgres(ql)?:/i, "http:"));
    const local = parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
    return local && (parsed.port === "54329" || parsed.port === "5432");
  } catch {
    return false;
  }
}

export function loadDatabaseUrl(opts = {}) {
  const envFile = parseEnvFile(join(process.cwd(), ".env"));
  const prodFile = parseEnvFile(join(process.cwd(), ".env.production"));
  const fromEnv = (process.env.DATABASE_URL || "").trim();
  const fromProdFile = (prodFile.DATABASE_URL || "").trim();
  const fromEnvFile = (envFile.DATABASE_URL || "").trim();

  let raw = fromEnv || fromProdFile || fromEnvFile;
  if (opts.preferProductionFile) {
    const prodMeta = fromProdFile ? classifyHost(fromProdFile) : { local: true };
    const envMeta = fromEnv ? classifyHost(fromEnv) : { local: true };
    if (fromProdFile && !prodMeta.local) raw = fromProdFile;
    else if (fromEnv && !envMeta.local) raw = fromEnv;
    else if (fromProdFile) raw = fromProdFile;
  }

  if (!raw) throw new Error("DATABASE_URL is missing");
  const meta = classifyHost(raw);
  const url = toSessionModeUrl(raw);
  if (opts.requireLoopback && !meta.local) {
    throw new Error("This command only runs against loopback PostgreSQL");
  }
  if (opts.requireProductionConfirm && !meta.local && !opts.confirmed) {
    throw new Error("Non-loopback DATABASE_URL requires --confirm-production");
  }
  return { url, meta, ssl: !meta.local };
}

export function prismaCli() {
  return join(process.cwd(), "node_modules", "prisma", "build", "index.js");
}

export function sslForUrl(url, sslFlag) {
  if (process.env.DATABASE_SSL === "disable" || process.env.DATABASE_SSL === "false") return undefined;
  if (!sslFlag) return undefined;
  return { rejectUnauthorized: false };
}
