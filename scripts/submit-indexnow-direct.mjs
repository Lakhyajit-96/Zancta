/**
 * One-shot official IndexNow submission.
 * Requires INDEXNOW_KEY only. Does not use INDEXNOW_NOTIFY_SECRET.
 * Never logs the key, keyLocation, or raw API bodies that contain the key.
 *
 * Usage:
 *   node scripts/submit-indexnow-direct.mjs guides
 *
 * Do not cron. Do not loop. Submit only after the public key file is live.
 */
const batch = process.argv[2]?.trim() || "guides";

const GUIDES = [
  "https://zancta.tech/guides/merge-pdf-without-uploading",
  "https://zancta.tech/guides/jpg-vs-png-vs-webp",
  "https://zancta.tech/guides/browser-ocr-without-uploading",
  "https://zancta.tech/guides/compress-pdf-without-uploading",
  "https://zancta.tech/guides/split-pdf-without-uploading",
  "https://zancta.tech/guides/remove-exif-before-sharing",
];

const BATCHES = {
  guides: GUIDES,
  prior: GUIDES.slice(0, 3),
  new: GUIDES.slice(3),
};

if (!(batch in BATCHES)) {
  console.log(JSON.stringify({ ok: false, reason: "batch must be guides, prior, or new" }));
  process.exit(1);
}

const key = process.env.INDEXNOW_KEY?.trim() ?? "";
const keyOk = /^[A-Za-z0-9-]{8,128}$/.test(key);
if (!keyOk) {
  console.log(JSON.stringify({
    ok: false,
    reason: "INDEXNOW_KEY missing or invalid charset",
    keyPresent: Boolean(key),
  }));
  process.exit(1);
}

const urls = BATCHES[batch];
const keyUrl = `https://zancta.tech/${key}.txt`;
const keyRes = await fetch(keyUrl, { redirect: "manual" });
const keyText = await keyRes.text();
const contentType = keyRes.headers.get("content-type") || "";
const keyFileOk =
  keyRes.status === 200 &&
  keyText === key &&
  /text\/plain/i.test(contentType) &&
  keyRes.status < 300;

if (!keyFileOk) {
  console.log(JSON.stringify({
    ok: false,
    reason: "key file not live verified",
    keyFileStatus: keyRes.status,
    contentType: contentType.split(";")[0],
    redirected: keyRes.status >= 300 && keyRes.status < 400,
    bodyLen: keyText.length,
    exactMatch: keyText === key,
    trailingWhitespace: keyText !== keyText.trim() || keyText.endsWith("\n"),
  }));
  process.exit(1);
}

const payload = {
  host: "zancta.tech",
  key,
  keyLocation: keyUrl,
  urlList: urls,
};

const started = new Date().toISOString();
const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify(payload),
});
const raw = await res.text();
const safeBody = raw.includes(key) ? "[redacted]" : raw.slice(0, 300);

console.log(JSON.stringify({
  ok: res.status === 200 || res.status === 202,
  batch,
  submittedCount: urls.length,
  httpStatus: res.status,
  timestamp: started,
  keyFileStatus: 200,
  keyFileExact: true,
  body: safeBody,
}));

if (res.status !== 200 && res.status !== 202) process.exit(1);
