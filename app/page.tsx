import { Navigation, Footer } from "@/components/marketing/nav";
import { Hero } from "@/components/marketing/hero";
import { ToolGrid } from "@/components/marketing/tool-grid";

export default function Home() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight">Privacy built into the architecture</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Your file bytes remain on your device during MVP processing. Files are handled in Web Workers — no upload, no server storage, no watermark. Analytics events are anonymized and never include file content or filenames.
            </p>
            <ul className="mt-6 grid gap-3 text-sm">
              <li className="flex gap-2"><span className="text-success">✓</span> No file upload for all 10 MVP tools</li>
              <li className="flex gap-2"><span className="text-success">✓</span> No server storage of your documents or images</li>
              <li className="flex gap-2"><span className="text-success">✓</span> Processing in browser — Web Workers off the main thread</li>
              <li className="flex gap-2"><span className="text-success">✓</span> PWA offline support — works without network after first visit</li>
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              Network activity: page/assets from CDN + anonymized <code>tool_view</code> events. Cloud processing (HD background removal, HEIC) will require explicit opt-in and is not part of MVP — see <a href="/privacy" className="underline">Privacy</a>.
            </p>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-6 py-10 border-t">
          <h2 className="text-xl font-semibold mb-6">Tool suite — 10 local-first tools</h2>
          <ToolGrid />
        </section>
        <section className="mx-auto max-w-6xl px-6 py-16 border-t">
          <h2 className="text-lg font-semibold">What stays local, what travels</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 text-sm">
            <div className="rounded-lg border bg-surface p-5">
              <h3 className="font-medium">Stays on device (MVP)</h3>
              <ul className="mt-3 list-disc pl-5 text-muted-foreground space-y-1">
                <li>PDF merge / split / compress bytes</li>
                <li>Image compress / convert / resize pixels</li>
                <li>EXIF cleaning by re-encode</li>
                <li>Background removal via small local model</li>
              </ul>
            </div>
            <div className="rounded-lg border bg-surface p-5">
              <h3 className="font-medium">May use network</h3>
              <ul className="mt-3 list-disc pl-5 text-muted-foreground space-y-1">
                <li>Page, JS, WASM, model assets from CDN</li>
                <li>Anonymized analytics (no file data)</li>
                <li>Future HD/cloud fallback — explicit opt-in only</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
