export type PdfTextStatus = "idle" | "validating" | "loading" | "processing" | "completed" | "failed" | "aborted";

export type PdfTextPage = {
  pageNumber: number;
  text: string;
};

export const PDF_TEXT_LIMITS = {
  maxFileSize: 50 * 1024 * 1024,
  maxFiles: 1,
} as const;

export function validatePdfTextInput(file: File): string | null {
  if (!file.size) return "The selected PDF is empty.";
  if (file.size > PDF_TEXT_LIMITS.maxFileSize) return "This PDF exceeds the existing 50 MB local PDF limit.";
  if (file.type && file.type !== "application/pdf") return "Choose a PDF file to extract text.";
  if (!file.name.toLowerCase().endsWith(".pdf")) return "Choose a PDF file to extract text.";
  return null;
}

export function pdfTextOutputName(fileName: string): string {
  const safeName = fileName.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_");
  const base = safeName.replace(/\.[^.]+$/, "") || "document";
  return `${base}-text.txt`;
}

export function joinPdfTextPages(pages: PdfTextPage[]): string {
  return pages.map((page) => page.text).join("\n\n");
}

export type PdfTextMatch = {
  pageNumber: number;
  index: number;
  excerpt: string;
};

export function searchPdfTextPages(pages: PdfTextPage[], query: string): PdfTextMatch[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return [];

  const matches: PdfTextMatch[] = [];
  for (const page of pages) {
    const haystack = page.text.toLocaleLowerCase();
    let index = haystack.indexOf(needle);
    while (index !== -1) {
      const start = Math.max(0, index - 48);
      const end = Math.min(page.text.length, index + query.trim().length + 72);
      matches.push({
        pageNumber: page.pageNumber,
        index,
        excerpt: `${start > 0 ? "…" : ""}${page.text.slice(start, end).replace(/\s+/g, " ")}${end < page.text.length ? "…" : ""}`,
      });
      index = haystack.indexOf(needle, index + needle.length);
    }
  }
  return matches;
}
