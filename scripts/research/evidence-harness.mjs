import { chromium } from "@playwright/test";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const repoRoot = process.cwd();
const baseUrl = (process.env.RESEARCH_BASE_URL || "https://zancta.tech").replace(/\/$/, "");
const runDate = new Date().toISOString();
const runId = runDate.replace(/[:.]/g, "-");
const root = path.join(repoRoot, ".tmp", "zancta-research", runId);
const fixturesDir = path.join(root, "fixtures");
const outputsDir = path.join(root, "outputs");
const resultsPath = path.join(root, "evidence.json");
const reportPath = path.join(root, "evidence.md");
const marker = "ZANCTA-SYNTHETIC-MARKER-8F";
const python = process.env.PYTHON || "python";

const fixtureRoot = path.join(repoRoot, "tests", "fixtures");
const pdfFixture = path.join(fixtureRoot, "pdf-text-single.pdf");

async function run(command, args) {
  const { stdout } = await execFileAsync(command, args, { cwd: repoRoot });
  return stdout.trim();
}

async function metadata(file) {
  return JSON.parse(await run(python, [path.join(repoRoot, "scripts", "research", "inspect-metadata.py"), file]));
}

async function gitCommit() {
  try {
    return await run("git", ["rev-parse", "HEAD"]);
  } catch {
    return "DATA_UNAVAILABLE";
  }
}

function digest(value) {
  return value ? crypto.createHash("sha256").update(value).digest("hex") : null;
}

async function setFixture(page, file) {
  await page.locator('input[type="file"]').setInputFiles(file);
}

function summarizeRequest(request, phase, origin) {
  const headers = request.headers();
  const body = request.postData() || "";
  const contentType = headers["content-type"] || null;
  return {
    url: request.url(),
    method: request.method(),
    resource_type: request.resourceType(),
    phase,
    same_origin: request.url().startsWith(origin),
    content_type: contentType,
    body_present: body.length > 0,
    body_length: body.length,
    body_sha256: digest(body),
    multipart: Boolean(contentType && /multipart\/form-data/i.test(contentType)),
    synthetic_marker_present: body.includes(marker),
  };
}

async function runNetworkWorkflow(browser, workflow) {
  console.log(`network workflow: ${workflow.name}`);
  const page = await browser.newPage({ acceptDownloads: true });
  const origin = new URL(baseUrl).origin;
  const requests = [];
  const responses = [];
  let phase = "initial_load";
  let selectionAt = null;
  let processingAt = null;

  page.on("request", (request) => {
    requests.push({ request, phaseAtCapture: phase, capturedAt: Date.now() });
  });
  page.on("response", (response) => {
    const headers = response.headers();
    responses.push({
      url: response.url(),
      status: response.status(),
      content_type: headers["content-type"] || null,
      content_length: headers["content-length"] || null,
      phase,
    });
  });

  await page.goto(`${baseUrl}${workflow.path}`, { waitUntil: "domcontentloaded" });
  await setFixture(page, workflow.fixture);
  selectionAt = new Date().toISOString();
  phase = "after_file_selection";
  await page.getByText(path.basename(workflow.fixture), { exact: true }).waitFor({ state: "visible", timeout: 30000 });
  try {
    await page.getByRole("button", { name: workflow.button }).waitFor({ state: "visible", timeout: 30000 });
  } catch (error) {
    const body = await page.locator("body").innerText().catch(() => "");
    throw new Error(`${workflow.name} did not expose its processing button: ${error instanceof Error ? error.message : String(error)}\n${body.slice(0, 1500)}`);
  }
  processingAt = new Date().toISOString();
  await page.getByRole("button", { name: workflow.button }).click();
  await workflow.waitForCompletion(page);
  phase = "completed";

  const normalizedRequests = requests.map(({ request, phaseAtCapture }) => summarizeRequest(request, phaseAtCapture, origin));
  const normalizedResponses = responses.filter((response) => response.url.startsWith(origin));
  const download = workflow.download ? await captureDownload(page, outputsDir) : null;
  await page.close();

  return {
    experiment_id: `network-${workflow.name}-${runId}`,
    experiment: "browser-network-audit",
    date: runDate,
    environment: { base_url: baseUrl, production_url: `${baseUrl}${workflow.path}`, git_commit: await gitCommit() },
    browser: "Chromium via Playwright",
    fixture: workflow.fixture,
    selection_at: selectionAt,
    processing_started_at: processingAt,
    requests: normalizedRequests,
    responses: normalizedResponses,
    observation: {
      external_requests: normalizedRequests.filter((item) => !item.same_origin && !item.url.startsWith("blob:")),
      unsafe_same_origin_requests: normalizedRequests.filter((item) => item.same_origin && !["GET", "HEAD"].includes(item.method)),
      body_requests: normalizedRequests.filter((item) => item.body_present),
      marker_requests: normalizedRequests.filter((item) => item.synthetic_marker_present),
      interpretation: "Scoped request observation for this Chromium workflow; not a universal no-upload guarantee.",
    },
    download,
    evidence_classification: "VERIFIED",
    limitations: ["Browser/version/workflow specific.", "Request bodies are summarized, not persisted.", "A transformed or encoded file could evade a literal marker search."],
  };
}

async function captureDownload(page, directory) {
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download" }).first().click();
  const download = await downloadPromise;
  const source = await download.path();
  if (!source) return { filename: await download.suggestedFilename(), status: "DATA_UNAVAILABLE" };
  const destination = path.join(directory, await download.suggestedFilename());
  await fs.copyFile(source, destination);
  return { filename: await download.suggestedFilename(), path: destination, size_bytes: (await fs.stat(destination)).size };
}

async function runExif(browser) {
  const files = ["synthetic-exif.jpg", "synthetic-metadata.webp", "synthetic-metadata.png"];
  const results = [];
  for (const file of files) {
    const input = path.join(fixturesDir, file);
    const page = await browser.newPage({ acceptDownloads: true });
    await page.goto(`${baseUrl}/tools/exif-cleaner`, { waitUntil: "domcontentloaded" });
    await setFixture(page, input);
    await page.getByText(file, { exact: true }).waitFor({ state: "visible", timeout: 30000 });
    await page.getByRole("button", { name: "Process locally" }).waitFor({ state: "visible", timeout: 20000 });
    await page.getByRole("button", { name: "Process locally" }).click();
    await page.getByText(/Completed/i).waitFor({ state: "visible", timeout: 30000 });
    const download = await captureDownload(page, outputsDir);
    await page.close();
    const before = await metadata(input);
    const after = download.path ? await metadata(download.path) : null;
    const beforeKeys = new Set([...Object.keys(before.exif), ...Object.keys(before.container_info)]);
    const afterKeys = new Set([...Object.keys(after?.exif || {}), ...Object.keys(after?.container_info || {})]);
    results.push({
      experiment_id: `exif-${path.parse(file).name}-${runId}`,
      experiment: "exif-before-after",
      date: runDate,
      environment: { production_url: `${baseUrl}/tools/exif-cleaner`, git_commit: await gitCommit() },
      browser: "Chromium via Playwright",
      fixture: { file, before },
      output: after,
      removed_fields: [...beforeKeys].filter((key) => !afterKeys.has(key)),
      retained_fields: [...beforeKeys].filter((key) => afterKeys.has(key)),
      changed_fields: [],
      observation: "The tested metadata fields were compared before and after the production re-encode.",
      evidence_classification: after ? "VERIFIED" : "NOT_VERIFIED",
      limitations: ["Synthetic fixtures only.", "Pillow is not exhaustive metadata coverage; use ExifTool for broader validation.", "GPS fixture is DATA_UNAVAILABLE."],
    });
  }
  return results;
}

async function runPdfCompression(browser) {
  const cases = [
    ["pdf-text-single.pdf", "small text PDF"],
    ["pdf-text-multi.pdf", "multi-page text PDF"],
    ["pdf-text-large.pdf", "larger controlled text PDF"],
  ];
  const results = [];
  for (const [file, description] of cases) {
    const input = path.join(fixtureRoot, file);
    const page = await browser.newPage({ acceptDownloads: true });
    await page.goto(`${baseUrl}/tools/pdf-compress`, { waitUntil: "domcontentloaded" });
    await setFixture(page, input);
    await page.getByText(file, { exact: true }).waitFor({ state: "visible", timeout: 30000 });
    await page.getByRole("button", { name: "Process locally" }).waitFor({ state: "visible", timeout: 20000 });
    await page.getByRole("button", { name: "Process locally" }).click();
    await page.getByText(/Completed/i).waitFor({ state: "visible", timeout: 30000 });
    const download = await captureDownload(page, outputsDir);
    await page.close();
    const inputSize = (await fs.stat(input)).size;
    const outputSize = download.size_bytes ?? null;
    results.push({
      experiment_id: `pdf-compression-${path.parse(file).name}-${runId}`,
      experiment: "pdf-compression",
      date: runDate,
      environment: { production_url: `${baseUrl}/tools/pdf-compress`, git_commit: await gitCommit() },
      browser: "Chromium via Playwright",
      fixture: { file, description, input_size_bytes: inputSize },
      output: { output_size_bytes: outputSize, byte_delta: outputSize === null ? null : outputSize - inputSize, percentage_change: outputSize === null ? null : ((outputSize - inputSize) / inputSize) * 100 },
      observation: "The exact tested fixture became smaller, unchanged, or larger as measured by the downloaded output.",
      evidence_classification: outputSize === null ? "NOT_VERIFIED" : "VERIFIED",
      limitations: ["Fixture-specific measurement.", "Not a universal compression guarantee.", "The current implementation performs structural PDF rewriting and does not transcode embedded images."],
    });
  }
  return results;
}

async function main() {
  await fs.mkdir(fixturesDir, { recursive: true });
  await fs.mkdir(outputsDir, { recursive: true });
  await run(python, [path.join(repoRoot, "scripts", "research", "generate-fixtures.py"), fixturesDir]);
  const browser = await chromium.launch({ headless: true });
  const network = [];
  const workflows = [
    { name: "exif-cleaner", path: "/tools/exif-cleaner", fixture: path.join(fixturesDir, "synthetic-exif.jpg"), button: "Process locally", download: "synthetic-exif.jpg", waitForCompletion: (page) => page.getByText(/Completed/i).waitFor({ state: "visible", timeout: 30000 }) },
    { name: "ocr", path: "/tools/ocr", fixture: path.join(fixturesDir, "synthetic-metadata.png"), button: "Extract text locally", waitForCompletion: (page) => page.getByLabel("Extracted OCR text").waitFor({ state: "visible", timeout: 90000 }) },
    { name: "pdf-text-extractor", path: "/tools/pdf-text-extractor", fixture: pdfFixture, button: "Extract text locally", waitForCompletion: (page) => page.getByText("Local PDF Text Test 123").waitFor({ state: "visible", timeout: 30000 }) },
    { name: "pdf-compress", path: "/tools/pdf-compress", fixture: pdfFixture, button: "Process locally", download: "compressed.pdf", waitForCompletion: (page) => page.getByText(/Completed/i).waitFor({ state: "visible", timeout: 30000 }) },
  ];
  for (const workflow of workflows) network.push(await runNetworkWorkflow(browser, workflow));
  const exif = await runExif(browser);
  const pdfCompression = await runPdfCompression(browser);
  await browser.close();
  const result = { harness: "ZANCTA research evidence harness", version: 1, run_id: runId, date: runDate, base_url: baseUrl, git_commit: await gitCommit(), results: { exif, network, pdf_compression: pdfCompression } };
  await fs.writeFile(resultsPath, JSON.stringify(result, null, 2), "utf8");
  const lines = [`# Research Evidence Run`, ``, `- Run: ${runId}`, `- Date: ${runDate}`, `- Base URL: ${baseUrl}`, `- Commit: ${result.git_commit}`, ``, `## Summary`, ``];
  for (const item of [...exif, ...network, ...pdfCompression]) lines.push(`- **${item.experiment}** — ${item.experiment_id} — ${item.evidence_classification}`);
  lines.push(``, `Generated JSON: ${resultsPath}`, ``, `All observations are scoped to the exact fixtures, Chromium run, production URL, and date above.`);
  await fs.writeFile(reportPath, lines.join("\n"), "utf8");
  console.log(JSON.stringify({ resultsPath, reportPath, exif: exif.length, network: network.length, pdfCompression: pdfCompression.length }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
