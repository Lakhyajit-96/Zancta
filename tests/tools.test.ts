import { describe, it, expect } from "vitest";
import { TOOLS, getTool } from "@/lib/tools";
import { TOOL_GUIDES, TOOL_NEXT_STEPS } from "@/lib/tool-next-steps";
import { OCR_LIMITS } from "@/lib/ocr-engine";
import { readFile } from "fs/promises";
import path from "path";
describe("tool registry", () => {
  it("has 12 tools", () => expect(TOOLS.length).toBe(12));
  it("pdf-merge exists", () => expect(getTool("pdf-merge")?.name).toBe("Merge PDF"));
  it("includes local OCR", () => expect(getTool("ocr")?.privacy).toBe("local"));
  it("includes a local text-native PDF extractor", () => expect(getTool("pdf-text-extractor")?.privacy).toBe("local"));
  it("all have seo titles", () => {
    for (const t of TOOLS) expect(t.seoTitle.length).toBeGreaterThan(10);
  });
  it("available tools have distinct search metadata", () => {
    const available = TOOLS.filter((t) => t.available);
    const titles = available.map((t) => t.seoTitle);
    const descriptions = available.map((t) => t.seoDescription);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
    for (const t of available) {
      expect(t.seoDescription.length).toBeGreaterThan(50);
      expect(t.seoDescription).not.toMatch(/#1|best|fastest|most secure|guaranteed/i);
    }
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
    expect(t.faq[0].q).toMatch(/image formats/i);
  });
  it("tool FAQs expose useful task-specific questions", () => {
    expect(getTool("images-to-pdf")!.faq[0].q).toMatch(/images.*convert/i);
    expect(getTool("image-resize")!.faq[0].q).toMatch(/maximum output size/i);
  });
  it("OCR landing-page limits preserve the engine's separate image and PDF caps", () => {
    expect(OCR_LIMITS.maxFileSize).toBe(20 * 1024 * 1024);
    expect(OCR_LIMITS.maxPdfFileSize).toBe(50 * 1024 * 1024);
    expect(OCR_LIMITS.scannedPdfPages).toBe(20);
  });
  it("core discovery pages link users to the next relevant destination", async () => {
    const howItWorks = await readFile(path.join(process.cwd(), "app/how-it-works/page.tsx"), "utf8");
    const toolsPage = await readFile(path.join(process.cwd(), "app/tools/page.tsx"), "utf8");
    expect(howItWorks).toContain('href="/tools"');
    expect(howItWorks).toContain("Browse the tools");
    expect(toolsPage).toContain('href="/pricing"');
    expect(toolsPage).toContain("See Premium pricing");
  });
  it("merge FAQ does not imply Premium has higher limits", () => {
    const t = getTool("pdf-merge")!;
    expect(t.faq.find((f) => f.q.includes("How many"))!.a).toMatch(/Free and Premium use the same limit/i);
  });
  it("post-success next steps stay in the product until Premium is actually relevant", () => {
    expect(TOOL_NEXT_STEPS["image-compress"]?.href).toBe("/tools/image-convert");
    expect(TOOL_NEXT_STEPS["image-convert"]?.href).toBe("/tools/image-resize");
    expect(TOOL_NEXT_STEPS.ocr?.href).toBe("/tools/pdf-text-extractor");
    expect(TOOL_NEXT_STEPS["pdf-compress"]?.href).toBe("/tools/pdf-split");
    expect(TOOL_NEXT_STEPS["pdf-split"]?.href).toBe("/tools/pdf-merge");
  });
  it("related guides match published walkthroughs", () => {
    expect(TOOL_GUIDES["pdf-compress"]?.href).toBe("/guides/compress-pdf-without-uploading");
    expect(TOOL_GUIDES["pdf-split"]?.href).toBe("/guides/split-pdf-without-uploading");
    expect(TOOL_GUIDES["exif-cleaner"]?.href).toBe("/guides/remove-exif-before-sharing");
  });
});
