import imageCompression from "browser-image-compression";

async function fileToBytes(file: File): Promise<Uint8Array> {
  if (typeof (file as { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer === "function") {
    return new Uint8Array(await (file as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer());
  }
  return new Uint8Array(
    await new Promise<ArrayBuffer>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as ArrayBuffer);
      r.onerror = () => rej(r.error);
      r.readAsArrayBuffer(file as unknown as Blob);
    })
  );
}

async function blobToImageBitmap(blob: Blob): Promise<ImageBitmap> {
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(blob);
  } catch {
    // Never surface browser decode internals (or cosmetic "0×0" output) —
    // one honest, safe message for undecodable images.
    throw new Error("That image couldn't be read. It may be corrupted, truncated, or in an unsupported format.");
  }
  if (!bmp.width || !bmp.height) {
    bmp.close?.();
    throw new Error("That image couldn't be read. It may be corrupted, truncated, or in an unsupported format.");
  }
  return bmp;
}

function getCanvas(width: number, height: number): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  return c as unknown as OffscreenCanvas;
}

async function canvasToBlob(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  mime: string,
  quality?: number
): Promise<Blob> {
  if (typeof OffscreenCanvas !== "undefined" && canvas instanceof OffscreenCanvas) {
    return await canvas.convertToBlob({ type: mime, quality });
  }
  return await new Promise<Blob>((res, rej) =>
    (canvas as HTMLCanvasElement).toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), mime, quality)
  );
}

export async function compressImage(file: File, quality = 0.8, maxWidth?: number): Promise<Blob> {
  // Use browser-image-compression for JPEG/WebP; for PNG we still re-encode via canvas to strip metadata
  const opts: Record<string, unknown> = {
    maxSizeMB: 50,
    maxWidthOrHeight: maxWidth || 1920,
    useWebWorker: false,
    initialQuality: quality,
    fileType: file.type || "image/jpeg",
  };
  // browser-image-compression expects File, returns Blob
  try {
    const blob = await imageCompression(file as unknown as File, opts as unknown as Parameters<typeof imageCompression>[1]);
    return blob as Blob;
  } catch {
    // Fallback: canvas re-encode (strips EXIF)
    const bmp = await blobToImageBitmap(file as unknown as Blob);
    const canvas = getCanvas(bmp.width, bmp.height);
    const ctx = (canvas as unknown as HTMLCanvasElement).getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    (ctx as CanvasRenderingContext2D).drawImage(bmp, 0, 0);
    bmp.close?.();
    const mime = file.type === "image/png" ? "image/png" : file.type === "image/webp" ? "image/webp" : "image/jpeg";
    return await canvasToBlob(canvas, mime, quality);
  }
}

export async function convertImage(file: File, targetMime: string, quality = 0.92): Promise<Blob> {
  const bmp = await blobToImageBitmap(file as unknown as Blob);
  // Dimensions check 12k — capture dims before close(): a closed ImageBitmap reports 0×0
  const { width, height } = bmp;
  if (width > 12000 || height > 12000) {
    bmp.close?.();
    throw new Error(`This image is ${width.toLocaleString()}×${height.toLocaleString()}px — the maximum supported size is 12,000×12,000px. Please resize it first.`);
  }
  const canvas = getCanvas(width, height);
  const ctx = (canvas as unknown as HTMLCanvasElement).getContext("2d");
  if (!ctx) {
    bmp.close?.();
    throw new Error("Canvas unavailable");
  }
  // Handle transparency → JPEG white background
  if (targetMime === "image/jpeg") {
    (ctx as CanvasRenderingContext2D).fillStyle = "#ffffff";
    (ctx as CanvasRenderingContext2D).fillRect(0, 0, bmp.width, bmp.height);
  }
  (ctx as CanvasRenderingContext2D).drawImage(bmp, 0, 0);
  bmp.close?.();
  return await canvasToBlob(canvas, targetMime, quality);
}

export async function resizeImage(file: File, width: number, height: number, mime?: string, quality = 0.92): Promise<Blob> {
  if (width <= 0 || height <= 0) throw new Error("Dimensions must be >0");
  if (width > 12000 || height > 12000) throw new Error(`Dimensions too large (${width}×${height})`);
  const bmp = await blobToImageBitmap(file as unknown as Blob);
  const canvas = getCanvas(width, height);
  const ctx = (canvas as unknown as HTMLCanvasElement).getContext("2d");
  if (!ctx) {
    bmp.close?.();
    throw new Error("Canvas unavailable");
  }
  if ((mime || file.type) === "image/jpeg") {
    (ctx as CanvasRenderingContext2D).fillStyle = "#ffffff";
    (ctx as CanvasRenderingContext2D).fillRect(0, 0, width, height);
  }
  (ctx as CanvasRenderingContext2D).drawImage(bmp, 0, 0, width, height);
  bmp.close?.();
  const outMime = mime || file.type || "image/jpeg";
  return await canvasToBlob(canvas, outMime, quality);
}

export async function exifClean(file: File): Promise<Blob> {
  // Strip metadata by re-encoding via canvas (EXIF automatically removed)
  const bmp = await blobToImageBitmap(file as unknown as Blob);
  // Capture dims before close(): a closed ImageBitmap reports 0×0
  const { width, height } = bmp;
  if (width > 12000 || height > 12000) {
    bmp.close?.();
    throw new Error(`This image is ${width.toLocaleString()}×${height.toLocaleString()}px — the maximum supported size is 12,000×12,000px. Please resize it first.`);
  }
  const canvas = getCanvas(width, height);
  const ctx = (canvas as unknown as HTMLCanvasElement).getContext("2d");
  if (!ctx) {
    bmp.close?.();
    throw new Error("Canvas unavailable");
  }
  (ctx as CanvasRenderingContext2D).drawImage(bmp, 0, 0);
  bmp.close?.();
  // Preserve original mime where possible, but re-encode strips EXIF
  const mime = file.type === "image/png" ? "image/png" : file.type === "image/webp" ? "image/webp" : "image/jpeg";
  const q = mime === "image/jpeg" || mime === "image/webp" ? 0.92 : undefined;
  return await canvasToBlob(canvas, mime, q);
}

export { fileToBytes };
