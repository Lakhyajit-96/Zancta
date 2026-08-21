/// <reference lib="webworker" />
import { compressImage, convertImage, resizeImage, exifClean } from "@/lib/image-engine";

export type ImageOp = "COMPRESS" | "CONVERT" | "RESIZE" | "EXIF_CLEAN" | "IMAGE_COMPRESS" | "IMAGE_CONVERT" | "IMAGE_RESIZE";
export interface ImageRequest {
  id: string;
  op: ImageOp;
  files: File[];
  options?: { quality?: number; targetMime?: string; width?: number; height?: number; maxWidth?: number };
}
let aborted = false;
self.onmessage = async (e: MessageEvent<ImageRequest | { id: string; op: "CANCEL" }>) => {
  const data = e.data as ImageRequest | { id: string; op: "CANCEL" };
  if ((data as { op: string }).op === "CANCEL") {
    aborted = true;
    (self as unknown as Worker).postMessage({ id: (data as { id: string }).id, status: "aborted", errorCode: "ABORTED", message: "Cancelled" });
    return;
  }
  aborted = false;
  const { id, op, files, options } = data as ImageRequest;
  const post = (msg: unknown) => {
    if (!aborted) (self as unknown as Worker).postMessage(msg);
  };
  try {
    post({ id, status: "validating", progress: 5 });
    if (!files || files.length === 0) throw new Error("No files");
    post({ id, status: "loading", progress: 15 });
    const results: { name: string; blob: Blob }[] = [];
    for (let i = 0; i < files.length; i++) {
      if (aborted) return;
      const f = files[i];
      // Magic + dimension pre-check via createImageBitmap already in engine
      post({ id, status: "processing", progress: Math.round(15 + (i / files.length) * 80), detail: `Processing ${i + 1}/${files.length}: ${f.name.slice(0, 12)}` });
      let blob: Blob;
      let outName: string;
      const base = f.name.replace(/\.[^.]+$/, "") || "image";
      if (op === "COMPRESS" || op === "IMAGE_COMPRESS") {
        const q = options?.quality ?? 0.8;
        blob = await compressImage(f, q);
        const ext = f.name.split(".").pop() || "jpg";
        outName = `${base}-compressed.${ext}`;
      } else if (op === "CONVERT" || op === "IMAGE_CONVERT") {
        const mime = options?.targetMime || "image/webp";
        blob = await convertImage(f, mime, options?.quality ?? 0.92);
        const ext = mime.split("/")[1].replace("jpeg", "jpg");
        outName = `${base}-converted.${ext}`;
      } else if (op === "RESIZE" || op === "IMAGE_RESIZE") {
        const w = options?.width;
        const h = options?.height;
        if (!w || !h) throw new Error("Resize needs width and height");
        blob = await resizeImage(f, w, h, options?.targetMime, options?.quality ?? 0.92);
        const ext = (options?.targetMime || f.type || "image/jpeg").split("/")[1].replace("jpeg", "jpg");
        outName = `${base}-resized.${ext}`;
      } else if (op === "EXIF_CLEAN") {
        blob = await exifClean(f);
        const ext = f.name.split(".").pop() || "jpg";
        outName = `${base}-clean.${ext}`;
      } else throw new Error(`Unknown op ${op}`);
      results.push({ name: outName, blob });
    }
    post({ id, status: "completed", progress: 100, blobs: results });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    post({ id: (data as ImageRequest).id, status: "failed", errorCode: "FAILED", message: msg });
  }
};
export {};
