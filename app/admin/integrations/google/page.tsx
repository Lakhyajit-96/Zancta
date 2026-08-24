import Link from "next/link";
import { InspectForm, SitemapForm } from "@/components/admin/integration-actions";
import { JsonBlock, Metric, StateBanner } from "@/components/admin/integration-ui";
import { loadGoogleDashboard } from "@/lib/integrations/google/dashboard";
import { INDEXING_API_NOTE } from "@/lib/integrations/google/gsc";

export const dynamic = "force-dynamic";

export default async function GoogleIntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const dash = await loadGoogleDashboard(params.range ?? "28d", params.start, params.end);
  const fallback = "totals" in dash ? dash.totals : dash.token;
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-12">
      <p className="text-sm"><Link className="underline" href="/admin/integrations">All integrations</Link></p>
      <h1 className="text-2xl font-bold">Google Search Console + GA4</h1>
      <p className="text-sm text-muted-foreground">
        {dash.connection.status.replaceAll("_", " ")}
        {dash.connection.accountEmail ? ` · ${dash.connection.accountEmail}` : ""}
        {"property" in dash && dash.property ? ` · ${dash.property}` : ""}
        {dash.connection.ga4PropertyId ? ` · GA4 ${dash.connection.ga4PropertyId}` : ""}
      </p>
      <p className="text-xs text-muted-foreground">
        Last success: {dash.connection.lastSuccessAt ?? "never"}
        {" · "}Last failure: {dash.connection.lastFailureAt ?? "none"}
        {" · "}Latency: {dash.connection.lastLatencyMs ?? "—"} ms
        {" · "}Failures: {dash.connection.consecutiveFailures}
        {"fromCache" in dash && dash.fromCache ? " · cached" : ""}
      </p>
      <div className="flex gap-3">
        <a className="rounded-md border border-border px-3 py-2 text-sm" href="/api/admin/integrations/google/connect">
          Connect Google
        </a>
        <form action="/api/admin/integrations/google/disconnect" method="post">
          <button className="rounded-md border border-border px-3 py-2 text-sm" type="submit">Disconnect</button>
        </form>
      </div>
      <nav className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/integrations/google?range=7d">7 days</Link>
        <Link href="/admin/integrations/google?range=28d">28 days</Link>
        <Link href="/admin/integrations/google?range=90d">3 months</Link>
      </nav>
      <form className="flex flex-wrap items-end gap-2 text-sm" method="get">
        <input type="hidden" name="range" value="custom" />
        <label>Start <input className="rounded-md border border-border bg-background px-2 py-1" type="date" name="start" /></label>
        <label>End <input className="rounded-md border border-border bg-background px-2 py-1" type="date" name="end" /></label>
        <button className="rounded-md border border-border px-3 py-1" type="submit">Custom range</button>
      </form>
      <StateBanner result={fallback ?? { state: "DATA_UNAVAILABLE", data: null, message: "Not loaded." }} />
      {"totals" in dash && dash.totals?.data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Clicks" result={dash.totals} value={dash.totals.data.clicks} />
          <Metric label="Impressions" result={dash.totals} value={dash.totals.data.impressions} />
          <Metric label="CTR" result={dash.totals} value={dash.totals.data.ctr.toFixed(4)} />
          <Metric label="Position" result={dash.totals} value={dash.totals.data.position.toFixed(2)} />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Clicks" result={fallback ?? { state: "DATA_UNAVAILABLE", data: null, message: "Not loaded." }} />
          <Metric label="Impressions" result={fallback ?? { state: "DATA_UNAVAILABLE", data: null, message: "Not loaded." }} />
          <Metric label="CTR" result={fallback ?? { state: "DATA_UNAVAILABLE", data: null, message: "Not loaded." }} />
          <Metric label="Position" result={fallback ?? { state: "DATA_UNAVAILABLE", data: null, message: "Not loaded." }} />
        </div>
      )}
      {"queries" in dash && dash.queries ? (
        <>
          <JsonBlock title="Top queries" result={dash.queries} />
          <JsonBlock title="Top pages" result={dash.pages!} />
          <JsonBlock title="Countries" result={dash.countries!} />
          <JsonBlock title="Devices" result={dash.devices!} />
          <JsonBlock title="Search appearance" result={dash.appearance!} />
          <JsonBlock title="Daily trend" result={dash.daily!} />
          <JsonBlock title="Sitemaps" result={dash.sitemaps!} />
          <JsonBlock title="GA4 overview" result={dash.ga4Overview!} />
          <JsonBlock title="GA4 admin / property" result={dash.ga4Admin!} />
          <JsonBlock title="Acquisition" result={dash.acquisition!} />
          <JsonBlock title="Campaigns" result={dash.campaigns!} />
          <JsonBlock title="Landing pages" result={dash.landingPages!} />
          <JsonBlock title="GA4 pages" result={dash.topPages!} />
          <JsonBlock title="GA4 countries" result={dash.ga4Countries!} />
          <JsonBlock title="GA4 devices" result={dash.ga4Devices!} />
          <JsonBlock title="Browsers" result={dash.browsers!} />
          <JsonBlock title="Operating systems" result={dash.operatingSystems!} />
          <JsonBlock title="GA4 daily trend" result={dash.ga4Daily!} />
          <JsonBlock title="Tool funnel events" result={dash.funnel!} />
          <JsonBlock title="Funnel rates" result={dash.funnelRates!} />
          <JsonBlock title="Tools by event param" result={dash.toolsByParam!} />
          <JsonBlock title="OCR events" result={dash.ocr!} />
          <JsonBlock title="GA4 realtime" result={dash.realtime!} />
        </>
      ) : null}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">URL Inspection</h2>
        <InspectForm />
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Sitemap submit</h2>
        <SitemapForm />
        <p className="text-sm text-muted-foreground">{INDEXING_API_NOTE}</p>
      </section>
    </main>
  );
}
