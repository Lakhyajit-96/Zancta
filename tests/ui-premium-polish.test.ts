import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { displayBasename } from "@/lib/display-filename";
import { sanitizeClientParams } from "@/lib/analytics/events";
import { sanitizeAnalyticsParams } from "@/lib/consent";

describe("premium UI privacy regressions", () => {
  it("keeps the local-processing evidence claim exact", () => {
    const source = readFileSync("components/ui/tool-ui.tsx", "utf8");
    expect(source).toContain("Processed in this tab. File bytes are not uploaded.");
  });

  it("does not send filenames through analytics sanitizers", () => {
    expect(sanitizeClientParams("tool_used", {
      tool: "pdf-compress",
      filename: "quarterly-report-final.pdf",
    })).not.toHaveProperty("filename");
    expect(sanitizeAnalyticsParams("tool_used", {
      tool: "pdf-compress",
      filename: "secret.pdf",
    })).toEqual({ tool: "pdf-compress" });
  });

  it("keeps filename display as a client-only basename helper", () => {
    expect(displayBasename("quarterly-report-final.pdf").display).toBe("quarterly-report-final.pdf");
    const analytics = readFileSync("lib/analytics/events.ts", "utf8");
    const tracker = readFileSync("lib/analytics/tracker.ts", "utf8");
    expect(analytics).not.toContain("display-filename");
    expect(tracker).not.toContain("display-filename");
  });

  it("hides provider subscription ids from the account page", () => {
    const source = readFileSync("app/account/page.tsx", "utf8");
    expect(source).toContain("Plan / Subscription");
    expect(source).toContain("Privacy / Preferences");
    expect(source).toContain("Danger zone");
    expect(source).not.toMatch(/providerSubscriptionId\s*\?/);
  });
});
