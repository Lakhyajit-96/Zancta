import Link from "next/link";
import {
  ContentPage,
  ContentSection,
} from "@/components/marketing/content-page";
import { jsonLdBreadcrumbList, pageMeta } from "@/lib/seo";

const PATH = "/guides/exif-data-before-sharing";

export const metadata = pageMeta(PATH, {
  title: "What EXIF Data Can Reveal Before You Share a Photo",
  description:
    "Learn what EXIF and image metadata can reveal, how to inspect it, and what a metadata-cleaning workflow can and cannot establish before sharing a photo.",
});

export default function ExifDataBeforeSharingGuidePage() {
  return (
    <>
      <ContentPage
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Local processing", href: "/guides/local-processing" },
          { name: "EXIF data before sharing" },
        ]}
        eyebrow={PATH}
        title="What EXIF data can reveal before you share a photo"
        intro="A photo can carry information alongside its visible pixels. Depending on the camera, application, format, and export workflow, that information may include device details, dates, software notes, or GPS coordinates. Inspecting the file before sharing helps you understand what is actually present; metadata cleanup does not anonymize the visible image."
      >
        <ContentSection title="Direct answer">
          <p>
            EXIF and related image metadata can reveal facts about how a file
            was captured or edited, and GPS metadata can reveal a location when
            it is present. Not every image contains the same fields.
            Screenshots, exports, edited copies, and images passed through
            different applications may carry different metadata from the
            original camera file.
          </p>
          <p>
            The safest practical question is not “Does every photo contain
            EXIF?” but “What does this particular file contain, and do I want to
            share it?”
          </p>
        </ContentSection>

        <ContentSection title="What EXIF data is">
          <p>
            EXIF, short for Exchangeable Image File Format, is a set of image
            metadata fields commonly used by cameras and imaging software.
            Metadata is information stored in the file structure around the
            image data. It is different from the visible pixels that make up the
            photograph.
          </p>
          <p>
            EXIF is only one metadata family. Images can also contain IPTC, XMP,
            ICC color-profile information, format-specific chunks, thumbnails,
            and application or vendor data. Which families exist depends on the
            device, software, and file format. The{" "}
            <a
              className="underline"
              href="https://www.cipa.jp/e/std/std-sec.html"
            >
              CIPA Exif standards
            </a>{" "}
            and{" "}
            <a
              className="underline"
              href="https://exiftool.org/exiftool_pod.html"
            >
              ExifTool documentation
            </a>{" "}
            describe these fields and metadata families in more detail.
          </p>
        </ContentSection>

        <ContentSection title="What information can EXIF reveal">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[38rem] border-collapse text-left text-sm">
              <caption className="sr-only">
                Examples of image metadata and what it may indicate
              </caption>
              <thead>
                <tr className="border-b border-border text-foreground">
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Metadata
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    What it may indicate
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Important qualification
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border align-top">
                  <td className="px-3 py-2">GPS coordinates</td>
                  <td className="px-3 py-2">
                    The location recorded by a device or application
                  </td>
                  <td className="px-3 py-2">
                    Only when GPS data exists and is accurate enough to be
                    useful.
                  </td>
                </tr>
                <tr className="border-b border-border align-top">
                  <td className="px-3 py-2">Camera make and model</td>
                  <td className="px-3 py-2">
                    The device family or capture source
                  </td>
                  <td className="px-3 py-2">
                    Some workflows remove or replace these fields.
                  </td>
                </tr>
                <tr className="border-b border-border align-top">
                  <td className="px-3 py-2">Capture or modification time</td>
                  <td className="px-3 py-2">
                    A timestamp associated with capture, editing, or export
                  </td>
                  <td className="px-3 py-2">
                    The field name and workflow determine what the time means.
                  </td>
                </tr>
                <tr className="border-b border-border align-top">
                  <td className="px-3 py-2">
                    Orientation and capture settings
                  </td>
                  <td className="px-3 py-2">
                    How the image should be displayed and some camera settings
                  </td>
                  <td className="px-3 py-2">
                    These are technical clues, not a complete account of the
                    scene.
                  </td>
                </tr>
                <tr className="align-top">
                  <td className="px-3 py-2">Software or editing information</td>
                  <td className="px-3 py-2">
                    That a program or workflow touched the file
                  </td>
                  <td className="px-3 py-2">
                    Availability and accuracy vary by application.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </ContentSection>

        <ContentSection title="GPS and location">
          <p>
            GPS fields can contain coordinates or related location information.
            If present, they may disclose where the device recorded the image. A
            photo does not need to display a map for its file metadata to
            contain location data.
          </p>
          <p>
            GPS was not generated in the controlled ZANCTA experiment described
            below. This guide therefore explains how to inspect GPS metadata,
            but it does not claim that the experiment demonstrated GPS removal.
          </p>
        </ContentSection>

        <ContentSection title="Camera, device, and software information">
          <p>
            Make and Model fields can identify a camera or device family when
            those fields are present. Software or editing fields may indicate
            that an application exported or modified the file. These clues are
            not always present, and they do not necessarily identify a person by
            themselves.
          </p>
          <p>
            A file can also disclose information through its filename, visible
            content, or later processing by the service receiving it. Metadata
            is one part of the sharing decision, not the whole decision.
          </p>
        </ContentSection>

        <ContentSection title="Dates and times">
          <p>
            A file may contain fields such as a camera capture time or a
            software modification time. Treat the meaning cautiously: a clock
            can be wrong, an application can rewrite a timestamp, and different
            fields can describe different stages of the workflow. A timestamp
            can describe timing, but it should not automatically be treated as
            proof of physical location.
          </p>
        </ContentSection>

        <ContentSection title="Metadata is not the same as image content">
          <p>
            Removing metadata does not remove information visible in the
            photograph. Faces, street signs, addresses, documents, screens,
            landmarks, uniforms, and text inside the image remain pixels. A
            recipient may also learn from the filename or from information the
            receiving platform generates after upload.
          </p>
          <p>
            Metadata cleanup can reduce embedded information in a copy of the
            file; it does not make the image itself anonymous or guarantee what
            another service will do with it later.
          </p>
        </ContentSection>

        <ContentSection title="How to inspect metadata yourself">
          <p>
            Use a metadata inspector on the exact file you plan to share. Look
            for GPS, camera/device fields, capture and modification times,
            software, IPTC, XMP, and profile information. Different tools expose
            different families, so an empty result in one viewer is not
            automatically a complete inventory.
          </p>
          <p>
            ExifTool is a widely used command-line inspector with documentation
            for EXIF, GPS, IPTC, XMP, ICC profiles, and format-specific data.
            The{" "}
            <a className="underline" href="https://exiftool.org/TagNames.pdf">
              ExifTool tag reference
            </a>{" "}
            is useful when you need to understand a field rather than just see
            that a file contains metadata. The{" "}
            <a
              className="underline"
              href="https://wwws.loc.gov/preservation/digital/formats/fdd/fdd000618.shtml"
            >
              Library of Congress Exif reference
            </a>{" "}
            provides additional format context.
          </p>
        </ContentSection>

        <ContentSection title="What metadata-cleaning tools actually do">
          <p>
            A cleaner may remove selected metadata blocks directly, or it may
            decode and re-encode the image so that much of the original file
            structure is not carried into the output. Re-encoding can change
            file size, compression, quality, color-profile information, or other
            container details.
          </p>
          <p>
            A successful cleanup of one field does not establish removal of
            every metadata family. Inspect the output again when the sharing
            risk is significant, and keep the original separately if you still
            need its capture information.
          </p>
        </ContentSection>

        <ContentSection title="What ZANCTA EXIF Cleaner does">
          <p>
            ZANCTA EXIF Cleaner accepts JPG/JPEG, PNG, and WebP images. The
            current limits are 50 MB per file, up to 20 files, and a maximum
            decoded dimension of 12,000 × 12,000 pixels. HEIC, SVG, RAW, and PDF
            are outside this image cleaner path.
          </p>
          <p>
            The implementation decodes the image in the browser, draws it to a
            canvas, and re-encodes it in the same image family where supported.
            JPEG and WebP use a quality value around 0.92 in this path. PNG is
            re-encoded without a JPEG/WebP quality parameter. This describes the
            implementation; it is not a claim that every possible metadata
            family is removed.
          </p>
          <p>
            To perform the cleanup, use the{" "}
            <Link className="underline" href="/tools/exif-cleaner">
              EXIF Cleaner tool
            </Link>{" "}
            or read the separate{" "}
            <Link
              className="underline"
              href="/guides/remove-exif-before-sharing"
            >
              removal guide
            </Link>
            .
          </p>
        </ContentSection>

        <ContentSection title="Controlled ZANCTA production observations">
          <p>
            The following observations came from the Phase 8F research harness
            at
            <code className="text-xs">
              {" "}
              https://zancta.tech/tools/exif-cleaner{" "}
            </code>
            using Chromium via Playwright. The run was timestamped
            <code className="text-xs"> 2026-09-14T18:29:17.883Z </code> and
            recorded commit{" "}
            <code className="text-xs">
              256d1ba022c87f15b353ed4410cb89ae9563e5b6
            </code>
            . The fixtures were synthetic; no personal photographs or real GPS
            coordinates were used. The results are controlled production
            observations, not an exhaustive metadata-removal benchmark.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
              <caption className="sr-only">
                Controlled ZANCTA metadata observations
              </caption>
              <thead>
                <tr className="border-b border-border text-foreground">
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Metadata or observation
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    What it can mean
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Evidence scope and limitation
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border align-top">
                  <td className="px-3 py-2">
                    JPEG: 3,202 → 2,424 bytes; 320 × 200 before and after
                  </td>
                  <td className="px-3 py-2">
                    The tested re-encode reduced this fixture’s file size.
                  </td>
                  <td className="px-3 py-2">
                    One synthetic JPEG; not a general compression result.
                  </td>
                </tr>
                <tr className="border-b border-border align-top">
                  <td className="px-3 py-2">
                    JPEG Make, Model, DateTime, DateTimeOriginal absent after
                    processing
                  </td>
                  <td className="px-3 py-2">
                    Those inserted fields were not present in the inspected
                    output.
                  </td>
                  <td className="px-3 py-2">
                    Pillow inspection; not exhaustive metadata coverage.
                  </td>
                </tr>
                <tr className="border-b border-border align-top">
                  <td className="px-3 py-2">
                    WebP: 1,220 → 1,474 bytes; 320 × 200 before and after
                  </td>
                  <td className="px-3 py-2">
                    The tested re-encode increased this fixture’s file size.
                  </td>
                  <td className="px-3 py-2">
                    One synthetic WebP; not a general compression result.
                  </td>
                </tr>
                <tr className="border-b border-border align-top">
                  <td className="px-3 py-2">
                    WebP inserted EXIF fields absent after processing
                  </td>
                  <td className="px-3 py-2">
                    The tested synthetic EXIF fields were not present in the
                    inspected output.
                  </td>
                  <td className="px-3 py-2">
                    Other WebP metadata families were not exhaustively tested.
                  </td>
                </tr>
                <tr className="border-b border-border align-top">
                  <td className="px-3 py-2">
                    PNG: 2,014 → 3,758 bytes; 320 × 200 before and after
                  </td>
                  <td className="px-3 py-2">
                    The tested PNG re-encode increased this fixture’s file size.
                  </td>
                  <td className="px-3 py-2">
                    One synthetic PNG; not a general compression result.
                  </td>
                </tr>
                <tr className="align-top">
                  <td className="px-3 py-2">
                    PNG Software, Comment, and Creation Time absent after
                    processing
                  </td>
                  <td className="px-3 py-2">
                    Those inserted textual fields were absent in the inspected
                    output.
                  </td>
                  <td className="px-3 py-2">
                    Other PNG chunks and metadata families were not exhaustively
                    tested.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            ICC profile information was observed in the JPEG and WebP output
            inspection. That is one reason this evidence should not be
            summarized as “all metadata removed.”
          </p>
        </ContentSection>

        <ContentSection title="What this experiment does not prove">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              It does not demonstrate universal GPS removal; no reliable GPS
              fixture was generated.
            </li>
            <li>
              It does not establish complete IPTC, XMP, MakerNotes, C2PA, or
              JUMBF removal.
            </li>
            <li>
              It does not establish complete ICC-profile behavior across
              browsers and formats.
            </li>
            <li>
              It does not predict every camera, application, browser, device, or
              future implementation.
            </li>
            <li>
              It does not make a photo anonymous or establish complete privacy.
            </li>
          </ul>
        </ContentSection>

        <ContentSection title="Practical checklist before sharing a photo">
          <ol className="list-decimal space-y-2 pl-5">
            <li>Inspect the exact file you plan to share.</li>
            <li>Check GPS specifically if location exposure matters.</li>
            <li>Review camera/device fields and timestamps where relevant.</li>
            <li>
              Inspect the visible image for faces, addresses, documents,
              screens, signs, landmarks, and text.
            </li>
            <li>
              Clean a copy when appropriate, then inspect the output again for
              higher-risk sharing.
            </li>
            <li>
              Remember that the receiving platform may process or add
              information independently.
            </li>
          </ol>
        </ContentSection>

        <ContentSection title="Related resources">
          <p>
            Use the{" "}
            <Link className="underline" href="/tools/exif-cleaner">
              EXIF Cleaner
            </Link>{" "}
            when you need to process a supported image. The{" "}
            <Link
              className="underline"
              href="/guides/remove-exif-before-sharing"
            >
              removal guide
            </Link>{" "}
            covers that workflow. For the broader browser-processing boundary,
            see{" "}
            <Link className="underline" href="/guides/local-processing">
              local processing
            </Link>
            .
          </p>
          <p>
            If you want to examine network behavior independently, use the{" "}
            <Link
              className="underline"
              href="/guides/check-browser-file-tool-uploads"
            >
              browser file-upload verification guide
            </Link>
            . For format tradeoffs, see{" "}
            <Link className="underline" href="/guides/jpg-vs-png-vs-webp">
              JPG vs PNG vs WebP
            </Link>
            .
          </p>
        </ContentSection>

        <ContentSection title="Bottom line" className="md:col-span-2">
          <p>
            EXIF and related metadata can reveal useful or sensitive information
            when those fields are present, including location, device, timing,
            and software details. Inspect the actual file before sharing.
            Metadata cleanup can reduce embedded information, but it is not the
            same as removing what the image visibly shows or guaranteeing what
            another service will do later. The ZANCTA observations above are
            specific to controlled synthetic fixtures and the tested fields, not
            a universal removal guarantee.
          </p>
        </ContentSection>

        <ContentSection title="Sources" className="md:col-span-2">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <a
                className="underline"
                href="https://www.cipa.jp/e/std/std-sec.html"
              >
                CIPA Exif standards
              </a>{" "}
              — Exif specifications for digital still cameras.
            </li>
            <li>
              <a
                className="underline"
                href="https://wwws.loc.gov/preservation/digital/formats/fdd/fdd000618.shtml"
              >
                Library of Congress: Exchangeable Image File Format
              </a>{" "}
              — format reference and standards context.
            </li>
            <li>
              <a
                className="underline"
                href="https://exiftool.org/exiftool_pod.html"
              >
                ExifTool application documentation
              </a>{" "}
              — metadata families and inspection capabilities.
            </li>
            <li>
              <a className="underline" href="https://exiftool.org/TagNames.pdf">
                ExifTool tag reference
              </a>{" "}
              — tag and format details.
            </li>
            <li>
              <a
                className="underline"
                href="https://www.iptc.org/std/photometadata/specification/IPTC-PhotoMetadata-2025.1.html"
              >
                IPTC Photo Metadata Standard
              </a>{" "}
              — broader photo metadata context.
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
              { name: "EXIF data before sharing", path: PATH },
            ]),
          ),
        }}
      />
    </>
  );
}
