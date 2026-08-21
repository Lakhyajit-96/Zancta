// Export ZANCTA brand logo from the exact source SVGs to high-res PNGs.
// Renders the real SVG markup in a headless browser so output is pixel-faithful.
import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

const OUT = "public/icons";
fs.mkdirSync(OUT, { recursive: true });

const faviconSvg = fs.readFileSync("public/favicon-zancta.svg", "utf8");

const browser = await chromium.launch();

async function renderPng(name, svgMarkup, targetPx) {
  const page = await browser.newPage({
    viewport: { width: targetPx, height: targetPx },
    deviceScaleFactor: 1,
  });
  // Strip any width/height attrs so the SVG fills the viewport at targetPx.
  const scaled = svgMarkup.replace(/<svg([^>]*)>/, `<svg$1 width="${targetPx}" height="${targetPx}">`);
  await page.setContent(
    `<!doctype html><html><head><style>html,body{margin:0;padding:0;background:transparent;}svg{display:block;}</style></head><body>${scaled}</body></html>`,
    { waitUntil: "networkidle" }
  );
  await page.screenshot({ path: path.join(OUT, name), omitBackground: true });
  await page.close();
  console.log("wrote", path.join(OUT, name), `${targetPx}x${targetPx}`);
}

for (const px of [16, 32, 48, 180, 192, 512]) {
  await renderPng(`favicon-${px}.png`, faviconSvg, px);
}

await browser.close();

// ICO files may contain PNG frames. Keep a stable single-frame favicon.ico
// while exposing the same mark at explicit PNG sizes for modern clients.
const png = fs.readFileSync(path.join(OUT, "favicon-32.png"));
const ico = Buffer.alloc(6 + 16 + png.length);
ico.writeUInt16LE(0, 0); // reserved
ico.writeUInt16LE(1, 2); // icon type
ico.writeUInt16LE(1, 4); // image count
ico.writeUInt8(32, 6);
ico.writeUInt8(32, 7);
ico.writeUInt8(0, 8); // palette
ico.writeUInt8(0, 9); // reserved
ico.writeUInt16LE(1, 10); // color planes
ico.writeUInt16LE(32, 12); // bits per pixel
ico.writeUInt32LE(png.length, 14);
ico.writeUInt32LE(22, 18);
png.copy(ico, 22);
fs.writeFileSync(path.join(OUT, "favicon.ico"), ico);
fs.copyFileSync(path.join(OUT, "favicon.ico"), "public/favicon.ico");
console.log("\nDone. Icons written to", OUT + "/");
