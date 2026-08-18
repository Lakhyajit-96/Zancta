declare module "pdfjs-dist/build/pdf.mjs" {
  export type TextItem = { str: string };
  export const getDocument: (src: unknown) => {
    promise: Promise<{
      numPages: number;
      getPage: (n: number) => Promise<{
        getViewport: (o: { scale: number }) => { width: number; height: number };
        render: (o: unknown) => { promise: Promise<void> };
        getTextContent: () => Promise<{ items: TextItem[] }>;
        cleanup: () => void;
      }>;
      destroy: () => Promise<void>;
    }>;
    destroy: () => Promise<void>;
  };
  export const GlobalWorkerOptions: { workerSrc: string };
}
