import { execSync } from "node:child_process";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL?.trim() || "postgresql://zancta:zancta@127.0.0.1:54329/zancta_test";

if (!TEST_DATABASE_URL.includes("127.0.0.1:54329")) {
  throw new Error("Refusing to reset a non-local test database");
}

execSync(
  'docker exec zancta-test-postgres psql -U zancta -d zancta_test -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"',
  { stdio: "inherit" }
);

const sql = execSync("npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script", {
  encoding: "utf8",
  env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
});

execSync("docker exec -i zancta-test-postgres psql -U zancta -d zancta_test", {
  input: sql,
  stdio: ["pipe", "inherit", "inherit"],
});
