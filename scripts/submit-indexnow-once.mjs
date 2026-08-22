/**
 * One-shot IndexNow submit for the three Phase 12H-12 guides.
 * Reads INDEXNOW_KEY / INDEXNOW_NOTIFY_SECRET from the environment only.
 * Does not write env files. Do not log secrets.
 *
 * Owner: npx vercel env run --environment production -- node scripts/submit-indexnow-once.mjs
 */
const secret = process.env.INDEXNOW_NOTIFY_SECRET?.trim();
const key = process.env.INDEXNOW_KEY?.trim();
const paymentsLive = process.env.PAYMENTS_LIVE_ENABLED?.trim() ?? "";

if (!secret || !key) {
  console.log(JSON.stringify({
    ok: false,
    reason: "missing key or secret in process.env",
    keyPresent: Boolean(key),
    secretPresent: Boolean(secret),
    paymentsLive,
  }));
  process.exit(1);
}

const urls = [
  "https://zancta.tech/guides/merge-pdf-without-uploading",
  "https://zancta.tech/guides/jpg-vs-png-vs-webp",
  "https://zancta.tech/guides/browser-ocr-without-uploading",
];

const res = await fetch("https://zancta.tech/api/indexnow", {
  method: "POST",
  headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
  body: JSON.stringify({ urls }),
});
const body = await res.json().catch(() => ({}));
const keyRes = await fetch(`https://zancta.tech/${key}.txt`);
const keyText = await keyRes.text();

console.log(JSON.stringify({
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
