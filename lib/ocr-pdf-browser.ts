import { classifyPdfText, renderScaleForPage, scannedPdfPageCapError, type PdfPageProbe } from "@/lib/ocr-pdf";

type Pdfjs = typeof import("pdfjs-dist/build/pdf.mjs");
type PdfDocument = Awaited<ReturnType<Pdfjs["getDocument"]>["promise"]>;

async function loadPdfjs(): Promise<Pdfjs> {
  const pdfjs = await import("pdfjs-dist/build/pdf.mjs");
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();
  }
  return pdfjs;
}

export type PdfOcrSession = {
  totalPages: number;
  pages: PdfPageProbe[];
  kind: ReturnType<typeof classifyPdfText>;
  renderPage: (pageNumber: number) => Promise<Blob>;
  destroy: () => Promise<void>;
};

export async function openPdfOcrSession(file: File, cancelled: () => boolean): Promise<PdfOcrSession> {
  const pdfjs = await loadPdfjs();
  const bytes = await file.arrayBuffer();
  if (cancelled()) throw new Error("cancelled");
  const task = pdfjs.getDocument({
    data: new Uint8Array(bytes),
    disableWorker: true,
    isEvalSupported: false,
    useWorkerFetch: false,
  });
  const documentProxy: PdfDocument = await task.promise;
  const capError = scannedPdfPageCapError(documentProxy.numPages);
  if (capError) {
    await documentProxy.destroy().catch(() => {});
    throw new Error(capError);
  }

  const pages: PdfPageProbe[] = [];
  for (let pageNumber = 1; pageNumber <= documentProxy.numPages; pageNumber += 1) {
    if (cancelled()) break;
    const page = await documentProxy.getPage(pageNumber);
    try {
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      pages.push({
        pageNumber,
        text,
        kind: text.length >= 40 ? "embedded" : "empty",
      });
    } finally {
      page.cleanup();
    }
  }

  if (cancelled()) {
    await documentProxy.destroy().catch(() => {});
    throw new Error("cancelled");
  }

  return {
    totalPages: documentProxy.numPages,
    pages,
    kind: classifyPdfText(pages),
    renderPage: async (pageNumber: number) => {
      if (cancelled()) throw new Error("cancelled");
      const page = await documentProxy.getPage(pageNumber);
      try {
        const base = page.getViewport({ scale: 1 });
        const scale = renderScaleForPage(base.width, base.height);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext("2d");
        if (!context) throw new Error("This browser could not render the PDF page.");
        await page.render({ canvasContext: context, viewport, canvas }).promise;
        if (cancelled()) throw new Error("cancelled");
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((result) => (result ? resolve(result) : reject(new Error("Page render failed."))), "image/png");
        });
        context.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = 0;
        canvas.height = 0;
        return blob;
      } finally {
        page.cleanup();
      }
    },
    destroy: async () => {
      await documentProxy.destroy().catch(() => {});
    },
  };
}
