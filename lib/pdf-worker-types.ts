export type PdfOp = "MERGE" | "SPLIT" | "COMPRESS" | "PDF_TO_IMAGES" | "IMAGES_TO_PDF";

export interface PdfRequest {
  id: string;
  op: PdfOp;
  files: File[];
  options?: {
    ranges?: string;
    imageFormat?: "png" | "jpeg" | "webp";
    quality?: number;
    compressLevel?: "light" | "medium" | "strong";
  };
}

export type PdfProgress = { id: string; status: "validating" | "loading" | "processing"; progress: number; detail?: string };
export type PdfSuccess = { id: string; status: "completed"; progress: 100; blobs: { name: string; blob: Blob }[]; meta?: { originalSize?: number; outputSize?: number; pages?: number } };
export type PdfFailure = { id: string; status: "failed" | "aborted"; errorCode: string; message: string; hint?: string };
export type PdfMessage = PdfProgress | PdfSuccess | PdfFailure;

export function redactFilename(name: string, i: number): string {
  const ext = name.split(".").pop() || "bin";
  return `file_${i + 1}.${ext}`;
}
