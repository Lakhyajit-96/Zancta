/**
 * One-shot IndexNow submit. Posts to the official IndexNow API.
 * Requires INDEXNOW_KEY only. INDEXNOW_NOTIFY_SECRET is not part of the protocol.
 *
 * Usage:
 *   node scripts/submit-indexnow-batch.mjs guides
 *
 * Prefer scripts/submit-indexnow-direct.mjs for the same path.
 */
import { spawnSync } from "node:child_process";

const batch = process.argv[2]?.trim();
if (batch !== "prior" && batch !== "new" && batch !== "guides") {
  console.log(JSON.stringify({ ok: false, reason: "batch must be guides, prior, or new" }));
  process.exit(1);
}

const result = spawnSync(process.execPath, ["scripts/submit-indexnow-direct.mjs", batch], {
  env: process.env,
  encoding: "utf8",
  cwd: process.cwd(),
});
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exit(result.status ?? 1);
