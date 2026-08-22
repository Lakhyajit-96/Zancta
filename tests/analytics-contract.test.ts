/**
 * Analytics event contract tests — ensure the event taxonomy is
 * consistent, complete, and privacy-safe.
 */

import { describe, expect, it } from "vitest";
import {
  ANALYTICS_EVENTS,
  CLIENT_ANALYTICS_EVENTS,
  EVENT_CONTRACT_VERSION,
  isValidEventName,
  sanitizeClientParams,
} from "@/lib/analytics/events";

describe("event contract", () => {
  it("has a positive integer version", () => {
    expect(EVENT_CONTRACT_VERSION).toBeGreaterThanOrEqual(1);
    expect(Number.isInteger(EVENT_CONTRACT_VERSION)).toBe(true);
  });

  it("all client events are valid event names", () => {
    for (const event of CLIENT_ANALYTICS_EVENTS) {
      expect(isValidEventName(event)).toBe(true);
    }
  });

  it("rejects arbitrary event names", () => {
    expect(isValidEventName("arbitrary_name")).toBe(false);
    expect(isValidEventName("")).toBe(false);
    expect(isValidEventName("DROP TABLE")).toBe(false);
  });

  it("ANALYTICS_EVENTS has acquisition events", () => {
    expect(ANALYTICS_EVENTS.page_view).toBe("page_view");
    expect(ANALYTICS_EVENTS.tool_catalog_view).toBe("tool_catalog_view");
    expect(ANALYTICS_EVENTS.pricing_view).toBe("pricing_view");
  });

  it("ANALYTICS_EVENTS has tool events", () => {
    expect(ANALYTICS_EVENTS.tool_view).toBe("tool_view");
    expect(ANALYTICS_EVENTS.tool_used).toBe("tool_used");
    expect(ANALYTICS_EVENTS.processing_started).toBe("processing_started");
    expect(ANALYTICS_EVENTS.processing_completed).toBe("processing_completed");
    expect(ANALYTICS_EVENTS.processing_failed).toBe("processing_failed");
    expect(ANALYTICS_EVENTS.download_completed).toBe("download_completed");
  });

  it("ANALYTICS_EVENTS has auth events", () => {
    expect(ANALYTICS_EVENTS.signup_completed).toBe("signup_completed");
    expect(ANALYTICS_EVENTS.signin_completed).toBe("signin_completed");
  });

  it("ANALYTICS_EVENTS has Premium OCR events", () => {
    expect(ANALYTICS_EVENTS.premium_feature_view).toBe("premium_feature_view");
    expect(ANALYTICS_EVENTS.ocr_language_selected).toBe("ocr_language_selected");
    expect(ANALYTICS_EVENTS.ocr_language_load_started).toBe("ocr_language_load_started");
    expect(ANALYTICS_EVENTS.ocr_language_load_completed).toBe("ocr_language_load_completed");
    expect(ANALYTICS_EVENTS.ocr_language_load_failed).toBe("ocr_language_load_failed");
    expect(ANALYTICS_EVENTS.ocr_processing_started).toBe("ocr_processing_started");
    expect(ANALYTICS_EVENTS.ocr_processing_completed).toBe("ocr_processing_completed");
    expect(ANALYTICS_EVENTS.ocr_processing_failed).toBe("ocr_processing_failed");
    expect(ANALYTICS_EVENTS.premium_upgrade_clicked).toBe("premium_upgrade_clicked");
  });

  it("ANALYTICS_EVENTS has monetization events", () => {
    expect(ANALYTICS_EVENTS.checkout_started).toBe("checkout_started");
    expect(ANALYTICS_EVENTS.subscription_active).toBe("subscription_active");
    expect(ANALYTICS_EVENTS.subscription_cancelled).toBe("subscription_cancelled");
    expect(ANALYTICS_EVENTS.payment_failed).toBe("payment_failed");
    expect(ANALYTICS_EVENTS.refund_completed).toBe("refund_completed");
  });
});

describe("param sanitization", () => {
  it("passes valid tool slug", () => {
    const out = sanitizeClientParams("tool_used", { tool: "pdf-merge" });
    expect(out.tool).toBe("pdf-merge");
  });

  it("passes valid path", () => {
    const out = sanitizeClientParams("page_view" as never, { path: "/tools/pdf-merge" });
    expect(out.path).toBe("/tools/pdf-merge");
  });

  it("passes valid plan", () => {
    const out = sanitizeClientParams("pricing_plan_selected", { plan: "PREMIUM_MONTHLY" });
    expect(out.plan).toBe("PREMIUM_MONTHLY");
  });

  it("passes valid method", () => {
    const out = sanitizeClientParams("signup_completed", { method: "credentials" });
    expect(out.method).toBe("credentials");
  });

  it("strips file-related params", () => {
    const out = sanitizeClientParams("tool_used", {
      tool: "ocr",
      filename: "passport.jpg",
      fileSize: 1234567,
      ocrText: "John Doe SSN 123-45-6789",
      pdfContent: "base64data",
    });
    expect(out.tool).toBe("ocr");
    expect(Object.keys(out)).toEqual(["tool"]);
  });

  it("rejects path-traversal tool slugs", () => {
    const out = sanitizeClientParams("tool_used", { tool: "../../etc/passwd" });
    expect(out).not.toHaveProperty("tool");
  });

  it("rejects invalid paths", () => {
    const out = sanitizeClientParams("page_view" as never, { path: "javascript:alert(1)" });
    expect(out).not.toHaveProperty("path");
  });

  it("returns empty object for no params", () => {
    const out = sanitizeClientParams("tool_used");
    expect(out).toEqual({});
  });

  it("strips OCR text and filenames while keeping a valid language code", () => {
    const out = sanitizeClientParams("ocr_processing_completed", {
      tool: "ocr",
      language: "hin",
      filename: "passport.jpg",
      ocrText: "secret document text",
      email: "user@example.com",
    });
    expect(out).toEqual({ tool: "ocr", language: "hin" });
  });

  it("rejects invalid language codes", () => {
    const out = sanitizeClientParams("ocr_language_selected", {
      tool: "ocr",
      language: "HINDI",
    });
    expect(out).not.toHaveProperty("language");
  });
});
