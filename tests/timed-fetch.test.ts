import { afterEach, describe, expect, it, vi } from "vitest";
import {
  INDEXNOW_TIMEOUT_MS,
  PROVIDER_UNAVAILABLE,
  isProviderUnavailableError,
  timedFetch,
} from "@/lib/http/timed-fetch";
import { hungBodyFetchMock, hungFetchMock } from "./hung-fetch";

describe("timedFetch", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("passes an AbortSignal to fetch", async () => {
    const fetchSpy = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      return new Response("{}", { status: 200 });
    });
    vi.stubGlobal("fetch", fetchSpy);
    const res = await timedFetch("https://example.test/ok", { method: "GET" }, 5_000);
    expect(res.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it("aborts a hung fetch and classifies it as provider_unavailable", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", hungFetchMock());
    const clearSpy = vi.spyOn(globalThis, "clearTimeout");
    const pending = timedFetch("https://example.test/hang", {}, 1_000).then(
      () => {
        throw new Error("timedFetch resolved a hung request");
      },
      (error: unknown) => error,
    );
    await vi.advanceTimersByTimeAsync(1_000);
    const error = await pending;
    expect(isProviderUnavailableError(error)).toBe(true);
    expect((error as Error).message).toBe(PROVIDER_UNAVAILABLE);
    expect(clearSpy).toHaveBeenCalled();
  });

  it("does not classify a caller abort as provider_unavailable", async () => {
    vi.stubGlobal("fetch", hungFetchMock());
    const caller = new AbortController();
    const pending = timedFetch("https://example.test/hang", { signal: caller.signal }, 30_000);
    caller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });

  it("preserves RequestInit fields other than the composed signal", async () => {
    const fetchSpy = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toContain("example.test/write");
      expect(init?.method).toBe("POST");
      return new Response("{}", { status: 200 });
    });
    vi.stubGlobal("fetch", fetchSpy);
    await timedFetch(
      "https://example.test/write",
      { method: "POST", headers: { "content-type": "application/json" }, body: "{\"a\":1}" },
      INDEXNOW_TIMEOUT_MS,
    );
    const init = fetchSpy.mock.calls[0]?.[1];
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe("{\"a\":1}");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("buffers a complete body before the timeout and preserves JSON for callers", async () => {
    const clearSpy = vi.spyOn(globalThis, "clearTimeout");
    const fetchSpy = vi.fn(async () => new Response(JSON.stringify({ checkout_id: "chk_1" }), {
      status: 201,
      statusText: "Created",
      headers: { "content-type": "application/json", "x-dodo": "ok" },
    }));
    vi.stubGlobal("fetch", fetchSpy);
    const res = await timedFetch("https://example.test/ok-body", {}, 5_000);
    expect(res.status).toBe(201);
    expect(res.statusText).toBe("Created");
    expect(res.headers.get("content-type")).toMatch(/application\/json/);
    expect(res.headers.get("x-dodo")).toBe("ok");
    expect(await res.json()).toEqual({ checkout_id: "chk_1" });
    expect(clearSpy).toHaveBeenCalled();
  });

  it("aborts when headers arrive but the body hangs, as provider_unavailable", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", hungBodyFetchMock());
    const pending = timedFetch("https://example.test/hang-body", {}, 1_000).then(
      () => {
        throw new Error("timedFetch resolved a hung body");
      },
      (error: unknown) => error,
    );
    await vi.advanceTimersByTimeAsync(1_000);
    const error = await pending;
    expect(isProviderUnavailableError(error)).toBe(true);
    expect((error as Error).message).toBe(PROVIDER_UNAVAILABLE);
  });

  it("does not classify a caller abort during body consumption as provider_unavailable", async () => {
    vi.stubGlobal("fetch", hungBodyFetchMock());
    const caller = new AbortController();
    const pending = timedFetch("https://example.test/hang-body", { signal: caller.signal }, 30_000);
    queueMicrotask(() => caller.abort());
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });
});
