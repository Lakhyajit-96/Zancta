import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Versioned third-party OCR worker/WASM loaders are served verbatim from this path.
    // Probe scripts and generated OCR assets are not product lint targets.
    "public/ocr/**",
    "audit-phase12b/**",
    "brand-export/**",
  ]),
]);

export default eslintConfig;
