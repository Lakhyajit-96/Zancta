import { describe, expect, it } from "vitest";
import { displayBasename, formatFileSize, sizeReduction } from "@/lib/display-filename";

describe("displayBasename", () => {
  it("keeps short original names", () => {
    expect(displayBasename("quarterly-report-final.pdf")).toEqual({
      full: "quarterly-report-final.pdf",
      display: "quarterly-report-final.pdf",
    });
  });

  it("truncates long names while keeping the extension", () => {
    const name = "very-long-confidential-quarterly-financial-report-final-version.pdf";
    const { full, display } = displayBasename(name, 32);
    expect(full).toBe(name);
    expect(display.endsWith(".pdf")).toBe(true);
    expect(display).toContain("…");
    expect(display.length).toBeLessThanOrEqual(32);
  });

  it("strips path separators", () => {
    expect(displayBasename("C:\\\\Users\\\\a\\\\secret.pdf").display).not.toMatch(/\\|\//);
  });
});

describe("size formatting", () => {
  it("formats KB and MB", () => {
    expect(formatFileSize(2400)).toBe("2.3 KB");
    expect(formatFileSize(2.4 * 1024 * 1024)).toBe("2.4 MB");
  });

  it("only reports reduction when both sizes are known and output is smaller", () => {
    expect(sizeReduction(1000, 420)).toBe("58% smaller");
    expect(sizeReduction(1000, 1000)).toBeNull();
    expect(sizeReduction(1000, 1200)).toBeNull();
    expect(sizeReduction(undefined, 100)).toBeNull();
  });
});
