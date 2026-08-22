import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/marketing/content-page";
import { jsonLdBreadcrumbList, jsonLdFaqPage, pageMeta } from "@/lib/seo";

const PATH = "/guides/merge-pdf-without-uploading";

const faqs = [
  { q: "Does merging a PDF require an account?", a: "No. ZANCTA Merge PDF runs in the browser without sign-in." },
  { q: "Are the files uploaded?", a: "No. For this implemented local workflow, selected PDF bytes stay in the tab until you close or clear them." },
  { q: "Is there a watermark?", a: "No. The merged output is a PDF without ZANCTA branding." },
] as const;

export const metadata = pageMeta(PATH, {
  title: "Merge PDFs without uploading",
  description: "How to combine PDF files in your browser so the documents stay on your device. Limits, order, and when merge is the wrong tool.",
});

export default function MergePdfGuidePage() {
  return (
    <>
      <ContentPage
        crumbs={[{ name: "Home", href: "/" }, { name: "Guides", href: "/guides/local-processing" }, { name: "Merge PDFs without uploading" }]}
        eyebrow={PATH}
        title="Merge PDF files without uploading them."
        intro="Most “merge PDF online” sites send every file to a server, wait, then send a new PDF back. That is simple, and it also means the operator briefly holds contracts, IDs, or bank statements. This page explains how to combine PDFs in the browser instead, using ZANCTA Merge PDF."
      >
        <ContentSection title="What “no upload” actually means">
          <p>
            After the page and PDF engine load, Merge PDF reads the files you select with the browser File API. The merge runs in this tab with pdf-lib. The result is a new PDF created locally, which you download from the same tab. ZANCTA does not receive those file bytes for processing.
          </p>
          <p>
            The website still downloads ordinary application assets (HTML, JavaScript, fonts). That is not the same as posting your PDF to a conversion API.
          </p>
        </ContentSection>
        <ContentSection title="When this is the right job">
          <p>Use merge when you already have several PDFs and need one file: signed pages plus an appendix, a scan plus a covering letter, or chapters exported separately. Do not use merge to “compress” a heavy file, to pull out a page range, or to turn photographs into a PDF — those are different tools.</p>
        </ContentSection>
        <ContentSection title="How to merge locally">
          <p>1. Open <Link href="/tools/pdf-merge" className="underline">Merge PDF</Link>.</p>
          <p>2. Select two or more PDFs. The current limit is 50 files and 200 pages counted across every selected file together. Free and Premium use that same cap.</p>
          <p>3. Confirm the order. The first file in the list becomes the first section of the output.</p>
          <p>4. Run the local merge, wait for the completed state, then download. If the browser is short on memory, close other tabs and try fewer pages.</p>
        </ContentSection>
        <ContentSection title="Limits you should expect">
          <p>Password-protected PDFs are not unlocked here. Corrupt files fail with an error instead of a fake PDF. Very large batches can exceed what a phone browser can hold in memory. There is no server queue to finish the job in the background.</p>
        </ContentSection>
        <ContentSection title="Related tools">
          <p>
            Split a merged file with <Link href="/tools/pdf-split" className="underline">Split PDF</Link>.
            If the result is still large, try <Link href="/tools/pdf-compress" className="underline">Compress PDF</Link> — it rewrites object streams and does not promise a smaller file.
            Building a PDF from photos is <Link href="/tools/images-to-pdf" className="underline">Images to PDF</Link>.
          </p>
        </ContentSection>
        <ContentSection title="Privacy boundary" className="md:col-span-2">
          <p>
            Local merge does not make the file “uncopyable” after you download it. Browser extensions, malware, and later uploads to other sites are outside this page. The detailed boundary is in the <Link href="/guides/local-processing" className="underline">local processing guide</Link>.
          </p>
        </ContentSection>
      </ContentPage>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumbList([{ name: "Home", path: "/" }, { name: "Guides", path: "/guides/local-processing" }, { name: "Merge PDFs without uploading", path: PATH }])) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaqPage(faqs)) }} />
    </>
  );
}
