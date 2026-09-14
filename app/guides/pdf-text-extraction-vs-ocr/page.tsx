import Link from "next/link";
import {
  ContentPage,
  ContentSection,
} from "@/components/marketing/content-page";
import { jsonLdBreadcrumbList, pageMeta } from "@/lib/seo";

const PATH = "/guides/pdf-text-extraction-vs-ocr";

export const metadata = pageMeta(PATH, {
  title: "PDF Text Extraction vs OCR: What’s the Difference?",
  description:
    "Learn when PDF text extraction is enough, when a scan needs OCR, how to diagnose mixed PDFs, and which local ZANCTA tool fits.",
});

export default function PdfTextExtractionVsOcrGuidePage() {
  return (
    <>
      <ContentPage
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Local processing", href: "/guides/local-processing" },
          { name: "PDF text extraction vs OCR" },
        ]}
        eyebrow={PATH}
        title="PDF text extraction vs OCR: what’s the difference?"
        intro="The short answer: ordinary PDF text extraction reads text that is already embedded in the document. OCR recognizes letters from page images. If you can select meaningful text in a PDF, start with PDF Text Extractor. If the pages are scans or images, use OCR instead."
      >
        <ContentSection title="Quick decision table">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[38rem] border-collapse text-left text-sm">
              <caption className="sr-only">
                Choosing between embedded PDF text extraction and OCR
              </caption>
              <thead>
                <tr className="border-b border-border text-foreground">
                  <th scope="col" className="px-3 py-2 font-semibold">
                    What the PDF contains
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    What you notice
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Use
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border align-top">
                  <td className="px-3 py-2">Embedded text</td>
                  <td className="px-3 py-2">
                    Text selects and copies as meaningful words
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      className="underline"
                      href="/tools/pdf-text-extractor"
                    >
                      PDF Text Extractor
                    </Link>
                  </td>
                </tr>
                <tr className="border-b border-border align-top">
                  <td className="px-3 py-2">Scanned or image-only pages</td>
                  <td className="px-3 py-2">
                    The page looks like a picture and copied text is empty or
                    meaningless
                  </td>
                  <td className="px-3 py-2">
                    <Link className="underline" href="/tools/ocr">
                      Image OCR
                    </Link>
                  </td>
                </tr>
                <tr className="align-top">
                  <td className="px-3 py-2">A mixture</td>
                  <td className="px-3 py-2">
                    Some pages have selectable text and others are scans
                  </td>
                  <td className="px-3 py-2">
                    Use the method that matches each page; OCR can handle the
                    image pages
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            PDF is a container format that may include both text and still
            images, so a file ending in <code className="text-xs">.pdf</code>{" "}
            does not tell you which kind of content every page contains. The
            Library of Congress describes PDF as supporting text and still-image
            content.{" "}
            <a
              className="underline"
              href="https://www.loc.gov/preservation/digital/formats/fdd/fdd000030.shtml"
            >
              PDF format overview
            </a>
          </p>
        </ContentSection>

        <ContentSection title="What PDF text extraction does">
          <p>
            Text extraction reads the document’s existing text layer. It is
            closer to copying text from a page than to reading the page
            visually. The extractor can preserve the words that the PDF exposes,
            but it does not invent a text layer for a photograph or scan.
          </p>
          <p>
            ZANCTA’s{" "}
            <Link className="underline" href="/tools/pdf-text-extractor">
              PDF Text Extractor
            </Link>{" "}
            reads pages in a local PDF worker, joins the extracted page text,
            and lets you search, copy, or download it as a text file. It accepts
            one PDF up to 50 MB and reports when no embedded text is found.
          </p>
        </ContentSection>

        <ContentSection title="What OCR does">
          <p>
            Optical character recognition, or OCR, analyzes pixels and predicts
            the characters represented by those pixels. It is useful when a page
            is a scan, photograph, or image-only PDF. OCR is an interpretation
            step, so the result can contain mistakes even when the page looks
            clear.
          </p>
          <p>
            ZANCTA Image OCR uses Tesseract.js in a browser Worker. English
            image OCR is free. Premium Local OCR Power adds Hindi, Bengali,
            Tamil, Spanish, French, and German language packs, plus scanned-PDF
            OCR up to 20 pages. Images are limited to 20 MB; PDFs use a separate
            50 MB limit.
          </p>
          <p>
            For background on OCR as a recognition process, see Adobe’s{" "}
            <a
              className="underline"
              href="https://www.adobe.com/acrobat/resources/what-is-ocr.html"
            >
              OCR explanation
            </a>{" "}
            and the{" "}
            <a
              className="underline"
              href="https://tesseract-ocr.github.io/tessdoc/"
            >
              Tesseract documentation
            </a>
            .
          </p>
        </ContentSection>

        <ContentSection title="How to tell whether a PDF needs OCR">
          <p>
            Try selecting a sentence in a PDF viewer and copying it into a
            plain-text field. Meaningful, complete words usually indicate an
            embedded text layer. Empty output, one large image-like selection,
            or unreadable fragments suggest that the page may be image-only.
          </p>
          <p>
            This is a practical check, not an infallible test. A PDF can contain
            unusual fonts, broken text positioning, protected content, or both
            text and image pages. The reliable test is to run a small copy
            through{" "}
            <Link className="underline" href="/tools/pdf-text-extractor">
              PDF Text Extractor
            </Link>{" "}
            and inspect whether useful text is returned.
          </p>
        </ContentSection>

        <ContentSection title="PDF Text Extractor vs OCR">
          <div className="space-y-3">
            <p>
              <strong className="text-foreground">
                Choose text extraction when:
              </strong>{" "}
              the PDF was exported from a word processor, contains searchable
              text, or you need to preserve the document’s existing text without
              recognition guesses.
            </p>
            <p>
              <strong className="text-foreground">Choose OCR when:</strong> the
              pages are scans or photos, ordinary extraction returns no useful
              text, or the PDF contains image pages that need recognition.
            </p>
            <p>
              <strong className="text-foreground">
                Do not assume OCR is always better:
              </strong>{" "}
              it adds an interpretation step and may misread blur, low contrast,
              unusual type, handwriting, stamps, tables, or mixed scripts.
            </p>
          </div>
        </ContentSection>

        <ContentSection title="Which ZANCTA tool should you use?">
          <p>
            Start with{" "}
            <Link className="underline" href="/tools/pdf-text-extractor">
              PDF Text Extractor
            </Link>{" "}
            for a text-native PDF. It does not OCR scanned pages. If the file is
            an image-only scan, use{" "}
            <Link className="underline" href="/tools/ocr">
              Image OCR
            </Link>
            ; scanned-PDF OCR is a Premium capability capped at 20 pages.
          </p>
          <p>
            If you only need to inspect or OCR one page,{" "}
            <Link className="underline" href="/tools/pdf-to-images">
              PDF to Images
            </Link>{" "}
            can render PDF pages as images first. That is a conversion step, not
            a replacement for OCR.
          </p>
        </ContentSection>

        <ContentSection title="What can go wrong">
          <p>
            <strong className="text-foreground">Image-only pages:</strong>{" "}
            ordinary extraction can correctly return no text because there is no
            text layer to read.
          </p>
          <p>
            <strong className="text-foreground">Mixed PDFs:</strong> some pages
            may extract normally while scanned pages need recognition. ZANCTA’s
            OCR path probes pages individually and retains embedded text where
            it is available while recognizing image pages.
          </p>
          <p>
            <strong className="text-foreground">Poor scans:</strong> low light,
            blur, decorative fonts, handwriting, stamps, dense tables, tiny
            type, and mixed scripts can reduce OCR quality. Empty or incorrect
            output is possible.
          </p>
          <p>
            <strong className="text-foreground">
              Unsupported or damaged files:
            </strong>{" "}
            password-protected, corrupt, or unusual PDFs can fail before either
            method produces text. Unlock or repair the document first, then
            retry with a small sample.
          </p>
        </ContentSection>

        <ContentSection title="Privacy and browser processing">
          <p>
            For these implemented ZANCTA workflows, supported file processing
            occurs in the browser after the required application assets load.
            The selected PDF is not posted to a ZANCTA processing API. OCR
            recognition runs in a browser Worker; Premium language data loads
            only when selected and authorized.
          </p>
          <p>
            This describes file processing, not an entire offline session. The
            page still loads HTML, JavaScript, fonts, and other assets. Optional
            analytics may record tool events without sending the file or
            recognized text. See{" "}
            <Link
              className="underline"
              href="/guides/browser-ocr-without-uploading"
            >
              how browser OCR works without uploading
            </Link>{" "}
            and the broader{" "}
            <Link className="underline" href="/guides/local-processing">
              local processing guide
            </Link>
            .
          </p>
        </ContentSection>

        <ContentSection title="Troubleshooting">
          <p>1. Try a single page or a small representative file first.</p>
          <p>
            2. Copy a visible sentence from the PDF. If the copied result is
            empty or unusable, test the file with PDF Text Extractor.
          </p>
          <p>
            3. If the extractor reports no embedded text, switch to Image OCR
            for a scan.
          </p>
          <p>
            4. For OCR, improve contrast and alignment where possible, select
            the correct language, and expect recognition errors on handwriting,
            stamps, tables, or blurred images.
          </p>
          <p>
            5. If a mixed PDF behaves unexpectedly, split or render the relevant
            pages and test them separately.
          </p>
        </ContentSection>

        <ContentSection title="Bottom line" className="md:col-span-2">
          <p>
            Extraction reads text that is already present. OCR recognizes text
            from pixels. Use the extractor for text-native PDFs, OCR for scans,
            and treat mixed PDFs page by page. Neither method guarantees perfect
            output, so inspect the result before relying on it.
          </p>
        </ContentSection>

        <ContentSection title="Sources" className="md:col-span-2">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <a
                className="underline"
                href="https://www.loc.gov/preservation/digital/formats/fdd/fdd000030.shtml"
              >
                Library of Congress: PDF format family
              </a>{" "}
              — PDF content categories and text/image capabilities.
            </li>
            <li>
              <a
                className="underline"
                href="https://www.adobe.com/acrobat/resources/what-is-ocr.html"
              >
                Adobe Acrobat: What is OCR?
              </a>{" "}
              — general OCR explanation.
            </li>
            <li>
              <a
                className="underline"
                href="https://tesseract-ocr.github.io/tessdoc/"
              >
                Tesseract documentation
              </a>{" "}
              — OCR engine documentation.
            </li>
          </ul>
        </ContentSection>
      </ContentPage>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            jsonLdBreadcrumbList([
              { name: "Home", path: "/" },
              { name: "Local processing", path: "/guides/local-processing" },
              { name: "PDF text extraction vs OCR", path: PATH },
            ]),
          ),
        }}
      />
    </>
  );
}
