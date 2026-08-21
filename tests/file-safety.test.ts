import { describe, it, expect } from "vitest";
import { validateFiles, validateFileMagic, checkMagicBytes } from "@/lib/file-safety";

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

  it("rejects zero-byte files", () => {
    const r = validateFiles([file("empty.pdf", 0, "application/pdf")], {
      acceptMime: ["application/pdf"],
      acceptExts: ["pdf"],
      maxFileSize: 50 * 1024 * 1024,
      maxFiles: 5,
    });
    expect(r.ok).toBe(false);
    expect(r.errors[0].code).toBe("EMPTY_FILE");
  });
});

describe("validateFileMagic", () => {
  it("rejects a PNG renamed as PDF", async () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const fake = new File([png], "fake.pdf", { type: "application/pdf" });
    const r = await validateFileMagic([fake]);
    expect(r.ok).toBe(false);
    expect(r.errors[0].code).toBe("MAGIC_MISMATCH");
  });

  it("accepts a real PDF header", async () => {
    const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    const f = new File([pdf], "ok.pdf", { type: "application/pdf" });
    const r = await validateFileMagic([f]);
    expect(r.ok).toBe(true);
  });

  it("does not treat a WAV RIFF header as WebP", async () => {
    const wav = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45]);
    expect(checkMagicBytes(wav, "webp")).toBe(false);
  });
});
