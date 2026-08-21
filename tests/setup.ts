import "dotenv/config";
import { createCanvas, loadImage } from "canvas";

if (!process.env.NEXT_PUBLIC_APP_URL) {
  process.env.NEXT_PUBLIC_APP_URL = "https://zancta.tech";
}
if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = "https://zancta.tech";
}

if (typeof globalThis.createImageBitmap === "undefined") {
  // @ts-expect-error polyfill
  globalThis.createImageBitmap = async (blob: Blob): Promise<ImageBitmap> => {
    const buf = await (async () => {
      if (typeof (blob as { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer === "function") {
        return await (blob as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer();
      }
      return await new Promise<ArrayBuffer>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as ArrayBuffer);
        r.onerror = () => rej(r.error);
        r.readAsArrayBuffer(blob);
      });
    })();
    const img = await loadImage(Buffer.from(buf));
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d");
    (ctx as unknown as { drawImage: (...a: unknown[]) => void }).drawImage(
      img,
      0,
      0,
    );
    // Return the canvas itself as ImageBitmap-like — jsdom canvas can draw canvas
    (canvas as unknown as { close?: () => void }).close = () => {};
    return canvas as unknown as ImageBitmap;
  };
}

// Ensure OffscreenCanvas not required — fallback uses document.createElement
