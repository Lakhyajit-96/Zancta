import "dotenv/config";
import { createCanvas, loadImage } from "canvas";
import { TEST_DATABASE_URL } from "./postgres-url";

// Prisma schema provider is postgresql. Tests must not use the SQLite fallback
// and must not mutate production DATABASE_URL.
process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.PAYMENTS_LIVE_ENABLED = "false";
if (!process.env.NEXT_PUBLIC_APP_URL) {
  process.env.NEXT_PUBLIC_APP_URL = "https://zancta.tech";
}
if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = "https://zancta.tech";
}
if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
  process.env.AUTH_SECRET = "test-only-auth-secret-not-for-production";
}
if (!process.env.INTEGRATION_ENCRYPTION_KEY) {
  process.env.INTEGRATION_ENCRYPTION_KEY = "ab".repeat(32);
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
