/**
 * Image OCR engine — local Tesseract.js only.
 * Premium language packs are loaded from an entitlement-gated same-origin path.
 * Never send file bytes or recognized text off the device.
 */

import {
  FREE_OCR_LANGUAGE,
  type OcrLanguage,
  type PremiumOcrLanguage,
  isFreeOcrLanguage,
  isOcrLanguage,
  isPremiumOcrLanguage,
} from "@/lib/ocr-languages";

export {
  OCR_LANGUAGE_PACKS,
  isOcrLanguage,
  isPremiumOcrLanguage,
  isFreeOcrLanguage,
  type OcrLanguage,
} from "@/lib/ocr-languages";

export type OcrStatus = "idle" | "validating" | "loading" | "processing" | "completed" | "failed" | "aborted";

export const OCR_LIMITS = {
  maxFileSize: 20 * 1024 * 1024,
  maxPdfFileSize: 50 * 1024 * 1024,
  maxFiles: 1,
  maxDimension: 12_000,
  scannedPdfPages: 20,
} as const;

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function isOcrPdf(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export function validateOcrInput(file: File): string | null {
  if (!file.size) return "The selected file is empty.";
  if (isOcrPdf(file)) {
    if (file.size > OCR_LIMITS.maxPdfFileSize) return "This PDF exceeds the 50 MB OCR limit.";
    return null;
  }
  if (file.size > OCR_LIMITS.maxFileSize) return "This image exceeds the 20 MB OCR limit.";
  if (!IMAGE_TYPES[file.type]) return "OCR supports JPG, PNG, and WebP images.";
  return null;
}

export async function validateOcrImage(file: File): Promise<string | null> {
  const inputError = validateOcrInput(file);
  if (inputError) return inputError;
  if (isOcrPdf(file)) return null;

  try {
    const bitmap = await createImageBitmap(file);
    const tooLarge = bitmap.width > OCR_LIMITS.maxDimension || bitmap.height > OCR_LIMITS.maxDimension;
    bitmap.close();
    return tooLarge ? "This image exceeds the 12,000 pixel dimension limit." : null;
  } catch {
    return "This image could not be decoded. Choose a valid JPG, PNG, or WebP image.";
  }
}

export function ocrProgressLabel(status: string): string {
  switch (status) {
    case "loading tesseract core":
      return "Loading local OCR engine…";
    case "initializing tesseract":
      return "Preparing OCR…";
    case "loading language traineddata":
      return "Downloading language data…";
    case "initializing api":
      return "Preparing OCR…";
    case "recognizing text":
      return "Processing locally…";
    default:
      return "Processing locally…";
  }
}

export function ocrLanguagePath(lang: OcrLanguage): string {
  return isFreeOcrLanguage(lang) ? "/ocr" : "/api/ocr/lang";
}

export class PremiumRequiredError extends Error {
  constructor() {
    super("PREMIUM_REQUIRED");
    this.name = "PremiumRequiredError";
  }
}

export async function fetchPremiumLanguageData(lang: PremiumOcrLanguage): Promise<Uint8Array> {
  const res = await fetch(`/api/ocr/lang/${lang}.traineddata.gz`, { credentials: "same-origin" });
  if (res.status === 401 || res.status === 403) throw new PremiumRequiredError();
  if (!res.ok) throw new Error("Language data could not be downloaded.");
  return new Uint8Array(await res.arrayBuffer());
}

export async function createLocalOcrWorker(
  onProgress: (status: string, progress: number) => void,
  lang: OcrLanguage = FREE_OCR_LANGUAGE,
  languageData?: Uint8Array,
): Promise<import("tesseract.js").Worker> {
  if (!isOcrLanguage(lang)) throw new Error("Unsupported OCR language.");
  if (isPremiumOcrLanguage(lang)) {
    if (!languageData) {
      throw new Error("Premium language data must be loaded before OCR starts.");
    }
    const { seedOcrLanguageCache } = await import("@/lib/ocr-lang-cache");
    try {
      await seedOcrLanguageCache(lang, languageData);
    } catch {
      throw new Error("This browser could not cache the language pack. Try another browser or turn off private browsing.");
    }
  }
  const { createWorker } = await import("tesseract.js");
  return createWorker(lang, 1, {
    workerPath: "/ocr/worker.min.js",
    corePath: "/ocr",
    langPath: "/ocr",
    gzip: true,
    cacheMethod: isPremiumOcrLanguage(lang) ? "readOnly" : "write",
    logger: (message) => onProgress(message.status, message.progress),
  });
}

export function ocrOutputName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "") || "image";
  return `${base}-ocr.txt`;
}

export function ocrPdfOutputName(): string {
  return "scanned-ocr.txt";
}

export function ocrPdfZipName(): string {
  return "scanned-ocr.zip";
}
