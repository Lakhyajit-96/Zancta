import { execSync } from "node:child_process";
import net from "node:net";
import { TEST_DATABASE_URL } from "./postgres-url";

function postgresAccepting(url: string): Promise<boolean> {
  try {
    const parsed = new URL(url.replace(/^postgres(ql)?:/i, "http:"));
    const host = parsed.hostname;
    const port = Number(parsed.port || "5432");
    return new Promise((resolve) => {
      const socket = net.connect({ host, port }, () => {
        socket.end();
        resolve(true);
      });
      socket.on("error", () => resolve(false));
      socket.setTimeout(1500, () => {
        socket.destroy();
        resolve(false);
      });
    });
  } catch {
    return Promise.resolve(false);
  }
}

export default async function globalSetup() {
  if (!TEST_DATABASE_URL.includes("127.0.0.1:54329")) {
    throw new Error("Refusing to reset a non-local test database");
  }
  const ready = await postgresAccepting(TEST_DATABASE_URL);
  if (!ready) {
    execSync("docker compose -f docker-compose.test.yml up -d --wait", {
      stdio: "inherit",
    });
  }
  execSync("node tests/apply-test-schema.mjs", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL, DATABASE_SSL: "disable" },
  });
}
