import type { ToolSlug } from "@/lib/tools";

export type ToolNextStep = {
  prompt: string;
  href: string;
  label: string;
};

export const TOOL_NEXT_STEPS: Partial<Record<ToolSlug, ToolNextStep>> = {
  "pdf-merge": {
    prompt: "Need to reduce the final file size?",
    href: "/tools/pdf-compress",
    label: "Compress PDF",
  },
  "pdf-split": {
    prompt: "Need those pages as images?",
    href: "/tools/pdf-to-images",
    label: "PDF to Images",
  },
  "pdf-compress": {
    prompt: "Working with images inside a new PDF?",
    href: "/tools/images-to-pdf",
    label: "Images to PDF",
  },
  "pdf-to-images": {
    prompt: "Need a different image format?",
    href: "/tools/image-convert",
    label: "Convert Image",
  },
  "images-to-pdf": {
    prompt: "Need to combine more PDFs?",
    href: "/tools/pdf-merge",
    label: "Merge PDF",
  },
  "image-compress": {
    prompt: "Need exact pixel dimensions?",
    href: "/tools/image-resize",
    label: "Resize Image",
  },
  "image-convert": {
    prompt: "Need to reduce image size?",
    href: "/tools/image-compress",
    label: "Compress Image",
  },
  "image-resize": {
    prompt: "Sharing the image? Strip camera metadata first.",
    href: "/tools/exif-cleaner",
    label: "EXIF Cleaner",
  },
  "exif-cleaner": {
    prompt: "Need a smaller copy of the cleaned image?",
    href: "/tools/image-compress",
    label: "Compress Image",
  },
  ocr: {
    prompt: "Working with a scanned PDF?",
    href: "/pricing",
    label: "Local OCR Power",
  },
  "pdf-text-extractor": {
    prompt: "Is this a scanned PDF with no embedded text?",
    href: "/tools/ocr",
    label: "Image OCR / Local OCR Power",
  },
};

export const TOOL_GUIDES: Partial<Record<ToolSlug, { href: string; label: string }>> = {
  "pdf-merge": { href: "/guides/merge-pdf-without-uploading", label: "How to merge PDFs without uploading" },
  "pdf-split": { href: "/guides/merge-pdf-without-uploading", label: "How to merge PDFs without uploading" },
  "pdf-compress": { href: "/guides/merge-pdf-without-uploading", label: "How to merge PDFs without uploading" },
  "image-convert": { href: "/guides/jpg-vs-png-vs-webp", label: "JPG vs PNG vs WebP" },
  "image-compress": { href: "/guides/jpg-vs-png-vs-webp", label: "JPG vs PNG vs WebP" },
  "image-resize": { href: "/guides/jpg-vs-png-vs-webp", label: "JPG vs PNG vs WebP" },
  "images-to-pdf": { href: "/guides/jpg-vs-png-vs-webp", label: "JPG vs PNG vs WebP" },
  ocr: { href: "/guides/browser-ocr-without-uploading", label: "How browser OCR works without uploading" },
  "pdf-text-extractor": { href: "/guides/browser-ocr-without-uploading", label: "How browser OCR works without uploading" },
};
