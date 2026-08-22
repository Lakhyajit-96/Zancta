/**
 * Local OCR accuracy probe against synthetic PNGs and shipped language packs.
 * Does not call ZANCTA APIs or grant Premium. Prints qualitative results only.
 */
import { createWorker } from "tesseract.js";
import { mkdtempSync, writeFileSync, existsSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const corePkg = path.dirname(require.resolve("tesseract.js-core/package.json"));
const workerPath = require.resolve("tesseract.js/src/worker-script/node/index.js");

const cases = [
  { lang: "eng", file: "ocr-lang-eng.png", expect: /ZANCTA|English|Local/i, public: true },
  { lang: "spa", file: "ocr-lang-spa.png", expect: /español|Procesamiento|ZANCTA/i, public: false },
  { lang: "fra", file: "ocr-lang-fra.png", expect: /français|Traitement|ZANCTA/i, public: false },
  { lang: "deu", file: "ocr-lang-deu.png", expect: /Deutsch|Lokale|ZANCTA/i, public: false },
  { lang: "hin", file: "ocr-lang-hin.png", expect: /जानक्टा|स्थानीय|ओसीआर/, public: false },
  { lang: "ben", file: "ocr-lang-ben.png", expect: /জ্যাঙ্কটা|স্থানীয়|ওসিআর/, public: false },
  { lang: "tam", file: "ocr-lang-tam.png", expect: /சாங்க்டா|உள்ளூர்|OCR/, public: false },
];

function langPathFor(lang, isPublic) {
  if (isPublic) return path.resolve("public/ocr");
  return path.resolve("private/ocr-traineddata");
}

for (const item of cases) {
  const image = path.resolve("tests/fixtures", item.file);
  const dir = langPathFor(item.lang, item.public);
  const gz = path.join(dir, `${item.lang}.traineddata.gz`);
  if (!existsSync(image) || !existsSync(gz)) {
    console.log(JSON.stringify({ lang: item.lang, status: "SKIPPED", reason: "missing fixture or pack" }));
    continue;
  }
  const started = Date.now();
  try {
    const tmp = mkdtempSync(path.join(os.tmpdir(), `zancta-ocr-${item.lang}-`));
    writeFileSync(path.join(tmp, `${item.lang}.traineddata`), zlib.gunzipSync(readFileSync(gz)));
    const worker = await createWorker(item.lang, 1, {
      workerPath,
      corePath: corePkg.replace(/\\/g, "/"),
      langPath: tmp.replace(/\\/g, "/"),
      gzip: false,
      cacheMethod: "none",
    });
    const result = await worker.recognize(image);
    await worker.terminate();
    rmSync(tmp, { recursive: true, force: true });
    const text = (result.data.text || "").replace(/\s+/g, " ").trim();
    const matched = item.expect.test(text);
    console.log(JSON.stringify({
      lang: item.lang,
      ms: Date.now() - started,
      matched,
      excerpt: text.slice(0, 120),
    }));
  } catch (error) {
    console.log(JSON.stringify({
      lang: item.lang,
      status: "FAILED",
      ms: Date.now() - started,
      error: error instanceof Error ? error.message.slice(0, 160) : "unknown",
    }));
  }
}
