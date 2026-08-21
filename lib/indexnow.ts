const ALLOWED_HOST = "zancta.tech";
const PRIVATE_PREFIXES = [
  "/api/",
  "/account",
  "/signin",
  "/signup",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
];
const MAX_URLS = 20;

export function getIndexNowKey(): string | null {
  const key = process.env.INDEXNOW_KEY?.trim();
  if (!key || !/^[a-f0-9]{8,128}$/i.test(key)) return null;
  return key;
}

export function indexNowKeyLocation(): string | null {
  const key = getIndexNowKey();
  if (!key) return null;
  return `https://${ALLOWED_HOST}/${key}.txt`;
}

const INDEXNOW_KEY_FILE_HEADERS = {
  "content-type": "text/plain; charset=utf-8",
  "cache-control": "public, max-age=3600",
  "x-robots-tag": "noindex",
} as const;

/** Serve the public IndexNow ownership file only at /{key}.txt. */
export function indexNowKeyFileResponse(pathname: string): { body: string; headers: Record<string, string> } | null {
  const key = getIndexNowKey();
  if (!key) return null;
  if (pathname !== `/${key}.txt`) return null;
  return { body: key, headers: { ...INDEXNOW_KEY_FILE_HEADERS } };
}

export function isAllowedIndexNowUrl(raw: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  if (parsed.username || parsed.password) return false;
  if (parsed.port) return false;
  if (parsed.hostname !== ALLOWED_HOST) return false;
  const path = parsed.pathname || "/";
  if (PRIVATE_PREFIXES.some((p) => path === p || path.startsWith(p.endsWith("/") ? p : `${p}/`) || path === p)) return false;
  if (path.startsWith("/api")) return false;
  return true;
}

export function sanitizeIndexNowUrls(urls: unknown): string[] {
  if (!Array.isArray(urls)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of urls) {
    if (typeof item !== "string") continue;
    if (!isAllowedIndexNowUrl(item)) continue;
    const canonical = new URL(item);
    canonical.hash = "";
    const href = canonical.toString();
    if (seen.has(href)) continue;
    seen.add(href);
    out.push(href);
    if (out.length >= MAX_URLS) break;
  }
  return out;
}

export function buildIndexNowPayload(urls: string[]) {
  const key = getIndexNowKey();
  if (!key) return null;
  const urlList = sanitizeIndexNowUrls(urls);
  return {
    host: ALLOWED_HOST,
    key,
    keyLocation: `https://${ALLOWED_HOST}/${key}.txt`,
    urlList,
  };
}

export async function notifyIndexNow(urls: string[]): Promise<{ ok: boolean; status: number; accepted: number }> {
  const payload = buildIndexNowPayload(urls);
  if (!payload) return { ok: false, status: 503, accepted: 0 };
  if (payload.urlList.length === 0) return { ok: false, status: 400, accepted: 0 };
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok || res.status === 202, status: res.status, accepted: payload.urlList.length };
}

export function allowedIndexNowHost(): string {
  return ALLOWED_HOST;
}
