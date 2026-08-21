import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";
import { TEST_DATABASE_URL } from "./tests/postgres-url";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30000,
  use: { baseURL: "http://localhost:3001", trace: "on-first-retry" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  workers: 3,
  webServer: {
    command: "npm run test:db:up && npm run test:db:schema && npm run build && npm run start -- -p 3001",
    url: "http://localhost:3001",
    reuseExistingServer: false,
    timeout: 240000,
    env: {
      ...process.env,
      DATABASE_URL: TEST_DATABASE_URL,
      AUTH_USE_SECURE_COOKIES: "false",
      PAYMENTS_LIVE_ENABLED: "false",
      AUTH_SECRET: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "test-only-auth-secret-not-for-production",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "test-only-auth-secret-not-for-production",
      NEXTAUTH_URL: "http://localhost:3001",
      NEXT_PUBLIC_APP_URL: "http://localhost:3001",
    },
  },
});
