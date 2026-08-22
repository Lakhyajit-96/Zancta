import { OCR_LIMITS } from "@/lib/ocr-engine";

export type PdfTextKind = "embedded" | "scanned" | "mixed";

export type PdfPageProbe = {
  pageNumber: number;
  text: string;
  kind: "embedded" | "empty";
};

const EMBEDDED_TEXT_MIN_CHARS = 40;

export function classifyPdfText(pages: PdfPageProbe[]): PdfTextKind {
  const withText = pages.filter((page) => page.text.trim().length >= EMBEDDED_TEXT_MIN_CHARS).length;
  if (withText === 0) return "scanned";
  if (withText === pages.length) return "embedded";
  return "mixed";
}

export function scannedPdfPageCapError(pageCount: number): string | null {
  if (pageCount < 1) return "This PDF has no pages.";
  if (pageCount > OCR_LIMITS.scannedPdfPages) {
    return `Scanned PDF OCR is limited to ${OCR_LIMITS.scannedPdfPages} pages. This file has ${pageCount} pages.`;
  }
  return null;
}

export function renderScaleForPage(width: number, height: number): number {
  const longest = Math.max(width, height, 1);
  return Math.min(2, 1600 / longest);
}
