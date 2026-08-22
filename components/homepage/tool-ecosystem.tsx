import Link from "next/link";
import { TOOLS } from "@/lib/tools";
import { MaskLines } from "@/components/marketing/motion";

const CATEGORIES = [
  { title: "PDF tools", detail: "Merge, split, compress, convert pages, and build PDFs from images." },
  { title: "Image tools", detail: "Compress, convert, resize, and clean metadata." },
  { title: "Extract tools", detail: "OCR for images and embedded text extraction from PDFs." },
  { title: "Other tools", detail: "Background removal is clearly marked deferred while licensing is verified." },
];

function categorySlugs(index: number): string[] {
  switch (index) {
    case 0:
      return ["pdf-merge", "pdf-split", "pdf-compress", "pdf-to-images", "images-to-pdf"];
    case 1:
      return ["image-compress", "image-convert", "image-resize", "exif-cleaner"];
    case 2:
      return ["ocr", "pdf-text-extractor"];
    default:
      return ["background-remover"];
  }
}

export function ToolEcosystemSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-[80rem] px-5 py-14 md:px-8 md:py-20">
        <div className="max-w-3xl">
          <MaskLines
            as="h2"
            className="display-serif text-4xl md:text-5xl"
            lines={[<>A focused suite</>, <>for file work.</>]}
          />
          <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground">
            {TOOLS.filter((t) => t.available).length} working local workflows, one clearly deferred capability.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((category, index) => (
            <article key={category.title} className="card-surface flex h-full flex-col p-5">
              <h3 className="text-sm font-semibold">{category.title}</h3>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">{category.detail}</p>
              <ul className="mt-4 space-y-1.5 border-t border-border pt-4 text-xs text-muted-foreground">
                {categorySlugs(index).map((slug) => {
                  const tool = TOOLS.find((t) => t.slug === slug);
                  if (!tool) return null;
                  return (
                    <li key={slug}>
                      <Link href={`/tools/${slug}`} className="transition-colors hover:text-accent-soft">
                        {tool.name}
                        {!tool.available && <span className="ml-1.5 text-warning">· deferred</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <Link href="/tools" className="premium-button premium-button-secondary">
            Explore all tools <span aria-hidden>→</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Walkthroughs:{" "}
            <Link href="/guides/compress-pdf-without-uploading" className="underline underline-offset-4 hover:text-foreground">compress PDF</Link>
            {", "}
            <Link href="/guides/split-pdf-without-uploading" className="underline underline-offset-4 hover:text-foreground">split PDF</Link>
            {", "}
            <Link href="/guides/remove-exif-before-sharing" className="underline underline-offset-4 hover:text-foreground">remove EXIF</Link>
            {" · "}
            <Link href="/guides/local-processing" className="underline underline-offset-4 hover:text-foreground">local processing</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
