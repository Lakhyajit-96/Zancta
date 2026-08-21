import { execSync } from "node:child_process";
import { TEST_DATABASE_URL } from "./postgres-url";

export default function globalSetup() {
  if (!TEST_DATABASE_URL.includes("127.0.0.1:54329")) {
    throw new Error("Refusing to reset a non-local test database");
  }
  execSync("docker compose -f docker-compose.test.yml up -d --wait", {
    stdio: "inherit",
  });
  execSync("node tests/apply-test-schema.mjs", { stdio: "inherit" });
}
