/**
 * Name-only env presence report. Never prints values.
 * Usage: node scripts/report-env-presence.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const NAMES = [
  "NODE_ENV",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_APP_NAME",
  "DATABASE_URL",
  "DATABASE_SSL",
  "AUTH_SECRET",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "AUTH_URL",
  "AUTH_TRUST_HOST",
  "AUTH_USE_SECURE_COOKIES",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "EMAIL_REPLY_TO",
  "PAYMENTS_PROVIDER",
  "DODO_API_KEY",
  "DODO_WEBHOOK_SECRET",
  "DODO_PAYMENTS_WEBHOOK_SECRET",
  "DODO_ENVIRONMENT",
  "DODO_PRODUCT_MONTHLY_ID",
  "DODO_PRODUCT_ANNUAL_ID",
  "DODO_PAYMENTS_PRODUCT_MONTHLY_ID",
  "DODO_PAYMENTS_PRODUCT_ANNUAL_ID",
  "PAYMENTS_LIVE_ENABLED",
  "NEXT_PUBLIC_GA_MEASUREMENT_ID",
  "SENTRY_DSN",
  "NEXT_PUBLIC_SENTRY_DSN",
  "INDEXNOW_KEY",
  "INDEXNOW_NOTIFY_SECRET",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "NEXT_PUBLIC_ADS_ENABLED",
  "TEST_DATABASE_URL",
];

const FILES = [
  ".env",
  ".env.local",
  ".env.development",
  ".env.production",
  ".env.test",
  ".env.vercel-check",
  ".env.bak12c",
];

function parse(text) {
  const out = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[match[1]] = value;
  }
  return out;
}

const root = process.cwd();
const report = {};
for (const file of FILES) {
  const path = join(root, file);
  if (!existsSync(path)) {
    report[file] = { file: "MISSING" };
    continue;
  }
  const parsed = parse(readFileSync(path, "utf8"));
  const vars = {};
  for (const name of NAMES) {
    if (!(name in parsed)) vars[name] = "MISSING";
    else if (!String(parsed[name] ?? "").trim()) vars[name] = "EMPTY";
    else vars[name] = "PRESENT";
  }
  report[file] = { file: "PRESENT", vars };
}

console.log(JSON.stringify(report, null, 2));
