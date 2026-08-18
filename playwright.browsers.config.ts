import { defineConfig, devices } from "@playwright/test";

// Temporary cross-browser smoke config (not part of the default suite).
export default defineConfig({
  testDir: "tests/e2e",
  testMatch: ["app.spec.ts", "public-composition.spec.ts", "motion-reduced.spec.ts", "auth.spec.ts"],
  timeout: 30000,
  use: { baseURL: "http://localhost:3000", trace: "on-first-retry" },
  projects: [
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: { command: "npm run start -- -p 3000", port: 3000, reuseExistingServer: true, timeout: 60000 },
});
