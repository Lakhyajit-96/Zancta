import { describe, it, expect } from "vitest";
import { validateFiles } from "@/lib/file-safety";

function file(name: string, size: number, type: string): File {
  const b = new Uint8Array(size);
  return new File([b], name, { type });
}

describe("validateFiles", () => {
  it("rejects HEIC", () => {
    const r = validateFiles([file("photo.heic", 1000, "")], {
      acceptMime: ["image/jpeg"],
      acceptExts: ["jpg", "png", "webp"],
      maxFileSize: 50 * 1024 * 1024,
      maxFiles: 5,
    });
    expect(r.ok).toBe(false);
    expect(r.errors[0].code).toBe("HEIC_NOT_SUPPORTED");
  });
  it("rejects too many files", () => {
    const files = Array.from({ length: 6 }, (_, i) => file(`a${i}.pdf`, 100, "application/pdf"));
    const r = validateFiles(files, { acceptMime: ["application/pdf"], acceptExts: ["pdf"], maxFileSize: 50 * 1024 * 1024, maxFiles: 5 });
    expect(r.ok).toBe(false);
    expect(r.errors[0].code).toBe("TOO_MANY_FILES");
  });
  it("rejects file too large", () => {
    const r = validateFiles([file("big.pdf", 60 * 1024 * 1024, "application/pdf")], {
      acceptMime: ["application/pdf"],
      acceptExts: ["pdf"],
      maxFileSize: 50 * 1024 * 1024,
      maxFiles: 5,
    });
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.code === "FILE_TOO_LARGE")).toBe(true);
  });
  it("accepts valid pdf", () => {
    const r = validateFiles([file("a.pdf", 1000, "application/pdf")], {
      acceptMime: ["application/pdf"],
      acceptExts: ["pdf"],
      maxFileSize: 50 * 1024 * 1024,
      maxFiles: 5,
    });
    expect(r.ok).toBe(true);
  });
});
