"use client";

import * as React from "react";
import Link from "next/link";
import { downloadBlob } from "@/lib/download";
import {
  createLocalOcrWorker,
  fetchPremiumLanguageData,
  OCR_LANGUAGE_PACKS,
  OCR_LIMITS,
  ocrOutputName,
  ocrPdfOutputName,
  ocrPdfZipName,
  ocrProgressLabel,
  PremiumRequiredError,
  isOcrPdf,
  type OcrLanguage,
  type OcrStatus,
  validateOcrImage,
} from "@/lib/ocr-engine";
import { isPremiumOcrLanguage } from "@/lib/ocr-languages";
import { zipTextParts } from "@/lib/ocr-zip";
import { trackEvent } from "@/lib/analytics/tracker";

function track(event: string, params?: Record<string, unknown>) {
  trackEvent(event as never, params);
}

export function OcrTool() {
  const [file, setFile] = React.useState<File | null>(null);
  const [status, setStatus] = React.useState<OcrStatus>("idle");
  const [progress, setProgress] = React.useState<number | null>(null);
  const [detail, setDetail] = React.useState("Select an image to begin.");
  const [error, setError] = React.useState<string | null>(null);
  const [text, setText] = React.useState("");
  const [pageTexts, setPageTexts] = React.useState<string[]>([]);
  const [copied, setCopied] = React.useState(false);
  const [language, setLanguage] = React.useState<OcrLanguage>("eng");
  const [premium, setPremium] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const premiumRef = React.useRef(false);
  const workerRef = React.useRef<import("tesseract.js").Worker | null>(null);
  const runIdRef = React.useRef(0);
  const statusFetched = React.useRef(false);

  const disposeWorker = React.useCallback(async () => {
    const worker = workerRef.current;
    workerRef.current = null;
    if (worker) await worker.terminate();
  }, []);

  React.useEffect(() => () => {
    runIdRef.current += 1;
    void disposeWorker();
  }, [disposeWorker]);

  const ensurePremiumStatus = async (): Promise<boolean> => {
    if (statusFetched.current) return premiumRef.current;
    try {
      const res = await fetch("/api/ocr/status", { credentials: "same-origin" });
      const data = await res.json().catch(() => ({ premium: false })) as { premium?: boolean };
      const value = data.premium === true;
      premiumRef.current = value;
      setPremium(value);
      statusFetched.current = true;
      return value;
    } catch {
      statusFetched.current = true;
      return false;
    }
  };

  const selectFile = (selected: File | null) => {
    void disposeWorker();
    runIdRef.current += 1;
    setFile(selected);
    setStatus("idle");
    setProgress(null);
    setText("");
    setPageTexts([]);
    setCopied(false);
    setError(null);
    setNotice(null);
    setDetail(selected ? "Ready to process locally." : "Select an image to begin.");
    if (selected && isOcrPdf(selected)) {
      void ensurePremiumStatus().then((hasPremium) => {
        if (!hasPremium) {
          setNotice("Scanned PDF OCR is Local OCR Power — a Premium capability. English image OCR remains free. Premium is currently unavailable while ZANCTA completes its launch process.");
          track("premium_feature_view", { tool: "ocr" });
        }
      });
    }
  };

  const onLanguageChange = async (next: OcrLanguage) => {
    void disposeWorker();
    setLanguage(next);
    track("ocr_language_selected", { tool: "ocr", language: next });
    if (!isPremiumOcrLanguage(next) && !(file && isOcrPdf(file))) return;
    const hasPremium = await ensurePremiumStatus();
    if (!hasPremium) {
      setNotice("Local OCR Power (additional languages and scanned PDF OCR) is a Premium capability. Premium is currently unavailable while ZANCTA completes its launch process.");
      track("premium_feature_view", { tool: "ocr" });
    }
  };

  const process = async () => {
    if (!file || status === "loading" || status === "processing") return;
    const runId = ++runIdRef.current;
    setError(null);
    setNotice(null);
    setText("");
    setPageTexts([]);
    setCopied(false);
    setStatus("validating");
    setProgress(null);
    setDetail("Validating…");

    const pdf = isOcrPdf(file);
    if (pdf || isPremiumOcrLanguage(language)) {
      const hasPremium = await ensurePremiumStatus();
      if (runId !== runIdRef.current) return;
      if (!hasPremium) {
        setError(pdf
          ? "Scanned PDF OCR is a Premium capability. English image OCR remains free."
          : "This language pack is a Premium capability. English OCR remains free.");
        setStatus("failed");
        track("premium_feature_view", { tool: "ocr" });
        return;
      }
    }

    const validationError = await validateOcrImage(file);
    if (runId !== runIdRef.current) return;
    if (validationError) {
      setError(validationError);
      setStatus("failed");
      return;
    }

    track("processing_started", { tool: "ocr" });
    track("ocr_processing_started", { tool: "ocr", language });
    let stage: "language" | "process" = "process";

    try {
      let languageData: Uint8Array | undefined;
      if (isPremiumOcrLanguage(language)) {
        stage = "language";
        setStatus("loading");
        setDetail("Downloading language data…");
        track("ocr_language_load_started", { tool: "ocr", language });
        languageData = await fetchPremiumLanguageData(language);
        if (runId !== runIdRef.current) return;
        track("ocr_language_load_completed", { tool: "ocr", language });
        stage = "process";
      }

      if (pdf) {
        setStatus("loading");
        setDetail("Preparing OCR…");
        const { openPdfOcrSession } = await import("@/lib/ocr-pdf-browser");
        const session = await openPdfOcrSession(file, () => runId !== runIdRef.current);
        try {
          if (runId !== runIdRef.current) return;
          if (session.kind === "embedded") {
            const joined = session.pages.map((page) => page.text).join("\n\n");
            setText(joined);
            setPageTexts(session.pages.map((page) => page.text));
            setProgress(100);
            setDetail("This PDF already contains embedded text. Local OCR was not required.");
            setStatus("completed");
            track("processing_completed", { tool: "ocr" });
            track("ocr_processing_completed", { tool: "ocr", language });
            track("tool_used", { tool: "ocr" });
            return;
          }

          const worker = await createLocalOcrWorker((workerStatus, workerProgress) => {
            if (runId !== runIdRef.current) return;
            setProgress(Number.isFinite(workerProgress) ? workerProgress * 100 : null);
            setDetail(ocrProgressLabel(workerStatus));
          }, language, languageData);
          if (runId !== runIdRef.current) {
            await worker.terminate();
            return;
          }
          workerRef.current = worker;
          const collected: string[] = [];
          for (let pageNumber = 1; pageNumber <= session.totalPages; pageNumber += 1) {
            if (runId !== runIdRef.current) {
              await disposeWorker();
              return;
            }
            const embedded = session.pages[pageNumber - 1];
            setStatus("processing");
            setDetail(`Processing page ${pageNumber} of ${session.totalPages} locally…`);
            if (embedded?.kind === "embedded") {
              collected.push(embedded.text);
            } else {
              const blob = await session.renderPage(pageNumber);
              if (runId !== runIdRef.current) {
                await disposeWorker();
                return;
              }
              const result = await worker.recognize(blob);
              if (runId !== runIdRef.current) {
                await disposeWorker();
                return;
              }
              collected.push(result.data.text);
            }
            setProgress(Math.round((pageNumber / session.totalPages) * 100));
          }
          setPageTexts(collected);
          setText(collected.join("\n\n"));
          setProgress(100);
          setDetail("Completed.");
          setStatus("completed");
          await disposeWorker();
          track("processing_completed", { tool: "ocr" });
          track("ocr_processing_completed", { tool: "ocr", language });
          track("tool_used", { tool: "ocr" });
        } finally {
          await session.destroy();
        }
        return;
      }

      setStatus("loading");
      setDetail("Loading local OCR engine…");
      const worker = await createLocalOcrWorker((workerStatus, workerProgress) => {
        if (runId !== runIdRef.current) return;
        setProgress(Number.isFinite(workerProgress) ? workerProgress * 100 : null);
        setDetail(ocrProgressLabel(workerStatus));
        if (workerStatus === "recognizing text") setStatus("processing");
      }, language, languageData);
      if (runId !== runIdRef.current) {
        await worker.terminate();
        return;
      }
      workerRef.current = worker;
      setStatus("processing");
      const result = await worker.recognize(file);
      if (runId !== runIdRef.current) {
        await disposeWorker();
        return;
      }
      setText(result.data.text);
      setProgress(100);
      setDetail("Completed.");
      setStatus("completed");
      await disposeWorker();
      track("processing_completed", { tool: "ocr" });
      track("ocr_processing_completed", { tool: "ocr", language });
      track("tool_used", { tool: "ocr" });
    } catch (caught) {
      if (runId !== runIdRef.current) return;
      if (caught instanceof PremiumRequiredError) {
        setError("This language pack is a Premium capability. English OCR remains free.");
        track("ocr_language_load_failed", { tool: "ocr", language });
      } else {
        const message = caught instanceof Error ? caught.message : "OCR could not process this file.";
        setError(message === "cancelled" ? null : message);
        if (message !== "cancelled" && stage === "language") {
          track("ocr_language_load_failed", { tool: "ocr", language });
        } else if (message !== "cancelled") {
          track("ocr_processing_failed", { tool: "ocr", language, error_category: "processing" });
          track("processing_failed", { tool: "ocr", error_category: "processing" });
        }
      }
      setStatus("failed");
      await disposeWorker();
    }
  };

  const cancel = async () => {
    runIdRef.current += 1;
    await disposeWorker();
    setProgress(null);
    setDetail("OCR cancelled.");
    setStatus("aborted");
    track("processing_cancelled", { tool: "ocr" });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setError("Copy was unavailable. Select the text and copy it manually.");
    }
  };

  const download = () => {
    if (!file) return;
    const name = isOcrPdf(file) ? ocrPdfOutputName() : ocrOutputName(file.name);
    downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), name);
    track("download_completed", { tool: "ocr" });
  };

  const downloadZip = async () => {
    if (pageTexts.length < 2) return;
    const blob = await zipTextParts(pageTexts.map((pageText, index) => ({
      name: `page-${String(index + 1).padStart(2, "0")}.txt`,
      text: pageText,
    })));
    downloadBlob(blob, ocrPdfZipName());
    track("download_completed", { tool: "ocr" });
  };

  const working = status === "validating" || status === "loading" || status === "processing";

  return (
    <section className="card-surface rounded-lg p-5 shadow-[0_24px_60px_rgba(0,0,0,0.35)] md:p-8" aria-labelledby="ocr-workspace-title" aria-busy={working}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
        <div>
          <p id="ocr-workspace-title" className="text-sm font-medium">Local OCR workspace</p>
          <p className="mt-1 text-xs text-muted-foreground">Your file and extracted text stay in this browser. OCR is not human-level. Results may vary with image quality, fonts, and layout. Handwriting, tables, and low-contrast scans often fail.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
          <span aria-hidden className="h-2 w-2 rounded-full bg-success" />
          Processed locally — no upload
        </span>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <label className="block">
          <span className="text-sm font-medium">Image or scanned PDF</span>
          <span className="mt-2 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-elevated px-5 text-center transition-colors hover:border-accent/50 focus-within:ring-2 focus-within:ring-accent">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf,.pdf"
              className="sr-only"
              disabled={working}
              onChange={(event) => {
                const picked = event.currentTarget.files?.[0] ?? null;
                selectFile(picked);
                event.currentTarget.value = "";
              }}
              aria-describedby="ocr-file-hint"
            />
            <span className="text-sm font-medium">Choose a JPG, PNG, WebP, or PDF</span>
            <span id="ocr-file-hint" className="mt-2 text-xs text-muted-foreground">Images up to 20 MB and 12,000 px. Scanned PDFs up to 50 MB and {OCR_LIMITS.scannedPdfPages} pages (Premium).</span>
          </span>
        </label>
        <label className="flex min-w-40 flex-col gap-2 text-sm font-medium">
          Language
          <select
            className="field-input w-auto py-1.5"
            value={language}
            disabled={working}
            aria-label="OCR language"
            onChange={(event) => void onLanguageChange(event.target.value as OcrLanguage)}
          >
            {OCR_LANGUAGE_PACKS.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}{item.premium ? " — Premium" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-4 grid gap-2 text-xs leading-5 text-muted-foreground sm:grid-cols-2">
        <p><span className="font-medium text-foreground">Free OCR</span> — English images. Current image limits apply.</p>
        <p><span className="font-medium text-foreground">Premium OCR</span> — Hindi, Bengali, Tamil, Spanish, French, German, and scanned PDF OCR (up to {OCR_LIMITS.scannedPdfPages} pages). Language packs load only when selected. Recognition is not human-level.</p>
      </div>

      {file ? (
        <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
          Selected: <span className="text-foreground">{isOcrPdf(file) ? "PDF document" : "Image"}</span> · {(file.size / 1024).toFixed(1)} KB
        </p>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">Select an image to begin.</p>
      )}
      {premium && (
        <p className="mt-4 text-xs text-muted-foreground">Premium OCR languages are available on this signed-in account.</p>
      )}
      {notice && (
        <p role="status" className="mt-4 border border-border bg-elevated p-4 text-sm text-muted-foreground">
          {notice}{" "}
          <Link href="/pricing" className="underline" onClick={() => track("premium_upgrade_clicked", { tool: "ocr" })}>See Premium</Link>
        </p>
      )}
      {error && <div role="alert" className="mt-5 border border-error/40 bg-error/10 p-4 text-sm text-error">{error}</div>}
      {status === "aborted" && <p role="status" className="mt-5 text-sm text-muted-foreground">{detail}</p>}

      {working && (
        <div className="mt-5 space-y-3" aria-live="polite">
          <p className="text-sm">{detail}</p>
          {progress === null ? <div className="h-1 overflow-hidden bg-muted"><div className="h-full w-1/3 bg-accent motion-safe:animate-pulse" /></div> : <>
            <div className="h-1 overflow-hidden bg-muted"><div className="h-full bg-accent transition-[width] motion-reduce:transition-none" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} /></div>
            <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
          </>}
          <button type="button" onClick={() => void cancel()} className="premium-button premium-button-secondary min-h-9 px-4 text-xs">Cancel</button>
        </div>
      )}

      {!working && file && status !== "completed" && (
        <button type="button" onClick={() => void process()} className="premium-button premium-button-primary mt-5 min-h-10 px-5">Extract text locally</button>
      )}

      {status === "completed" && (
        <div className="mt-6 border border-success/30 bg-success/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-success">Completed — processed locally</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void copy()} className="premium-button premium-button-secondary min-h-9 px-4 text-xs">{copied ? "Copied" : "Copy text"}</button>
              <button type="button" onClick={download} className="premium-button premium-button-primary min-h-9 px-4 text-xs">Download text</button>
              {pageTexts.length > 1 && (
                <button type="button" onClick={() => void downloadZip()} className="premium-button premium-button-secondary min-h-9 px-4 text-xs">Download ZIP</button>
              )}
              <button type="button" onClick={() => selectFile(null)} className="premium-button premium-button-secondary min-h-9 px-4 text-xs">Clear</button>
            </div>
          </div>
          <label className="mt-4 block text-sm font-medium" htmlFor="ocr-result">Extracted OCR text</label>
          <textarea id="ocr-result" readOnly value={text} className="field-input mt-2 h-56 p-3 font-mono text-sm leading-6" aria-label="Extracted OCR text" />
          {detail && detail !== "Completed." && (
            <p role="status" className="mt-3 text-sm text-muted-foreground">{detail}</p>
          )}
          {!text.trim() && (
            <p role="status" className="mt-3 text-sm text-muted-foreground">
              No text was recognized. OCR can miss handwriting, low-contrast images, or unsupported scripts. This is not a silent success with hidden content.
            </p>
          )}
          <p className="mt-4 text-sm text-muted-foreground">
            Working with a text-native PDF instead? Use the{" "}
            <Link href="/tools/pdf-text-extractor" className="underline">PDF Text Extractor</Link>.
          </p>
        </div>
      )}

      <p className="mt-6 text-xs leading-5 text-muted-foreground">
        Scanned PDF OCR is performed locally in your browser. English OCR assets are bundled with this site. Additional language packs load only when selected and only for Premium accounts. Recognition runs in a Web Worker; no file bytes or extracted text are sent to an API.
      </p>
    </section>
  );
}
