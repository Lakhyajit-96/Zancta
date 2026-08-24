import { classifyHttp, fail, ok, type ApiResult } from "./types";

const TIMEOUT_MS = 20_000;

export async function providerFetch(
  url: string,
  init: RequestInit & { accessToken?: string } = {},
): Promise<ApiResult<unknown>> {
  const started = Date.now();
  const headers = new Headers(init.headers);
  if (init.accessToken) headers.set("Authorization", `Bearer ${init.accessToken}`);
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, headers, signal: controller.signal, cache: "no-store" });
    const latencyMs = Date.now() - started;
    const text = await res.text();
    let json: unknown = null;
    if (text) {
      try {
        json = JSON.parse(text) as unknown;
      } catch {
        json = { raw: text.slice(0, 200) };
      }
    }
    if (!res.ok) {
      const state = classifyHttp(res.status);
      return fail(state, safeProviderMessage(res.status, json), {
        httpStatus: res.status,
        providerCode: extractProviderCode(json),
        latencyMs,
      });
    }
    return ok(json, { latencyMs, fetchedAt: new Date().toISOString() });
  } catch (error) {
    const latencyMs = Date.now() - started;
    const aborted = error instanceof Error && error.name === "AbortError";
    return fail("PROVIDER_UNAVAILABLE", aborted ? "Provider request timed out." : "Provider request failed.", {
      latencyMs,
    });
  } finally {
    clearTimeout(timer);
  }
}

function extractProviderCode(json: unknown): string | undefined {
  if (!json || typeof json !== "object") return undefined;
  const obj = json as Record<string, unknown>;
  const err = obj.error;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "status" in err && typeof (err as { status: unknown }).status === "string") {
    return (err as { status: string }).status;
  }
  if (typeof obj.ErrorCode === "number") return String(obj.ErrorCode);
  return undefined;
}

function safeProviderMessage(status: number, json: unknown): string {
  if (status === 401) return "Authorization expired or missing. Reconnect the operator account.";
  if (status === 403) return "The connected account does not have permission for this property.";
  if (status === 404) return "The requested property or URL was not found.";
  if (status === 429) return "The provider rate-limited this request. Try again later.";
  if (status >= 500) return "The provider is unavailable.";
  const code = extractProviderCode(json);
  return code ? `Provider returned ${status} (${code}).` : `Provider returned HTTP ${status}.`;
}
