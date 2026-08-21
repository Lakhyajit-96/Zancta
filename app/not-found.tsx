import Link from "next/link";
import { Footer, Navigation } from "@/components/marketing/nav";

export default function NotFound() {
  return (
    <>
      <Navigation />
      <main className="mx-auto flex min-h-[70vh] max-w-[40rem] flex-col justify-center px-5 py-16">
      <p className="eyebrow">404</p>
      <h1 className="display-serif mt-4 text-4xl">This page is not available.</h1>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">
        The address may be mistyped, or the page may have moved. The tool catalog is the usual next step.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/tools" className="premium-button premium-button-primary">
          Open a tool
        </Link>
        <Link href="/" className="premium-button premium-button-secondary">
          Home
        </Link>
      </div>
    </main>
    <Footer />
    </>
  );
}
