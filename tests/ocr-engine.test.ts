import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isOcrLanguage,
  OCR_LANGUAGE_PACKS,
  OCR_LIMITS,
  ocrOutputName,
  ocrProgressLabel,
  validateOcrImage,
  validateOcrInput,
} from "@/lib/ocr-engine";

function imageFile(name: string, type: string, size = 10): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe("OCR input contract", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("exposes English as free and six Premium language packs", () => {
    expect(OCR_LANGUAGE_PACKS.map((pack) => pack.code)).toEqual(["eng", "hin", "ben", "tam", "spa", "fra", "deu"]);
    expect(isOcrLanguage("eng")).toBe(true);
    expect(isOcrLanguage("spa")).toBe(true);
    expect(isOcrLanguage("chi_sim")).toBe(false);
  });

  it.each([
    ["image.jpg", "image/jpeg"],
    ["image.png", "image/png"],
    ["image.webp", "image/webp"],
    ["scan.pdf", "application/pdf"],
  ])("accepts supported %s input", (name, type) => {
    expect(validateOcrInput(imageFile(name, type))).toBeNull();
  });

  it("rejects unsupported, empty, and oversized files", () => {
    expect(validateOcrInput(imageFile("scan.tiff", "image/tiff"))).toContain("JPG, PNG, and WebP");
    expect(validateOcrInput(imageFile("empty.png", "image/png", 0))).toContain("empty");
    expect(validateOcrInput(imageFile("large.png", "image/png", OCR_LIMITS.maxFileSize + 1))).toContain("20 MB");
  });

  it("rejects corrupted and oversized-dimension images before a worker starts", async () => {
    await expect(validateOcrImage(imageFile("broken.png", "image/png"))).resolves.toContain("could not be decoded");
    vi.stubGlobal("createImageBitmap", async () => ({ width: 12_001, height: 100, close: () => {} }));
    await expect(validateOcrImage(imageFile("wide.png", "image/png"))).resolves.toContain("12,000");
  });

  it("uses meaningful worker progress labels and a real text output name", () => {
    expect(ocrProgressLabel("loading language traineddata")).toBe("Downloading language data…");
    expect(ocrProgressLabel("initializing api")).toBe("Preparing OCR…");
    expect(ocrProgressLabel("recognizing text")).toBe("Processing locally…");
    expect(ocrProgressLabel("unknown stage")).toBe("Processing locally…");
    expect(ocrOutputName("scan.final.png")).toBe("scan.final-ocr.txt");
  });
});
