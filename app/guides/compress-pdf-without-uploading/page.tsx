import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/marketing/content-page";
import { jsonLdBreadcrumbList, jsonLdFaqPage, pageMeta } from "@/lib/seo";

const PATH = "/guides/compress-pdf-without-uploading";

const faqs = [
  { q: "Does ZANCTA recompress the photos inside my PDF?", a: "No. Compress PDF rewrites the file with object streams in this browser. Embedded images keep their current encoding. Size may stay the same or grow. The tool always shows the original and output sizes." },
  { q: "Are files uploaded to compress a PDF?", a: "No. For this implemented local workflow, selected PDF bytes stay in the tab until you close or clear them." },
  { q: "Will quality drop?", a: "Because images are not transcoded, the visible pages should match the input. This is not a “low / medium / high quality” slider." },
] as const;

export const metadata = pageMeta(PATH, {
  title: "Compress PDF without uploading",
  description: "What browser-local PDF compression actually does: object-stream rewrite, why image-heavy files often do not shrink, limits, and when another tool is a better fit.",
});

export default function CompressPdfGuidePage() {
  return (
    <>
      <ContentPage
        crumbs={[{ name: "Home", href: "/" }, { name: "Guides", href: "/guides/local-processing" }, { name: "Compress PDF without uploading" }]}
        eyebrow={PATH}
        title="Compress a PDF without uploading it."
        intro="Search results for “compress PDF online” usually mean: send the file to a server, downsample every photo, and email you a smaller copy. That can shrink a scan-heavy brochure. It also means a stranger’s computer held the document. This page explains what ZANCTA Compress PDF actually does in the browser, and when it will not make the file smaller."
      >
        <ContentSection title="Why PDFs get large">
          <p>
            A PDF is a container. Size comes from photographs and other images, embedded fonts, unused objects left over from export, and how the file stores its internal dictionaries. Image-heavy exports (phone scans, slide decks, marketing PDFs) are dominated by pixel data. Text-heavy exports (contracts from a word processor) are often already compact; leftover objects and uncompressed metadata can still add bulk, but they are rarely the whole story.
          </p>
        </ContentSection>
        <ContentSection title="What “compress” can mean">
          <p>
            Desktop and server tools often downsample images, switch JPEG quality, subset fonts, and pack objects into compressed object streams (PDF 1.5). Those are different jobs. Image recompression is the usual reason a 20 MB scan becomes 2 MB — and it is lossy. Object-stream rewrite packs small internal objects together. On a simple file it can even grow the PDF slightly because of packaging overhead. On a file with many unused objects it can drop some bytes without touching the pictures.
          </p>
        </ContentSection>
        <ContentSection title="What ZANCTA does">
          <p>
            <Link href="/tools/pdf-compress" className="underline">Compress PDF</Link> loads the file with pdf-lib in this tab and saves it with object streams enabled. It does not recompress embedded images. After it finishes, it reports the original size and the output size. Believe those two numbers, not a marketing percentage. There is no claimed “up to 90% smaller.”
          </p>
          <p>
            After the page and engine load, selected file bytes are not posted to ZANCTA for processing. The site still downloads ordinary HTML and JavaScript. That is not the same as a conversion API.
          </p>
        </ContentSection>
        <ContentSection title="A practical workflow">
          <p>1. Open <Link href="/tools/pdf-compress" className="underline">Compress PDF</Link>.</p>
          <p>2. Select one PDF, up to 50 MB, within the page cap shown on the tool. Password-protected files are not unlocked.</p>
          <p>3. Run the rewrite and read the two sizes. If output is larger, keep the original — the tool did not fail; the strategy simply had nothing useful to remove.</p>
          <p>4. If the file is large because of photos, export smaller images first or use <Link href="/tools/pdf-to-images" className="underline">PDF to Images</Link> plus <Link href="/tools/image-compress" className="underline">Compress Image</Link>, then <Link href="/tools/images-to-pdf" className="underline">Images to PDF</Link>. That is a different, lossy pipeline. ZANCTA does not hide that tradeoff behind a single “compress” button.</p>
        </ContentSection>
        <ContentSection title="Limits">
          <p>One file at a time. Free and Premium share the same size and page caps. Very large documents can exhaust a phone browser. There is no background server job. Corrupt or encrypted PDFs error instead of producing a fake file.</p>
        </ContentSection>
        <ContentSection title="Related tools">
          <p>
            Combine files first with <Link href="/tools/pdf-merge" className="underline">Merge PDF</Link>.
            Pull a range with <Link href="/tools/pdf-split" className="underline">Split PDF</Link>.
            How merge works without uploading is on the <Link href="/guides/merge-pdf-without-uploading" className="underline">merge guide</Link>.
          </p>
        </ContentSection>
        <ContentSection title="Privacy boundary" className="md:col-span-2">
          <p>
            A smaller local copy is still a copy. Extensions, malware, and the next website you upload to are outside this page. The boundary is in the <Link href="/guides/local-processing" className="underline">local processing guide</Link>.
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumbList([{ name: "Home", path: "/" }, { name: "Guides", path: "/guides/local-processing" }, { name: "Compress PDF without uploading", path: PATH }])) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaqPage(faqs)) }} />
    </>
  );
}
