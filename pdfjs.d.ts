declare module "pdfjs-dist/build/pdf.mjs" {
  export const getDocument: (src: unknown) => { promise: Promise<{ numPages: number; getPage: (n: number) => Promise<{ getViewport: (o: { scale: number }) => { width: number; height: number }; render: (o: unknown) => { promise: Promise<void> }; cleanup: () => void }> }> };
  export const GlobalWorkerOptions: { workerSrc: string };
}
