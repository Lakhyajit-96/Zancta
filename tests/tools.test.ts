import { describe, it, expect } from "vitest";
import { TOOLS, getTool } from "@/lib/tools";
describe("tool registry", () => {
  it("has 10 tools", () => expect(TOOLS.length).toBe(10));
  it("pdf-merge exists", () => expect(getTool("pdf-merge")?.name).toBe("Merge PDF"));
  it("all have seo titles", () => {
    for (const t of TOOLS) expect(t.seoTitle.length).toBeGreaterThan(10);
  });
});
