import { describe, expect, it } from "vitest";
import {
  joinPdfTextPages,
  PDF_TEXT_LIMITS,
  pdfTextOutputName,
  searchPdfTextPages,
  validatePdfTextInput,
} from "@/lib/pdf-text-engine";

function file(name: string, type: string, size = 10): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe("PDF text extraction input and output contracts", () => {
  it("accepts a non-empty PDF within the established PDF size limit", () => {
    expect(validatePdfTextInput(file("report.pdf", "application/pdf"))).toBeNull();
  });

  it("rejects empty, non-PDF, and oversized input", () => {
    expect(validatePdfTextInput(file("empty.pdf", "application/pdf", 0))).toContain("empty");
    expect(validatePdfTextInput(file("notes.txt", "text/plain"))).toContain("PDF");
    expect(validatePdfTextInput(file("report.pdf", "application/pdf", PDF_TEXT_LIMITS.maxFileSize + 1))).toContain("50 MB");
  });

  it("creates a safe deterministic text filename", () => {
    expect(pdfTextOutputName("annual.report.pdf")).toBe("annual.report-text.txt");
    expect(pdfTextOutputName("unsafe/name.pdf")).toBe("unsafe_name-text.txt");
  });

  it("joins actual page text in order", () => {
    expect(joinPdfTextPages([{ pageNumber: 1, text: "First page" }, { pageNumber: 2, text: "Second page" }]))
      .toBe("First page\n\nSecond page");
  });

  it("searches actual page text case-insensitively with page context", () => {
    const matches = searchPdfTextPages([
      { pageNumber: 1, text: "First Page Extraction" },
      { pageNumber: 2, text: "Second Page Search Target" },
    ], "page");
    expect(matches).toHaveLength(2);
    expect(matches.map((match) => match.pageNumber)).toEqual([1, 2]);
    expect(matches[1].excerpt).toContain("Search Target");
  });

  it("returns no search results for empty or absent queries", () => {
    const pages = [{ pageNumber: 1, text: "Local PDF Text Test 123" }];
    expect(searchPdfTextPages(pages, "")).toEqual([]);
    expect(searchPdfTextPages(pages, "missing")).toEqual([]);
  });
});
