"use client";
import * as React from "react";
import Link from "next/link";
import { displayBasename, formatFileSize, sizeReduction } from "@/lib/display-filename";

export function PrivacyEvidence() {
  return (
    <p className="max-w-xl text-xs leading-5 text-muted-foreground">
      Processed in this tab. File bytes are not uploaded.{" "}
      <Link href="/guides/local-processing" className="underline underline-offset-4 hover:text-foreground">
        How local processing works
      </Link>
    </p>
  );
}

function DropZoneTicks() {
  const offset = "10px";
  return (
    <>
      <span aria-hidden className="corner-tick border-t border-l" style={{ top: offset, left: offset }} />
      <span aria-hidden className="corner-tick border-t border-r" style={{ top: offset, right: offset }} />
      <span aria-hidden className="corner-tick border-b border-l" style={{ bottom: offset, left: offset }} />
      <span aria-hidden className="corner-tick border-b border-r" style={{ bottom: offset, right: offset }} />
    </>
  );
}

export function UploadZone({
  onFiles,
  accept,
  multiple,
  maxFiles,
  maxFileSize = 50 * 1024 * 1024,
  title = "Drop files here or click to browse",
  hint,
  disabled,
}: {
  onFiles: (files: File[]) => void;
  accept: string;
  multiple?: boolean;
  maxFiles: number;
  maxFileSize?: number;
  title?: string;
  hint?: React.ReactNode;
  disabled?: boolean;
}) {
  const [dragOver, setDragOver] = React.useState(false);
  const inputId = React.useId();
  const hintId = `${inputId}-hint`;
  const isImageAccept = accept.includes("image/");
  const maxMb = Math.round(maxFileSize / 1024 / 1024);

  const handleFiles = (files: FileList | null) => {
    if (disabled || !files) return;
    onFiles(Array.from(files));
  };

  return (
    <div
      className={`aperture relative overflow-hidden rounded-lg border border-dashed p-10 text-center transition-colors md:p-12 ${
        dragOver && !disabled ? "aperture-open border-accent bg-accent/10" : "border-border-strong bg-surface"
      } ${disabled ? "opacity-60" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <DropZoneTicks />
      <label
        htmlFor={inputId}
        className="relative mx-auto block max-w-md cursor-pointer space-y-3 rounded-md focus-within:ring-2 focus-within:ring-accent"
      >
        <input
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          aria-label="Select files"
          aria-describedby={hintId}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <div className="relative pointer-events-none">
          <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-lg border border-border-strong bg-elevated text-platinum" aria-hidden>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <p className="text-base font-semibold tracking-tight">{title}</p>
          <p id={hintId} className="mt-3 text-xs leading-5 text-muted-foreground">
            {hint ?? (
              <>
                Max {maxFiles} files, {maxMb} MB each.
                {isImageAccept ? " JPG, PNG, and WebP. HEIC and SVG are not supported." : ""}
              </>
            )}
          </p>
        </div>
      </label>
    </div>
  );
}

export function FileRow({ name, size, onRemove }: { name: string; size: number; onRemove?: () => void }) {
  const { full, display } = displayBasename(name);
  return (
    <li className="flex items-center justify-between gap-3 rounded-md border border-border bg-elevated px-3.5 py-3 text-sm">
      <span className="min-w-0 truncate font-medium" title={full}>
        {display}
      </span>
      <span className="shrink-0 font-mono text-xs text-muted-foreground">{formatFileSize(size)}</span>
      {onRemove && (
        <button type="button" onClick={onRemove} className="shrink-0 text-xs text-muted-foreground underline underline-offset-4 hover:text-error" aria-label={`Remove ${full}`}>
          Remove
        </button>
      )}
    </li>
  );
}

export function Progress({
  value,
  label,
  indeterminate,
}: {
  value?: number;
  label?: string;
  indeterminate?: boolean;
}) {
  const known = !indeterminate && typeof value === "number" && Number.isFinite(value);
  return (
    <div className="space-y-2" aria-live="polite">
      {label && <p className="text-sm">{label}</p>}
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        {known ? (
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
        ) : (
          <div className="h-full w-1/3 rounded-full bg-accent motion-safe:animate-pulse" />
        )}
      </div>
      {known && <p className="font-mono text-xs text-muted-foreground">{Math.round(value)}%</p>}
    </div>
  );
}

export function ResultCard({
  originalName,
  results,
  meta,
  onDownload,
  onAgain,
  next,
  guide,
  extra,
}: {
  originalName?: string;
  results: { name: string; blob: Blob }[];
  meta?: { originalSize?: number; outputSize?: number } | null;
  onDownload: (blob: Blob, name: string) => void;
  onAgain: () => void;
  next?: { prompt: string; href: string; label: string };
  guide?: { href: string; label: string };
  extra?: React.ReactNode;
}) {
  const reduction = sizeReduction(meta?.originalSize, meta?.outputSize);
  const original = originalName ? displayBasename(originalName) : null;
  return (
    <div className="rounded-lg border border-success/30 bg-success/10 p-5 space-y-4">
      <p className="eyebrow text-success">Result ready</p>
      <p className="text-sm font-medium text-success">Completed — processed locally</p>
      {original && (
        <p className="text-xs text-muted-foreground">
          From <span className="text-foreground" title={original.full}>{original.display}</span>
        </p>
      )}
      {meta?.originalSize !== undefined && meta?.outputSize !== undefined && (
        <p className="text-sm text-muted-foreground">
          {formatFileSize(meta.originalSize)} → {formatFileSize(meta.outputSize)}
          {reduction ? ` · ${reduction}` : meta.outputSize > meta.originalSize ? " · not smaller (already optimized)" : ""}
        </p>
      )}
      {results.length > 0 ? (
        <ul className="space-y-2">
          {results.map((r, i) => {
            const shown = displayBasename(r.name);
            return (
              <li key={`${r.name}-${i}`} className="flex items-center justify-between gap-3 rounded-md border border-border bg-elevated px-3.5 py-2.5">
                <span className="min-w-0 truncate text-sm" title={shown.full}>
                  {shown.display} — {formatFileSize(r.blob.size)}
                </span>
                <button
                  type="button"
                  onClick={() => onDownload(r.blob, r.name)}
                  className="premium-button premium-button-primary min-h-8 shrink-0 px-3 text-xs"
                >
                  Download
                </button>
              </li>
            );
          })}
        </ul>
      ) : extra ? null : (
        <p className="text-sm text-muted-foreground">No file output was generated for this operation.</p>
      )}
      {extra}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onAgain} className="premium-button premium-button-secondary min-h-9 px-4 text-xs">
          Process another
        </button>
        <Link href="/tools" className="premium-button premium-button-secondary min-h-9 px-4 text-xs">
          Related tools
        </Link>
      </div>
      {next && (
        <p className="text-sm text-muted-foreground">
          {next.prompt}{" "}
          <Link href={next.href} className="underline underline-offset-4">
            {next.label}
          </Link>
        </p>
      )}
      {guide && (
        <p className="text-sm text-muted-foreground">
          Want the longer explanation?{" "}
          <Link href={guide.href} className="underline underline-offset-4">
            {guide.label}
          </Link>
        </p>
      )}
    </div>
  );
}
