import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/marketing/content-page";
import { jsonLdBreadcrumbList, jsonLdFaqPage, pageMeta } from "@/lib/seo";

const PATH = "/guides/split-pdf-without-uploading";

const faqs = [
  { q: "Does split upload the PDF?", a: "No. For this implemented local workflow, the selected PDF stays in the tab. The new file is built in the browser with pdf-lib." },
  { q: "Do I get one file per page?", a: "No. Split PDF copies the pages you ask for into a single new PDF. Use a range such as 3-3 for one page, or 5-10 for a block." },
  { q: "What about password-protected PDFs?", a: "They are not unlocked here. The tool reports an error instead of guessing a password." },
] as const;

export const metadata = pageMeta(PATH, {
  title: "Split PDF without uploading",
  description: "Extract a page range from a PDF in your browser. How ZANCTA Split PDF works, what the output is, limits, and when merge or images are the better next step.",
});

export default function SplitPdfGuidePage() {
  return (
    <>
      <ContentPage
        crumbs={[{ name: "Home", href: "/" }, { name: "Guides", href: "/guides/local-processing" }, { name: "Split PDF without uploading" }]}
        eyebrow={PATH}
        title="Split a PDF without uploading it."
        intro="“Split PDF online” often means uploading a contract so a server can emit page 7. That is easy, and it is also a copy of the whole file on someone else’s disk. This page describes extracting a page range locally with ZANCTA Split PDF."
      >
        <ContentSection title="What split means here">
          <p>
            You select one PDF and a page range. The tool copies those pages, in order, into a new PDF and leaves the original on disk untouched. It does not explode the document into a ZIP of single-page files. Syntax matches the tool: <code className="text-xs">1</code>, <code className="text-xs">1-3</code>, <code className="text-xs">2,5,8</code>, or <code className="text-xs">1-3,7,10-12</code>. A single page is <code className="text-xs">4-4</code> or just <code className="text-xs">4</code>.
          </p>
        </ContentSection>
        <ContentSection title="How to extract pages locally">
          <p>1. Open <Link href="/tools/pdf-split" className="underline">Split PDF</Link>.</p>
          <p>2. Choose one PDF, up to 50 MB, within the page cap shown on the tool. Free and Premium use the same cap.</p>
          <p>3. Enter the range, run the local split, wait for the completed state, then download the new PDF.</p>
          <p>4. If you actually needed images of those pages, use <Link href="/tools/pdf-to-images" className="underline">PDF to Images</Link> instead of splitting first unless you also want a PDF excerpt.</p>
        </ContentSection>
        <ContentSection title="Privacy">
          <p>
            After the page and engine load, selected bytes are not sent to ZANCTA for processing. You still download the website’s scripts. Browser extensions can still read the tab. Splitting does not redact text on the pages you keep.
          </p>
        </ContentSection>
        <ContentSection title="Limits and failures">
          <p>Encrypted PDFs fail. Corrupt files fail. Ranges outside the document fail with a readable error, not a blank PDF. A phone may run out of memory on a very large file. There is no server queue. Output is one PDF containing the copied pages, not a multi-file archive.</p>
        </ContentSection>
        <ContentSection title="Related tools">
          <p>
            Put excerpts back together with <Link href="/tools/pdf-merge" className="underline">Merge PDF</Link>.
            If the excerpt is still heavy, read <Link href="/guides/compress-pdf-without-uploading" className="underline">Compress PDF without uploading</Link> before you expect a smaller file.
            Combining files without a server is on the <Link href="/guides/merge-pdf-without-uploading" className="underline">merge guide</Link>.
          </p>
        </ContentSection>
        <ContentSection title="Privacy boundary" className="md:col-span-2">
          <p>
            Local split does not make the excerpt uncopyable. The detailed boundary is in the <Link href="/guides/local-processing" className="underline">local processing guide</Link>.
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumbList([{ name: "Home", path: "/" }, { name: "Guides", path: "/guides/local-processing" }, { name: "Split PDF without uploading", path: PATH }])) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaqPage(faqs)) }} />
    </>
  );
}
