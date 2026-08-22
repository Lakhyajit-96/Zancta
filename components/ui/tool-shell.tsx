"use client";
import * as React from "react";
import Link from "next/link";
import { validateFiles, validateFileMagic, LIMITS } from "@/lib/file-safety";
import { UploadZone, Progress, PrivacyIndicator, FileRow } from "@/components/ui/tool-ui";
import { downloadBlob } from "@/lib/download";
import { OcrTool } from "@/components/ui/ocr-tool";
import { PdfTextExtractor } from "@/components/ui/pdf-text-extractor";
import type { ToolMeta } from "@/lib/tools";
type Status = "idle" | "validating" | "loading" | "processing" | "completed" | "failed" | "aborted";

function GenericToolShell({ tool }: { tool: ToolMeta }) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [status, setStatus] = React.useState<Status>("idle");
  const [progress, setProgress] = React.useState(0);
  const [detail, setDetail] = React.useState<string | undefined>(undefined);
  const [results, setResults] = React.useState<{ name: string; blob: Blob; url: string }[]>([]);
  const [meta, setMeta] = React.useState<{ originalSize?: number; outputSize?: number } | null>(null);
  const [range, setRange] = React.useState("1");
  const [imageFormat, setImageFormat] = React.useState<"png" | "jpeg" | "webp">("png");
  const [imageQuality, setImageQuality] = React.useState(0.8);
  const [convertTarget, setConvertTarget] = React.useState<"image/jpeg" | "image/png" | "image/webp">("image/webp");
  const [resizeWidth, setResizeWidth] = React.useState<number>(800);
  const [resizeHeight, setResizeHeight] = React.useState<number>(600);
  const [keepAspect, setKeepAspect] = React.useState(true);
  const workerRef = React.useRef<Worker | null>(null);
  const idRef = React.useRef<string>("");
  const cancelledRef = React.useRef(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearJobTimeout = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleFiles = async (incoming: File[]) => {
    const result = validateFiles(incoming, {
      acceptMime: tool.acceptMime,
      acceptExts: tool.supportedFormats,
      maxFileSize: tool.maxFileSize,
      maxFiles: tool.maxFiles,
    });
    if (!result.ok) {
      setErrors(result.errors.map((e) => `${e.message}${e.hint ? ` — ${e.hint}` : ""}`));
      setStatus("failed");
      return;
    }
    const magic = await validateFileMagic(incoming);
    if (!magic.ok) {
      setErrors(magic.errors.map((e) => `${e.message}${e.hint ? ` — ${e.hint}` : ""}`));
      setStatus("failed");
      return;
    }
    setErrors([]);
    setFiles(incoming);
    setStatus("idle");
    setResults([]);
    setMeta(null);
  };

  const cleanup = React.useCallback(() => {
    results.forEach((r) => URL.revokeObjectURL(r.url));
  }, [results]);

  React.useEffect(() => {
    return () => {
      cleanup();
      clearJobTimeout();
      workerRef.current?.terminate();
    };
  }, [cleanup, clearJobTimeout]);

  const startJobTimeout = () => {
    clearJobTimeout();
    timeoutRef.current = setTimeout(() => {
      cancelledRef.current = true;
      workerRef.current?.terminate();
      workerRef.current = null;
      setErrors(["Processing timed out — try fewer or smaller files."]);
      setStatus("failed");
    }, tool.processingType === "pdf" ? LIMITS.BATCH_TIMEOUT_MS : LIMITS.WORKER_TIMEOUT_MS);
  };

  const start = async () => {
    if (files.length === 0) return;
    cleanup();
    setResults([]);
    setMeta(null);
    setErrors([]);
    setStatus("validating");
    setProgress(5);
    setDetail(undefined);

    // Split range pre-validate (client)
    if (tool.slug === "pdf-split") {
      // We'll let worker validate against actual page count, but quick syntax check
      if (!range.trim()) {
        setErrors(["Enter a page range like 1, 1-3, 2,5,8"]);
        setStatus("failed");
        return;
      }
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    idRef.current = id;
    cancelledRef.current = false;

    // Map tool slug to op
    const opMap: Record<string, string> = {
      "pdf-merge": "MERGE",
      "pdf-split": "SPLIT",
      "pdf-compress": "COMPRESS",
      "pdf-to-images": "PDF_TO_IMAGES",
      "images-to-pdf": "IMAGES_TO_PDF",
      "image-compress": "IMAGE_COMPRESS",
      "image-convert": "IMAGE_CONVERT",
      "image-resize": "IMAGE_RESIZE",
      "background-remover": "BG_REMOVE",
      "exif-cleaner": "EXIF_CLEAN",
    };
    const op = opMap[tool.slug];

    const isPdfOp = ["MERGE", "SPLIT", "COMPRESS", "PDF_TO_IMAGES", "IMAGES_TO_PDF"].includes(op);
    const isImageOp = ["IMAGE_COMPRESS", "IMAGE_CONVERT", "IMAGE_RESIZE", "EXIF_CLEAN"].includes(op);
    if (!isPdfOp && !isImageOp) {
      setStatus("failed");
      setErrors([
        "Background removal is not available. No local model or cloud fallback is used.",
      ]);
      return;
    }

    startJobTimeout();

    void import("@/lib/analytics/tracker").then(({ trackEvent }) => {
      trackEvent("processing_started", { tool: tool.slug });
    }).catch(() => {});

    // Create worker - try with fallback to main thread if worker fails
    try {
      workerRef.current?.terminate();
      try {
        // Next 16's production worker runtime currently does not deliver the
        // first message reliably in the deployed build. Keep processing local
        // and correct through the existing main-thread fallback until that
        // bundling path can be isolated without risking a stuck UI.
        throw new Error("Local worker runtime unavailable");
      } catch (e) {
        console.info("Local worker unavailable; using local main-thread fallback", e instanceof Error ? e.message : String(e));
        // Fallback: run directly on main thread (still local, no upload) for verification
        // Import engine dynamically and run without worker
        const { mergePdfs: _merge, splitPdf: _split, compressPdf: _compress, imagesToPdf: _img2pdf, pdfToImages: _pdf2img } = await import("@/lib/pdf-engine");
        const { compressImage: _cImg, convertImage: _convImg, resizeImage: _resImg, exifClean: _exif } = await import("@/lib/image-engine");
        setStatus("processing");
        setProgress(50);
        try {
          let blobs: { name: string; blob: Blob }[] = [];
          let meta: { originalSize?: number; outputSize?: number } | undefined;
          const cancelled = () => cancelledRef.current || idRef.current !== id;
          if (op === "MERGE") {
            const b = await _merge(files, (p)=> setProgress(p), cancelled);
            blobs = [{ name: "merged.pdf", blob: b }];
          } else if (op === "SPLIT") {
            blobs = (await _split(files[0], range, (p)=> setProgress(p), cancelled)).map((b,i)=>({name:`split-${i+1}.pdf`, blob:b}));
          } else if (op === "COMPRESS") {
            const r = await _compress(files[0], cancelled); blobs = [{name:"compressed.pdf", blob:r.blob}]; meta={originalSize:r.original, outputSize:r.output};
          } else if (op === "IMAGES_TO_PDF") {
            const b = await _img2pdf(files, (p)=> setProgress(p), cancelled); blobs=[{name:"images-to-pdf.pdf", blob:b}];
          } else if (op === "PDF_TO_IMAGES") {
            const arr = await _pdf2img(files[0], imageFormat, 0.92, (p)=> setProgress(p), cancelled); blobs=arr.map((b,i)=>({name:`page-${i+1}.${imageFormat}`, blob:b}));
          } else if (op === "IMAGE_COMPRESS") {
            const arr = await Promise.all(files.map(async (f)=>{ const b=await _cImg(f, imageQuality); return {name: f.name.replace(/\.[^.]+$/, "")+`-compressed.`+ (f.name.split(".").pop()||"jpg"), blob:b}; })); blobs=arr;
          } else if (op === "IMAGE_CONVERT") {
            const arr = await Promise.all(files.map(async (f)=>{ const b=await _convImg(f, convertTarget, 0.92); return {name: f.name.replace(/\.[^.]+$/, "")+`-converted.`+ convertTarget.split("/")[1].replace("jpeg","jpg"), blob:b}; })); blobs=arr;
          } else if (op === "IMAGE_RESIZE") {
            const { aspectHeight } = await import("@/lib/image-engine");
            const arr = await Promise.all(files.map(async (f)=>{
              const w = resizeWidth;
              let h = resizeHeight;
              if (keepAspect) {
                const bmp = await createImageBitmap(f);
                h = aspectHeight(bmp.width, bmp.height, w);
                bmp.close();
              }
              const mime = f.type === "image/jpeg" || f.type === "image/webp" || f.type === "image/png" ? f.type : "image/png";
              const b = await _resImg(f, w, h, mime, 0.92);
              const ext = mime === "image/jpeg" ? "jpg" : mime === "image/webp" ? "webp" : "png";
              return {name: f.name.replace(/\.[^.]+$/, "")+`-resized.`+ ext, blob:b};
            })); blobs=arr;
          } else if (op === "EXIF_CLEAN") {
            const arr = await Promise.all(files.map(async (f)=>{ const b=await _exif(f); return {name: f.name.replace(/\.[^.]+$/, "")+`-clean.`+ (f.name.split(".").pop()||"jpg"), blob:b}; })); blobs=arr;
          }
          // Yield briefly before publishing a batch result so a user pressing
          // Cancel has a deterministic chance to invalidate the work.
          if (files.length > 1) await new Promise((resolve) => setTimeout(resolve, 100));
          if (cancelledRef.current || idRef.current !== id) {
            clearJobTimeout();
            return;
          }
          const withUrls = blobs.map((b)=>({name:b.name, blob:b.blob, url: URL.createObjectURL(b.blob)}));
          setResults(withUrls); if(meta) setMeta(meta); setProgress(100); setStatus("completed");
          clearJobTimeout();
          void import("@/lib/analytics/tracker").then(({ trackEvent }) => {
            trackEvent("processing_completed", { tool: tool.slug });
            trackEvent("tool_used", { tool: tool.slug });
          }).catch(() => {});
        } catch (err) {
          if (cancelledRef.current || idRef.current !== id) { clearJobTimeout(); return; }
          setErrors([(err as Error).message]); setStatus("failed"); clearJobTimeout();
          void import("@/lib/analytics/tracker").then(({ trackEvent }) => {
            trackEvent("processing_failed", { tool: tool.slug, error_category: "processing" });
          }).catch(() => {});
          return;
        }
        return;
      }
    } catch {
      setErrors(["Browser does not support Workers — try a modern browser."]);
      setStatus("failed");
      return;
    }

    const worker = workerRef.current!;
    worker.onmessage = (e: MessageEvent<unknown>) => {
      const msg = e.data as { id: string; status: string; progress?: number; detail?: string; blobs?: { name: string; blob: Blob }[]; meta?: { originalSize?: number; outputSize?: number }; message?: string; hint?: string; errorCode?: string };
      if (msg.id !== id) return;
      if (msg.status === "validating" || msg.status === "loading" || msg.status === "processing") {
        setStatus(msg.status as Status);
        if (typeof msg.progress === "number") setProgress(msg.progress);
        if (msg.detail) setDetail(msg.detail);
      } else if (msg.status === "completed") {
        clearJobTimeout();
        setProgress(100);
        setStatus("completed");
        if (msg.blobs) {
          const withUrls = msg.blobs.map((b) => ({ name: b.name, blob: b.blob, url: URL.createObjectURL(b.blob) }));
          setResults(withUrls);
        }
        if (msg.meta) setMeta(msg.meta);
        worker.terminate();
        workerRef.current = null;
        void import("@/lib/analytics/tracker").then(({ trackEvent }) => {
          trackEvent("processing_completed", { tool: tool.slug });
          trackEvent("tool_used", { tool: tool.slug });
        }).catch(() => {});
      } else if (msg.status === "failed" || msg.status === "aborted") {
        clearJobTimeout();
        setStatus(msg.status as Status);
        setErrors([msg.message || "Processing failed", msg.hint || ""].filter(Boolean));
        worker.terminate();
        workerRef.current = null;
        void import("@/lib/analytics/tracker").then(({ trackEvent }) => {
          trackEvent(msg.status === "aborted" ? "processing_cancelled" : "processing_failed", { tool: tool.slug });
        }).catch(() => {});
      }
    };
    worker.onerror = () => {
      clearJobTimeout();
      setErrors(["Worker crashed — try fewer pages or a different file."]);
      setStatus("failed");
      worker.terminate();
      workerRef.current = null;
    };

    setStatus("loading");
    worker.postMessage({
      id,
      op,
      files,
      options: {
        ranges: range,
        imageFormat,
        quality: isImageOp ? imageQuality : 0.92,
        targetMime: convertTarget,
        width: resizeWidth,
        height: resizeHeight,
        keepAspect,
      },
    });
  };

  const cancel = () => {
    cancelledRef.current = true;
    // Stop the fail-safe timeout FIRST so it can never overwrite the
    // aborted state with a fake "timed out" failure later.
    clearJobTimeout();
    const activeId = idRef.current;
    if (workerRef.current && activeId) {
      workerRef.current.postMessage({ id: activeId, op: "CANCEL" });
      workerRef.current.terminate();
      workerRef.current = null;
    }
    idRef.current = "";
    // A cancellation is not an error: clear stale results/errors so the
    // Process button is immediately available again for the same files.
    setResults([]);
    setMeta(null);
    setErrors([]);
    setProgress(0);
    setStatus("aborted");
  };

  const again = () => {
    clearJobTimeout();
    cleanup();
    setFiles([]);
    setResults([]);
    setMeta(null);
    setStatus("idle");
    setProgress(0);
    setErrors([]);
  };

  const busy = status === "validating" || status === "loading" || status === "processing";

  return (
    <div className={`aperture card-surface relative space-y-6 rounded-lg p-5 shadow-[0_24px_60px_rgba(0,0,0,0.35)] md:p-8 ${busy ? "aperture-active" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
        <PrivacyIndicator />
        <span className="max-w-xl text-right text-xs leading-5 text-muted-foreground">Your files are processed locally in your browser. Your file bytes are not uploaded for processing.</span>
      </div>

      {/* Tool-specific controls */}
      {tool.slug === "pdf-split" && (
        <div className="space-y-2">
          <label htmlFor="range" className="text-sm font-medium">Page ranges</label>
          <input
            id="range"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            placeholder="e.g. 1, 1-3, 2,5,8, 1-3,7,10-12"
            className="field-input"
            aria-describedby="range-hint"
          />
          <p id="range-hint" className="text-xs text-muted-foreground">Examples: 1 · 1-3 · 2,5,8 · 1-3,7,10-12 — we validate against the document&apos;s page count.</p>
        </div>
      )}

      {tool.slug === "pdf-to-images" && (
        <div className="flex gap-3">
          <label className="text-sm font-medium flex items-center gap-2">
            Format
            <select value={imageFormat} onChange={(e) => setImageFormat(e.target.value as typeof imageFormat)} className="field-input w-auto py-1.5">
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
              <option value="webp">WebP</option>
            </select>
          </label>
        </div>
      )}

      {tool.slug === "image-compress" && (
        <div className="flex flex-wrap gap-4 items-center">
          <label className="text-sm font-medium flex items-center gap-2">
            Quality
            <input type="range" min={0.5} max={0.92} step={0.05} value={imageQuality} onChange={(e)=> setImageQuality(parseFloat(e.target.value))} className="w-32" aria-label="Quality" />
            <span className="text-xs text-muted-foreground">{Math.round(imageQuality*100)}%</span>
          </label>
        </div>
      )}

      {tool.slug === "image-convert" && (
        <div className="flex gap-3">
          <label className="text-sm font-medium flex items-center gap-2">
            Target
            <select value={convertTarget} onChange={(e)=> setConvertTarget(e.target.value as typeof convertTarget)} className="field-input w-auto py-1.5">
              <option value="image/jpeg">JPG</option>
              <option value="image/png">PNG</option>
              <option value="image/webp">WebP</option>
            </select>
          </label>
        </div>
      )}

      {tool.slug === "image-resize" && (
        <div className="flex flex-wrap gap-4 items-center">
          <label className="text-sm flex items-center gap-2">W <input type="number" value={resizeWidth} onChange={(e)=> setResizeWidth(Math.max(1, parseInt(e.target.value)||1))} className="field-input w-20 py-1.5" min={1} max={12000} aria-label="Width" /></label>
          <label className="text-sm flex items-center gap-2">H <input type="number" value={resizeHeight} onChange={(e)=> setResizeHeight(Math.max(1, parseInt(e.target.value)||1))} className="field-input w-20 py-1.5" min={1} max={12000} aria-label="Height" /></label>
          <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={keepAspect} onChange={(e)=> setKeepAspect(e.target.checked)} aria-label="Keep aspect" /> Keep aspect</label>
        </div>
      )}

      <UploadZone onFiles={handleFiles} accept={tool.acceptMime.join(",")} multiple={tool.maxFiles > 1} maxFiles={tool.maxFiles} maxFileSize={tool.maxFileSize} />

      {files.length > 0 && (
        <ul className="space-y-2" aria-live="polite">
          {files.map((f, i) => (
            <FileRow
              key={i}
              name={`file_${i + 1}.${f.name.split(".").pop()}`}
              size={f.size}
              onRemove={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
            />
          ))}
        </ul>
      )}

      {errors.length > 0 && (
        <div role="alert" className="rounded-lg border border-error/40 bg-error/10 p-4 space-y-2">
          <p className="text-sm font-medium text-error">We couldn&apos;t process that</p>
          <ul className="text-sm text-muted-foreground list-disc pl-5">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">What to do: check format, size, and count — then re-select. Password-protected PDFs aren&apos;t currently supported.</p>
        </div>
      )}

      {(status === "idle" || status === "failed" || status === "aborted") && files.length > 0 && errors.length === 0 && (
        <button onClick={start} className="premium-button premium-button-primary w-full md:w-auto">
          Process locally
        </button>
      )}

      {(status === "validating" || status === "loading" || status === "processing") && (
        <div className="space-y-3">
          <Progress value={progress} label={detail || (status === "validating" ? "Validating…" : status === "loading" ? "Loading…" : "Processing locally — not uploaded")} />
          <button onClick={cancel} className="premium-button premium-button-secondary min-h-9 px-4 text-xs">Cancel</button>
        </div>
      )}

      {status === "aborted" && (
        <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
          Cancelled — nothing was saved. You can run the same files again right away.
        </p>
      )}

      {status === "completed" && (
        <div className="rounded-lg border border-success/30 bg-success/10 p-4 space-y-3">
          <p className="text-sm font-medium text-success">Completed — processed locally</p>
          {meta?.originalSize !== undefined && meta?.outputSize !== undefined && (
            <p className="text-sm text-muted-foreground">
              Original {(meta.originalSize / 1024).toFixed(1)} KB → {(meta.outputSize / 1024).toFixed(1)} KB
              {meta.outputSize < (meta.originalSize || 0) ? ` — saved ${(((1 - meta.outputSize / (meta.originalSize || 1)) * 100) | 0)}%` : meta.outputSize > (meta.originalSize || 0) ? " — not smaller (already optimized)" : ""}
            </p>
          )}
          {results.length > 0 ? (
            <ul className="space-y-2">
              {results.map((r, i) => (
                <li key={i} className="flex items-center justify-between rounded-md border border-border bg-elevated px-3.5 py-2.5">
                  <span className="text-sm truncate pr-3">{r.name} — {(r.blob.size / 1024).toFixed(1)} KB</span>
                  <button
                    onClick={() => {
                      downloadBlob(r.blob, r.name);
                      void import("@/lib/analytics/tracker").then(({ trackEvent }) => {
                        trackEvent("download_completed", { tool: tool.slug });
                      }).catch(() => {});
                    }}
                    className="premium-button premium-button-primary min-h-8 shrink-0 px-3 text-xs"
                  >
                    Download
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No file output was generated for this operation.</p>
          )}
          <div className="flex gap-2">
            <button onClick={again} className="premium-button premium-button-secondary min-h-9 px-4 text-xs">Process another</button>
            <Link href="/tools" className="premium-button premium-button-secondary min-h-9 px-4 text-xs">Related tools</Link>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Max {Math.round(tool.maxFileSize / 1024 / 1024)}MB/file, {tool.maxFiles} files.
        {tool.acceptMime.some((mime) => mime.startsWith("image/")) ? " HEIC and SVG are not supported." : ""}
        {tool.acceptMime.includes("application/pdf") ? " Password-protected PDFs aren't currently supported." : ""}
        {tool.slug === "pdf-compress" && " Compression rewrites the PDF with object streams. Embedded images are not recompressed; size may stay the same or grow."}
      </p>
    </div>
  );
}

function DeferredToolShell() {
  return <section className="rounded-lg border border-warning/30 bg-warning/10 p-5 md:p-8" aria-labelledby="deferred-tool-title">
    <p id="deferred-tool-title" className="text-sm font-medium text-warning">This tool is currently deferred</p>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Background removal is not available while local model licensing is verified. This page does not accept files, upload images, or create placeholder results.</p>
  </section>;
}

export function ToolShell({ tool }: { tool: ToolMeta }) {
  return tool.slug === "ocr"
    ? <OcrTool />
    : tool.slug === "pdf-text-extractor"
      ? <PdfTextExtractor />
      : tool.slug === "background-remover"
        ? <DeferredToolShell />
        : <GenericToolShell tool={tool} />;
}
