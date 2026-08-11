"use client";
import * as React from "react";
import Link from "next/link";
import { validateFiles } from "@/lib/file-safety";
import { UploadZone, Progress, PrivacyIndicator } from "@/components/ui/tool-ui";
import { downloadBlob } from "@/lib/download";
import type { ToolMeta } from "@/lib/tools";
type Status = "idle" | "validating" | "loading" | "processing" | "completed" | "failed" | "aborted";

export function ToolShell({ tool }: { tool: ToolMeta }) {
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

  const handleFiles = (incoming: File[]) => {
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
      workerRef.current?.terminate();
    };
  }, [cleanup]);

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
      // Background removal is DEFERRED per Phase 6C — honest, no fake progress
      setStatus("failed");
      setErrors([
        "Background removal is deferred — no commercially verified model is integrated. See docs/PHASE6C_REPORT.md for verification details.",
      ]);
      return;
    }

    const timeout = setTimeout(() => {
      workerRef.current?.terminate();
      setErrors(["Processing timed out (30s) — try fewer or smaller files."]);
      setStatus("failed");
    }, 30_000);

    // Create worker - try with fallback to main thread if worker fails
    try {
      workerRef.current?.terminate();
      try {
        if (isPdfOp) {
          workerRef.current = new Worker(new URL("../../workers/pdf.worker.ts", import.meta.url));
        } else {
          workerRef.current = new Worker(new URL("../../workers/image.worker.ts", import.meta.url));
        }
      } catch (e) {
        console.error("Worker creation failed, falling back to main thread", e);
        // Fallback: run directly on main thread (still local, no upload) for verification
        // Import engine dynamically and run without worker
        const { mergePdfs: _merge, splitPdf: _split, compressPdf: _compress, imagesToPdf: _img2pdf, pdfToImages: _pdf2img } = await import("@/lib/pdf-engine");
        const { compressImage: _cImg, convertImage: _convImg, resizeImage: _resImg, exifClean: _exif } = await import("@/lib/image-engine");
        setStatus("processing");
        setProgress(50);
        try {
          let blobs: { name: string; blob: Blob }[] = [];
          let meta: { originalSize?: number; outputSize?: number } | undefined;
          if (op === "MERGE") {
            const b = await _merge(files, (p)=> setProgress(p));
            blobs = [{ name: "merged.pdf", blob: b }];
          } else if (op === "SPLIT") {
            blobs = (await _split(files[0], range, (p)=> setProgress(p))).map((b,i)=>({name:`split-${i+1}.pdf`, blob:b}));
          } else if (op === "COMPRESS") {
            const r = await _compress(files[0]); blobs = [{name:"compressed.pdf", blob:r.blob}]; meta={originalSize:r.original, outputSize:r.output};
          } else if (op === "IMAGES_TO_PDF") {
            const b = await _img2pdf(files, (p)=> setProgress(p)); blobs=[{name:"images-to-pdf.pdf", blob:b}];
          } else if (op === "PDF_TO_IMAGES") {
            const arr = await _pdf2img(files[0], imageFormat, 0.92, (p)=> setProgress(p)); blobs=arr.map((b,i)=>({name:`page-${i+1}.${imageFormat}`, blob:b}));
          } else if (op === "IMAGE_COMPRESS") {
            const arr = await Promise.all(files.map(async (f)=>{ const b=await _cImg(f, imageQuality); return {name: f.name.replace(/\.[^.]+$/, "")+`-compressed.`+ (f.name.split(".").pop()||"jpg"), blob:b}; })); blobs=arr;
          } else if (op === "IMAGE_CONVERT") {
            const arr = await Promise.all(files.map(async (f)=>{ const b=await _convImg(f, convertTarget, 0.92); return {name: f.name.replace(/\.[^.]+$/, "")+`-converted.`+ convertTarget.split("/")[1].replace("jpeg","jpg"), blob:b}; })); blobs=arr;
          } else if (op === "IMAGE_RESIZE") {
            const arr = await Promise.all(files.map(async (f)=>{ const b=await _resImg(f, resizeWidth, resizeHeight, convertTarget, 0.92); return {name: f.name.replace(/\.[^.]+$/, "")+`-resized.`+ convertTarget.split("/")[1].replace("jpeg","jpg"), blob:b}; })); blobs=arr;
          } else if (op === "EXIF_CLEAN") {
            const arr = await Promise.all(files.map(async (f)=>{ const b=await _exif(f); return {name: f.name.replace(/\.[^.]+$/, "")+`-clean.`+ (f.name.split(".").pop()||"jpg"), blob:b}; })); blobs=arr;
          }
          const withUrls = blobs.map((b)=>({name:b.name, blob:b.blob, url: URL.createObjectURL(b.blob)}));
          setResults(withUrls); if(meta) setMeta(meta); setProgress(100); setStatus("completed");
          clearTimeout(timeout);
          return;
        } catch (err) {
          setErrors([(err as Error).message]); setStatus("failed"); clearTimeout(timeout); return;
        }
      }
    } catch {
      setErrors(["Browser does not support Workers — try a modern browser."]);
      setStatus("failed");
      return;
    }

    const worker = workerRef.current!;
    let completed = false;
    // Fallback to main thread if worker doesn't respond in 3s (Turbopack worker bundling may fail in some builds)
    const fallback = setTimeout(async () => {
      if (completed) return;
      try {
        const { mergePdfs: _merge, splitPdf: _split, compressPdf: _compress, imagesToPdf: _img2pdf, pdfToImages: _pdf2img } = await import("@/lib/pdf-engine");
        const { compressImage: _cImg, convertImage: _convImg, resizeImage: _resImg, exifClean: _exif } = await import("@/lib/image-engine");
        let blobs: { name: string; blob: Blob }[] = [];
        let meta: { originalSize?: number; outputSize?: number } | undefined;
        if (op === "MERGE") {
          const b = await _merge(files, (pr)=> setProgress(pr));
          blobs = [{ name: "merged.pdf", blob: b }];
        } else if (op === "SPLIT") {
          blobs = (await _split(files[0], range, (pr)=> setProgress(pr))).map((b,i)=>({name:`split-${i+1}.pdf`, blob:b}));
        } else if (op === "COMPRESS") {
          const r = await _compress(files[0]); blobs = [{name:"compressed.pdf", blob:r.blob}]; meta={originalSize:r.original, outputSize:r.output};
        } else if (op === "IMAGES_TO_PDF") {
          const b = await _img2pdf(files, (pr)=> setProgress(pr)); blobs=[{name:"images-to-pdf.pdf", blob:b}];
        } else if (op === "PDF_TO_IMAGES") {
          const arr = await _pdf2img(files[0], imageFormat, 0.92, (pr)=> setProgress(pr)); blobs=arr.map((b,i)=>({name:`page-${i+1}.${imageFormat}`, blob:b}));
        } else if (op === "IMAGE_COMPRESS") {
          const arr = await Promise.all(files.map(async (f)=>{ const b=await _cImg(f, imageQuality); return {name: f.name.replace(/\.[^.]+$/, "")+`-compressed.`+ (f.name.split(".").pop()||"jpg"), blob:b}; })); blobs=arr;
        } else if (op === "IMAGE_CONVERT") {
          const arr = await Promise.all(files.map(async (f)=>{ const b=await _convImg(f, convertTarget, 0.92); return {name: f.name.replace(/\.[^.]+$/, "")+`-converted.`+ convertTarget.split("/")[1].replace("jpeg","jpg"), blob:b}; })); blobs=arr;
        } else if (op === "IMAGE_RESIZE") {
          const arr = await Promise.all(files.map(async (f)=>{ const b=await _resImg(f, resizeWidth, resizeHeight, convertTarget, 0.92); return {name: f.name.replace(/\.[^.]+$/, "")+`-resized.`+ convertTarget.split("/")[1].replace("jpeg","jpg"), blob:b}; })); blobs=arr;
        } else if (op === "EXIF_CLEAN") {
          const arr = await Promise.all(files.map(async (f)=>{ const b=await _exif(f); return {name: f.name.replace(/\.[^.]+$/, "")+`-clean.`+ (f.name.split(".").pop()||"jpg"), blob:b}; })); blobs=arr;
        }
        try { worker.terminate(); } catch {}
        workerRef.current = null;
        clearTimeout(timeout);
        clearTimeout(fallback);
        const withUrls = blobs.map((b)=>({name:b.name, blob:b.blob, url: URL.createObjectURL(b.blob)}));
        setResults(withUrls); if(meta) setMeta(meta); setProgress(100); setStatus("completed"); completed = true;
      } catch (err) {
        setErrors([(err as Error).message]); setStatus("failed"); clearTimeout(timeout);
      }
    }, 3000);

    worker.onmessage = (e: MessageEvent<unknown>) => {
      const msg = e.data as { id: string; status: string; progress?: number; detail?: string; blobs?: { name: string; blob: Blob }[]; meta?: { originalSize?: number; outputSize?: number }; message?: string; hint?: string; errorCode?: string };
      if (msg.id !== id) return;
      if (msg.status === "validating" || msg.status === "loading" || msg.status === "processing") {
        setStatus(msg.status as Status);
        if (typeof msg.progress === "number") setProgress(msg.progress);
        if (msg.detail) setDetail(msg.detail);
      } else if (msg.status === "completed") {
        clearTimeout(timeout);
        setProgress(100);
        setStatus("completed");
        if (msg.blobs) {
          const withUrls = msg.blobs.map((b) => ({ name: b.name, blob: b.blob, url: URL.createObjectURL(b.blob) }));
          setResults(withUrls);
        }
        if (msg.meta) setMeta(msg.meta);
        completed = true;
        clearTimeout(fallback);
        worker.terminate();
        workerRef.current = null;
        // Analytics (privacy-safe, coarse bucket)
        try {
          const total = files.reduce((a, f) => a + f.size, 0);
          const bucket = total < 1024 * 1024 ? "<1MB" : total < 5 * 1024 * 1024 ? "1-5MB" : total < 20 * 1024 * 1024 ? "5-20MB" : "20MB+";
          (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag?.("event", "processing_completed", { tool: tool.slug, bucket });
        } catch {}
      } else if (msg.status === "failed" || msg.status === "aborted") {
        clearTimeout(timeout);
        completed = true;
        clearTimeout(fallback);
        setStatus(msg.status as Status);
        setErrors([msg.message || "Processing failed", msg.hint || ""].filter(Boolean));
        worker.terminate();
        workerRef.current = null;
      }
    };
    worker.onerror = () => {
      clearTimeout(timeout);
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
        maxWidth: 1920,
      },
    });
  };

  const cancel = () => {
    if (workerRef.current && idRef.current) {
      workerRef.current.postMessage({ id: idRef.current, op: "CANCEL" });
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setStatus("aborted");
    setErrors(["Cancelled."]);
  };

  const again = () => {
    cleanup();
    setFiles([]);
    setResults([]);
    setMeta(null);
    setStatus("idle");
    setProgress(0);
    setErrors([]);
  };

  return (
    <div className="rounded-xl border bg-surface p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PrivacyIndicator />
        <span className="text-xs text-muted-foreground">Your files are processed locally in your browser. Your file bytes are not uploaded for processing.</span>
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
            className="w-full rounded-md border bg-elevated px-3 py-2 text-sm"
            aria-describedby="range-hint"
          />
          <p id="range-hint" className="text-xs text-muted-foreground">Examples: 1 · 1-3 · 2,5,8 · 1-3,7,10-12 — we validate against the document&apos;s page count.</p>
        </div>
      )}

      {tool.slug === "pdf-to-images" && (
        <div className="flex gap-3">
          <label className="text-sm font-medium flex items-center gap-2">
            Format
            <select value={imageFormat} onChange={(e) => setImageFormat(e.target.value as typeof imageFormat)} className="rounded-md border bg-elevated px-2 py-1 text-sm">
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
            <select value={convertTarget} onChange={(e)=> setConvertTarget(e.target.value as typeof convertTarget)} className="rounded-md border bg-elevated px-2 py-1 text-sm">
              <option value="image/jpeg">JPG</option>
              <option value="image/png">PNG</option>
              <option value="image/webp">WebP</option>
            </select>
          </label>
        </div>
      )}

      {tool.slug === "image-resize" && (
        <div className="flex flex-wrap gap-4 items-center">
          <label className="text-sm flex items-center gap-2">W <input type="number" value={resizeWidth} onChange={(e)=> setResizeWidth(Math.max(1, parseInt(e.target.value)||1))} className="w-20 rounded-md border bg-elevated px-2 py-1 text-sm" min={1} max={12000} aria-label="Width" /></label>
          <label className="text-sm flex items-center gap-2">H <input type="number" value={resizeHeight} onChange={(e)=> setResizeHeight(Math.max(1, parseInt(e.target.value)||1))} className="w-20 rounded-md border bg-elevated px-2 py-1 text-sm" min={1} max={12000} aria-label="Height" /></label>
          <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={keepAspect} onChange={(e)=> setKeepAspect(e.target.checked)} aria-label="Keep aspect" /> Keep aspect</label>
        </div>
      )}

      <UploadZone onFiles={handleFiles} accept={tool.acceptMime.join(",")} multiple={tool.maxFiles > 1} maxFiles={tool.maxFiles} />

      {files.length > 0 && (
        <ul className="space-y-2" aria-live="polite">
          {files.map((f, i) => (
            <li key={i} className="flex justify-between rounded-md border bg-elevated px-3 py-2 text-sm">
              <span className="truncate pr-3">{`file_${i + 1}.${f.name.split(".").pop()}`}</span>
              <span className="text-xs text-muted-foreground shrink-0">{(f.size / 1024).toFixed(1)} KB</span>
              <button onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))} className="ml-3 text-xs underline">Remove</button>
            </li>
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
        <button onClick={start} className="h-10 px-5 rounded-md bg-accent text-accent-foreground font-medium w-full md:w-auto">
          Process locally
        </button>
      )}

      {(status === "validating" || status === "loading" || status === "processing") && (
        <div className="space-y-3">
          <Progress value={progress} label={detail || (status === "validating" ? "Validating…" : status === "loading" ? "Loading…" : "Processing locally — not uploaded")} />
          <button onClick={cancel} className="h-9 px-4 rounded-md border bg-surface text-sm">Cancel</button>
        </div>
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
                <li key={i} className="flex items-center justify-between rounded-md border bg-elevated px-3 py-2">
                  <span className="text-sm truncate pr-3">{r.name} — {(r.blob.size / 1024).toFixed(1)} KB</span>
                  <button
                    onClick={() => downloadBlob(r.blob, r.name)}
                    className="h-8 px-3 rounded-md bg-accent text-accent-foreground text-xs font-medium shrink-0"
                  >
                    Download
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No file output — this tool&apos;s image engine ships in Phase 5.</p>
          )}
          <div className="flex gap-2">
            <button onClick={again} className="h-9 px-4 rounded-md border bg-surface text-sm">Process another</button>
            <Link href="/tools" className="h-9 px-4 inline-flex items-center rounded-md border bg-surface text-sm">Related tools</Link>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Max {Math.round(tool.maxFileSize / 1024 / 1024)}MB/file, {tool.maxFiles} files, total 100MB. HEIC/SVG not supported. Password-protected PDFs aren&apos;t currently supported.
        {tool.slug === "pdf-compress" && " Compression uses object-stream cleanup — image recompression where possible; honest size is reported, not guaranteed to shrink every PDF."}
      </p>
    </div>
  );
}
