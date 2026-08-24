import Link from "next/link";
import { BingSubmitForm } from "@/components/admin/integration-actions";
import { JsonBlock, StateBanner } from "@/components/admin/integration-ui";
import { loadBingDashboard } from "@/lib/integrations/bing/dashboard";
import { BING_UNSUPPORTED } from "@/lib/integrations/bing/webmaster";

export const dynamic = "force-dynamic";

export default async function BingIntegrationsPage() {
  const dash = await loadBingDashboard();
  const fallback = "queries" in dash ? dash.queries : dash.token;
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-12">
      <p className="text-sm"><Link className="underline" href="/admin/integrations">All integrations</Link></p>
      <h1 className="text-2xl font-bold">Bing Webmaster</h1>
      <p className="text-sm text-muted-foreground">
        {dash.connection.status.replaceAll("_", " ")}
        {"siteUrl" in dash && dash.siteUrl ? ` · ${dash.siteUrl}` : ""}
      </p>
      <p className="text-xs text-muted-foreground">
        Last success: {dash.connection.lastSuccessAt ?? "never"}
        {" · "}Last failure: {dash.connection.lastFailureAt ?? "none"}
        {" · "}Latency: {dash.connection.lastLatencyMs ?? "—"} ms
      </p>
      <div className="flex gap-3">
        <a className="rounded-md border border-border px-3 py-2 text-sm" href="/api/admin/integrations/bing/connect">
          Connect Bing
        </a>
        <form action="/api/admin/integrations/bing/disconnect" method="post">
          <button className="rounded-md border border-border px-3 py-2 text-sm" type="submit">Disconnect</button>
        </form>
      </div>
      <StateBanner result={fallback ?? { state: "DATA_UNAVAILABLE", data: null, message: "Not loaded." }} />
      {"queries" in dash && dash.queries ? (
        <>
          <JsonBlock title="Query stats" result={dash.queries} />
          <JsonBlock title="Page stats" result={dash.pages!} />
          <JsonBlock title="Rank and traffic" result={dash.traffic!} />
          <JsonBlock title="Crawl stats" result={dash.crawl!} />
          <JsonBlock title="Crawl issues" result={dash.issues!} />
          <JsonBlock title="Crawl control / settings" result={dash.crawlSettings!} />
          <JsonBlock title="Feeds / sitemaps" result={dash.feeds!} />
          <JsonBlock title="Site explorer" result={dash.explorer!} />
          <JsonBlock title="Link counts / backlinks" result={dash.links!} />
          <JsonBlock title="Keyword research" result={dash.keywords!} />
          <JsonBlock title="URL submission quota" result={dash.quota!} />
        </>
      ) : null}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Submit URL</h2>
        <BingSubmitForm />
      </section>
      <section className="space-y-2 text-sm text-muted-foreground">
        <p>{BING_UNSUPPORTED.aiPerformance}</p>
        <p>{BING_UNSUPPORTED.requestIndexingGoogleStyle}</p>
        <p>{BING_UNSUPPORTED.soap}</p>
        <p>{BING_UNSUPPORTED.indexNow}</p>
        <p>{BING_UNSUPPORTED.siteScan}</p>
      </section>
    </main>
  );
}
