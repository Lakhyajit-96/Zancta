import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";

const guidePath = "app/guides/pdf-text-extraction-vs-ocr/page.tsx";

describe("PDF text extraction versus OCR guide", () => {
  it("keeps the guide's canonical content and required decision links", async () => {
    const source = await readFile(guidePath, "utf8");
    expect(source).toContain(
      'const PATH = "/guides/pdf-text-extraction-vs-ocr"',
    );
    expect(source).toContain("PDF Text Extractor");
    expect(source).toContain("Image OCR");
    expect(source).toContain('href="/tools/pdf-text-extractor"');
    expect(source).toContain('href="/tools/ocr"');
    expect(source).toContain('href="/guides/browser-ocr-without-uploading"');
    expect(source).toContain('href="/guides/local-processing"');
  });

  it("does not make unsupported accuracy or privacy promises", async () => {
    const source = await readFile(guidePath, "utf8");
    expect(source).not.toMatch(
      /100%|most private|fastest|best|guaranteed private|completely offline|nothing leaves your device/i,
    );
    expect(source).toMatch(/OCR.*interpretation|recognition.*pixels/i);
    expect(source).toMatch(
      /does not.*entire offline session|not.*entire offline session/i,
    );
  });
});
