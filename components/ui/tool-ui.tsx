"use client";
import * as React from "react";

export function UploadZone({
  onFiles,
  accept,
  multiple,
  maxFiles,
}: {
  onFiles: (files: File[]) => void;
  accept: string;
  multiple?: boolean;
  maxFiles: number;
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
      className={`rounded-xl border-2 border-dashed p-10 text-center transition-colors focus-visible:ring-2 ring-accent cursor-pointer ${
        dragOver ? "border-accent bg-muted" : "border-border bg-surface hover:bg-elevated"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        onClick={(e) => e.stopPropagation()}
        aria-hidden
        tabIndex={-1}
      />
      <div className="mx-auto max-w-md space-y-3">
        <p className="text-sm font-medium">Drop files here or click to browse</p>
        <p className="text-xs text-muted-foreground">
          Max {maxFiles} files, 50 MB each. HEIC and SVG not supported in MVP.
        </p>
        <p className="text-xs text-muted-foreground">Your files stay on your device — no upload.</p>
      </div>
    </div>
  );
}

export function FileRow({ name, size, onRemove }: { name: string; size: number; onRemove?: () => void }) {
  return (
    <li className="flex items-center justify-between rounded-md border bg-elevated px-3 py-2 text-sm">
      <span className="truncate pr-3">{name}</span>
      <span className="shrink-0 text-xs text-muted-foreground">{(size / 1024).toFixed(1)} KB</span>
      {onRemove && (
        <button onClick={onRemove} className="ml-3 text-xs underline hover:no-underline" aria-label={`Remove ${name}`}>
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
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-accent transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">{Math.round(value)}%</p>
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
