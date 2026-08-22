/**
 * Deterministic scanned-PDF fixtures for local OCR tests.
 * Rasterized text only — no PDF text layer.
 */
import { createCanvas, registerFont } from "canvas";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const OUT = path.resolve("tests/fixtures");
const NIRMALA = "C:\\Windows\\Fonts\\Nirmala.ttc";
const INDIC_FAMILY = existsSync(NIRMALA) ? "Nirmala UI" : "sans-serif";

if (existsSync(NIRMALA)) {
  try {
    registerFont(NIRMALA, { family: "Nirmala UI" });
    console.log("registered Nirmala UI");
  } catch (error) {
    console.log("nirmala_register_failed", error instanceof Error ? error.message : "unknown");
  }
}

function rasterPage(pageNumber) {
  const canvas = createCanvas(1200, 1600);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 1200, 1600);
  ctx.fillStyle = "#111111";
  ctx.font = "bold 72px sans-serif";
  ctx.fillText("ZANCTA OCR TEST", 80, 220);
  ctx.font = "48px sans-serif";
  ctx.fillText("Local browser processing", 80, 320);
  ctx.fillText(`Page ${String(pageNumber).padStart(2, "0")}`, 80, 420);
  return canvas.toBuffer("image/png");
}

async function writeScannedPdf(pages, fileName) {
  const pdf = await PDFDocument.create();
  for (let pageNumber = 1; pageNumber <= pages; pageNumber += 1) {
    const png = await pdf.embedPng(rasterPage(pageNumber));
    const page = pdf.addPage([png.width, png.height]);
    page.drawImage(png, { x: 0, y: 0, width: png.width, height: png.height });
  }
  const bytes = await pdf.save({ useObjectStreams: false });
  writeFileSync(path.join(OUT, fileName), bytes);
  console.log(fileName, bytes.length);
}

async function writeLanguagePng(fileName, lines, family = "sans-serif") {
  const canvas = createCanvas(1400, 900);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 1400, 900);
  ctx.fillStyle = "#111111";
  ctx.font = `64px "${family}"`;
  lines.forEach((line, index) => {
    ctx.fillText(line, 60, 160 + index * 90);
  });
  writeFileSync(path.join(OUT, fileName), canvas.toBuffer("image/png"));
  console.log(fileName, family);
}

mkdirSync(OUT, { recursive: true });
await writeScannedPdf(1, "ocr-scanned-1.pdf");
await writeScannedPdf(5, "ocr-scanned-5.pdf");
await writeScannedPdf(10, "ocr-scanned-10.pdf");
await writeScannedPdf(20, "ocr-scanned-20.pdf");
await writeScannedPdf(21, "ocr-scanned-21.pdf");

await writeLanguagePng("ocr-lang-eng.png", ["ZANCTA English OCR", "Local browser processing"]);
await writeLanguagePng("ocr-lang-spa.png", ["ZANCTA OCR en español", "Procesamiento local"]);
await writeLanguagePng("ocr-lang-fra.png", ["ZANCTA OCR en français", "Traitement local"]);
await writeLanguagePng("ocr-lang-deu.png", ["ZANCTA OCR auf Deutsch", "Lokale Verarbeitung"]);
await writeLanguagePng("ocr-lang-hin.png", ["जानक्टा ओसीआर परीक्षण", "स्थानीय प्रसंस्करण"], INDIC_FAMILY);
await writeLanguagePng("ocr-lang-ben.png", ["জ্যাঙ্কটা ওসিআর পরীক্ষা", "স্থানীয় প্রক্রিয়াকরণ"], INDIC_FAMILY);
await writeLanguagePng("ocr-lang-tam.png", ["சாங்க்டா OCR சோதனை", "உள்ளூர் செயலாக்கம்"], INDIC_FAMILY);

{
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText("ZANCTA embedded text fixture for local extraction tests.", { x: 50, y: 700, size: 16, font });
  page.drawText("This PDF already contains a text layer.", { x: 50, y: 670, size: 16, font });
  writeFileSync(path.join(OUT, "ocr-embedded-text.pdf"), await pdf.save({ useObjectStreams: false }));
  console.log("ocr-embedded-text.pdf");
}
