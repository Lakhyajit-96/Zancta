import { vi } from "vitest";

function abortError(): Error {
  const err = new Error("The operation was aborted");
  err.name = "AbortError";
  return err;
}

/** fetch() that never settles unless the AbortSignal fires. */
export function hungFetchMock() {
  return vi.fn((_url: string | URL | Request, init?: RequestInit) => {
    return new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal;
      const abort = () => reject(abortError());
      if (signal?.aborted) {
        abort();
        return;
      }
      signal?.addEventListener("abort", abort, { once: true });
    });
  });
}

/**
 * fetch() that returns headers immediately, but whose body never ends unless
 * the request AbortSignal fires. Used to prove timedFetch keeps the timeout
 * armed through body consumption.
 */
export function hungBodyFetchMock() {
  return vi.fn((_url: string | URL | Request, init?: RequestInit) => {
    const signal = init?.signal;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const abort = () => {
          try {
            controller.error(abortError());
          } catch {
            /* already closed */
          }
        };
        if (signal?.aborted) {
          abort();
          return;
        }
        signal?.addEventListener("abort", abort, { once: true });
      },
    });
    return Promise.resolve(
      new Response(stream, {
        status: 200,
        statusText: "OK",
        headers: { "content-type": "application/json" },
      }),
    );
  });
}
