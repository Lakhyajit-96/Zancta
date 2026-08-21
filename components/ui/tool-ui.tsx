"use client";
import * as React from "react";
import { CornerTicks } from "@/components/marketing/motion";

export function UploadZone({
  onFiles,
  accept,
  multiple,
  maxFiles,
  maxFileSize = 50 * 1024 * 1024,
}: {
  onFiles: (files: File[]) => void;
  accept: string;
  multiple?: boolean;
  maxFiles: number;
  maxFileSize?: number;
}) {
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    onFiles(Array.from(files));
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Select files"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`aperture relative overflow-hidden rounded-lg border border-dashed p-10 text-center transition-colors focus-visible:ring-2 ring-accent cursor-pointer md:p-14 ${
        dragOver ? "aperture-open border-accent bg-accent/10" : "border-border-strong bg-surface hover:border-accent/50 hover:bg-elevated"
      }`}
    >
      <CornerTicks />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 perspective-floor opacity-40" />
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          // Reset so re-selecting the SAME file fires change again (e.g. after
          // "Process another" cleared the list).
          e.target.value = "";
        }}
        onClick={(e) => e.stopPropagation()}
        aria-hidden
        tabIndex={-1}
      />
      <div className="relative mx-auto max-w-md space-y-3">
        <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-lg border border-border-strong bg-elevated text-platinum" aria-hidden>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
        <p className="text-base font-semibold tracking-tight">Drop files here or click to browse</p>
        <p className="text-xs text-muted-foreground">
          Max {maxFiles} files, {Math.round(maxFileSize / 1024 / 1024)} MB each. HEIC and SVG are not supported.
        </p>
        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-success" />
          Your files stay on your device — no upload.
        </p>
      </div>
    </div>
  );
}

export function FileRow({ name, size, onRemove }: { name: string; size: number; onRemove?: () => void }) {
  return (
    <li className="flex items-center justify-between rounded-md border border-border bg-elevated px-3.5 py-3 text-sm transition-colors hover:border-border-strong">
      <span className="truncate pr-3">{name}</span>
      <span className="shrink-0 font-mono text-xs text-muted-foreground">{(size / 1024).toFixed(1)} KB</span>
      {onRemove && (
        <button onClick={onRemove} className="ml-3 text-xs text-muted-foreground underline underline-offset-4 hover:text-error" aria-label={`Remove ${name}`}>
          Remove
        </button>
      )}
    </li>
  );
}

export function Progress({ value, label }: { value: number; label?: string }) {
  return (
    <div className="space-y-2" aria-live="polite">
      {label && <p className="text-sm">{label}</p>}
      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      <p className="font-mono text-xs text-muted-foreground">{Math.round(value)}%</p>
    </div>
  );
}

export function PrivacyIndicator() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
      <span aria-hidden className="h-2 w-2 rounded-full bg-success" />
      Processed locally — no upload
    </span>
  );
}
