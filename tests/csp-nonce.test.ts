import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildApiCsp,
  buildHtmlCsp,
  cspNonceFromHeader,
  generateCspNonce,
  isHtmlDocumentPath,
  isRootTxtPath,
} from "@/lib/http/csp";

describe("CSP nonce helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("generates unique URL-safe nonces", () => {
    const a = generateCspNonce();
    const b = generateCspNonce();
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(b).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(a).not.toBe(b);
  });

  it("html CSP uses a nonce and drops script-src unsafe-inline", () => {
    vi.stubEnv("NODE_ENV", "production");
    const nonce = generateCspNonce();
    const csp = buildHtmlCsp(nonce);
    expect(csp).toContain(`script-src 'self' 'nonce-${nonce}' 'wasm-unsafe-eval'`);
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).toContain("worker-src 'self' blob:");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(cspNonceFromHeader(csp)).toBe(nonce);
  });

  it("API CSP has no nonce and no script-src unsafe-inline", () => {
    vi.stubEnv("NODE_ENV", "production");
    const csp = buildApiCsp();
    expect(cspNonceFromHeader(csp)).toBeNull();
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).toContain("'wasm-unsafe-eval'");
  });

  it("does not log nonce values", async () => {
    const { readFile } = await import("fs/promises");
    const path = await import("path");
    const proxy = await readFile(path.join(process.cwd(), "proxy.ts"), "utf8");
    const csp = await readFile(path.join(process.cwd(), "lib/http/csp.ts"), "utf8");
    expect(proxy).toMatch(/\/api\/:path\*/);
    expect(proxy).toMatch(/isHtmlDocumentPath/);
    expect(proxy).toMatch(/generateCspNonce/);
    expect(proxy).not.toMatch(/console\.(log|info|debug|warn).*nonce/i);
    expect(csp).not.toMatch(/console\.(log|info|debug|warn)/);
  });

  it("GA loader is an external googletagmanager script, not an inline snippet", async () => {
    const { readFile } = await import("fs/promises");
    const path = await import("path");
    const src = await readFile(path.join(process.cwd(), "components/consent-and-analytics.tsx"), "utf8");
    expect(src).toContain("document.createElement(\"script\")");
    expect(src).toContain("https://www.googletagmanager.com/gtag/js");
    expect(src).not.toMatch(/document\.write|innerHTML\s*=/);
  });

  it("classifies HTML vs static/API paths", () => {
    expect(isHtmlDocumentPath("/")).toBe(true);
    expect(isHtmlDocumentPath("/privacy")).toBe(true);
    expect(isHtmlDocumentPath("/tools/ocr")).toBe(true);
    expect(isHtmlDocumentPath("/api/payments/status")).toBe(false);
    expect(isHtmlDocumentPath("/.well-known/security.txt")).toBe(false);
    expect(isHtmlDocumentPath("/favicon.ico")).toBe(false);
    expect(isHtmlDocumentPath("/ocr/worker.min.js")).toBe(false);
    expect(isRootTxtPath("/robots.txt")).toBe(true);
    expect(isRootTxtPath("/.well-known/security.txt")).toBe(false);
  });
});
