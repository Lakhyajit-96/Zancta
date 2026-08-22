import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: ["ga4-production.spec.ts", "a11y-12h14-production.spec.ts"],
  timeout: 120000,
  use: { baseURL: "https://zancta.tech", trace: "off" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
