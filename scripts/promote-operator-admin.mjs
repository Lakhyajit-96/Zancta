/**
 * Promote a single existing user to Entitlement.plan = ADMIN.
 * Does not run in the web app. Production CLI only.
 *
 *   OPERATOR_ADMIN_EMAIL=you@example.com node scripts/promote-operator-admin.mjs --production --inspect
 *   OPERATOR_ADMIN_EMAIL=you@example.com node scripts/promote-operator-admin.mjs --production --confirm
 *   OPERATOR_ADMIN_EMAIL=you@example.com node scripts/promote-operator-admin.mjs --production --confirm --revoke
 *
 * Never set OPERATOR_ADMIN_EMAIL on Vercel Preview. This script does not grant
 * ADMIN because someone signed in with Google.
 */
import { readFileSync } from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import pg from "pg";

function arg(name) {
  return process.argv.includes(name);
}

function newId() {
  return "c" + randomBytes(12).toString("hex");
}

function emailFingerprint(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function loadDatabaseUrl() {
  const file = arg("--production") ? ".env.production" : ".env";
  const text = readFileSync(file, "utf8");
  const line = text.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="));
  if (!line) throw new Error(`DATABASE_URL missing in ${file}`);
  let url = line.slice("DATABASE_URL=".length).trim().replace(/^['"]|['"]$/g, "");
  return url.replace(":6543", ":5432");
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function blockedReason({ vercelEnv, confirm, production, email, inspect }) {
  if (vercelEnv === "preview") return "Refusing to promote ADMIN on Vercel Preview.";
  if (!production) return "Refusing without --production.";
  if (!inspect && !confirm) return "Refusing without --confirm.";
  if (!email.includes("@")) return "OPERATOR_ADMIN_EMAIL is missing or not an email.";
  return null;
}

const email = normalizeEmail(process.env.OPERATOR_ADMIN_EMAIL || "");
const revoke = arg("--revoke");
const inspect = arg("--inspect");
const production = arg("--production");
const confirm = arg("--confirm");
const reason = blockedReason({
  vercelEnv: process.env.VERCEL_ENV || null,
  confirm,
  production,
  email,
  inspect,
});
if (reason) {
  console.error(reason);
  process.exit(1);
}

const client = new pg.Client({
  connectionString: loadDatabaseUrl(),
  ssl: { rejectUnauthorized: false },
});
await client.connect();

try {
  const userRes = await client.query(
    'SELECT id, "emailVerified", "deletedAt" FROM "User" WHERE lower(email) = $1 LIMIT 1',
    [email],
  );
  const user = userRes.rows[0];
  if (!user || user.deletedAt) {
    throw new Error("No matching active user. Sign in once with that Google account first, then rerun.");
  }

  const google = await client.query(
    'SELECT 1 FROM "Account" WHERE "userId" = $1 AND provider = $2 LIMIT 1',
    [user.id, "google"],
  );
  const entitlement = await client.query(
    'SELECT plan, status, source FROM "Entitlement" WHERE "userId" = $1',
    [user.id],
  );
  const existingAdmin = await client.query('SELECT COUNT(*)::int AS n FROM "Entitlement" WHERE plan = $1', ["ADMIN"]);
  const row = entitlement.rows[0];

  if (inspect) {
    console.log(
      [
        "userId=" + user.id,
        "plan=" + (row?.plan ?? "NONE"),
        "status=" + (row?.status ?? "NONE"),
        "source=" + (row?.source ?? "NONE"),
        "emailVerified=" + Boolean(user.emailVerified),
        "googleLinked=" + Boolean(google.rowCount > 0),
        "adminCount=" + existingAdmin.rows[0].n,
      ].join(" "),
    );
  } else if (!revoke && existingAdmin.rows[0].n > 0 && row?.plan === "ADMIN") {
    console.log("ALREADY_ADMIN userId=" + user.id);
  } else if (!revoke && existingAdmin.rows[0].n > 0) {
    throw new Error("An ADMIN entitlement already exists. Revoke it first with --revoke.");
  } else {
  const fingerprint = emailFingerprint(email);
  await client.query("BEGIN");
  if (revoke) {
    await client.query(
      'UPDATE "Entitlement" SET plan = $1, status = $2, source = $3, "updatedAt" = NOW() WHERE "userId" = $4',
      ["FREE", "ACTIVE", "OPERATOR_REVOKE", user.id],
    );
    await client.query(
      'INSERT INTO "AuditEvent" (id, "userId", action, "targetId", metadata, "createdAt") VALUES ($1, $2, $3, $4, $5, NOW())',
      [newId(), user.id, "operator_admin_revoked", user.id, JSON.stringify({ emailFingerprint: fingerprint })],
    );
    await client.query("COMMIT");
    console.log("REVOKED_ADMIN userId=" + user.id);
  } else {
    if (row) {
      await client.query(
        'UPDATE "Entitlement" SET plan = $1, status = $2, source = $3, "updatedAt" = NOW() WHERE "userId" = $4',
        ["ADMIN", "ACTIVE", "OPERATOR_BOOTSTRAP", user.id],
      );
    } else {
      await client.query(
        'INSERT INTO "Entitlement" (id, "userId", plan, status, source, "startsAt", "createdAt", "updatedAt", "cancelAtPeriodEnd") VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW(), false)',
        [newId(), user.id, "ADMIN", "ACTIVE", "OPERATOR_BOOTSTRAP"],
      );
    }
    if (!user.emailVerified && google.rowCount > 0) {
      await client.query('UPDATE "User" SET "emailVerified" = NOW() WHERE id = $1 AND "emailVerified" IS NULL', [user.id]);
    }
    await client.query(
      'INSERT INTO "AuditEvent" (id, "userId", action, "targetId", metadata, "createdAt") VALUES ($1, $2, $3, $4, $5, NOW())',
      [
        newId(),
        user.id,
        "operator_admin_promoted",
        user.id,
        JSON.stringify({ emailFingerprint: fingerprint, googleLinked: google.rowCount > 0 }),
      ],
    );
    await client.query("COMMIT");
    console.log("PROMOTED_ADMIN userId=" + user.id);
  }
  }
} catch (err) {
  await client.query("ROLLBACK").catch(() => {});
  console.error(err instanceof Error ? err.message : "promote failed");
  process.exit(1);
} finally {
  await client.end();
}
