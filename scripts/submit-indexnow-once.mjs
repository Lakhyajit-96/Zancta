/**
 * Legacy wrapper. Use scripts/submit-indexnow-direct.mjs guides
 */
import { spawnSync } from "node:child_process";

const result = spawnSync(process.execPath, ["scripts/submit-indexnow-direct.mjs", "prior"], {
  env: process.env,
  encoding: "utf8",
  cwd: process.cwd(),
});
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exit(result.status ?? 1);
