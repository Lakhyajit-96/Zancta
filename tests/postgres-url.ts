/** Isolated Postgres for Vitest/Playwright. Never reuse production DATABASE_URL. */
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL?.trim() ||
  "postgresql://zancta:zancta@127.0.0.1:54329/zancta_test";
