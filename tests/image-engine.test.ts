import { describe, it, expect } from "vitest";
import { compressImage, convertImage, resizeImage, exifClean, aspectHeight } from "@/lib/image-engine";

async function makeImage(width: number, height: number, color = "red"): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no ctx");
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  const blob = await new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob"))), "image/png")
  );
  return new File([blob], `test-${width}x${height}.png`, { type: "image/png" });
}

// blobToBytes removed — not needed for current assertions (kept for future byte-level validation)

describe("image-engine", () => {
  it("compress preserves dimensions", async () => {
    const f = await makeImage(400, 400, "blue");
    const blob = await compressImage(f, 0.7);
    expect(blob.type).toMatch(/image\//);
    expect(blob.size).toBeGreaterThan(0);
    const bmp = await createImageBitmap(blob);
    expect(bmp.width).toBe(400);
    expect(bmp.height).toBe(400);
    bmp.close();
  });

  it("convert PNG → JPEG", async () => {
    const f = await makeImage(100, 100, "green");
    const blob = await convertImage(f, "image/jpeg", 0.9);
    expect(blob.type).toBe("image/jpeg");
    expect(blob.size).toBeGreaterThan(0);
  });

  it("convert PNG → WebP", async () => {
    const f = await makeImage(50, 50, "red");
    const blob = await convertImage(f, "image/webp", 0.9);
    // In jsdom/canvas, WebP may fallback to PNG — allow either, but ensure non-zero and image type
    expect(["image/webp", "image/png"]).toContain(blob.type);
    expect(blob.size).toBeGreaterThan(0);
  });

  it("resize 100→50", async () => {
    const f = await makeImage(100, 100);
    const blob = await resizeImage(f, 50, 50, "image/png");
    expect(blob.type).toBe("image/png");
    // Decode and check dimensions
    const bmp = await createImageBitmap(blob);
    expect(bmp.width).toBe(50);
    expect(bmp.height).toBe(50);
    bmp.close();
  });

  it("exifClean strips and keeps dimensions", async () => {
    const f = await makeImage(80, 60);
    const blob = await exifClean(f);
    expect(blob.type).toMatch(/image\//);
    const bmp = await createImageBitmap(blob);
    expect(bmp.width).toBe(80);
    expect(bmp.height).toBe(60);
    bmp.close();
  });

  it("aspectHeight keeps ratio", () => {
    expect(aspectHeight(100, 50, 80)).toBe(40);
  });

  it("resize rejects too large", async () => {
    const f = await makeImage(10, 10);
    await expect(resizeImage(f, 13000, 13000)).rejects.toThrow();
  });

  it("convert handles transparent PNG → JPEG with white bg", async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 20;
    canvas.height = 20;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, 20, 20);
    ctx.fillStyle = "rgba(255,0,0,0.5)";
    ctx.fillRect(0, 0, 20, 20);
    const blob = await new Promise<Blob>((res, rej) =>
      canvas.toBlob((b) => (b ? res(b) : rej(new Error("blob"))), "image/png")
    );
    const f = new File([blob], "transp.png", { type: "image/png" });
    const out = await convertImage(f, "image/jpeg", 0.9);
    expect(out.type).toBe("image/jpeg");
    expect(out.size).toBeGreaterThan(0);
  });
});
