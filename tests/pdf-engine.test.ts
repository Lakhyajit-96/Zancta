import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { mergePdfs, splitPdf, compressPdf, imagesToPdf } from "@/lib/pdf-engine";

async function makePdf(pages = 1): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([200, 200]);
  return await doc.save();
}

async function blobToBytes(blob: Blob): Promise<Uint8Array> {
  if (typeof (blob as unknown as { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer === "function") {
    return new Uint8Array(await (blob as unknown as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer());
  }
  return new Uint8Array(await new Promise<ArrayBuffer>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as ArrayBuffer);
    r.onerror = () => reject(r.error);
    r.readAsArrayBuffer(blob);
  }));
}
function fileFromBytes(bytes: Uint8Array, name: string, type: string): File {
  return new File([bytes as unknown as BlobPart], name, { type });
}

describe("pdf-engine", () => {
  it("merge two PDFs", async () => {
    const a = await makePdf(1);
    const b = await makePdf(2);
    const fa = fileFromBytes(a, "a.pdf", "application/pdf");
    const fb = fileFromBytes(b, "b.pdf", "application/pdf");
    const blob = await mergePdfs([fa, fb]);
    expect(blob.type).toBe("application/pdf");
    expect(blob.size).toBeGreaterThan(0);
    const buf = await blobToBytes(blob);
    const doc = await PDFDocument.load(buf);
    expect(doc.getPageCount()).toBe(3);
    // magic
    expect(buf[0]).toBe(0x25); // %
  });

  it("split with range", async () => {
    const bytes = await makePdf(4);
    const f = fileFromBytes(bytes, "four.pdf", "application/pdf");
    const blobs = await splitPdf(f, "2-3");
    expect(blobs.length).toBe(1);
    const doc = await PDFDocument.load(await blobToBytes(blobs[0]));
    expect(doc.getPageCount()).toBe(2);
  });

  it("split rejects invalid range", async () => {
    const bytes = await makePdf(2);
    const f = fileFromBytes(bytes, "two.pdf", "application/pdf");
    await expect(splitPdf(f, "5")).rejects.toThrow();
  });

  it("compress returns honest sizes", async () => {
    const bytes = await makePdf(1);
    const f = fileFromBytes(bytes, "one.pdf", "application/pdf");
    const { blob, original, output } = await compressPdf(f);
    expect(blob.type).toBe("application/pdf");
    expect(original).toBeGreaterThan(0);
    expect(output).toBeGreaterThan(0);
  });

  it("imagesToPdf creates valid PDF", async () => {
    // 1x1 PNG
    const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";
    const pngBytes = new Uint8Array(Buffer.from(pngBase64, "base64"));
    const f = new File([pngBytes], "tiny.png", { type: "image/png" });
    const blob = await imagesToPdf([f]);
    expect(blob.type).toBe("application/pdf");
    const doc = await PDFDocument.load(await blobToBytes(blob));
    expect(doc.getPageCount()).toBe(1);
  });

  it("merge rejects corrupted", async () => {
    const bad = new File([new Uint8Array([1, 2, 3])], "bad.pdf", { type: "application/pdf" });
    await expect(mergePdfs([bad])).rejects.toThrow();
  });
});
