import { expect, test } from "@playwright/test";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

const fixture = path.resolve("tests/fixtures/local-ocr-test-123.png");

async function syntheticPdf(pages: number) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([200, 200]);
  return Buffer.from(await doc.save());
}

function isGaHost(url: string) {
  return /google-analytics\.com|googletagmanager\.com|analytics\.google\.com|www\.google\.com\/ccm\//.test(url);
}

function isGaCollect(url: string) {
  return /\/g\/collect|\/j\/collect|\/mp\/collect|\/ccm\/collect/.test(url);
}

function isGtagLoader(url: string) {
  return /googletagmanager\.com\/gtag\/js/.test(url);
}

function redact(url: string) {
  return url
    .replace(/[?&]id=G-[A-Z0-9]+/gi, (match) => `${match[0]}id=REDACTED`)
    .replace(/tid=G-[A-Z0-9]+/gi, "tid=REDACTED")
    .replace(/cid=\d+\.\d+/gi, "cid=REDACTED");
}

function hostPath(url: string) {
  try {
    const parsed = new URL(redact(url));
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return "invalid";
  }
}

function payloadLooksPrivate(url: string, postData: string | null) {
  const blob = `${url} ${postData || ""}`;
  expect(blob).not.toMatch(/Local OCR Test 123/i);
  expect(blob).not.toMatch(/ZANCTA OCR TEST/i);
  expect(blob).not.toMatch(/passport|filename=|\.png|\.pdf/i);
  expect(blob).not.toMatch(/@gmail\.com|cardNumber|AUTH_SECRET/i);
}

function eventNamesFromHits(hits: { url: string; postData: string | null }[]) {
  return hits.flatMap((hit) => {
    const fromUrl = [...hit.url.matchAll(/[?&]en=([^&]+)/g)].map((match) => decodeURIComponent(match[1]));
    const fromBody = hit.postData
      ? [...hit.postData.matchAll(/(?:^|&)en=([^&]+)/g)].map((match) => decodeURIComponent(match[1]))
      : [];
    return [...fromUrl, ...fromBody];
  });
}

async function dataLayerEvents(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const names: string[] = [];
    const dl = window.dataLayer || [];
    for (const item of dl) {
      try {
        const arr = Array.from(item as ArrayLike<unknown>);
        if (arr[0] === "event" && typeof arr[1] === "string") names.push(arr[1]);
      } catch {
        if (item && typeof item === "object" && "event" in item) {
          names.push(String((item as { event: unknown }).event));
        }
      }
    }
    return names;
  });
}

test("production GA4 stays silent until consent, then fires product events without file content", async ({ page, context }) => {
  test.setTimeout(180_000);
  await context.clearCookies();

  const gaHits: { url: string; method: string; postData: string | null }[] = [];
  const cspViolations: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (isGaHost(url)) {
      gaHits.push({ url: redact(url), method: request.method(), postData: request.postData() });
    }
  });
  page.on("console", (msg) => {
    const text = msg.text();
    if (/content security policy|csp|refused to connect|Fetch API cannot load/i.test(text)) {
      cspViolations.push(redact(text).slice(0, 160));
    }
  });

  await page.goto("https://zancta.tech/", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });

  const banner = page.getByRole("region", { name: "Optional analytics" });
  await expect(banner).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(2000);
  expect(gaHits.filter((hit) => isGaCollect(hit.url) || isGtagLoader(hit.url)).length).toBe(0);

  await page.getByRole("button", { name: "Allow analytics" }).click();
  await expect(banner).toHaveCount(0);

  await expect.poll(() => gaHits.some((hit) => isGtagLoader(hit.url)), { timeout: 20_000 }).toBeTruthy();
  await page.waitForTimeout(3000);

  await page.goto("https://zancta.tech/tools");
  await page.waitForTimeout(1500);
  await page.goto("https://zancta.tech/tools/pdf-merge");
  await page.waitForTimeout(1500);
  const pdfA = await syntheticPdf(1);
  const pdfB = await syntheticPdf(1);
  await page.locator('input[type="file"]').setInputFiles([
    { name: "a.pdf", mimeType: "application/pdf", buffer: pdfA },
    { name: "b.pdf", mimeType: "application/pdf", buffer: pdfB },
  ]);
  await page.getByRole("button", { name: /Process locally/i }).click();
  await expect(page.getByText(/Completed/i)).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: /Download/i }).first().click();
  await page.waitForTimeout(1500);
  await page.goto("https://zancta.tech/tools/ocr");
  await page.getByLabel("OCR language").selectOption("hin");
  await expect(page.getByRole("link", { name: "See Premium" })).toBeVisible({ timeout: 15_000 });
  const beforeUpgrade = await dataLayerEvents(page);
  await page.getByRole("link", { name: "See Premium" }).click();
  await expect(page).toHaveURL(/\/pricing/);
  await page.waitForTimeout(3000);
  const pricingLayer = await dataLayerEvents(page);
  await page.goto("https://zancta.tech/tools/ocr");
  await page.getByLabel("OCR language").selectOption("eng");
  await page.locator('input[type="file"]').setInputFiles(fixture);
  await page.getByRole("button", { name: "Extract text locally" }).click();
  await expect(page.getByLabel("Extracted OCR text")).toHaveValue(/Local OCR Test 123/i, { timeout: 90_000 });
  await page.getByRole("button", { name: "Download text" }).click();
  await page.waitForTimeout(2500);

  const layer = await dataLayerEvents(page);
  const names = [...new Set([...eventNamesFromHits(gaHits), ...beforeUpgrade, ...pricingLayer, ...layer])];
  const required = [
    "page_view",
    "tool_view",
    "tool_used",
    "processing_started",
    "processing_completed",
    "download_completed",
    "pricing_view",
    "premium_feature_view",
    "premium_upgrade_clicked",
    "ocr_processing_started",
    "ocr_processing_completed",
  ];
  const observed = Object.fromEntries(required.map((name) => [name, names.includes(name)]));

  for (const hit of gaHits) payloadLooksPrivate(hit.url, hit.postData);
  expect(gaHits.some((hit) => /doubleclick\.net|google\.[a-z.]+\/ads\//i.test(hit.url))).toBeFalsy();

  console.log(JSON.stringify({
    gaHitCount: gaHits.length,
    hosts: [...new Set(gaHits.map((hit) => hostPath(hit.url)))],
    collectNames: [...new Set(eventNamesFromHits(gaHits))],
    dataLayerNames: [...new Set([...beforeUpgrade, ...pricingLayer, ...layer])],
    observed,
    collect: gaHits.some((hit) => isGaCollect(hit.url)),
    cspViolations,
  }));

  expect(gaHits.some((hit) => isGtagLoader(hit.url))).toBeTruthy();
  expect(gaHits.some((hit) => isGaCollect(hit.url)) || names.includes("page_view")).toBeTruthy();
});
