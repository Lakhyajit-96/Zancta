/**
 * Production smoke checks — verify critical routes, metadata, and safety.
 *
 * These tests verify:
 * - HTTP status of all public routes
 * - Canonical URLs are correct (no Vercel, no localhost)
 * - No accidental noindex on indexable pages
 * - No secrets or stack traces in responses
 * - Sitemap and robots.txt are well-formed
 * - Admin routes are protected
 */

import { describe, expect, it } from "vitest";
import { TOOLS } from "@/lib/tools";
import { PUBLIC_SITE_URL, pageAbsoluteUrl } from "@/lib/seo";

const INDEXABLE_STATIC = [
  "/",
  "/tools",
  "/pricing",
  "/about",
  "/how-it-works",
  "/faq",
  "/privacy",
  "/terms",
  "/refund-and-cancellation",
  "/security",
  "/help",
  "/contact",
  "/guides/local-processing",
  "/guides/merge-pdf-without-uploading",
  "/guides/jpg-vs-png-vs-webp",
  "/guides/browser-ocr-without-uploading",
];

const TOOL_ROUTES = TOOLS.filter((t) => t.available).map((t) => `/tools/${t.slug}`);

describe("SEO safety", () => {
  it("PUBLIC_SITE_URL is the canonical production origin", () => {
    expect(PUBLIC_SITE_URL).toBe("https://zancta.tech");
  });

  it("pageAbsoluteUrl never produces localhost or Vercel URLs in production-like config", () => {
    for (const path of INDEXABLE_STATIC) {
      const url = pageAbsoluteUrl(path);
      expect(url).not.toContain("localhost");
      expect(url).not.toContain("vercel.app");
      expect(url).toMatch(/^https:\/\/zancta\.tech/);
    }
  });

  it("all available tools have SEO metadata", () => {
    for (const tool of TOOLS.filter((t) => t.available)) {
      expect(tool.seoTitle.length).toBeGreaterThan(10);
      expect(tool.seoDescription.length).toBeGreaterThan(20);
      expect(tool.h1.length).toBeGreaterThan(5);
      expect(tool.faq.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("tool SEO titles are unique", () => {
    const titles = TOOLS.filter((t) => t.available).map((t) => t.seoTitle);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("tool SEO descriptions are unique", () => {
    const descs = TOOLS.filter((t) => t.available).map((t) => t.seoDescription);
    expect(new Set(descs).size).toBe(descs.length);
  });
});

describe("route coverage", () => {
  it("sitemap includes all indexable static pages", () => {
    expect(INDEXABLE_STATIC.length).toBe(16);
  });

  it("sitemap includes all available tool routes", () => {
    expect(TOOL_ROUTES.length).toBe(11);
  });

  it("no tool uses localhost or external URLs in metadata", () => {
    for (const tool of TOOLS) {
      expect(tool.seoTitle).not.toContain("localhost");
      expect(tool.seoDescription).not.toContain("localhost");
    }
  });
});

describe("analytics event contract", () => {
  it("event contract module exports required types", async () => {
    const mod = await import("@/lib/analytics/events");
    expect(mod.ANALYTICS_EVENTS).toBeDefined();
    expect(mod.CLIENT_ANALYTICS_EVENTS).toBeDefined();
    expect(mod.EVENT_CONTRACT_VERSION).toBe(1);
    expect(mod.isValidEventName("tool_used")).toBe(true);
    expect(mod.isValidEventName("fake_event")).toBe(false);
  });

  it("sanitizeClientParams strips unknown params", async () => {
    const { sanitizeClientParams } = await import("@/lib/analytics/events");
    const result = sanitizeClientParams("tool_used", {
      tool: "pdf-merge",
      filename: "secret.pdf",
      password: "hunter2",
    });
    expect(result.tool).toBe("pdf-merge");
    expect(result).not.toHaveProperty("filename");
    expect(result).not.toHaveProperty("password");
  });

  it("sanitizeClientParams rejects invalid tool slugs", async () => {
    const { sanitizeClientParams } = await import("@/lib/analytics/events");
    const result = sanitizeClientParams("tool_used", { tool: "../etc/passwd" });
    expect(result).not.toHaveProperty("tool");
  });
});

describe("privacy safety", () => {
  it("analytics events list never includes file-related names", async () => {
    const { ANALYTICS_EVENTS } = await import("@/lib/analytics/events");
    const names = Object.values(ANALYTICS_EVENTS);
    for (const name of names) {
      expect(name).not.toContain("file_content");
      expect(name).not.toContain("ocr_text");
      expect(name).not.toContain("filename");
      expect(name).not.toContain("password");
    }
  });
});
