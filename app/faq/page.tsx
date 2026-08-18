import { ContentPage } from "@/components/marketing/content-page";

export const metadata = { title: "FAQ", description: "Practical answers about ZANCTA tools, local processing, accounts, limits, and billing availability." };

const faqs = [
  ["Does ZANCTA upload my files?", "For implemented local tools, selected file bytes are processed in the browser and are not uploaded to ZANCTA for processing. The page itself still makes normal requests for application code and assets."],
  ["Where does processing happen?", "Supported PDF, image, OCR, and PDF text-extraction workflows run in the browser. Individual tool pages explain their own processing boundaries and limitations."],
  ["What file types are supported?", "Each tool lists accepted formats before selection. Current image workflows support JPG, PNG, and WebP; tool-specific PDF workflows accept PDF. HEIC and SVG are not supported by the current image tools."],
  ["What are the file-size limits?", "Limits are shown on each tool page. Most local PDF and image workflows currently use a 50 MB per-file limit; OCR has a 20 MB image limit. Batch limits vary by tool."],
  ["Does OCR run locally?", "Yes. The implemented OCR workflow uses bundled English assets in a browser Worker. The selected image and recognized text are not sent to an OCR API."],
  ["Can scanned PDFs be converted to text?", "No. PDF Text Extractor reads existing embedded text from text-native PDFs. It clearly reports when a PDF is image-only or scanned instead of fabricating text."],
  ["What happens if processing fails?", "The tool should show a readable error without producing a fake result. Check the format, file size, page count, browser memory, and whether the PDF is password-protected or malformed."],
  ["Can I use ZANCTA without an account?", "Yes. The implemented local workflows do not require sign-in. Accounts are used for authentication and entitlement management."],
  ["What does Premium provide?", "The pricing page describes the intended plan differences. Premium checkout and paid entitlement availability are only real when the live payment provider configuration is complete."],
  ["What happens after cancellation?", "Cancellation behavior depends on the configured payment provider and subscription state. It is not presented as available until the payment flow has been verified."],
  ["Are files stored?", "Tool outputs are held in the active browser session for review or download. ZANCTA does not store selected file bytes for implemented local processing."],
  ["Does ZANCTA work on mobile?", "The interface is responsive and has Chromium checks at common mobile widths. Large or memory-heavy files may still exceed the capabilities of a particular device or browser."],
  ["Which browsers are supported?", "Current automated browser verification is Chromium-based. Browser support can vary by file format, memory availability, and platform APIs; Firefox and WebKit require separate verification."],
  ["How do I contact support?", "A monitored public support channel is not configured yet. Help, Docs, and individual tool pages provide the current self-service guidance. A real support contact is required before a paid public launch."],
  ["How does account deletion work?", "Authenticated account deletion is available through the account flow. It removes associated application account records; it does not need to delete local tool files because those files are not uploaded for processing."],
] as const;

export default function FAQPage() {
  return <ContentPage eyebrow="ANSWERS" title="Clear answers before you hand over a file." intro="Product-specific guidance on local processing, formats, limits, accounts, and the boundaries of the current service."><dl className="space-y-3">{faqs.map(([question, answer], index) => <div key={question} className="border border-border bg-surface p-5"><dt className="flex gap-4 font-medium"><span className="font-mono text-xs text-accent">{String(index + 1).padStart(2, "0")}</span>{question}</dt><dd className="mt-3 pl-8 text-sm leading-7 text-muted-foreground">{answer}</dd></div>)}</dl></ContentPage>;
}
