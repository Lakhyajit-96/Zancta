import { Navigation, Footer } from "@/components/marketing/nav";
import { ToolGrid } from "@/components/marketing/tool-grid";
export const metadata = { title: "Tools — LocalFile" };
export default function ToolsPage() {
  return (<><Navigation /><main className="mx-auto max-w-6xl px-6 py-12"><h1 className="text-3xl font-semibold">Tools</h1><p className="mt-2 text-sm text-muted-foreground">10 local-first tools — no upload, no watermark.</p><div className="mt-8"><ToolGrid /></div></main><Footer /></>);
}
