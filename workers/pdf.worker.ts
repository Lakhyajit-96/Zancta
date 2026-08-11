/// <reference lib="webworker" />
import { mergePdfs, splitPdf, compressPdf, imagesToPdf, pdfToImages } from "@/lib/pdf-engine";
import type { PdfRequest } from "@/lib/pdf-worker-types";

type CancelMsg = { id: string; op: "CANCEL" };
let aborted = false;

self.onmessage = async (e: MessageEvent<PdfRequest | CancelMsg>) => {
  const data = e.data as PdfRequest | CancelMsg;
  if ((data as CancelMsg).op === "CANCEL") {
    aborted = true;
    (self as unknown as Worker).postMessage({ id: (data as CancelMsg).id, status: "aborted", errorCode: "ABORTED", message: "Cancelled" });
    return;
  }
  aborted = false;
  const { id, op, files, options } = data as PdfRequest;
  const post = (msg: unknown) => {
    if (!aborted) (self as unknown as Worker).postMessage(msg);
  };
  try {
    post({ id, status: "validating", progress: 5 });
    if (!files || files.length === 0) throw new Error("No files");
    post({ id, status: "loading", progress: 15 });
    if (aborted) return;
    const onProgress = (p: number, detail?: string) => post({ id, status: "processing", progress: p, detail });

    if (op === "MERGE") {
      const blob = await mergePdfs(files, onProgress);
      post({ id, status: "completed", progress: 100, blobs: [{ name: "merged.pdf", blob }], meta: { pages: 0 } });
    } else if (op === "SPLIT") {
      if (files.length !== 1) throw new Error("Split needs exactly one PDF");
      const ranges = (options?.ranges as string) || "1";
      const blobs = await splitPdf(files[0], ranges, (p) => onProgress(p));
      post({ id, status: "completed", progress: 100, blobs: blobs.map((b, i) => ({ name: `split-${i + 1}.pdf`, blob: b })) });
    } else if (op === "COMPRESS") {
      if (files.length !== 1) throw new Error("Compress needs one PDF");
      const { blob, original, output } = await compressPdf(files[0]);
      post({ id, status: "completed", progress: 100, blobs: [{ name: "compressed.pdf", blob }], meta: { originalSize: original, outputSize: output } });
    } else if (op === "IMAGES_TO_PDF") {
      const blob = await imagesToPdf(files, onProgress);
      post({ id, status: "completed", progress: 100, blobs: [{ name: "images-to-pdf.pdf", blob }] });
    } else if (op === "PDF_TO_IMAGES") {
      if (files.length !== 1) throw new Error("PDF→Images needs one PDF");
      const fmt = (options?.imageFormat as "png" | "jpeg" | "webp") || "png";
      const q = (options?.quality as number) || 0.92;
      const blobs = await pdfToImages(files[0], fmt, q, onProgress);
      post({ id, status: "completed", progress: 100, blobs: blobs.map((b, i) => ({ name: `page-${i + 1}.${fmt}`, blob: b })) });
    } else {
      throw new Error(`Unknown op ${op}`);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const hint = msg.includes("Password") ? "Password-protected PDFs aren't supported." : msg.includes("Corrupted") ? "File may be damaged." : undefined;
    const code = msg.includes("Password") ? "PASSWORD" : msg.includes("Corrupted") || msg.includes("Not a PDF") ? "CORRUPT" : "FAILED";
    post({ id: (data as PdfRequest).id, status: "failed", errorCode: code, message: msg, hint });
  }
};
export {};
