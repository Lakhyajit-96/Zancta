/**
 * Read-only comparison of applied Prisma migrations vs local files.
 * Never prints DATABASE_URL or credentials. Never writes.
 *
 * Usage:
 *   node scripts/inspect-migration-history.mjs --local
 *   node scripts/inspect-migration-history.mjs --production-readonly
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

function parseEnvFile(path) {
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

function localChecksums() {
  const dir = join(process.cwd(), "prisma", "migrations");
  const names = readdirSync(dir).filter((name) => statSync(join(dir, name)).isDirectory());
  const map = {};
  for (const name of names) {
    const sql = readFileSync(join(dir, name, "migration.sql"));
    map[name] = createHash("sha256").update(sql).digest("hex");
  }
  return map;
}

function classifyHost(url) {
  try {
    const parsed = new URL(url.replace(/^postgres(ql)?:/i, "http:"));
    const host = parsed.hostname;
    const port = parsed.port || "5432";
    const local = host === "127.0.0.1" || host === "localhost" || host === "::1";
    let kind = "unknown";
    if (local) kind = "loopback";
    else if (port === "6543") kind = "transaction-pooler";
    else if (port === "5432") kind = "session-or-direct";
    return { kind, port, local, ssl: !local };
  } catch {
    return { kind: "unparseable", port: "", local: false, ssl: true };
  }
}

function toSessionModeUrl(url) {
  try {
    const parsed = new URL(url.replace(/^postgres(ql)?:/i, "http:"));
    if (parsed.port === "6543") {
      return url.replace(/:6543(\/|$)/, ":5432$1");
    }
  } catch {
    /* keep original */
  }
  return url;
}

function loadProductionUrl() {
  const files = {
    ...parseEnvFile(join(process.cwd(), ".env")),
    ...parseEnvFile(join(process.cwd(), ".env.production")),
  };
  const raw = (files.DATABASE_URL || process.env.DATABASE_URL || "").trim();
  if (!raw) throw new Error("DATABASE_URL missing from .env.production");
  const meta = classifyHost(raw);
  if (meta.local) throw new Error("Refusing --production-readonly against a loopback URL");
  return { url: toSessionModeUrl(raw), meta };
}

async function readRemote(url, ssl) {
  const client = new pg.Client({
    connectionString: url,
    ssl: ssl ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 15000,
  });
  await client.connect();
  try {
    const exists = await client.query(
      "SELECT to_regclass('public._prisma_migrations') AS table_name",
    );
    if (!exists.rows[0]?.table_name) {
      return { tablePresent: false, rows: [] };
    }
    const result = await client.query(
      `SELECT migration_name, checksum, finished_at IS NOT NULL AS finished,
              rolled_back_at IS NOT NULL AS rolled_back, started_at, finished_at
       FROM _prisma_migrations
       ORDER BY started_at ASC`,
    );
    return { tablePresent: true, rows: result.rows };
  } finally {
    await client.end();
  }
}

const mode = process.argv[2];
const checksums = localChecksums();
const localNames = Object.keys(checksums).sort();

if (mode === "--local") {
  console.log(JSON.stringify({ localMigrations: localNames, count: localNames.length }, null, 2));
  process.exit(0);
}

if (mode !== "--production-readonly") {
  console.error("Usage: node scripts/inspect-migration-history.mjs --local|--production-readonly");
  process.exit(1);
}

const { url, meta } = loadProductionUrl();
console.log("targetHostKind=" + meta.kind);
console.log("targetPortClass=" + (meta.port === "6543" ? "transaction-pooler" : meta.port === "5432" ? "session-or-direct" : "other"));
console.log("query=SELECT from _prisma_migrations only");

const remote = await readRemote(url, meta.ssl);
if (!remote.tablePresent) {
  console.log(JSON.stringify({ tablePresent: false, localMigrations: localNames }, null, 2));
  process.exit(0);
}

const remoteNames = remote.rows.map((row) => row.migration_name);
const comparisons = remote.rows.map((row) => ({
  name: row.migration_name,
  finished: row.finished,
  rolledBack: row.rolled_back,
  checksumMatch: checksums[row.migration_name] === row.checksum,
  presentLocally: Object.prototype.hasOwnProperty.call(checksums, row.migration_name),
}));
const missingRemote = localNames.filter((name) => !remoteNames.includes(name));
const extraRemote = remoteNames.filter((name) => !localNames.includes(name));

console.log(
  JSON.stringify(
    {
      tablePresent: true,
      appliedCount: remote.rows.length,
      comparisons,
      pendingInRepoNotApplied: missingRemote,
      appliedButMissingLocally: extraRemote,
    },
    null,
    2,
  ),
);
