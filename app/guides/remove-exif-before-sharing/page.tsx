import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/marketing/content-page";
import { jsonLdBreadcrumbList, jsonLdFaqPage, pageMeta } from "@/lib/seo";

const PATH = "/guides/remove-exif-before-sharing";

const faqs = [
  { q: "Does EXIF Cleaner upload my photos?", a: "No. For this implemented local workflow, selected images stay in the tab. Cleaning is a canvas re-encode in the browser." },
  { q: "Is the output lossless?", a: "No. JPEG and WebP are re-encoded (JPEG/WebP around quality 0.92). PNG is re-encoded as PNG. Pixels are redrawn; this is not a byte-level metadata strip that leaves the original entropy coding untouched." },
  { q: "Does this make a photo anonymous?", a: "No. Faces, backgrounds, and the next site you upload to can still identify a place or a person. Stripping metadata only removes what was in the file headers, not what is in the picture." },
] as const;

export const metadata = pageMeta(PATH, {
  title: "Remove EXIF before sharing",
  description: "What photo EXIF and GPS metadata are, when they matter, what ZANCTA EXIF Cleaner actually removes by re-encoding JPG, PNG, and WebP locally, and what it does not prove.",
});

export default function RemoveExifGuidePage() {
  return (
    <>
      <ContentPage
        crumbs={[{ name: "Home", href: "/" }, { name: "Guides", href: "/guides/local-processing" }, { name: "Remove EXIF before sharing" }]}
        eyebrow={PATH}
        title="Remove EXIF before you share a photo."
        intro="Cameras and phones often write extra data next to the pixels: when the shot was taken, which device took it, and — if location was on — GPS coordinates. Email, listings, and some chat apps keep that data. This page explains what ZANCTA EXIF Cleaner does in the browser, and what it does not claim."
      >
        <ContentSection title="What EXIF is">
          <p>
            EXIF (Exchangeable Image File Format) is a common place cameras store settings and, when enabled, GPS. Files can also carry IPTC captions, XMP edit history, embedded thumbnails, and vendor MakerNotes. You do not need every acronym. The practical risk is: a recipient with a free inspector can read a location or a camera serial that you never typed into the message.
          </p>
        </ContentSection>
        <ContentSection title="When metadata is useful">
          <p>
            Keep EXIF when you still need it: cataloguing a shoot, proving capture time for your own archive, or sending a file to an editor who asked for the original. Strip a copy before a public listing, a client preview, or a group chat if you do not want that copy to carry GPS or camera tags.
          </p>
        </ContentSection>
        <ContentSection title="What ZANCTA actually does">
          <p>
            <Link href="/tools/exif-cleaner" className="underline">EXIF Cleaner</Link> accepts JPG, PNG, and WebP, up to 50 MB and 20 files, max 12,000 px on a side. It draws the image onto a canvas and re-encodes. Typical EXIF, GPS, and camera tags do not survive that re-encode. HEIC and SVG are not supported. The tool does not inventory every tag beforehand, and it does not claim to remove C2PA manifests, motion-photo video appendices, or data that lives only in a format it cannot open.
          </p>
          <p>
            JPEG and WebP use a quality around 0.92 on write. That can change file size and is not a bit-identical original. If you need a lossless byte strip, this is the wrong tool — say so rather than pretending canvas redraw is ExifTool <code className="text-xs">-all=</code>.
          </p>
        </ContentSection>
        <ContentSection title="How to clean a copy locally">
          <p>1. Open <Link href="/tools/exif-cleaner" className="underline">EXIF Cleaner</Link>.</p>
          <p>2. Select supported images. Processing stays in this browser after the page loads.</p>
          <p>3. Download the cleaned copies. Keep the originals if you still need GPS for yourself.</p>
          <p>4. If the file is also too large, use <Link href="/tools/image-compress" className="underline">Compress Image</Link> or <Link href="/tools/image-resize" className="underline">Resize Image</Link> on purpose — those are separate quality tradeoffs. Format choice is in <Link href="/guides/jpg-vs-png-vs-webp" className="underline">JPG vs PNG vs WebP</Link>.</p>
        </ContentSection>
        <ContentSection title="Limitations">
          <p>
            Re-encoding is not a legal redaction of the scene. Platforms you upload to later may add their own metadata. Some apps strip GPS on upload after they have already received the original. This tool does not talk to those platforms. It does not process RAW, HEIC, or PDF.
          </p>
        </ContentSection>
        <ContentSection title="Related tools">
          <p>
            Shrink a cleaned JPEG with <Link href="/tools/image-compress" className="underline">Compress Image</Link>.
            Change container with <Link href="/tools/image-convert" className="underline">Convert Image</Link>.
          </p>
        </ContentSection>
        <ContentSection title="Privacy boundary" className="md:col-span-2">
          <p>
            Local cleaning does not hide the pixels from extensions or from the next upload. See the <Link href="/guides/local-processing" className="underline">local processing guide</Link>.
          </p>
        </ContentSection>
        <ContentSection title="Questions" className="md:col-span-2">
          {faqs.map((item) => (
            <div key={item.q}>
              <p className="font-medium text-foreground">{item.q}</p>
              <p>{item.a}</p>
            </div>
          ))}
        </ContentSection>
      </ContentPage>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumbList([{ name: "Home", path: "/" }, { name: "Guides", path: "/guides/local-processing" }, { name: "Remove EXIF before sharing", path: PATH }])) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaqPage(faqs)) }} />
    </>
  );
}
