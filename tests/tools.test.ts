import { describe, it, expect } from "vitest";
import { TOOLS, getTool } from "@/lib/tools";
describe("tool registry", () => {
  it("has 12 tools", () => expect(TOOLS.length).toBe(12));
  it("pdf-merge exists", () => expect(getTool("pdf-merge")?.name).toBe("Merge PDF"));
  it("includes local OCR", () => expect(getTool("ocr")?.privacy).toBe("local"));
  it("includes a local text-native PDF extractor", () => expect(getTool("pdf-text-extractor")?.privacy).toBe("local"));
  it("all have seo titles", () => {
    for (const t of TOOLS) expect(t.seoTitle.length).toBeGreaterThan(10);
  });
});
