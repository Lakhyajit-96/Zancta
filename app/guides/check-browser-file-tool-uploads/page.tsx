import Link from "next/link";
import {
  ContentPage,
  ContentSection,
} from "@/components/marketing/content-page";
import { jsonLdBreadcrumbList, pageMeta } from "@/lib/seo";

const PATH = "/guides/check-browser-file-tool-uploads";

export const metadata = pageMeta(PATH, {
  title: "How to check whether a browser file tool uploads your file",
  description:
    "Use a browser Network panel and a synthetic test file to investigate whether a file-processing tool sends file data to a server.",
});

export default function CheckBrowserFileToolUploadsGuidePage() {
  return (
    <>
      <ContentPage
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Local processing", href: "/guides/local-processing" },
          { name: "Check browser file uploads" },
        ]}
        eyebrow={PATH}
        title="How to check whether a browser file tool uploads your file"
        intro="The practical way to investigate a browser file workflow is to watch its network requests while you select and process a harmless test file. Look at the request method, destination, content type, body, and timing. A request by itself is not proof of an upload, and one clean run is not a universal privacy guarantee."
      >
        <ContentSection title="Quick verification checklist">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Open a clean browser session and the tool you want to investigate.
            </li>
            <li>
              Open Developer Tools, choose Network, and enable request
              recording. Preserve the log if a reload is needed.
            </li>
            <li>
              Clear old requests, then select a synthetic file with a
              distinctive harmless marker.
            </li>
            <li>Perform exactly one processing operation.</li>
            <li>
              Inspect requests generated during the operation, especially
              Fetch/XHR and requests with a body.
            </li>
            <li>
              Check the URL, method, content type, payload or form data, request
              size, initiator, and response.
            </li>
            <li>Repeat after a fresh reload if the first run is ambiguous.</li>
          </ol>
        </ContentSection>

        <ContentSection title="What “uploading your file” means">
          <p>
            A browser may download JavaScript, CSS, fonts, images, a Web Worker,
            WebAssembly, or an OCR language file. It may also make a
            configuration, entitlement, session, or analytics request. Those are
            network activities, but they do not automatically contain the bytes
            of the file you selected.
          </p>
          <p>
            The question is whether the application sends the file itself, or a
            transformed representation of its contents, to a server. That
            requires inspecting the relevant request rather than inferring from
            timing alone.
          </p>
        </ContentSection>

        <ContentSection title="Step-by-step in Chrome or Chromium">
          <p>
            Open Developer Tools before selecting the file, then open the
            Network panel. Chrome records requests while DevTools is open; the
            panel can clear the request list, filter by resource type, and show
            request headers, payload, response, initiator, and timing details.
            See the official{" "}
            <a
              className="underline"
              href="https://developer.chrome.com/docs/devtools/network/overview"
            >
              Chrome Network panel documentation
            </a>
            .
          </p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Reload the tool with the Network panel already open.</li>
            <li>
              Clear the log after the page has settled, or mark the initial-load
              requests mentally.
            </li>
            <li>Select the synthetic test file and run one operation.</li>
            <li>
              Filter to Fetch/XHR when useful, but also inspect other request
              types if the workflow loads a worker or model.
            </li>
            <li>
              Open suspicious requests and inspect Headers, Payload, Initiator,
              and Timing.
            </li>
            <li>
              Look for multipart form data, a binary body, a file name, a
              recognizable marker, or a request size consistent with the
              selected file.
            </li>
          </ol>
        </ContentSection>

        <ContentSection title="Firefox and Edge">
          <p>
            Firefox calls its equivalent the Network Monitor. Open it from Web
            Developer Tools, start recording before the workflow, and select a
            request to inspect its details. The{" "}
            <a
              className="underline"
              href="https://firefox-source-docs.mozilla.org/devtools-user/network_monitor/index.html"
            >
              Firefox Network Monitor documentation
            </a>{" "}
            describes the request list and detail view.
          </p>
          <p>
            Microsoft Edge provides a Network tool in its Chromium-based
            DevTools. Its controls and request details are similar to Chrome,
            but labels can vary by browser version. Use the{" "}
            <a
              className="underline"
              href="https://learn.microsoft.com/en-us/microsoft-edge/devtools-guide-chromium/network/"
            >
              Microsoft Edge Network tool documentation
            </a>{" "}
            for the current interface.
          </p>
        </ContentSection>

        <ContentSection title="What to look for">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
              <caption className="sr-only">
                Network observations and what to investigate
              </caption>
              <thead>
                <tr className="border-b border-border text-foreground">
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Observation
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    What it may indicate
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Next check
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border align-top">
                  <td className="px-3 py-2">
                    POST, PUT, or PATCH with multipart/form-data
                  </td>
                  <td className="px-3 py-2">
                    Possible file or form submission
                  </td>
                  <td className="px-3 py-2">
                    Open Payload and inspect the form fields and body size.
                  </td>
                </tr>
                <tr className="border-b border-border align-top">
                  <td className="px-3 py-2">
                    Payload includes a file name, marker, or recognizable file
                    bytes
                  </td>
                  <td className="px-3 py-2">
                    Strong evidence that file-related data was sent
                  </td>
                  <td className="px-3 py-2">
                    Check the destination, encoding, initiator, and whether the
                    data is the original or a transformed file.
                  </td>
                </tr>
                <tr className="border-b border-border align-top">
                  <td className="px-3 py-2">
                    A large request begins after file selection
                  </td>
                  <td className="px-3 py-2">
                    Could be file data, but size alone is not conclusive
                  </td>
                  <td className="px-3 py-2">
                    Inspect content type and payload instead of relying on
                    timing or size.
                  </td>
                </tr>
                <tr className="border-b border-border align-top">
                  <td className="px-3 py-2">
                    GET for JavaScript, WASM, or a language/model asset
                  </td>
                  <td className="px-3 py-2">
                    The browser is loading application resources
                  </td>
                  <td className="px-3 py-2">
                    Check whether the request contains a body; a normal GET
                    asset request does not by itself show a file upload.
                  </td>
                </tr>
                <tr className="border-b border-border align-top">
                  <td className="px-3 py-2">
                    Analytics or entitlement request without file content
                  </td>
                  <td className="px-3 py-2">
                    Event, session, or feature-state traffic
                  </td>
                  <td className="px-3 py-2">
                    Inspect fields and destination; do not label it an upload
                    without file evidence.
                  </td>
                </tr>
                <tr className="align-top">
                  <td className="px-3 py-2">
                    Same-origin request without a body
                  </td>
                  <td className="px-3 py-2">
                    Navigation, configuration, or session activity
                  </td>
                  <td className="px-3 py-2">
                    A body-less request does not transmit the selected file in
                    that request, but continue checking the full workflow.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </ContentSection>

        <ContentSection title="Use a unique test marker">
          <p>
            Create a harmless test file containing a distinctive string, such as
            <code className="text-xs"> ZANCTA-NETWORK-CHECK-2026 </code>, where
            the format allows it. Searching request payloads for that marker can
            help distinguish ordinary application traffic from the contents of
            your test file.
          </p>
          <p>
            This is a useful signal, not a perfect detector. The file could be
            compressed, encrypted, encoded, rendered to pixels, or transformed
            before transmission. Inspect the request structure and body
            characteristics as well, and avoid placing real private information
            in a test fixture.
          </p>
        </ContentSection>

        <ContentSection title="What the test can and cannot prove">
          <p>
            A network inspection is evidence about a particular browser,
            deployment, fixture, workflow, and test time. It can show that a
            request with file-like data was observed, or that no request body
            was observed in the captured run. It cannot establish that every
            future version, browser extension, device, account state, or network
            condition will behave identically.
          </p>
          <p>
            In particular, the absence of a literal marker or request body is
            not a mathematical proof that a file can never be transmitted. If
            the result matters, repeat the test in the browser and account state
            you actually plan to use.
          </p>
        </ContentSection>

        <ContentSection title="ZANCTA: scoped production observation">
          <p>
            The Phase 8F research harness captured four workflows against
            <a className="underline" href="https://zancta.tech">
              {" "}
              zancta.tech
            </a>{" "}
            in Chromium via Playwright. The final run was timestamped
            <code className="text-xs"> 2026-09-14T18:29:17.883Z </code> and
            recorded production commit{" "}
            <code className="text-xs">
              256d1ba022c87f15b353ed4410cb89ae9563e5b6
            </code>
            . The harness used synthetic fixtures and recorded request metadata
            rather than storing complete request bodies. The Chromium version
            was not captured in the artifact.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[38rem] border-collapse text-left text-sm">
              <caption className="sr-only">
                Scoped ZANCTA network observations
              </caption>
              <thead>
                <tr className="border-b border-border text-foreground">
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Workflow
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Requests
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    External
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Non-GET
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Bodies
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="px-3 py-2">EXIF Cleaner</td>
                  <td className="px-3 py-2">37</td>
                  <td className="px-3 py-2">0</td>
                  <td className="px-3 py-2">0</td>
                  <td className="px-3 py-2">0</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-3 py-2">OCR</td>
                  <td className="px-3 py-2">34</td>
                  <td className="px-3 py-2">0</td>
                  <td className="px-3 py-2">0</td>
                  <td className="px-3 py-2">0</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-3 py-2">PDF Text Extractor</td>
                  <td className="px-3 py-2">34</td>
                  <td className="px-3 py-2">0</td>
                  <td className="px-3 py-2">0</td>
                  <td className="px-3 py-2">0</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">PDF Compression</td>
                  <td className="px-3 py-2">29</td>
                  <td className="px-3 py-2">0</td>
                  <td className="px-3 py-2">0</td>
                  <td className="px-3 py-2">0</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            In those captured runs, no request body was recorded after file
            selection and processing. That is a scoped observation, not a
            universal guarantee. The harness also saw ordinary application
            resources. For OCR, observed resource paths included{" "}
            <code className="text-xs">/ocr/worker.min.js</code>,
            <code className="text-xs">
              /ocr/tesseract-core-relaxedsimd-lstm.wasm.js
            </code>
            , and <code className="text-xs">/ocr/eng.traineddata.gz</code>.
            These are worker, WebAssembly, and language-model resources; their
            download does not by itself show that the selected image or PDF was
            uploaded.
          </p>
        </ContentSection>

        <ContentSection title="Related ZANCTA resources">
          <p>
            The{" "}
            <Link className="underline" href="/guides/local-processing">
              local processing guide
            </Link>{" "}
            explains the broader application boundary. For OCR-specific
            behavior, see{" "}
            <Link
              className="underline"
              href="/guides/browser-ocr-without-uploading"
            >
              browser OCR without uploading
            </Link>
            . For a PDF choice between embedded-text extraction and OCR, see{" "}
            <Link
              className="underline"
              href="/guides/pdf-text-extraction-vs-ocr"
            >
              PDF text extraction vs OCR
            </Link>
            .
          </p>
          <p>
            You can apply the method to{" "}
            <Link className="underline" href="/tools/pdf-text-extractor">
              PDF Text Extractor
            </Link>
            ,{" "}
            <Link className="underline" href="/tools/ocr">
              OCR
            </Link>
            ,{" "}
            <Link className="underline" href="/tools/exif-cleaner">
              EXIF Cleaner
            </Link>
            , and{" "}
            <Link className="underline" href="/tools/pdf-compress">
              PDF Compression
            </Link>
            .
          </p>
        </ContentSection>

        <ContentSection title="Practical privacy checklist">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Use a synthetic fixture, not a real private document or
              photograph.
            </li>
            <li>Start recording before selecting the file.</li>
            <li>
              Inspect request bodies and destinations, not just the request
              count.
            </li>
            <li>
              Repeat after reload and note the browser, version, deployment, and
              workflow.
            </li>
            <li>
              Remember that extensions, the receiving service, and later sharing
              steps are outside this one test.
            </li>
          </ul>
        </ContentSection>

        <ContentSection title="Bottom line" className="md:col-span-2">
          <p>
            To investigate whether a browser file tool uploads your file,
            observe one controlled run in the browser Network panel and inspect
            the requests made during processing. File-like payloads, multipart
            form data, or a recognizable marker are stronger evidence than a
            request merely appearing after selection. Treat the result as scoped
            evidence, repeat it when the environment changes, and avoid turning
            one clean run into a universal privacy promise.
          </p>
        </ContentSection>

        <ContentSection title="Sources" className="md:col-span-2">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <a
                className="underline"
                href="https://developer.chrome.com/docs/devtools/network/overview"
              >
                Chrome DevTools: Network panel overview
              </a>{" "}
              — recording, filtering, and request details.
            </li>
            <li>
              <a
                className="underline"
                href="https://firefox-source-docs.mozilla.org/devtools-user/network_monitor/index.html"
              >
                Firefox Developer Tools: Network Monitor
              </a>{" "}
              — monitoring HTTP requests and request details.
            </li>
            <li>
              <a
                className="underline"
                href="https://learn.microsoft.com/en-us/microsoft-edge/devtools-guide-chromium/network/"
              >
                Microsoft Edge: Network tool
              </a>{" "}
              — Chromium-based network inspection workflow.
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
              { name: "Check browser file uploads", path: PATH },
            ]),
          ),
        }}
      />
    </>
  );
}
