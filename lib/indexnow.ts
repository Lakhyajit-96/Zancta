import { PUBLIC_SITE_URL } from "@/lib/seo";

export const INDEXNOW_KEY = "7c8f2e1a0b4d4f6a9c1e3b5d7f9a2c4e";

export function indexNowKeyLocation(): string {
  return `${PUBLIC_SITE_URL}/${INDEXNOW_KEY}.txt`;
}

export function buildIndexNowPayload(urls: string[]) {
  const host = new URL(PUBLIC_SITE_URL).host;
  const urlList = [...new Set(urls)].filter((u) => {
    try {
      return new URL(u).host === host;
    } catch {
      return false;
    }
  });
  return {
    host,
    key: INDEXNOW_KEY,
    keyLocation: indexNowKeyLocation(),
    urlList,
  };
}

export async function notifyIndexNow(urls: string[]): Promise<{ ok: boolean; status: number }> {
  const payload = buildIndexNowPayload(urls);
  if (payload.urlList.length === 0) return { ok: true, status: 0 };
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok || res.status === 202, status: res.status };
}
