import Link from "next/link";
import { TOOLS } from "@/lib/tools";
import { MaskLines } from "@/components/marketing/motion";
import { ToolGrid } from "@/components/marketing/tool-grid";

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

        <div className="mt-12">
          <ToolGrid />
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <Link href="/tools" className="premium-button premium-button-secondary">
            Explore all tools <span aria-hidden>→</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Walkthroughs live in{" "}
            <Link href="/help" className="underline underline-offset-4 hover:text-foreground">Help</Link>
            {" · "}
            <Link href="/guides/local-processing" className="underline underline-offset-4 hover:text-foreground">local processing</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
