import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    setupFiles: ["tests/setup.ts"],
    server: {
      // next-auth v5 ships ESM imports of "next/server" without file extensions;
      // inline it so Vite's resolver (which honours package exports) handles it.
      deps: { inline: ["next-auth"] },
    },
  },
});
