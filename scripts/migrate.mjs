/**
 * Idempotent Prisma migration entrypoint.
 * Never uses `prisma db push`. Never resets Production. Never rewrites historical SQL.
 *
 * Commands:
 *   checksums | write-baseline [--check] | status | bootstrap | deploy | verify
 *   prove-unreplayable | prove-production-clone
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import pg from "pg";
import {
  BASELINE_SQL_PATH,
  TEST_LOOPBACK_URL,
  assertHistoricalChecksumsUnchanged,
  frozenChecksumMap,
  isLoopbackTestUrl,
  listMigrationNames,
  loadDatabaseUrl,
  localChecksumMap,
  prismaCli,
  redact,
  sslForUrl,
} from "./lib/migrate-env.mjs";

const args = process.argv.slice(2);
const command = args[0];
const confirmProduction = args.includes("--confirm-production");
const checkOnly = args.includes("--check");

function runPrisma(prismaArgs, url) {
  const out = execFileSync(process.execPath, [prismaCli(), ...prismaArgs], {
    env: {
      ...process.env,
      DATABASE_URL: url,
      DATABASE_SSL: isLoopbackTestUrl(url) ? "disable" : process.env.DATABASE_SSL,
    },
    encoding: "utf8",
  });
  return redact(out);
}

function clientFor(url, ssl) {
  return new pg.Client({
    connectionString: url,
    ssl: sslForUrl(url, ssl),
    connectionTimeoutMillis: 15000,
  });
}

async function inspectEmpty(url, ssl) {
  const client = clientFor(url, ssl);
  await client.connect();
  try {
    const migrations = await client.query("SELECT to_regclass('public._prisma_migrations') AS t");
    const users = await client.query("SELECT to_regclass('public.\"User\"') AS t");
    return {
      hasMigrationsTable: Boolean(migrations.rows[0]?.t),
      hasUserTable: Boolean(users.rows[0]?.t),
    };
  } finally {
    await client.end();
  }
}

async function applySql(url, ssl, sql) {
  const client = clientFor(url, ssl);
  await client.connect();
  try {
    await client.query(sql);
  } finally {
    await client.end();
  }
}

function generateBaselineSql(url) {
  const sql = execFileSync(
    process.execPath,
    [prismaCli(), "migrate", "diff", "--from-empty", "--to-schema", "prisma/schema.prisma", "--script"],
    {
      env: { ...process.env, DATABASE_URL: url, DATABASE_SSL: "disable" },
      encoding: "utf8",
    },
  );
  const header =
    "-- Generated PostgreSQL baseline from prisma/schema.prisma.\n" +
    "-- Not a Prisma migration folder entry. Do not replay historical SQLite SQL on PostgreSQL.\n" +
    "-- Regenerate: node scripts/migrate.mjs write-baseline\n\n";
  return header + sql;
}

function writeBaseline(url) {
  mkdirSync(dirname(BASELINE_SQL_PATH), { recursive: true });
  const sql = generateBaselineSql(url);
  if (checkOnly) {
    const existing = readFileSync(BASELINE_SQL_PATH, "utf8");
    if (existing !== sql) {
      throw new Error("Committed prisma/baseline/postgresql.sql is out of date with prisma/schema.prisma");
    }
    console.log("baseline_sql=unchanged");
    return;
  }
  writeFileSync(BASELINE_SQL_PATH, sql);
  console.log("baseline_sql=written");
}

async function resolveAll(url) {
  for (const name of listMigrationNames()) {
    const out = runPrisma(["migrate", "resolve", "--applied", name], url);
    if (out.trim()) console.log(out.trim());
    console.log("resolved=" + name);
  }
}

async function bootstrap(url, ssl) {
  if (!isLoopbackTestUrl(url) && !confirmProduction) {
    throw new Error("bootstrap on a non-loopback database requires --confirm-production");
  }
  if (!isLoopbackTestUrl(url)) {
    throw new Error("bootstrap is for empty contributor/CI databases only; Production must use deploy");
  }
  const state = await inspectEmpty(url, ssl);
  if (state.hasUserTable || state.hasMigrationsTable) {
    throw new Error("bootstrap requires an empty public schema (no User, no _prisma_migrations)");
  }
  assertHistoricalChecksumsUnchanged();
  const sql = generateBaselineSql(url);
  await applySql(url, ssl, sql);
  await resolveAll(url);
  const deployOut = runPrisma(["migrate", "deploy"], url);
  console.log(deployOut.trim());
  if (/Applying migration `20260811160111_init`/.test(deployOut)) {
    throw new Error("bootstrap replayed historical SQLite SQL");
  }
  console.log("bootstrap=ok");
}

async function deploy(url, ssl, meta) {
  console.log("targetHostKind=" + meta.kind);
  const state = await inspectEmpty(url, ssl);
  if (!state.hasUserTable && !state.hasMigrationsTable) {
    console.log("empty_database=true action=bootstrap");
    await bootstrap(url, ssl);
    return;
  }
  if (state.hasUserTable && !state.hasMigrationsTable) {
    throw new Error("Schema exists without _prisma_migrations; refusing to guess. Do not db push.");
  }
  assertHistoricalChecksumsUnchanged();
  const out = runPrisma(["migrate", "deploy"], url);
  console.log(out.trim());
  if (/Applying migration `20260811160111_init`/.test(out) || /Applying migration `20260811165730_add_payments_9a`/.test(out)) {
    throw new Error("deploy attempted to replay historical SQLite migrations");
  }
  console.log("deploy=ok");
}

async function verify(url) {
  assertHistoricalChecksumsUnchanged();
  const status = runPrisma(["migrate", "status"], url);
  console.log(status.trim());
  try {
    const diff = runPrisma(
      ["migrate", "diff", "--from-config-datasource", "--to-schema", "prisma/schema.prisma", "--exit-code"],
      url,
    );
    if (diff.trim()) console.log(diff.trim());
  } catch (e) {
    const code = e && typeof e === "object" && "status" in e ? e.status : 1;
    if (code === 2) throw new Error("Schema drift detected between database and prisma/schema.prisma");
    throw e;
  }
  console.log("verify=ok drift=none");
}

async function proveUnreplayable() {
  const adminUrl = TEST_LOOPBACK_URL;
  const dbName = "zancta_migrate_audit";
  const auditUrl = TEST_LOOPBACK_URL.replace(/\/zancta_test$/, `/${dbName}`);
  const admin = clientFor(adminUrl, false);
  await admin.connect();
  try {
    await admin.query(`DROP DATABASE IF EXISTS ${dbName}`);
    await admin.query(`CREATE DATABASE ${dbName}`);
  } finally {
    await admin.end();
  }
  let failed = false;
  try {
    runPrisma(["migrate", "deploy"], auditUrl);
  } catch (e) {
    const text = redact(`${e && e.stdout ? e.stdout : ""}\n${e && e.stderr ? e.stderr : ""}\n${e instanceof Error ? e.message : e}`);
    failed = /datetime does not exist|type "datetime"|P3018/i.test(text);
    console.log(text.slice(0, 1500));
  }
  const cleanup = clientFor(adminUrl, false);
  await cleanup.connect();
  try {
    await cleanup.query(`DROP DATABASE IF EXISTS ${dbName}`);
  } finally {
    await cleanup.end();
  }
  if (!failed) throw new Error("Expected raw migrate deploy on empty PostgreSQL to fail on SQLite DATETIME");
  console.log("prove_unreplayable=ok");
}

async function proveProductionClone() {
  const adminUrl = TEST_LOOPBACK_URL;
  const dbName = "zancta_migrate_clone";
  const cloneUrl = TEST_LOOPBACK_URL.replace(/\/zancta_test$/, `/${dbName}`);
  const admin = clientFor(adminUrl, false);
  await admin.connect();
  try {
    await admin.query(`DROP DATABASE IF EXISTS ${dbName}`);
    await admin.query(`CREATE DATABASE ${dbName}`);
  } finally {
    await admin.end();
  }
  const sql = generateBaselineSql(cloneUrl);
  await applySql(cloneUrl, false, sql);
  await resolveAll(cloneUrl);
  const out = runPrisma(["migrate", "deploy"], cloneUrl);
  console.log(out.trim());
  const replay = /Applying migration `20260811/.test(out);
  const client = clientFor(cloneUrl, false);
  await client.connect();
  let applied = 0;
  try {
    const rows = await client.query("SELECT COUNT(*)::int AS n FROM _prisma_migrations WHERE finished_at IS NOT NULL");
    applied = rows.rows[0].n;
  } finally {
    await client.end();
  }
  const cleanup = clientFor(adminUrl, false);
  await cleanup.connect();
  try {
    await cleanup.query(`DROP DATABASE IF EXISTS ${dbName}`);
  } finally {
    await cleanup.end();
  }
  if (replay) throw new Error("production-clone replayed historical migrations");
  if (applied !== listMigrationNames().length) {
    throw new Error("production-clone applied count mismatch");
  }
  console.log("prove_production_clone=ok applied=" + applied + " pending_replay=false");
}

async function status(url) {
  console.log(runPrisma(["migrate", "status"], url).trim());
}

function printChecksums() {
  const frozen = frozenChecksumMap();
  const local = localChecksumMap();
  const rows = listMigrationNames().map((name) => ({
    name,
    matchesFrozen: frozen[name] === local[name],
    frozen: Boolean(frozen[name]),
  }));
  console.log(JSON.stringify({ rows, allMatch: rows.every((row) => row.matchesFrozen && row.frozen) }, null, 2));
  assertHistoricalChecksumsUnchanged();
}

if (!command) {
  console.error("Usage: node scripts/migrate.mjs <checksums|write-baseline|status|bootstrap|deploy|verify|prove-unreplayable|prove-production-clone>");
  process.exit(1);
}

try {
  if (command === "checksums") {
    printChecksums();
  } else if (command === "prove-unreplayable") {
    await proveUnreplayable();
  } else if (command === "prove-production-clone") {
    await proveProductionClone();
  } else if (command === "write-baseline") {
    writeBaseline(TEST_LOOPBACK_URL);
  } else if (command === "bootstrap") {
    const url =
      process.env.DATABASE_URL && isLoopbackTestUrl(process.env.DATABASE_URL)
        ? process.env.DATABASE_URL
        : TEST_LOOPBACK_URL;
    await bootstrap(url, false);
  } else {
    const loaded = loadDatabaseUrl({
      requireProductionConfirm: command === "deploy" || command === "verify" || command === "status",
      confirmed: confirmProduction,
      preferProductionFile: confirmProduction,
    });
    if (command === "status") await status(loaded.url);
    else if (command === "deploy") await deploy(loaded.url, loaded.ssl, loaded.meta);
    else if (command === "verify") await verify(loaded.url);
    else {
      console.error("Unknown command " + command);
      process.exit(1);
    }
  }
} catch (e) {
  console.error(redact(e instanceof Error ? e.message : String(e)));
  process.exit(1);
}
