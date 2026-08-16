import { Navigation, Footer } from "@/components/marketing/nav";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <>
      <Navigation />
      <main className="mx-auto max-w-3xl px-6 py-12 prose prose-invert dark">
        <h1 className="text-3xl font-semibold">Privacy</h1>
        <p className="text-sm text-muted-foreground mt-3">Your file bytes remain on your device during MVP processing.</p>
        <h2 className="font-medium mt-8">What stays local (MVP)</h2>
        <ul className="text-sm text-muted-foreground list-disc pl-5">
          <li>All 10 tools process files locally in your browser — no upload.</li>
          <li>No server storage of files.</li>
        </ul>
        <h2 className="font-medium mt-6">Network activity</h2>
        <ul className="text-sm text-muted-foreground list-disc pl-5">
          <li>Page and asset requests from the CDN.</li>
          <li>Anonymized analytics, with file content and filenames excluded.</li>
          <li>Future HD/cloud fallback — explicit opt-in only, disclosed here when live.</li>
        </ul>
      </main>
      <Footer />
    </>
  );
}
