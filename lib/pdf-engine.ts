import { PDFDocument } from "pdf-lib";
import { parseRanges } from "@/lib/split-parser";

export type { PdfOp } from "@/lib/pdf-worker-types";

const MAGIC_PDF = [0x25, 0x50, 0x44, 0x46];

async function fileToBytes(file: File): Promise<Uint8Array> {
  if (typeof (file as unknown as { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer === "function") {
    return new Uint8Array(await (file as unknown as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer());
  }
  // jsdom fallback — FileReader
  const blob = file as unknown as Blob;
  // Try Response first (works in real browser/Node), fallback to FileReader for jsdom where Response mangles Uint8Array
  try {
    const buf = await (new Response(blob).arrayBuffer());
    if (buf.byteLength === (blob as unknown as File).size || (blob as unknown as File).size === 0) {
      // Heuristic: jsdom bug gives 13 bytes for 574 input, so detect mismatch
      if (buf.byteLength !== 13 || (blob as unknown as File).size === 13) return new Uint8Array(buf);
    }
  } catch {}
  return await new Promise<Uint8Array>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

function isPdf(bytes: Uint8Array): boolean {
  return MAGIC_PDF.every((b, i) => bytes[i] === b);
}

async function loadPdf(bytes: Uint8Array, filename: string): Promise<PDFDocument> {
  if (!isPdf(bytes)) throw new Error(`Not a PDF: ${filename}`);
  try {
    return await PDFDocument.load(bytes, { ignoreEncryption: false });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.toLowerCase().includes("encrypted") || msg.toLowerCase().includes("password")) {
      throw new Error("Password-protected PDFs aren't currently supported — please unlock it first.");
    }
    throw new Error(`Corrupted or unsupported PDF (${filename}): ${msg}`);
  }
}

export async function mergePdfs(files: File[], onProgress?: (p: number, detail: string) => void): Promise<Blob> {
  if (files.length === 0) throw new Error("No files to merge");
  if (files.length === 1) {
    const b = await fileToBytes(files[0]);
    await loadPdf(b, files[0].name);
    return new Blob([b as unknown as BlobPart], { type: "application/pdf" });
  }
  const out = await PDFDocument.create();
  for (let i = 0; i < files.length; i++) {
    onProgress?.(Math.round((i / files.length) * 90), `Merging ${i + 1}/${files.length}`);
    const bytes = await fileToBytes(files[i]);
    if (bytes.length > 50 * 1024 * 1024) throw new Error(`File too large: ${files[i].name}`);
    const doc = await loadPdf(bytes, files[i].name);
    if (doc.getPageCount() > 200) throw new Error(`Too many pages in ${files[i].name} — max 200`);
    const pages = await out.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  }
  const saved = await out.save();
  return new Blob([saved as unknown as BlobPart], { type: "application/pdf" });
}

export async function splitPdf(file: File, rangesStr: string, onProgress?: (p: number) => void): Promise<Blob[]> {
  const bytes = await fileToBytes(file);
  const doc = await loadPdf(bytes, file.name);
  const total = doc.getPageCount();
  const { pages, error } = parseRanges(rangesStr, total);
  if (error) throw new Error(error);
  onProgress?.(30);
  const out = await PDFDocument.create();
  const copied = await out.copyPages(doc, pages.map((p) => p - 1));
  copied.forEach((p) => out.addPage(p));
  onProgress?.(80);
  const saved = await out.save();
  return [new Blob([saved as unknown as BlobPart], { type: "application/pdf" })];
}

export async function compressPdf(file: File): Promise<{ blob: Blob; original: number; output: number }> {
  const bytes = await fileToBytes(file);
  const original = bytes.length;
  const doc = await loadPdf(bytes, file.name);
  // Honest strategy: pdf-lib save with object streams / cleanup. This does not transcode images, but removes unused objects.
  // We save with default (which already uses object streams). We cannot guarantee reduction — we measure and report honestly.
  const saved = await doc.save({ useObjectStreams: true, addDefaultPage: false });
  const blob = new Blob([saved as unknown as BlobPart], { type: "application/pdf" });
  return { blob, original, output: blob.size };
}

export async function imagesToPdf(files: File[], onProgress?: (p: number) => void): Promise<Blob> {
  if (files.length === 0) throw new Error("No images");
  const doc = await PDFDocument.create();
  for (let i = 0; i < files.length; i++) {
    onProgress?.(Math.round((i / files.length) * 90));
    const f = files[i];
    const bytes = await fileToBytes(f);
    const type = f.type || "";
    let img;
    if (type === "image/png" || f.name.toLowerCase().endsWith(".png")) {
      img = await doc.embedPng(bytes);
    } else if (type === "image/jpeg" || f.name.toLowerCase().endsWith(".jpg") || f.name.toLowerCase().endsWith(".jpeg")) {
      img = await doc.embedJpg(bytes);
    } else if (type === "image/webp" || f.name.toLowerCase().endsWith(".webp")) {
      // pdf-lib cannot embed webp directly — decode via canvas in main thread before call, or convert to PNG via createImageBitmap
      // For worker fallback, try embedJpg after canvas decode — but worker has no DOM. So we require caller to have converted WebP to PNG/JPG.
      throw new Error("WebP images must be converted to PNG/JPG before Images→PDF in this engine — use Convert Image first.");
    } else {
      // Try jpg then png
      try {
        img = await doc.embedJpg(bytes);
      } catch {
        img = await doc.embedPng(bytes);
      }
    }
    const page = doc.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }
  const saved = await doc.save();
  return new Blob([saved as unknown as BlobPart], { type: "application/pdf" });
}

export async function pdfToImages(
  file: File,
  format: "png" | "jpeg" | "webp" = "png",
  quality = 0.92,
  onProgress?: (p: number, detail: string) => void
): Promise<Blob[]> {
  // This uses pdfjs-dist — must be called from worker with proper workerSrc. For lib fallback (node test), we require caller to handle.
  // In browser worker, we lazy import pdfjs.
  const bytes = await fileToBytes(file);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjs: any = await import("pdfjs-dist/build/pdf.mjs");
  // Worker fix: pdfjs needs workerSrc when running in Worker; disable fake worker when already in Worker
  try {
    if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();
    }
  } catch {}
  const isWorkerContext = typeof document === "undefined";
  const loadingTask = pdfjs.getDocument({
    data: bytes,
    useWorkerFetch: false,
    isEvalSupported: false,
    ...(isWorkerContext ? { disableWorker: true } : {}),
  });
  const pdf = await loadingTask.promise;
  if (pdf.numPages > 200) throw new Error(`Too many pages (${pdf.numPages}) — max 200 for PDF→Images`);
  if (pdf.numPages > 50) {
    // Honest warning for large page counts — still try but may be slow
    onProgress?.(5, `Large PDF: ${pdf.numPages} pages — rendering sequentially`);
  }
  const blobs: Blob[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress?.(Math.round((i / pdf.numPages) * 90), `Rendering page ${i}/${pdf.numPages}`);
    const page = await pdf.getPage(i);
    // Adaptive scale: use 2x for normal pages, lower if would exceed 12000
    let scale = 2;
    let viewport = page.getViewport({ scale });
    if (viewport.width > 12000 || viewport.height > 12000) {
      scale = Math.min(12000 / viewport.width, 12000 / viewport.height, scale);
      viewport = page.getViewport({ scale });
      if (viewport.width > 12000 || viewport.height > 12000) throw new Error(`Page ${i} too large (${viewport.width}×${viewport.height})`);
    }
    // OffscreenCanvas in worker, else canvas fallback
    const canvas: HTMLCanvasElement | OffscreenCanvas =
      typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(viewport.width, viewport.height)
        : (() => {
            const c = document.createElement("canvas");
            c.width = viewport.width;
            c.height = viewport.height;
            return c as unknown as OffscreenCanvas;
          })();
    const ctx = (canvas as unknown as HTMLCanvasElement).getContext("2d");
    if (!ctx) throw new Error("Canvas context unavailable");
    await page.render({ canvasContext: ctx as unknown as CanvasRenderingContext2D, viewport }).promise;
    const blob: Blob = await new Promise((resolve, reject) => {
      if (canvas instanceof OffscreenCanvas) {
        (canvas as unknown as OffscreenCanvas).convertToBlob({ type: format === "png" ? "image/png" : `image/${format}`, quality }).then(resolve).catch(reject);
      } else {
        (canvas as HTMLCanvasElement).toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), format === "png" ? "image/png" : `image/${format}`, quality);
      }
    });
    blobs.push(blob);
    page.cleanup();
  }
  return blobs;
}
