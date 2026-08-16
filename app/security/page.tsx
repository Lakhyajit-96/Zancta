import { Navigation, Footer } from "@/components/marketing/nav";

export const metadata = { title: "Security" };

export default function Security() {
  return (
    <>
      <Navigation />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-semibold">Security</h1>
        <p className="mt-3 text-sm text-muted-foreground">Local browser processing, CSP headers, file validation before processing, and no execution of embedded PDF JavaScript.</p>
        <p className="mt-2 text-xs text-muted-foreground">A dedicated security contact channel will be published when available.</p>
      </main>
      <Footer />
    </>
  );
}
