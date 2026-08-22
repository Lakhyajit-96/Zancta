import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { OCR_LIMITS } from "@/lib/ocr-engine";
import {
  isPremiumOcrLanguage,
  parsePremiumLangFile,
  PREMIUM_OCR_LANGUAGES,
  languagePackFileName,
} from "@/lib/ocr-languages";
import { classifyPdfText, scannedPdfPageCapError } from "@/lib/ocr-pdf";
import { mintOcrLangToken, verifyOcrLangToken } from "@/lib/ocr-lang-token";
import { PREMIUM_CONTRACT } from "@/lib/payments/premium-contract";

async function source(rel: string) {
  return readFile(path.join(process.cwd(), rel), "utf8");
}

describe("Local OCR Power contract", () => {
  it("marks Local OCR Power as implemented without raising file/page limits", () => {
    expect(PREMIUM_CONTRACT.localOcrPowerImplemented).toBe(true);
    expect(PREMIUM_CONTRACT.sameFileAndPageLimitsAsFree).toBe(true);
    expect(PREMIUM_CONTRACT.higherLimitsImplemented).toBe(false);
  });

  it("parses only allowlisted premium pack filenames", () => {
    for (const lang of PREMIUM_OCR_LANGUAGES) {
      expect(parsePremiumLangFile(languagePackFileName(lang))).toBe(lang);
      expect(isPremiumOcrLanguage(lang)).toBe(true);
    }
    expect(parsePremiumLangFile("eng.traineddata.gz")).toBeNull();
    expect(parsePremiumLangFile("hin.traineddata")).toBeNull();
    expect(parsePremiumLangFile("../hin.traineddata.gz")).toBeNull();
    expect(parsePremiumLangFile("hin.traineddata.gz/../../secret")).toBeNull();
    expect(parsePremiumLangFile("")).toBeNull();
  });

  it("ships gzipped premium packs on disk", () => {
    for (const lang of PREMIUM_OCR_LANGUAGES) {
      const file = path.join(process.cwd(), "private", "ocr-traineddata", languagePackFileName(lang));
      expect(existsSync(file)).toBe(true);
      const buf = readFileSync(file);
      expect(buf[0]).toBe(0x1f);
      expect(buf[1]).toBe(0x8b);
      expect(buf.length).toBeGreaterThan(100_000);
    }
  });

  it("caps scanned PDF OCR at 20 pages", () => {
    expect(OCR_LIMITS.scannedPdfPages).toBe(20);
    expect(scannedPdfPageCapError(0)).toMatch(/no pages/i);
    expect(scannedPdfPageCapError(20)).toBeNull();
    expect(scannedPdfPageCapError(21)).toMatch(/21 pages/);
  });

  it("classifies embedded versus scanned PDFs from extracted text length", () => {
    expect(classifyPdfText([{ pageNumber: 1, text: "short", kind: "empty" }])).toBe("scanned");
    expect(classifyPdfText([{ pageNumber: 1, text: "x".repeat(40), kind: "embedded" }])).toBe("embedded");
    expect(classifyPdfText([
      { pageNumber: 1, text: "x".repeat(40), kind: "embedded" },
      { pageNumber: 2, text: "", kind: "empty" },
    ])).toBe("mixed");
  });

  it("mints and verifies short-lived language tokens bound to one language", () => {
    const token = mintOcrLangToken("user-1", "hin", 1_000_000);
    expect(token).toBeTruthy();
    expect(verifyOcrLangToken(token!, "hin", 1_000_000).ok).toBe(true);
    expect(verifyOcrLangToken(token!, "spa", 1_000_000).ok).toBe(false);
    expect(verifyOcrLangToken(token!, "hin", 1_000_000 + 3 * 60 * 1000).ok).toBe(false);
  });
});

describe("premium language pack authorization (source)", () => {
  it("requires authentication, entitlement, and an allowlisted filename", async () => {
    const src = await source("app/api/ocr/lang/[...file]/route.ts");
    expect(src).toMatch(/parsePremiumLangFile/);
    expect(src).toMatch(/verifyOcrLangToken/);
    expect(src).toMatch(/auth\(\)/);
    expect(src).toMatch(/hasPremiumOcrAccess/);
    expect(src).toMatch(/status: 401/);
    expect(src).toMatch(/status: 403/);
    expect(src).toMatch(/"cache-control": "private/);
    expect(src).not.toMatch(/searchParams\.get\(["']token/);
    expect(src).not.toMatch(/jsdelivr|cdn\.jsdelivr/);
  });

  it("does not put premium packs in public/", async () => {
    const engine = await source("lib/ocr-engine.ts");
    expect(engine).toMatch(/\/api\/ocr\/lang\//);
    expect(engine).toMatch(/langPath: "\/ocr"/);
    expect(engine).not.toMatch(/jsdelivr/);
    expect(existsSync(path.join(process.cwd(), "public", "ocr", "hin.traineddata.gz"))).toBe(false);
  });
});
