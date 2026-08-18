export type ToolCategory = "pdf" | "image";

export type ToolPrivacy = "local" | "hybrid";

export type ToolSlug =
  | "pdf-merge"
  | "pdf-split"
  | "pdf-compress"
  | "pdf-to-images"
  | "images-to-pdf"
  | "image-compress"
  | "image-convert"
  | "image-resize"
  | "background-remover"
  | "exif-cleaner"
  | "ocr"
  | "pdf-text-extractor";

export interface ToolMeta {
  slug: ToolSlug;
  name: string;
  shortName: string;
  description: string;
  longDescription: string;
  category: ToolCategory;
  icon: string;
  supportedFormats: string[];
  acceptMime: string[];
  maxFileSize: number;
  maxFiles: number;
  privacy: ToolPrivacy;
  processingType: "pdf" | "image" | "bg";
  seoTitle: string;
  seoDescription: string;
  h1: string;
  available: boolean;
  related: ToolSlug[];
  faq: { q: string; a: string }[];
}

export const TOOLS: ToolMeta[] = [
  {
    slug: "pdf-merge",
    name: "Merge PDF",
    shortName: "Merge",
    description: "Combine multiple PDFs into one — locally, no upload.",
    longDescription: "Merge 2–200 PDFs in your browser. Files never leave your device. No watermark.",
    category: "pdf",
    icon: "merge",
    supportedFormats: ["pdf"],
    acceptMime: ["application/pdf"],
    maxFileSize: 50 * 1024 * 1024,
    maxFiles: 50,
    privacy: "local",
    processingType: "pdf",
    seoTitle: "Merge PDF — Free, Private, No Upload",
    seoDescription: "Merge PDFs privately in your browser. No upload, no watermark, no signup.",
    h1: "Merge PDF files — privately in your browser",
    available: true,
    related: ["pdf-split", "pdf-compress", "images-to-pdf"],
    faq: [
      { q: "Do files leave my device?", a: "No. Merge runs entirely in your browser. Nothing is uploaded." },
      { q: "How many PDFs can I merge?", a: "Up to 50 files or 400 total pages in the free tier." },
      { q: "Is there a watermark?", a: "No. Output is clean, no branding added." },
    ],
  },
  {
    slug: "pdf-split",
    name: "Split PDF",
    shortName: "Split",
    description: "Extract pages or split a PDF by range.",
    longDescription: "Split by page range or extract specific pages — all local.",
    category: "pdf",
    icon: "split",
    supportedFormats: ["pdf"],
    acceptMime: ["application/pdf"],
    maxFileSize: 50 * 1024 * 1024,
    maxFiles: 1,
    privacy: "local",
    processingType: "pdf",
    seoTitle: "Split PDF — Extract Pages Privately, No Upload",
    seoDescription: "Split PDFs or extract pages locally. No upload, no account.",
    h1: "Split PDF — extract pages privately",
    available: true,
    related: ["pdf-merge", "pdf-to-images", "pdf-compress"],
    faq: [
      { q: "Can I extract a single page?", a: "Yes — select page range 3-3 or 5-10." },
      { q: "Is it private?", a: "Yes, processing is local. No file bytes are sent to a server." },
    ],
  },
  {
    slug: "pdf-compress",
    name: "Compress PDF",
    shortName: "Compress",
    description: "Reduce PDF file size without leaving your device.",
    longDescription: "Compress PDFs with 3 quality levels — optimized in-browser.",
    category: "pdf",
    icon: "compress",
    supportedFormats: ["pdf"],
    acceptMime: ["application/pdf"],
    maxFileSize: 50 * 1024 * 1024,
    maxFiles: 1,
    privacy: "local",
    processingType: "pdf",
    seoTitle: "Compress PDF — Reduce Size Locally, No Upload",
    seoDescription: "Compress PDFs in your browser. Three quality levels, no upload.",
    h1: "Compress PDF — smaller, still private",
    available: true,
    related: ["pdf-merge", "image-compress", "pdf-to-images"],
    faq: [{ q: "Will quality drop?", a: "You choose: Light, Medium, Strong. Preview shows estimated size." }],
  },
  {
    slug: "pdf-to-images",
    name: "PDF to Images",
    shortName: "To Images",
    description: "Convert PDF pages to JPG or PNG — locally.",
    longDescription: "Render each PDF page to an image without uploading.",
    category: "pdf",
    icon: "images",
    supportedFormats: ["pdf"],
    acceptMime: ["application/pdf"],
    maxFileSize: 50 * 1024 * 1024,
    maxFiles: 1,
    privacy: "local",
    processingType: "pdf",
    seoTitle: "PDF to Images — Convert Pages to JPG/PNG Locally",
    seoDescription: "Convert PDF to JPG or PNG in your browser. No upload.",
    h1: "PDF to Images — render locally",
    available: true,
    related: ["images-to-pdf", "pdf-split", "image-convert"],
    faq: [{ q: "What formats?", a: "JPG and PNG. Choose DPI and output folder as ZIP." }],
  },
  {
    slug: "images-to-pdf",
    name: "Images to PDF",
    shortName: "To PDF",
    description: "Turn JPG/PNG/WebP images into a single PDF.",
    longDescription: "Create a PDF from images — page size matches image, all local.",
    category: "pdf",
    icon: "pdf",
    supportedFormats: ["jpg", "png", "webp"],
    acceptMime: ["image/jpeg", "image/png", "image/webp"],
    maxFileSize: 50 * 1024 * 1024,
    maxFiles: 20,
    privacy: "local",
    processingType: "pdf",
    seoTitle: "Images to PDF — JPG/PNG to PDF, No Upload",
    seoDescription: "Convert images to PDF locally. No watermark, no upload.",
    h1: "Images to PDF — build locally",
    available: true,
    related: ["pdf-to-images", "pdf-merge", "image-compress"],
    faq: [{ q: "Max images?", a: "20 per batch free. Premium 50." }],
  },
  {
    slug: "image-compress",
    name: "Compress Image",
    shortName: "Compress",
    description: "Shrink JPG/PNG/WebP without uploading.",
    longDescription: "Compress with mozjpeg/WebP re-encode — quality preserved, privacy intact.",
    category: "image",
    icon: "compress",
    supportedFormats: ["jpg", "png", "webp"],
    acceptMime: ["image/jpeg", "image/png", "image/webp"],
    maxFileSize: 50 * 1024 * 1024,
    maxFiles: 20,
    privacy: "local",
    processingType: "image",
    seoTitle: "Compress Image — Reduce Size Locally, No Upload",
    seoDescription: "Compress images in your browser. No upload, no watermark.",
    h1: "Compress images — smaller, private",
    available: true,
    related: ["image-convert", "image-resize", "exif-cleaner"],
    faq: [{ q: "Quality loss?", a: "Adjustable 0.6–0.9. Preview shows before/after." }],
  },
  {
    slug: "image-convert",
    name: "Convert Image",
    shortName: "Convert",
    description: "JPG ↔ PNG ↔ WebP — all in your browser.",
    longDescription: "Convert between JPG, PNG, WebP, AVIF (decode) — no server.",
    category: "image",
    icon: "convert",
    supportedFormats: ["jpg", "png", "webp"],
    acceptMime: ["image/jpeg", "image/png", "image/webp"],
    maxFileSize: 50 * 1024 * 1024,
    maxFiles: 20,
    privacy: "local",
    processingType: "image",
    seoTitle: "Convert Image — JPG PNG WebP Locally, No Upload",
    seoDescription: "Convert images between formats locally. No upload.",
    h1: "Convert images — any format, locally",
    available: true,
    related: ["image-compress", "image-resize", "pdf-to-images"],
    faq: [{ q: "AVIF?", a: "AVIF encode deferred; decode supported via canvas fallback." }],
  },
  {
    slug: "image-resize",
    name: "Resize Image",
    shortName: "Resize",
    description: "Resize by pixels or percentage — locally.",
    longDescription: "Resize with aspect lock and quality control — in-browser.",
    category: "image",
    icon: "resize",
    supportedFormats: ["jpg", "png", "webp"],
    acceptMime: ["image/jpeg", "image/png", "image/webp"],
    maxFileSize: 50 * 1024 * 1024,
    maxFiles: 10,
    privacy: "local",
    processingType: "image",
    seoTitle: "Resize Image — Scale Locally, No Upload",
    seoDescription: "Resize images by pixels or percent. No upload.",
    h1: "Resize images — precise, private",
    available: true,
    related: ["image-compress", "image-convert", "background-remover"],
    faq: [{ q: "Max size?", a: "12,000×12,000. Larger images show guidance." }],
  },
  {
    slug: "background-remover",
    name: "Background Remover",
    shortName: "BG Remove",
    description: "Background removal is deferred pending verified local model licensing.",
    longDescription: "Background removal is not currently available. No model is loaded and no cloud fallback is used.",
    category: "image",
    icon: "bg",
    supportedFormats: ["jpg", "png", "webp"],
    acceptMime: ["image/jpeg", "image/png", "image/webp"],
    maxFileSize: 30 * 1024 * 1024,
    maxFiles: 5,
    privacy: "local",
    processingType: "bg",
    seoTitle: "Background Removal — Currently Deferred",
    seoDescription: "Background removal is currently deferred while local model licensing is verified.",
    h1: "Background removal — currently deferred",
    available: false,
    related: ["image-compress", "image-convert", "exif-cleaner"],
    faq: [
      { q: "Is background removal available?", a: "No. It remains deferred while a commercially verified local model is evaluated." },
      { q: "Will my image be uploaded instead?", a: "No. This deferred page does not use a cloud fallback or create an output." },
    ],
  },
  {
    slug: "exif-cleaner",
    name: "EXIF Cleaner",
    shortName: "EXIF",
    description: "Strip metadata before sharing — locally.",
    longDescription: "Common image metadata is removed by re-encoding — privacy-first. Files stay on device.",
    category: "image",
    icon: "shield",
    supportedFormats: ["jpg", "png", "webp"],
    acceptMime: ["image/jpeg", "image/png", "image/webp"],
    maxFileSize: 50 * 1024 * 1024,
    maxFiles: 20,
    privacy: "local",
    processingType: "image",
    seoTitle: "Remove EXIF — Strip Metadata Locally",
    seoDescription: "Clean EXIF/GPS metadata locally. No upload.",
    h1: "Clean EXIF — share safely",
    available: true,
    related: ["background-remover", "image-compress", "image-convert"],
    faq: [{ q: "What is removed?", a: "Common image metadata is removed by re-encoding. EXIF, GPS, and camera data do not survive canvas re-encode." }],
  },
  {
    slug: "pdf-text-extractor",
    name: "PDF Text Extractor",
    shortName: "Extract Text",
    description: "Extract embedded PDF text locally and search it.",
    longDescription: "Read existing text from text-based PDFs in your browser. The PDF and extracted text stay on your device.",
    category: "pdf",
    icon: "text",
    supportedFormats: ["pdf"],
    acceptMime: ["application/pdf"],
    maxFileSize: 50 * 1024 * 1024,
    maxFiles: 1,
    privacy: "local",
    processingType: "pdf",
    seoTitle: "PDF Text Extractor — Extract Text Locally",
    seoDescription: "Extract embedded text from text-based PDFs locally in your browser. No PDF upload or OCR.",
    h1: "Extract text from PDFs — locally",
    available: true,
    related: ["pdf-split", "pdf-merge", "pdf-to-images"],
    faq: [
      { q: "Do PDFs leave my device?", a: "No. The PDF and extracted text are processed locally in your browser." },
      { q: "Can it read scanned PDFs?", a: "No. This tool extracts existing embedded PDF text and does not OCR scanned or image-only PDFs." },
      { q: "Can I search the extracted text?", a: "Yes. Search runs against the extracted text in this browser." },
    ],
  },
  {
    slug: "ocr",
    name: "Image OCR",
    shortName: "OCR",
    description: "Extract text from JPG, PNG, and WebP images locally.",
    longDescription: "Extract English text from images in your browser. The OCR engine, language data, image, and result stay on your device.",
    category: "image",
    icon: "text",
    supportedFormats: ["jpg", "png", "webp"],
    acceptMime: ["image/jpeg", "image/png", "image/webp"],
    maxFileSize: 20 * 1024 * 1024,
    maxFiles: 1,
    privacy: "local",
    processingType: "image",
    seoTitle: "Image OCR — Extract Text Locally in Your Browser",
    seoDescription: "Extract English text from JPG, PNG, and WebP images locally in your browser. No OCR API or file upload.",
    h1: "Extract text from images — locally",
    available: true,
    related: ["image-compress", "image-convert", "exif-cleaner"],
    faq: [
      { q: "Do images leave my device?", a: "No. The OCR engine and English language data are served with this site, and recognition runs in a browser Web Worker." },
      { q: "Which language is available?", a: "English is currently bundled and available." },
      { q: "Which image formats can I use?", a: "JPG, PNG, and WebP images are supported." },
    ],
  },
];

export function getTool(slug: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export const TOOL_SLUGS = TOOLS.map((t) => t.slug);
