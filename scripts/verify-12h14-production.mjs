const origin = "https://zancta.tech";

async function get(path) {
  const res = await fetch(`${origin}${path}`);
  const text = await res.text();
  return { status: res.status, text };
}

function extractCanon(html) {
  const match = html.match(/rel="canonical"[^>]*href="([^"]+)"/i)
    || html.match(/href="([^"]+)"[^>]*rel="canonical"/i);
  return match ? match[1] : null;
}

function bad(text) {
  return {
    localhost: /localhost|127\.0\.0\.1/i.test(text),
    vercelApp: /vercel\.app/i.test(text),
    backgroundRemover: /background-remover/i.test(text),
  };
}

const checkout = await get("/api/payments/checkout");
const sitemap = await get("/sitemap.xml");
const robots = await get("/robots.txt");
const llms = await get("/llms.txt");
const home = await get("/");
const compress = await get("/guides/compress-pdf-without-uploading");
const split = await get("/guides/split-pdf-without-uploading");
const exif = await get("/guides/remove-exif-before-sharing");
const pricing = await get("/pricing");

const sitemapLocs = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const needed = [
  "/guides/compress-pdf-without-uploading",
  "/guides/split-pdf-without-uploading",
  "/guides/remove-exif-before-sharing",
  "/guides/merge-pdf-without-uploading",
  "/guides/jpg-vs-png-vs-webp",
  "/guides/browser-ocr-without-uploading",
];

console.log(JSON.stringify({
  checkout: { status: checkout.status, body: checkout.text.trim() },
  sitemap: {
    status: sitemap.status,
    count: sitemapLocs.length,
    guides: Object.fromEntries(needed.map((path) => [path, sitemapLocs.includes(`${origin}${path}`)])),
    bad: bad(sitemap.text),
    sampleBadLocs: sitemapLocs.filter((url) => /localhost|vercel\.app|background-remover|\/(admin|signin|signup|account|api\/)/i.test(url)),
  },
  robots: {
    status: robots.status,
    hasSitemap: robots.text.includes(`${origin}/sitemap.xml`),
    disallowAdmin: /Disallow:\s*\/admin/.test(robots.text),
    disallowApi: /Disallow:\s*\/api/.test(robots.text),
    bad: bad(robots.text),
  },
  llms: {
    status: llms.status,
    hasCompress: llms.text.includes("compress-pdf-without-uploading"),
    hasSplit: llms.text.includes("split-pdf-without-uploading"),
    hasExif: llms.text.includes("remove-exif-before-sharing"),
    bad: bad(llms.text),
  },
  canonicals: {
    home: extractCanon(home.text),
    compress: extractCanon(compress.text),
    split: extractCanon(split.text),
    exif: extractCanon(exif.text),
    pricing: extractCanon(pricing.text),
  },
  pricingCopy: /Premium is currently unavailable while ZANCTA completes its launch process/.test(pricing.text),
}, null, 2));
