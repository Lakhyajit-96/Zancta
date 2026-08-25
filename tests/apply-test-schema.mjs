/**
 * Reset the loopback test database to the current PostgreSQL baseline + recorded migration history.
 * Never points at Production. Never uses prisma db push.
 */
import pg from "pg";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL?.trim() || "postgresql://zancta:zancta@127.0.0.1:54329/zancta_test";

if (!TEST_DATABASE_URL.includes("127.0.0.1:54329")) {
  throw new Error("Refusing to reset a non-local test database");
}

const client = new pg.Client({ connectionString: TEST_DATABASE_URL });
await client.connect();
try {
  await client.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
} finally {
  await client.end();
}

execFileSync(process.execPath, [join(process.cwd(), "scripts", "migrate.mjs"), "bootstrap"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL, DATABASE_SSL: "disable" },
});
