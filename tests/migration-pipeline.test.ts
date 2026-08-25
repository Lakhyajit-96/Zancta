import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import pg from "pg";
import { TEST_DATABASE_URL } from "./postgres-url";

function migrationNames() {
  return readdirSync("prisma/migrations")
    .filter((name) => statSync(join("prisma/migrations", name)).isDirectory())
    .sort();
}

function checksum(name: string) {
  return createHash("sha256").update(readFileSync(join("prisma/migrations", name, "migration.sql"))).digest("hex");
}

describe("P1-PAY-3/4/5 migration pipeline", () => {
  it("keeps historical migration SQL checksum-locked", () => {
    const frozen = JSON.parse(readFileSync("prisma/migrations/checksums.json", "utf8")) as {
      algorithm: string;
      migrations: Record<string, string>;
    };
    expect(frozen.algorithm).toBe("sha256");
    const names = migrationNames();
    expect(Object.keys(frozen.migrations).sort()).toEqual(names);
    for (const name of names) {
      expect(checksum(name)).toBe(frozen.migrations[name]);
    }
  });

  it("does not edit the SQLite-era historical SQL", () => {
    const init = readFileSync("prisma/migrations/20260811160111_init/migration.sql", "utf8");
    const payments = readFileSync("prisma/migrations/20260811165730_add_payments_9a/migration.sql", "utf8");
    expect(init).toMatch(/DATETIME/);
    expect(payments).toMatch(/PRAGMA /);
    expect(payments).toMatch(/DATETIME/);
  });

  it("does not run migrations inside next build", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { scripts: Record<string, string> };
    expect(pkg.scripts.build).not.toMatch(/migrate/);
    expect(pkg.scripts.build).not.toMatch(/db push/);
    expect(pkg.scripts.build).toMatch(/prisma generate && next build/);
  });

  it("records a complete PostgreSQL baseline history on the test database", async () => {
    const frozen = JSON.parse(readFileSync("prisma/migrations/checksums.json", "utf8")) as {
      migrations: Record<string, string>;
    };
    const client = new pg.Client({ connectionString: TEST_DATABASE_URL });
    await client.connect();
    try {
      const rows = await client.query(
        `SELECT migration_name, checksum FROM _prisma_migrations WHERE finished_at IS NOT NULL ORDER BY started_at`,
      );
      expect(rows.rows.map((row: { migration_name: string }) => row.migration_name)).toEqual(migrationNames());
      for (const row of rows.rows as { migration_name: string; checksum: string }[]) {
        expect(row.checksum).toBe(frozen.migrations[row.migration_name]);
      }
      const users = await client.query(`SELECT to_regclass('public."User"') AS t`);
      expect(users.rows[0].t).toBeTruthy();
    } finally {
      await client.end();
    }
  });

  it("makes migrate deploy a no-op after baseline (no historical replay)", () => {
    const out = execFileSync(process.execPath, ["scripts/migrate.mjs", "deploy"], {
      encoding: "utf8",
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL, DATABASE_SSL: "disable" },
    });
    expect(out).not.toMatch(/Applying migration `20260811160111_init`/);
    expect(out).not.toMatch(/Applying migration `20260811165730_add_payments_9a`/);
    expect(out).toMatch(/deploy=ok/);
  });

  it("CI workflow starts PostgreSQL and does not use SQLite", () => {
    const ci = readFileSync(".github/workflows/ci.yml", "utf8");
    expect(ci).toMatch(/postgres:16/);
    expect(ci).toMatch(/54329:5432/);
    expect(ci).toMatch(/scripts\/migrate\.mjs/);
    expect(ci).toMatch(/billing-lifecycle/);
    expect(ci).toMatch(/billing-transaction/);
    expect(ci).not.toMatch(/file:\.\/prisma\/dev\.db/);
    expect(ci).not.toMatch(/db push/);
  });
});
