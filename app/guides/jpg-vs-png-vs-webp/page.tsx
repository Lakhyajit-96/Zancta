import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/marketing/content-page";
import { jsonLdBreadcrumbList, jsonLdFaqPage, pageMeta } from "@/lib/seo";

const PATH = "/guides/jpg-vs-png-vs-webp";

const faqs = [
  { q: "Which format should I use for a photo on a website?", a: "WebP is usually the smallest for photographs in current browsers. Keep a JPG copy if you must send the file by email to someone on older software." },
  { q: "When is PNG the right choice?", a: "Use PNG when you need sharp edges, screenshots, UI, or transparency. PNG is lossless for those cases and often larger than WebP or JPG for camera photos." },
  { q: "Does converting in the browser upload the image?", a: "Not on ZANCTA Convert Image. Conversion runs in the tab for JPG, PNG, and WebP." },
] as const;

export const metadata = pageMeta(PATH, {
  title: "JPG vs PNG vs WebP",
  description: "When to use JPG, PNG, or WebP for photos, screenshots, and transparency — then convert or compress locally without uploading.",
});

export default function ImageFormatGuidePage() {
  return (
    <>
      <ContentPage
        crumbs={[{ name: "Home", href: "/" }, { name: "Guides", href: "/guides/local-processing" }, { name: "JPG vs PNG vs WebP" }]}
        eyebrow={PATH}
        title="JPG, PNG, or WebP — which format to use."
        intro="The same picture can be a 4 MB PNG, a 400 KB JPG, or a 250 KB WebP. The right choice depends on whether you need transparency, exact pixels, or a small file that still looks like a photograph. ZANCTA Convert Image and Compress Image run that work in the browser."
      >
        <ContentSection title="JPG (JPEG)">
          <p>JPG is a lossy format designed for photographs. It discards detail that is hard to see in order to shrink file size. Use it for camera photos, email attachments, and documents that must open on software that still does not handle WebP well. Repeated re-saving at low quality adds visible blocks. JPG does not support transparency.</p>
        </ContentSection>
        <ContentSection title="PNG">
          <p>PNG is lossless for the pixels it stores. It is the default for screenshots, diagrams, UI, and any image that needs a transparent background. Camera photos saved as PNG are often unnecessarily large. If you only need a smaller photo, convert or compress to JPG or WebP instead of “compressing” a PNG and expecting photograph-level savings.</p>
        </ContentSection>
        <ContentSection title="WebP">
          <p>WebP can be lossy or lossless and usually beats JPG on photographic size at a similar look. Current Chrome, Edge, Firefox, and Safari open it. Use WebP when you control the website or app that will display the file. Avoid it as the only copy you send to a print shop or an older office tool until you confirm they accept it.</p>
        </ContentSection>
        <ContentSection title="A practical rule">
          <p>Photos for the web: WebP, with JPG as a fallback. Screenshots and sharp text: PNG. Logos with transparency: PNG or lossless WebP. Print or unknown recipients: ask, then use PNG or high-quality JPG. This is guidance, not a guarantee that a given encoder will hit a target kilobyte size.</p>
        </ContentSection>
        <ContentSection title="Do it locally">
          <p>
            Convert between JPG, PNG, and WebP with <Link href="/tools/image-convert" className="underline">Convert Image</Link>.
            Reduce photographic size with <Link href="/tools/image-compress" className="underline">Compress Image</Link> — it changes quality, not pixel dimensions.
            Change width and height with <Link href="/tools/image-resize" className="underline">Resize Image</Link>.
            Turn a set of images into one PDF with <Link href="/tools/images-to-pdf" className="underline">Images to PDF</Link>.
            Before you email a photo, see <Link href="/guides/remove-exif-before-sharing" className="underline">Remove EXIF before sharing</Link>
            {" "}or use <Link href="/tools/exif-cleaner" className="underline">EXIF Cleaner</Link>.
          </p>
        </ContentSection>
        <ContentSection title="What ZANCTA does not convert" className="md:col-span-2">
          <p>HEIC, SVG, and AVIF are out of scope for the current image tools. Convert those elsewhere, or export JPG/PNG/WebP from the original app, then finish locally.</p>
        </ContentSection>
      </ContentPage>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumbList([{ name: "Home", path: "/" }, { name: "Guides", path: "/guides/local-processing" }, { name: "JPG vs PNG vs WebP", path: PATH }])) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaqPage(faqs)) }} />
    </>
  );
}
