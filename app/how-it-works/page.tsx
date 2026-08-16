import { ContentPage, ContentSection } from "@/components/marketing/content-page";

export const metadata = { title: "How it works", description: "How ZANCTA validates, processes, and returns files in the browser." };

export default function HowItWorksPage() {
  return <ContentPage eyebrow="HOW IT WORKS" title="From selected file to local output." intro="The workflow is intentionally straightforward. You can inspect the limits and privacy message before choosing a file.">
    <ol className="grid gap-4 md:grid-cols-2">{[["01", "Choose a tool", "Open a specific PDF or image tool and review its supported inputs, output behavior, and limits."],["02", "Select a file", "Choose files through the browser file picker or drop zone. Client-side validation checks type, count, and size."],["03", "Process locally", "For the implemented local engines, the browser reads the selected bytes and generates the result on-device. No file upload is required."],["04", "Review and download", "The interface reports completion, names the output, and exposes a download action. You can process another file afterward."]].map(([n,t,d]) => <li key={n} className="rounded-xl border bg-surface p-5"><span className="font-mono text-xs text-accent">{n}</span><h2 className="mt-3 text-lg font-semibold">{t}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{d}</p></li>)}</ol>
    <ContentSection title="What local means here"><p>Local means the supported operation runs in the browser using the selected file. It does not mean the entire browser session is offline, and it does not cover future cloud features unless they are explicitly introduced and opt-in.</p></ContentSection>
  </ContentPage>;
}
