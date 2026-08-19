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

  it("corrupt PDF errors never leak parser internals", async () => {
    // Valid magic bytes, garbage body — forces pdf-lib deep parse failure
    const head = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    const junk = new Uint8Array(64).fill(0xab);
    const both = new Uint8Array(head.length + junk.length);
    both.set(head, 0);
    both.set(junk, head.length);
    const bad = new File([both], "halfpdf.pdf", { type: "application/pdf" });
    let message = "";
    try {
      await mergePdfs([bad]);
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toBeTruthy();
    expect(message).toMatch(/couldn't be read/i);
    expect(message).not.toMatch(/Cannot read properties|undefined.*Pages|stack/i);
  });

  describe("merge aggregate page limit (200 total, every combination)", () => {
    it("single file at exactly 200 pages is allowed", async () => {
      const bytes = await makePdf(200);
      const f = fileFromBytes(bytes, "exact200.pdf", "application/pdf");
      const blob = await mergePdfs([f]);
      const doc = await PDFDocument.load(await blobToBytes(blob));
      expect(doc.getPageCount()).toBe(200);
    });

    it("single file at 199 pages is allowed", async () => {
      const bytes = await makePdf(199);
      const f = fileFromBytes(bytes, "p199.pdf", "application/pdf");
      const blob = await mergePdfs([f]);
      expect(blob.size).toBeGreaterThan(0);
    });

    it("single file at 201 pages is rejected (previous bypass)", async () => {
      const bytes = await makePdf(201);
      const f = fileFromBytes(bytes, "p201.pdf", "application/pdf");
      await expect(mergePdfs([f])).rejects.toThrow(/200 total pages/);
    });

    it("2 x 100 pages (total 200) is allowed", async () => {
      const a = fileFromBytes(await makePdf(100), "a.pdf", "application/pdf");
      const b = fileFromBytes(await makePdf(100), "b.pdf", "application/pdf");
      const blob = await mergePdfs([a, b]);
      const doc = await PDFDocument.load(await blobToBytes(blob));
      expect(doc.getPageCount()).toBe(200);
    });

    it("2 x 101 pages (total 202) is rejected", async () => {
      const a = fileFromBytes(await makePdf(101), "a.pdf", "application/pdf");
      const b = fileFromBytes(await makePdf(101), "b.pdf", "application/pdf");
      await expect(mergePdfs([a, b])).rejects.toThrow(/200 total pages/);
    });

    it("3 x 67 pages (total 201) is rejected", async () => {
      const files = await Promise.all([1, 2, 3].map(async (i) => fileFromBytes(await makePdf(67), `f${i}.pdf`, "application/pdf")));
      await expect(mergePdfs(files)).rejects.toThrow(/200 total pages/);
    });

    it("3 x 66 pages (total 198) is allowed", async () => {
      const files = await Promise.all([1, 2, 3].map(async (i) => fileFromBytes(await makePdf(66), `f${i}.pdf`, "application/pdf")));
      const blob = await mergePdfs(files);
      const doc = await PDFDocument.load(await blobToBytes(blob));
      expect(doc.getPageCount()).toBe(198);
    });
  });
});
