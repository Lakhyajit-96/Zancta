// bg.worker.ts — background removal stub (MIT model spike deferred)
type Msg = unknown;
self.onmessage = (e: MessageEvent<Msg>) => {
  const data = e.data as { id: string };
  // Honest placeholder — no fake image output
  setTimeout(() => {
    (self as unknown as Worker).postMessage({ id: data.id, status: "failed", errorCode: "UNSUPPORTED", message: "BG engine ships in Phase 5 — MIT model spike pending." });
  }, 300);
};
export {};
