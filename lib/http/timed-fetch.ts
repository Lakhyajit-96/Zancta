/**
 * Bounded fetch for Dodo and IndexNow. Not a global fetch patch.
 * Operator Google/Bing JSON traffic keeps using lib/integrations/http.ts.
 *
 * A timeout means the remote outcome is unknown — not a confirmed rejection
 * and not a confirmed success.
 */
export const PROVIDER_UNAVAILABLE = "provider_unavailable";

export const DODO_READ_TIMEOUT_MS = 10_000;
export const DODO_WRITE_TIMEOUT_MS = 15_000;
export const INDEXNOW_TIMEOUT_MS = 10_000;

export function isProviderUnavailableError(error: unknown): boolean {
  return error instanceof Error && error.message === PROVIDER_UNAVAILABLE;
}

function responseMayHaveBody(status: number): boolean {
  return status !== 204 && status !== 205 && status !== 304;
}

export async function timedFetch(url: string, init: RequestInit = {}, timeoutMs: number): Promise<Response> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error("timedFetch timeoutMs must be a positive number");
  }

  const timeoutController = new AbortController();
  const timer = setTimeout(() => timeoutController.abort(), timeoutMs);
  const callerSignal = init.signal ?? undefined;
  const forwardCallerAbort = () => timeoutController.abort();
  if (callerSignal) {
    if (callerSignal.aborted) timeoutController.abort();
    else callerSignal.addEventListener("abort", forwardCallerAbort, { once: true });
  }

  try {
    const res = await fetch(url, { ...init, signal: timeoutController.signal });
    // Keep the timer armed until the body is fully buffered. fetch() resolves
    // on headers; Dodo callers then res.json(), which would otherwise be untimed.
    const body = await res.arrayBuffer();
    return new Response(responseMayHaveBody(res.status) ? body : null, {
      status: res.status,
      statusText: res.statusText,
      headers: new Headers(res.headers),
    });
  } catch (error) {
    const timedOut = timeoutController.signal.aborted && !callerSignal?.aborted;
    if (timedOut) throw new Error(PROVIDER_UNAVAILABLE);
    throw error;
  } finally {
    clearTimeout(timer);
    callerSignal?.removeEventListener("abort", forwardCallerAbort);
  }
}
