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
  | "exif-cleaner";

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
      { q: "Do files leave my device?", a: "No. Merge runs entirely in your browser via Web Workers. Nothing is uploaded." },
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
    description: "Remove background locally — standard quality.",
    longDescription: "U²Net small model, runs in Web Worker. Files stay on device. HD cloud optional later.",
    category: "image",
    icon: "bg",
    supportedFormats: ["jpg", "png", "webp"],
    acceptMime: ["image/jpeg", "image/png", "image/webp"],
    maxFileSize: 30 * 1024 * 1024,
    maxFiles: 5,
    privacy: "local",
    processingType: "bg",
    seoTitle: "Remove Background — Local, Private, No Upload",
    seoDescription: "Remove image background locally. No upload for standard quality.",
    h1: "Remove background — locally",
    available: true,
    related: ["image-compress", "image-convert", "exif-cleaner"],
    faq: [
      { q: "Quality?", a: "Local small model — best effort. HD cloud optional in premium (explicit opt-in)." },
      { q: "MIT?", a: "MVP uses MIT/Apache model via transformers.js — not AGPL." },
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
];

export function getTool(slug: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export const TOOL_SLUGS = TOOLS.map((t) => t.slug);
