export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

export function safeFilename(base: string, ext: string): string {
  const safe = base.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 80) || "result";
  const e = ext.startsWith(".") ? ext : `.${ext}`;
  return `${safe}${e}`;
}
