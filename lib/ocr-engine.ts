export const OCR_LANGUAGE_PACKS = [{ code: "eng", name: "English" }] as const;

export type OcrLanguage = (typeof OCR_LANGUAGE_PACKS)[number]["code"];
export type OcrStatus = "idle" | "validating" | "loading" | "processing" | "completed" | "failed" | "aborted";

export const OCR_LIMITS = {
  maxFileSize: 20 * 1024 * 1024,
  maxFiles: 1,
  maxDimension: 12_000,
} as const;

const SUPPORTED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function isOcrLanguage(value: string): value is OcrLanguage {
  return OCR_LANGUAGE_PACKS.some((language) => language.code === value);
}

export function validateOcrInput(file: File): string | null {
  if (!file.size) return "The selected image is empty.";
  if (file.size > OCR_LIMITS.maxFileSize) return "This image exceeds the 20 MB OCR limit.";
  if (!SUPPORTED_TYPES[file.type]) return "OCR supports JPG, PNG, and WebP images.";
  return null;
}

export async function validateOcrImage(file: File): Promise<string | null> {
  const inputError = validateOcrInput(file);
  if (inputError) return inputError;

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
      return "Loading local English language data…";
    case "initializing api":
      return "Preparing English OCR…";
    case "recognizing text":
      return "Recognizing text locally…";
    default:
      return "Processing locally…";
  }
}

export async function createLocalOcrWorker(
  onProgress: (status: string, progress: number) => void,
): Promise<import("tesseract.js").Worker> {
  const { createWorker } = await import("tesseract.js");
  return createWorker("eng", 1, {
    workerPath: "/ocr/worker.min.js",
    corePath: "/ocr",
    langPath: "/ocr",
    gzip: true,
    logger: (message) => onProgress(message.status, message.progress),
  });
}

export function ocrOutputName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "") || "image";
  return `${base}-ocr.txt`;
}
