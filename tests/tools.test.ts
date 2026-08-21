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
  it("background remover is deferred and not advertised as working", () => {
    const t = getTool("background-remover")!;
    expect(t.available).toBe(false);
    expect(t.description).toMatch(/deferred/i);
  });
  it("pdf-compress copy matches object-stream behavior", () => {
    const t = getTool("pdf-compress")!;
    expect(`${t.longDescription} ${t.seoDescription} ${t.faq.map((f) => f.a).join(" ")}`).not.toMatch(/3 quality|quality levels|Light, Medium, Strong/i);
    expect(t.longDescription).toMatch(/object streams/i);
  });
  it("image-compress copy does not claim mozjpeg or silent resize", () => {
    const t = getTool("image-compress")!;
    expect(t.longDescription).not.toMatch(/mozjpeg/i);
    expect(t.faq[0].a).toMatch(/Dimensions are not reduced/i);
  });
  it("image-convert names JPG/PNG/WebP instead of any format", () => {
    const t = getTool("image-convert")!;
    expect(t.acceptMime).not.toContain("image/avif");
    expect(t.longDescription).not.toMatch(/AVIF \(decode\)/i);
    expect(t.faq[0].a).toMatch(/AVIF is not supported/i);
    expect(t.h1).not.toMatch(/any format/i);
    expect(t.h1).toMatch(/JPG.*PNG.*WebP/i);
  });
  it("related tools never include the current tool", () => {
    for (const t of TOOLS) {
      expect(t.related).not.toContain(t.slug);
    }
  });
  it("pdf-to-images copy does not claim DPI or ZIP", () => {
    const t = getTool("pdf-to-images")!;
    expect(t.faq[0].a).not.toMatch(/DPI|ZIP/i);
  });
  it("merge FAQ does not imply Premium has higher limits", () => {
    const t = getTool("pdf-merge")!;
    expect(t.faq.find((f) => f.q.includes("How many"))!.a).toMatch(/Free and Premium use the same limit/i);
  });
});
