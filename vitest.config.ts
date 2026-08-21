import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    globalSetup: ["tests/global-setup.ts"],
    setupFiles: ["tests/setup.ts"],
    testTimeout: 20000,
    server: {
      // next-auth v5 ships ESM imports of "next/server" without file extensions;
      // inline it so Vite's resolver (which honours package exports) handles it.
      deps: { inline: ["next-auth"] },
    },
  },
});
