import { describe, it, expect } from "vitest";
import { isGaMeasurementId, parseConsent, sanitizeAnalyticsParams, serializeConsent } from "@/lib/consent";

describe("consent and analytics sanitization", () => {
  it("does not treat an unset or junk measurement id as GA4", () => {
    expect(isGaMeasurementId(undefined)).toBe(false);
    expect(isGaMeasurementId("")).toBe(false);
    expect(isGaMeasurementId("UA-123")).toBe(false);
    expect(isGaMeasurementId("G-ABCDEF12")).toBe(true);
  });

  it("defaults to no analytics until the user decides", () => {
    expect(parseConsent(null)).toEqual({ analytics: false, decided: false });
    expect(parseConsent(serializeConsent(true))).toEqual({ analytics: true, decided: true });
    expect(parseConsent(serializeConsent(false))).toEqual({ analytics: false, decided: true });
  });

  it("strips filenames, text, and size from tool_used", () => {
    const safe = sanitizeAnalyticsParams("tool_used", {
      tool: "ocr",
      filename: "secret.pdf",
      text: "extracted",
      bucket: "20MB+",
    });
    expect(safe).toEqual({ tool: "ocr" });
    expect(JSON.stringify(safe)).not.toMatch(/secret|extracted|20MB/);
  });

  it("rejects malformed tool slugs", () => {
    expect(sanitizeAnalyticsParams("tool_used", { tool: "../etc/passwd" })).toEqual({});
  });
});

