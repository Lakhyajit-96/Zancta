import Link from "next/link";
import { TOOLS } from "@/lib/tools";

export function ToolGrid() {
  const pdf = TOOLS.filter((t) => t.category === "pdf");
  const img = TOOLS.filter((t) => t.category === "image");
  return (
    <div className="space-y-10">
      <ToolSection title="PDF tools" tools={pdf} />
      <ToolSection title="Image tools" tools={img} />
    </div>
  );
}

function ToolSection({ title, tools }: { title: string; tools: typeof TOOLS }) {
  return (
    <div>
      <h3 className="text-sm font-semibold tracking-wide text-muted-foreground mb-4">{title}</h3>
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((t) => (
          <li key={t.slug} className="rounded-lg border bg-surface p-5 hover:bg-elevated transition-colors">
            <Link href={`/tools/${t.slug}`} className="block space-y-2 focus:outline-none">
              <h4 className="font-medium">{t.name}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2">{t.description}</p>
              <span className="text-xs text-accent-soft">{t.processingType === "bg" ? "View status →" : "Open →"}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
