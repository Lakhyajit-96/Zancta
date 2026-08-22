/**
 * One-shot IndexNow submit. Does not log secrets.
 *
 * Usage:
 *   node scripts/submit-indexnow-batch.mjs prior
 *   node scripts/submit-indexnow-batch.mjs new
 *
 * Reads INDEXNOW_KEY / INDEXNOW_NOTIFY_SECRET from process.env only.
 */
const batch = process.argv[2]?.trim();
const secret = process.env.INDEXNOW_NOTIFY_SECRET?.trim();
const key = process.env.INDEXNOW_KEY?.trim();
const paymentsLive = process.env.PAYMENTS_LIVE_ENABLED?.trim() ?? "";

const BATCHES = {
  prior: [
    "https://zancta.tech/guides/merge-pdf-without-uploading",
    "https://zancta.tech/guides/jpg-vs-png-vs-webp",
    "https://zancta.tech/guides/browser-ocr-without-uploading",
  ],
  new: [
    "https://zancta.tech/guides/compress-pdf-without-uploading",
    "https://zancta.tech/guides/split-pdf-without-uploading",
    "https://zancta.tech/guides/remove-exif-before-sharing",
  ],
};

if (batch !== "prior" && batch !== "new") {
  console.log(JSON.stringify({ ok: false, reason: "batch must be prior or new" }));
  process.exit(1);
}

if (!secret || !key) {
  console.log(JSON.stringify({
    ok: false,
    reason: "missing key or secret in process.env",
    keyPresent: Boolean(key),
    secretPresent: Boolean(secret),
    paymentsLive,
    batch,
  }));
  process.exit(1);
}

const urls = BATCHES[batch];
const res = await fetch("https://zancta.tech/api/indexnow", {
  method: "POST",
  headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
  body: JSON.stringify({ urls }),
});
const body = await res.json().catch(() => ({}));
const keyRes = await fetch(`https://zancta.tech/${key}.txt`);
const keyText = await keyRes.text();

console.log(JSON.stringify({
  batch,
  urlCount: urls.length,
  postStatus: res.status,
  ok: body.ok === true,
  accepted: body.accepted ?? 0,
  indexNowStatus: body.status ?? null,
  error: body.error ?? null,
  keyFileStatus: keyRes.status,
  keyBodyMatches: keyText.trim() === key,
  keyLooksHex: /^[a-f0-9]{8,128}$/i.test(key),
  paymentsLive,
}));

if (res.status !== 200 || body.ok !== true) process.exit(1);
