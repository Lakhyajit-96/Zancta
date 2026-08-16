import Link from "next/link";
import { TOOLS } from "@/lib/tools";

export function ToolGrid() {
  const pdf = TOOLS.filter((t) => t.category === "pdf");
  const img = TOOLS.filter((t) => t.category === "image");
  return (
    <div className="space-y-14">
      <ToolSection title="PDF tools" tools={pdf} />
      <ToolSection title="Image tools" tools={img} />
    </div>
  );
}

function ToolSection({ title, tools }: { title: string; tools: typeof TOOLS }) {
  return (
    <div>
      <div className="mb-5 flex items-center justify-between border-b border-border pb-3">
        <h3 className="eyebrow">{title}</h3>
        <span className="font-mono text-[0.65rem] text-muted-foreground">{String(tools.length).padStart(2, "0")} tools</span>
      </div>
      <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((t, index) => (
          <li key={t.slug} className="group border border-border bg-surface p-5 transition-colors hover:border-accent/40 hover:bg-surface-hover">
            <Link href={`/tools/${t.slug}`} className="block min-h-40 focus:outline-none">
              <div className="mb-8 flex items-start justify-between">
                <span className="font-mono text-[0.65rem] text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                <span className="text-lg text-accent opacity-0 transition-opacity group-hover:opacity-100" aria-hidden>↗</span>
              </div>
              <h4 className="font-medium tracking-tight transition-colors group-hover:text-accent">{t.name}</h4>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{t.description}</p>
              <span className="mt-4 block text-[0.68rem] uppercase tracking-[0.12em] text-muted-foreground">{t.processingType === "bg" ? "Deferred status" : "Open tool"}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
