/// <reference lib="webworker" />

import * as pdfjs from "pdfjs-dist/build/pdf.mjs";

type StartMessage = { id: string; type: "START"; bytes: ArrayBuffer };
type CancelMessage = { id: string; type: "CANCEL" };
type WorkerMessage = StartMessage | CancelMessage;

let activeId: string | null = null;
let cancelled = false;

function post(message: unknown) {
  self.postMessage(message);
}

function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/password|encrypted/i.test(message)) return "This PDF is password-protected. Unlock it before extracting text.";
  if (/invalid|malformed|corrupt|unexpected|xref|pdf/i.test(message)) return "This PDF could not be read. It may be corrupted or unsupported.";
  return "Text extraction could not process this PDF.";
}

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;
  if (message.type === "CANCEL") {
    if (message.id === activeId) cancelled = true;
    return;
  }

  activeId = message.id;
  cancelled = false;
  let loadingTask: ReturnType<typeof pdfjs.getDocument> | null = null;
  let documentProxy: Awaited<ReturnType<typeof pdfjs.getDocument>["promise"]> | null = null;

  try {
    post({ id: message.id, type: "loading" });
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();
    }
    loadingTask = pdfjs.getDocument({
      data: new Uint8Array(message.bytes),
      disableWorker: true,
      isEvalSupported: false,
      useWorkerFetch: false,
    });
    documentProxy = await loadingTask.promise;
    if (cancelled || activeId !== message.id) return;

    const totalPages = documentProxy.numPages;
    post({ id: message.id, type: "loaded", totalPages });

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      if (cancelled || activeId !== message.id) return;
      const page = await documentProxy.getPage(pageNumber);
      try {
        const content = await page.getTextContent();
        if (cancelled || activeId !== message.id) return;
        const text = content.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        post({ id: message.id, type: "page", pageNumber, totalPages, text });
      } finally {
        page.cleanup();
      }
    }

    if (!cancelled && activeId === message.id) post({ id: message.id, type: "completed" });
  } catch (error) {
    if (!cancelled && activeId === message.id) post({ id: message.id, type: "failed", message: errorMessage(error) });
  } finally {
    try {
      await documentProxy?.destroy();
    } catch {}
    try {
      await loadingTask?.destroy();
    } catch {}
    if (activeId === message.id) activeId = null;
  }
};

export {};
