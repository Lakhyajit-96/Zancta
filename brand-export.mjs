// Export ZANCTA brand logo from the exact source SVGs to high-res PNGs.
// Renders the real SVG markup in a headless browser so output is pixel-faithful.
import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

const OUT = "public/icons";
const EMAIL_OUT = "public/assets/zancta-brand/email";
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(EMAIL_OUT, { recursive: true });

const faviconSvg = fs.readFileSync("public/favicon-zancta.svg", "utf8");
const compactSvg = fs.readFileSync("public/assets/zancta-brand/logos/compact-mark.svg", "utf8");

const browser = await chromium.launch();

async function renderPng(outPath, svgMarkup, targetPx) {
  const page = await browser.newPage({
    viewport: { width: targetPx, height: targetPx },
    deviceScaleFactor: 1,
  });
  const scaled = svgMarkup.replace(/<svg([^>]*)>/, `<svg$1 width="${targetPx}" height="${targetPx}">`);
  await page.setContent(
    `<!doctype html><html><head><style>html,body{margin:0;padding:0;background:transparent;}svg{display:block;}</style></head><body>${scaled}</body></html>`,
    { waitUntil: "networkidle" }
  );
  await page.screenshot({ path: outPath, omitBackground: true });
  await page.close();
  console.log("wrote", outPath, `${targetPx}x${targetPx}`);
}

for (const px of [16, 32, 48, 64, 128, 180, 192, 512]) {
  await renderPng(path.join(OUT, `favicon-${px}.png`), faviconSvg, px);
}

await renderPng(path.join(EMAIL_OUT, "zancta-email-mark.png"), compactSvg, 192);

await browser.close();

const png = fs.readFileSync(path.join(OUT, "favicon-48.png"));
const ico = Buffer.alloc(6 + 16 + png.length);
ico.writeUInt16LE(0, 0);
ico.writeUInt16LE(1, 2);
ico.writeUInt16LE(1, 4);
ico.writeUInt8(48, 6);
ico.writeUInt8(48, 7);
ico.writeUInt8(0, 8);
ico.writeUInt8(0, 9);
ico.writeUInt16LE(1, 10);
ico.writeUInt16LE(32, 12);
ico.writeUInt32LE(png.length, 14);
ico.writeUInt32LE(22, 18);
png.copy(ico, 22);
fs.writeFileSync(path.join(OUT, "favicon.ico"), ico);
fs.copyFileSync(path.join(OUT, "favicon.ico"), "public/favicon.ico");
fs.copyFileSync(path.join(OUT, "favicon-180.png"), "public/apple-touch-icon.png");
fs.copyFileSync(path.join(OUT, "favicon-192.png"), "public/icon-192.png");
fs.copyFileSync(path.join(OUT, "favicon-512.png"), "public/icon-512.png");
fs.copyFileSync("public/favicon-zancta.svg", "public/icon.svg");
fs.copyFileSync(path.join(OUT, "favicon-512.png"), "public/assets/zancta-brand/logos/zancta-logo-512.png");
console.log("\nDone. Icons written to", OUT + "/");
