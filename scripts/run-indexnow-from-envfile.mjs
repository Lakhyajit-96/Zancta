/**
 * Load INDEXNOW_KEY from a Vercel env-pull file without printing secrets,
 * then run the official IndexNow submit script.
 *
 * INDEXNOW_NOTIFY_SECRET is not required for the official protocol.
 *
 * Usage: node scripts/run-indexnow-from-envfile.mjs <envfile> <guides|prior|new>
 */
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const envFile = process.argv[2];
const batch = process.argv[3] || "guides";
if (!envFile || (batch !== "prior" && batch !== "new" && batch !== "guides")) {
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
const key = parsed.INDEXNOW_KEY?.trim() ?? "";

if (!key) {
  console.log(JSON.stringify({
    ok: false,
    reason: "parsed env file missing INDEXNOW_KEY",
    keyPresent: false,
  }));
  process.exit(1);
}

const result = spawnSync(process.execPath, ["scripts/submit-indexnow-direct.mjs", batch], {
  env: {
    ...process.env,
    INDEXNOW_KEY: key,
  },
  encoding: "utf8",
  cwd: process.cwd(),
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exit(result.status ?? 1);
