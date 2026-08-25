/**
 * Operator production release helper. Does not git push, vercel deploy, or enable payments.
 *
 *   node scripts/operator-production-release.mjs --verify-env
 *   node scripts/operator-production-release.mjs --migrate --confirm-production
 *   node scripts/operator-production-release.mjs --verify --confirm-production
 *   node scripts/operator-production-release.mjs --smoke
 *   node scripts/operator-production-release.mjs --print-plan
 */
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { loadDatabaseUrl, parseEnvFile, redact } from "./lib/migrate-env.mjs";

const args = process.argv.slice(2);
const confirmProduction = args.includes("--confirm-production");

function envFiles() {
  return {
    ...parseEnvFile(join(process.cwd(), ".env")),
    ...parseEnvFile(join(process.cwd(), ".env.production")),
    ...process.env,
  };
}

function verifyEnv() {
  const env = envFiles();
  const live = env.PAYMENTS_LIVE_ENABLED === "true";
  const ads = env.NEXT_PUBLIC_ADS_ENABLED === "true";
  const { meta } = loadDatabaseUrl({ confirmed: true, preferProductionFile: true });
  console.log("PAYMENTS_LIVE_ENABLED=" + (live ? "true" : "false"));
  console.log("NEXT_PUBLIC_ADS_ENABLED=" + (ads ? "true" : "false"));
  console.log("databaseHostKind=" + meta.kind);
  if (live) throw new Error("Refusing operator release while PAYMENTS_LIVE_ENABLED=true (Phase 6D-7 is separate)");
  if (ads) throw new Error("Refusing operator release while NEXT_PUBLIC_ADS_ENABLED=true");
  if (meta.kind === "loopback") throw new Error("--verify-env expected a non-loopback Production DATABASE_URL");
  console.log("verify_env=ok");
  console.log("migrate_will_use=session-mode-rewrite-if-port-6543");
  console.log("next_build_does_not_run_migrations=true");
}

function runMigrate(command) {
  const out = execFileSync(
    process.execPath,
    [join(process.cwd(), "scripts", "migrate.mjs"), command, ...(confirmProduction ? ["--confirm-production"] : [])],
    { encoding: "utf8" },
  );
  console.log(redact(out).trim());
}

async function smoke() {
  const res = await fetch("https://zancta.tech/api/payments/checkout");
  const body = await res.text();
  console.log("smoke_checkout_status=" + res.status);
  console.log("smoke_checkout_body=" + body.slice(0, 200));
  if (!body.includes('"live":false') && !body.includes('"live": false')) {
    throw new Error("Checkout smoke did not report live:false");
  }
  console.log("smoke=ok");
}

function printPlan() {
  console.log(`Production release order (do not invert):
1. Verify environment (PAYMENTS_LIVE_ENABLED=false, PostgreSQL URL present)
2. Apply pending migrations with scripts/migrate.mjs deploy --confirm-production
   (session-mode port 5432; never transaction pooler 6543; never prisma db push)
3. Verify migrate status and schema drift
4. Deploy the application (git push to main / Vercel). next build must not migrate.
5. Smoke-test GET https://zancta.tech/api/payments/checkout → {"live":false}

Rollback:
- Application: Vercel Instant Rollback / Promote a previous READY deployment.
- Database: never prisma migrate reset. Additive migrations stay. Reverse schema needs a new forward migration.
- Historical SQLite SQL in prisma/migrations/20260811160111_init and 20260811165730_add_payments_9a must never be replayed or edited.
`);
}

try {
  if (args.includes("--print-plan") || args.length === 0) printPlan();
  if (args.includes("--verify-env") || args.includes("--all")) verifyEnv();
  if (args.includes("--migrate") || args.includes("--all")) {
    if (!confirmProduction) throw new Error("--migrate requires --confirm-production");
    runMigrate("deploy");
  }
  if (args.includes("--verify") || args.includes("--all")) {
    if (!confirmProduction && !args.includes("--verify-env")) {
      /* verify against production still needs confirm */
    }
    if (!confirmProduction) throw new Error("--verify requires --confirm-production");
    runMigrate("verify");
  }
  if (args.includes("--smoke") || args.includes("--all")) await smoke();
} catch (e) {
  console.error(redact(e instanceof Error ? e.message : String(e)));
  process.exit(1);
}
