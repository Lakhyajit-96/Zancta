"use client";

import * as React from "react";
import { downloadBlob } from "@/lib/download";
import {
  createLocalOcrWorker,
  OCR_LANGUAGE_PACKS,
  ocrOutputName,
  ocrProgressLabel,
  type OcrStatus,
  validateOcrImage,
} from "@/lib/ocr-engine";

export function OcrTool() {
  const [file, setFile] = React.useState<File | null>(null);
  const [status, setStatus] = React.useState<OcrStatus>("idle");
  const [progress, setProgress] = React.useState<number | null>(null);
  const [detail, setDetail] = React.useState("Select an image to begin.");
  const [error, setError] = React.useState<string | null>(null);
  const [text, setText] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const workerRef = React.useRef<import("tesseract.js").Worker | null>(null);
  const runIdRef = React.useRef(0);

  const disposeWorker = React.useCallback(async () => {
    const worker = workerRef.current;
    workerRef.current = null;
    if (worker) await worker.terminate();
  }, []);

  React.useEffect(() => () => { void disposeWorker(); }, [disposeWorker]);

  const selectFile = (selected: File | null) => {
    void disposeWorker();
    runIdRef.current += 1;
    setFile(selected);
    setStatus("idle");
    setProgress(null);
    setText("");
    setCopied(false);
    setError(null);
    setDetail(selected ? "Ready to process locally." : "Select an image to begin.");
  };

  const process = async () => {
    if (!file || status === "loading" || status === "processing") return;
    const runId = ++runIdRef.current;
    setError(null);
    setText("");
    setCopied(false);
    setStatus("validating");
    setProgress(null);
    setDetail("Validating image…");

    const validationError = await validateOcrImage(file);
    if (runId !== runIdRef.current) return;
    if (validationError) {
      setError(validationError);
      setStatus("failed");
      return;
    }

    try {
      setStatus("loading");
      setDetail("Loading local OCR engine…");
      const worker = await createLocalOcrWorker((workerStatus, workerProgress) => {
        if (runId !== runIdRef.current) return;
        setProgress(Number.isFinite(workerProgress) ? workerProgress * 100 : null);
        setDetail(ocrProgressLabel(workerStatus));
        if (workerStatus === "recognizing text") setStatus("processing");
      });
      if (runId !== runIdRef.current) {
        await worker.terminate();
        return;
      }
      workerRef.current = worker;
      setStatus("processing");
      const result = await worker.recognize(file);
      if (runId !== runIdRef.current) return;
      const recognizedText = result.data.text;
      setText(recognizedText);
      setProgress(100);
      setDetail("Text extracted locally.");
      setStatus("completed");
      await disposeWorker();
    } catch (caught) {
      if (runId !== runIdRef.current) return;
      setError(caught instanceof Error ? caught.message : "OCR could not process this image.");
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
    downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), ocrOutputName(file.name));
  };

  const working = status === "validating" || status === "loading" || status === "processing";

  return (
    <section className="card-surface rounded-lg p-5 shadow-[0_24px_60px_rgba(0,0,0,0.35)] md:p-8" aria-labelledby="ocr-workspace-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
        <div>
          <p id="ocr-workspace-title" className="text-sm font-medium">Local OCR workspace</p>
          <p className="mt-1 text-xs text-muted-foreground">Your image and extracted text stay in this browser.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
          <span aria-hidden className="h-2 w-2 rounded-full bg-success" />
          Processed locally — no upload
        </span>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <label className="block">
          <span className="text-sm font-medium">Image</span>
          <span className="mt-2 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-elevated px-5 text-center transition-colors hover:border-accent/50 focus-within:ring-2 focus-within:ring-accent">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={working}
              onChange={(event) => selectFile(event.currentTarget.files?.[0] ?? null)}
              aria-describedby="ocr-file-hint"
            />
            <span className="text-sm font-medium">Choose a JPG, PNG, or WebP image</span>
            <span id="ocr-file-hint" className="mt-2 text-xs text-muted-foreground">One image, up to 20 MB and 12,000 px per side.</span>
          </span>
        </label>
        <label className="flex min-w-40 flex-col gap-2 text-sm font-medium">
          Language
          <select className="field-input w-auto py-1.5" defaultValue="eng" disabled={working}>
            {OCR_LANGUAGE_PACKS.map((language) => <option key={language.code} value={language.code}>{language.name}</option>)}
          </select>
        </label>
      </div>

      {file ? <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">Selected: <span className="text-foreground">{file.name}</span> · {(file.size / 1024).toFixed(1)} KB</p> : <p className="mt-4 text-sm text-muted-foreground">Select an image to begin.</p>}
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
            <div className="flex gap-2">
              <button type="button" onClick={() => void copy()} className="premium-button premium-button-secondary min-h-9 px-4 text-xs">{copied ? "Copied" : "Copy text"}</button>
              <button type="button" onClick={download} className="premium-button premium-button-primary min-h-9 px-4 text-xs">Download text</button>
              <button type="button" onClick={() => selectFile(null)} className="premium-button premium-button-secondary min-h-9 px-4 text-xs">Clear</button>
            </div>
          </div>
          <label className="mt-4 block text-sm font-medium" htmlFor="ocr-result">Extracted text</label>
          <textarea id="ocr-result" readOnly value={text} className="field-input mt-2 h-56 p-3 font-mono text-sm leading-6" aria-label="Extracted OCR text" />
        </div>
      )}

      <p className="mt-6 text-xs leading-5 text-muted-foreground">English OCR assets are bundled with this site. OCR runs in a Web Worker; no file bytes or extracted text are sent to an API.</p>
    </section>
  );
}
