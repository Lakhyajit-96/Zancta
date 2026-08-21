export const LIMITS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024,
  MAX_BG_SIZE: 30 * 1024 * 1024,
  MAX_PDF_PAGES: 200,
  MAX_IMAGE_DIM: 12000,
  MAX_TOTAL_BYTES: 100 * 1024 * 1024,
  WORKER_TIMEOUT_MS: 30_000,
  BATCH_TIMEOUT_MS: 120_000,
} as const;

export type ValidationErrorCode =
  | "FILE_TOO_LARGE"
  | "TOO_MANY_FILES"
  | "UNSUPPORTED_FORMAT"
  | "TOTAL_TOO_LARGE"
  | "IMAGE_TOO_LARGE_DIM"
  | "PDF_TOO_MANY_PAGES"
  | "HEIC_NOT_SUPPORTED"
  | "SVG_NOT_SUPPORTED"
  | "EMPTY_FILE"
  | "MAGIC_MISMATCH";

export interface ValidationError {
  code: ValidationErrorCode;
  message: string;
  hint?: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationError[];
}

const MAGIC: Record<string, number[]> = {
  pdf: [0x25, 0x50, 0x44, 0x46],
  jpg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
  webp: [0x52, 0x49, 0x46, 0x46],
};

function extOf(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "";
}

function heicExt(ext: string): boolean {
  return ["heic", "heif", "heif-sequence", "heic-sequence"].includes(ext);
}

export function validateFiles(
  files: File[],
  opts: {
    acceptMime: string[];
    acceptExts: string[];
    maxFileSize: number;
    maxFiles: number;
    category?: "pdf" | "image";
  }
): ValidationResult {
  const errors: ValidationError[] = [];

  if (files.length === 0) {
    return { ok: true, errors: [] };
  }

  if (files.length > opts.maxFiles) {
    errors.push({
      code: "TOO_MANY_FILES",
      message: `Too many files — ${files.length} selected, max ${opts.maxFiles}.`,
      hint: `Select up to ${opts.maxFiles} files.`,
    });
  }

  let total = 0;
  for (const f of files) {
    total += f.size;
    const ext = extOf(f.name);

    if (heicExt(ext)) {
      errors.push({
        code: "HEIC_NOT_SUPPORTED",
        message: `HEIC not supported yet — "${f.name}"`,
        hint: "Convert HEIC in Photos or another app, then use JPG, PNG, or WebP.",
      });
      continue;
    }

    if (ext === "svg") {
      errors.push({
        code: "SVG_NOT_SUPPORTED",
        message: `SVG not supported — "${f.name}"`,
        hint: "Use JPG, PNG, or WebP for image tools.",
      });
      continue;
    }

    if (f.size === 0) {
      errors.push({
        code: "EMPTY_FILE",
        message: `"${f.name}" is empty (0 bytes).`,
        hint: "Choose a real file with content.",
      });
      continue;
    }

    if (f.size > opts.maxFileSize) {
      errors.push({
        code: "FILE_TOO_LARGE",
        message: `"${f.name}" exceeds ${Math.round(opts.maxFileSize / 1024 / 1024)}MB`,
        hint: "Try compressing or splitting on desktop.",
      });
    }

    const extOk = opts.acceptExts.includes(ext) || opts.acceptExts.includes(ext.replace("jpeg", "jpg"));
    const mimeOk = opts.acceptMime.includes(f.type) || f.type === "" || f.type === "application/octet-stream";
    // Allow if either matches; but require at least one known ext
    if (!extOk && !mimeOk) {
      errors.push({
        code: "UNSUPPORTED_FORMAT",
        message: `Unsupported format — "${f.name}" (${ext || "unknown"})`,
        hint: `Supported: ${opts.acceptExts.join(", ")}`,
      });
    }
  }

  if (total > LIMITS.MAX_TOTAL_BYTES) {
    errors.push({
      code: "TOTAL_TOO_LARGE",
      message: `Total size ${(total / 1024 / 1024).toFixed(1)}MB exceeds ${LIMITS.MAX_TOTAL_BYTES / 1024 / 1024}MB`,
      hint: "Process fewer or smaller files at once.",
    });
  }

  return { ok: errors.length === 0, errors };
}

export function checkMagicBytes(bytes: Uint8Array, expected: keyof typeof MAGIC): boolean {
  const sig = MAGIC[expected];
  if (!sig) return false;
  if (!sig.every((b, i) => bytes[i] === b)) return false;
  if (expected === "webp") {
    // RIFF....WEBP — first 4 bytes also match WAV/AVI
    return bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  }
  return true;
}

function expectedKind(ext: string, mime: string): keyof typeof MAGIC | null {
  if (ext === "pdf" || mime === "application/pdf") return "pdf";
  if (ext === "png" || mime === "image/png") return "png";
  if (ext === "jpg" || ext === "jpeg" || mime === "image/jpeg") return "jpg";
  if (ext === "webp" || mime === "image/webp") return "webp";
  return null;
}

async function readFileBytes(file: File): Promise<Uint8Array> {
  if (typeof (file as File & { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer === "function") {
    return new Uint8Array(await file.arrayBuffer());
  }
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file as unknown as Blob);
  });
}

/** Inspect the first bytes of already-accepted files. Does not trust extension alone. */
export async function validateFileMagic(files: File[]): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  for (const f of files) {
    if (f.size === 0) continue;
    const ext = extOf(f.name);
    const kind = expectedKind(ext, f.type);
    if (!kind) continue;
    const bytes = await readFileBytes(f);
    const head = bytes.subarray(0, 16);
    if (!checkMagicBytes(head, kind)) {
      errors.push({
        code: "MAGIC_MISMATCH",
        message: `"${f.name}" is not a valid ${kind.toUpperCase()} file.`,
        hint: "The filename or type does not match the file contents. Rename will not convert formats.",
      });
    }
  }
  return { ok: errors.length === 0, errors };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
