/**
 * Load INDEXNOW_* from a Vercel env-pull file without printing secrets,
 * then run scripts/submit-indexnow-batch.mjs.
 *
 * Usage: node scripts/run-indexnow-from-envfile.mjs <envfile> <prior|new>
 */
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const envFile = process.argv[2];
const batch = process.argv[3];
if (!envFile || (batch !== "prior" && batch !== "new")) {
  console.log(JSON.stringify({ ok: false, reason: "usage: envfile batch" }));
  process.exit(1);
}

function decodeEnvFile(buf) {
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) return buf.toString("utf16le").slice(1);
  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
    buf.swap16();
    return buf.toString("utf16le").slice(1);
  }
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) return buf.toString("utf8").slice(1);
  if (buf.includes(0) && buf.length > 8) return buf.toString("utf16le");
  return buf.toString("utf8");
}

function parseDotenv(text) {
  const out = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    const name = match[1].replace(/\0/g, "");
    let value = match[2].replace(/\0/g, "").replace(/\r$/, "");
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[name] = value.replace(/\\n/g, "\n");
  }
  return out;
}

const parsed = parseDotenv(decodeEnvFile(readFileSync(envFile)));
const names = Object.keys(parsed);
const needed = ["INDEXNOW_KEY", "INDEXNOW_NOTIFY_SECRET"];
const present = Object.fromEntries(needed.map((name) => [name, Boolean(parsed[name])]));

if (!parsed.INDEXNOW_KEY || !parsed.INDEXNOW_NOTIFY_SECRET) {
  const indexNowKeys = names
    .filter((name) => /indexnow/i.test(name))
    .map((name) => ({
      name: JSON.stringify(name),
      valueLen: (parsed[name] || "").length,
    }));
  console.log(JSON.stringify({
    ok: false,
    reason: "parsed env file missing IndexNow vars",
    present,
    nameCount: names.length,
    indexNowKeys,
  }));
  process.exit(1);
}

const result = spawnSync(process.execPath, ["scripts/submit-indexnow-batch.mjs", batch], {
  env: {
    ...process.env,
    INDEXNOW_KEY: parsed.INDEXNOW_KEY,
    INDEXNOW_NOTIFY_SECRET: parsed.INDEXNOW_NOTIFY_SECRET,
    PAYMENTS_LIVE_ENABLED: parsed.PAYMENTS_LIVE_ENABLED ?? process.env.PAYMENTS_LIVE_ENABLED ?? "",
  },
  encoding: "utf8",
  cwd: process.cwd(),
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exit(result.status ?? 1);
