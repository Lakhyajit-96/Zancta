import { Navigation, Footer } from "@/components/marketing/nav";
import { getTool, TOOLS } from "@/lib/tools";
import { buildMetadata, jsonLdSoftwareApp } from "@/lib/seo";
import { ToolShell } from "@/components/ui/tool-shell";
import Link from "next/link";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};
  return buildMetadata({ title: tool.seoTitle, description: tool.seoDescription, path: `/tools/${slug}` });
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  const related = tool.related.map((s) => TOOLS.find((t) => t.slug === s)).filter(Boolean) as typeof TOOLS;

  return (
    <>
      <Navigation />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link> <span aria-hidden> / </span>
          <Link href="/tools" className="hover:text-foreground">Tools</Link> <span aria-hidden> / </span>
          <span aria-current="page" className="text-foreground">{tool.name}</span>
        </nav>

        <div className="mt-6 max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight">{tool.h1}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{tool.longDescription}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
              <span aria-hidden className="h-2 w-2 rounded-full bg-success" /> Local — no upload
            </span>
            <span className="text-xs text-muted-foreground">Supports: {tool.supportedFormats.join(", ")} · Max {Math.round(tool.maxFileSize / 1024 / 1024)}MB/file · {tool.maxFiles} files</span>
          </div>
        </div>

        <div className="mt-8">
          <ToolShell tool={tool} />
        </div>

        {related.length > 0 && (
          <section className="mt-12 border-t pt-8">
            <h2 className="text-sm font-semibold">Related tools</h2>
            <ul className="mt-4 grid gap-4 md:grid-cols-3">
              {related.map((r) => (
                <li key={r.slug} className="rounded-lg border bg-surface p-4">
                  <Link href={`/tools/${r.slug}`} className="font-medium hover:text-accent">{r.name}</Link>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-12 border-t pt-8 max-w-3xl">
          <h2 className="text-sm font-semibold">FAQ</h2>
          <dl className="mt-4 space-y-4">
            {tool.faq.map((f) => (
              <div key={f.q} className="rounded-lg border bg-surface p-4">
                <dt className="text-sm font-medium">{f.q}</dt>
                <dd className="text-sm text-muted-foreground mt-1">{f.a}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-xs text-muted-foreground">
            {tool.slug === "background-remover"
              ? "Background removal is currently deferred — no model has been integrated. This page shows the validated UX contract and will process locally once a commercially verified model is approved."
              : "Processing runs locally in your browser via Web Workers — no upload. Outputs are generated on-device and validated before download."}
          </p>
        </section>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSoftwareApp(tool)) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: tool.faq.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            }),
          }}
        />
      </main>
      <Footer />
    </>
  );
}
