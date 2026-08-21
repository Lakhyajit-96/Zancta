/**
 * Same-origin path only. Rejects protocol-relative, absolute, and encoded open redirects.
 */
const FALLBACK = "/account";

export function safeInternalPath(raw: string | null | undefined, fallback = FALLBACK): string {
  if (!raw || typeof raw !== "string") return fallback;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//") || trimmed.startsWith("/\\")) return fallback;
  if (trimmed.includes("://") || trimmed.includes("\\")) return fallback;
  if (/[%]2f[%]?2f/i.test(trimmed) || /[%]5c/i.test(trimmed)) return fallback;
  try {
    const resolved = new URL(trimmed, "https://zancta.tech");
    if (resolved.origin !== "https://zancta.tech") return fallback;
    if (!resolved.pathname.startsWith("/")) return fallback;
    return `${resolved.pathname}${resolved.search}`;
  } catch {
    return fallback;
  }
}
