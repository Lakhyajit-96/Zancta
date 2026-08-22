"use client";

import * as React from "react";
import Link from "next/link";
import { downloadBlob } from "@/lib/download";
import {
  joinPdfTextPages,
  pdfTextOutputName,
  searchPdfTextPages,
  type PdfTextPage,
  type PdfTextStatus,
  validatePdfTextInput,
} from "@/lib/pdf-text-engine";

type WorkerResponse =
  | { id: string; type: "loading" }
  | { id: string; type: "loaded"; totalPages: number }
  | { id: string; type: "page"; pageNumber: number; totalPages: number; text: string }
  | { id: string; type: "completed" }
  | { id: string; type: "failed"; message: string };

export function PdfTextExtractor() {
  const [file, setFile] = React.useState<File | null>(null);
  const [status, setStatus] = React.useState<PdfTextStatus>("idle");
  const [detail, setDetail] = React.useState("Select a text-based PDF to begin.");
  const [error, setError] = React.useState<string | null>(null);
  const [pages, setPages] = React.useState<PdfTextPage[]>([]);
  const [totalPages, setTotalPages] = React.useState(0);
  const [query, setQuery] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const workerRef = React.useRef<Worker | null>(null);
  const runIdRef = React.useRef(0);

  const disposeWorker = React.useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  React.useEffect(() => () => disposeWorker(), [disposeWorker]);

  const reset = React.useCallback((selected: File | null = null) => {
    disposeWorker();
    runIdRef.current += 1;
    setFile(selected);
    setStatus("idle");
    setDetail(selected ? "Ready to extract embedded text locally." : "Select a text-based PDF to begin.");
    setError(null);
    setPages([]);
    setTotalPages(0);
    setQuery("");
    setCopied(false);
  }, [disposeWorker]);

  const extract = async () => {
    if (!file || status === "loading" || status === "processing" || status === "validating") return;
    const id = String(++runIdRef.current);
    setStatus("validating");
    setDetail("Validating PDF…");
    setError(null);
    setPages([]);
    setTotalPages(0);
    setQuery("");
    setCopied(false);

    const validationError = validatePdfTextInput(file);
    if (id !== String(runIdRef.current)) return;
    if (validationError) {
      setError(validationError);
      setStatus("failed");
      return;
    }

    try {
      const bytes = await file.arrayBuffer();
      if (id !== String(runIdRef.current)) return;
      const worker = new Worker(new URL("../../workers/pdf-text.worker.ts", import.meta.url));
      workerRef.current = worker;
      void import("@/lib/analytics/tracker").then(({ trackEvent }) => {
        trackEvent("processing_started", { tool: "pdf-text-extractor" });
      }).catch(() => {});

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const message = event.data;
        if (message.id !== id || id !== String(runIdRef.current)) return;
        if (message.type === "loading") {
          setStatus("loading");
          setDetail("Loading PDF locally…");
        } else if (message.type === "loaded") {
          setTotalPages(message.totalPages);
          setStatus("processing");
          setDetail(`Extracting page 0 of ${message.totalPages} locally…`);
        } else if (message.type === "page") {
          setStatus("processing");
          setPages((current) => [...current, { pageNumber: message.pageNumber, text: message.text }]);
          setDetail(`Extracting page ${message.pageNumber} of ${message.totalPages} locally…`);
        } else if (message.type === "completed") {
          disposeWorker();
          setDetail("Embedded text extracted locally.");
          setStatus("completed");
          void import("@/lib/analytics/tracker").then(({ trackEvent }) => {
            trackEvent("processing_completed", { tool: "pdf-text-extractor" });
            trackEvent("tool_used", { tool: "pdf-text-extractor" });
          }).catch(() => {});
        } else if (message.type === "failed") {
          disposeWorker();
          setError(message.message);
          setStatus("failed");
        }
      };
      worker.onerror = () => {
        if (id !== String(runIdRef.current)) return;
        disposeWorker();
        setError("The local PDF worker stopped unexpectedly. Try a different PDF.");
        setStatus("failed");
      };
      setStatus("loading");
      setDetail("Loading PDF locally…");
      worker.postMessage({ id, type: "START", bytes }, [bytes]);
    } catch {
      if (id !== String(runIdRef.current)) return;
      disposeWorker();
      setError("This PDF could not be read locally. It may be corrupted or unsupported.");
      setStatus("failed");
    }
  };

  const cancel = () => {
    const id = String(runIdRef.current);
    workerRef.current?.postMessage({ id, type: "CANCEL" });
    runIdRef.current += 1;
    disposeWorker();
    setDetail("Text extraction cancelled.");
    setStatus("aborted");
  };

  const text = React.useMemo(() => joinPdfTextPages(pages), [pages]);
  const matches = React.useMemo(() => searchPdfTextPages(pages, query), [pages, query]);
  const working = status === "validating" || status === "loading" || status === "processing";
  const progress = totalPages ? Math.round((pages.length / totalPages) * 100) : null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setError("Copy was unavailable. Select the extracted text and copy it manually.");
    }
  };

  const download = () => {
    if (!file) return;
    downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), pdfTextOutputName(file.name));
    void import("@/lib/analytics/tracker").then(({ trackEvent }) => {
      trackEvent("download_completed", { tool: "pdf-text-extractor" });
    }).catch(() => {});
  };

  return (
    <section className="card-surface rounded-lg p-5 shadow-[0_24px_60px_rgba(0,0,0,0.35)] md:p-8" aria-labelledby="pdf-text-workspace-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
        <div>
          <p id="pdf-text-workspace-title" className="text-sm font-medium">Local PDF text workspace</p>
          <p className="mt-1 text-xs text-muted-foreground">Extract existing text from text-based PDFs in this browser.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
          <span aria-hidden className="h-2 w-2 rounded-full bg-success" />
          Processed locally — no upload
        </span>
      </div>

      <label className="mt-6 block">
        <span className="text-sm font-medium">PDF document</span>
        <span className="mt-2 flex min-h-32 cursor-pointer flex-col items-center justify-center border-2 border-dashed border-border-strong bg-elevated px-5 text-center transition-colors hover:border-accent/50 focus-within:ring-2 focus-within:ring-accent">
          <input type="file" accept="application/pdf,.pdf" className="sr-only" disabled={working} onChange={(event) => { const picked = event.currentTarget.files?.[0] ?? null; reset(picked); event.currentTarget.value = ""; }} aria-describedby="pdf-text-file-hint" />
          <span className="text-sm font-medium">Choose a text-based PDF</span>
          <span id="pdf-text-file-hint" className="mt-2 text-xs text-muted-foreground">One PDF, up to 50 MB. Scanned or image-only PDFs do not contain extractable text.</span>
        </span>
      </label>

      {file ? <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">Selected: <span className="text-foreground">{file.name}</span> · {(file.size / 1024).toFixed(1)} KB</p> : <p className="mt-4 text-sm text-muted-foreground">Select a text-based PDF to begin.</p>}
      {error && <div role="alert" className="mt-5 border border-error/40 bg-error/10 p-4 text-sm text-error">{error}</div>}
      {status === "aborted" && <p role="status" className="mt-5 text-sm text-muted-foreground">{detail}</p>}

      {working && <div className="mt-5 space-y-3" aria-live="polite">
        <p className="text-sm">{detail}</p>
        {progress === null ? <div className="h-1 overflow-hidden bg-muted"><div className="h-full w-1/3 bg-accent motion-safe:animate-pulse" /></div> : <>
          <div className="h-1 overflow-hidden bg-muted"><div className="h-full bg-accent transition-[width] motion-reduce:transition-none" style={{ width: `${progress}%` }} /></div>
          <p className="text-xs text-muted-foreground">{progress}%</p>
        </>}
        <button type="button" onClick={cancel} className="premium-button premium-button-secondary min-h-9 px-4 text-xs">Cancel</button>
      </div>}

      {!working && file && status !== "completed" && <button type="button" onClick={() => void extract()} className="premium-button premium-button-primary mt-5 min-h-10 px-5">Extract text locally</button>}

      {status === "completed" && <div className="mt-6 border border-success/30 bg-success/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-success">Completed — processed locally</p>
            <p className="mt-1 text-xs text-muted-foreground">{totalPages} {totalPages === 1 ? "page" : "pages"} processed.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void copy()} disabled={!text} className="premium-button premium-button-secondary min-h-9 px-4 text-xs disabled:opacity-50">{copied ? "Copied" : "Copy text"}</button>
            <button type="button" onClick={download} disabled={!text} className="premium-button premium-button-primary min-h-9 px-4 text-xs disabled:opacity-50">Download TXT</button>
            <button type="button" onClick={() => reset()} className="premium-button premium-button-secondary min-h-9 px-4 text-xs">Clear</button>
          </div>
        </div>

        {!text ? <p role="status" className="mt-4 border border-border bg-elevated p-4 text-sm text-muted-foreground">No embedded text was found. This PDF may be scanned or image-only. This tool extracts existing PDF text and does not OCR scanned documents. For scanned PDFs, use <Link href="/tools/ocr" className="underline">Image OCR</Link> Local OCR Power (Premium, up to 20 pages).</p> : <>
          <div className="mt-5 border-y border-border py-4">
            <label htmlFor="pdf-text-search" className="text-sm font-medium">Search extracted text</label>
            <div className="mt-2 flex flex-wrap gap-2">
              <input id="pdf-text-search" value={query} onChange={(event) => setQuery(event.target.value)} className="field-input min-w-0 flex-1" placeholder="Find text across pages" />
              {query && <button type="button" onClick={() => setQuery("")} className="premium-button premium-button-secondary min-h-9 px-4 text-xs">Clear search</button>}
            </div>
            {query && <p role="status" className="mt-2 text-xs text-muted-foreground">{matches.length} {matches.length === 1 ? "match" : "matches"} found.</p>}
            {query && matches.length > 0 && <ul className="mt-3 max-h-40 space-y-2 overflow-auto text-sm" aria-label="Search results">
              {matches.map((match, index) => <li key={`${match.pageNumber}-${match.index}-${index}`} className="border border-border bg-elevated p-2"><span className="font-medium">Page {match.pageNumber}</span><span className="ml-2 text-muted-foreground">{match.excerpt}</span></li>)}
            </ul>}
          </div>
          <div className="mt-5 max-h-[34rem] space-y-4 overflow-auto pr-1" aria-label="Extracted PDF text">
            {pages.map((page) => <section key={page.pageNumber} className="border border-border bg-elevated p-4" aria-labelledby={`pdf-page-${page.pageNumber}`}>
              <p id={`pdf-page-${page.pageNumber}`} className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Page {page.pageNumber}</p>
              <p className="mt-3 whitespace-pre-wrap break-words font-mono text-sm leading-6">{page.text || "No embedded text on this page."}</p>
            </section>)}
          </div>
        </>}
      </div>}

      <p className="mt-6 text-xs leading-5 text-muted-foreground">PDF bytes and extracted text remain in this browser. This tool reads embedded PDF text only; it does not OCR scanned documents. Scanned-page OCR lives on <Link href="/tools/ocr" className="underline">Image OCR</Link>.</p>
    </section>
  );
}
