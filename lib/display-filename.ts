/** Client-side display helpers. Never send these strings to analytics or logs. */

export function displayBasename(name: string, max = 48): { full: string; display: string } {
  const full = (name || "file").replace(/[/\\]/g, "").replace(/\s+/g, " ").trim() || "file";
  if (full.length <= max) return { full, display: full };
  const dot = full.lastIndexOf(".");
  const ext = dot > 0 && dot < full.length - 1 ? full.slice(dot) : "";
  const base = ext ? full.slice(0, dot) : full;
  const keep = Math.max(8, max - ext.length - 1);
  return { full, display: `${base.slice(0, keep)}…${ext}` };
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 KB";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function sizeReduction(original?: number, output?: number): string | null {
  if (original == null || output == null || original <= 0 || output >= original) return null;
  return `${Math.round((1 - output / original) * 100)}% smaller`;
}
