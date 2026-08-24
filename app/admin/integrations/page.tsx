import Link from "next/link";
import { getPublicConnection } from "@/lib/integrations/store";
import { INDEXING_API_NOTE } from "@/lib/integrations/google/gsc";
import { BING_UNSUPPORTED } from "@/lib/integrations/bing/webmaster";
import type { PublicConnection } from "@/lib/integrations/types";

export const dynamic = "force-dynamic";

function maskEmail(email: string | null): string | null {
  if (!email || !email.includes("@")) return null;
  const [local, domain] = email.split("@");
  if (!local || !domain) return null;
  return `${local.slice(0, 2)}***@${domain}`;
}

function formatTime(iso: string | null): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Never";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(d) + " UTC";
}

function statusLabel(status: string): string {
  return status.replaceAll("_", " ");
}

function ProviderCard({
  title,
  href,
  connection,
  connectHref,
  disconnectHref,
  detail,
}: {
  title: string;
  href: string;
  connection: PublicConnection;
  connectHref: string;
  disconnectHref: string;
  detail: string;
}) {
  const connected = connection.status === "CONNECTED";
  const email = maskEmail(connection.accountEmail);
  return (
    <article className="flex flex-col rounded-lg border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            <Link className="underline-offset-4 hover:underline" href={href}>
              {title}
            </Link>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
        </div>
        <p className="rounded-md border border-border px-2 py-1 text-xs font-medium uppercase tracking-wide" aria-live="polite">
          {statusLabel(connection.status)}
        </p>
      </div>
      <dl className="mt-4 grid gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Account</dt>
          <dd>{email ?? "Not connected"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Last successful check</dt>
          <dd>{formatTime(connection.lastSuccessAt)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Last failure</dt>
          <dd>{formatTime(connection.lastFailureAt)}</dd>
        </div>
      </dl>
      {connection.lastErrorSafe ? (
        <p className="mt-3 rounded-md border border-border bg-elevated px-3 py-2 text-sm text-muted-foreground" role="alert">
          {connection.lastErrorSafe}
        </p>
      ) : null}
      {!connection.configured ? (
        <p className="mt-3 text-sm text-muted-foreground" role="status">
          OAuth client env vars are not configured for Production.
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-2">
        <a
          className="inline-flex min-h-10 items-center rounded-md border border-border bg-background px-3 py-2 text-sm"
          href={connectHref}
        >
          {connected ? "Reconnect" : "Connect"}
        </a>
        <form action={disconnectHref} method="post">
          <button
            className="inline-flex min-h-10 items-center rounded-md border border-border px-3 py-2 text-sm"
            type="submit"
            disabled={!connected}
          >
            Disconnect
          </button>
        </form>
        <Link className="inline-flex min-h-10 items-center rounded-md px-3 py-2 text-sm underline" href={href}>
          Open dashboard
        </Link>
      </div>
    </article>
  );
}

export default async function IntegrationsPage() {
  const [google, bing] = await Promise.all([getPublicConnection("google"), getPublicConnection("bing")]);
  const ga4Ready = Boolean(google.ga4PropertyId);
  const gscReady = Boolean(google.selectedProperty);
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Operator integrations</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Production-only Google Search Console, GA4 Data API, and Bing Webmaster. Access tokens stay encrypted on the
          server and are never sent to the browser. Failures are shown as states, not as zero traffic.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">GitHub</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sign-in only</p>
          <p className="mt-2 text-sm text-muted-foreground">
            There is no GitHub App or repository operator API. GitHub OAuth is used for user login.
          </p>
        </section>
        <section className="rounded-lg border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">Vercel</h2>
          <p className="mt-1 text-sm text-muted-foreground">Deploy platform only</p>
          <p className="mt-2 text-sm text-muted-foreground">
            There is no Vercel REST operator integration. Preview stays isolated from Production credentials.
          </p>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ProviderCard
          title="Google Search Console"
          href="/admin/integrations/google"
          connection={google}
          connectHref="/api/admin/integrations/google/connect"
          disconnectHref="/api/admin/integrations/google/disconnect"
          detail={gscReady ? `Property ${google.selectedProperty}` : "Search appearance and indexing for zancta.tech"}
        />
        <article className="flex flex-col rounded-lg border border-border bg-surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                <Link className="underline-offset-4 hover:underline" href="/admin/integrations/google">
                  Google Analytics 4
                </Link>
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Uses the same Google operator OAuth client as Search Console.
              </p>
            </div>
            <p className="rounded-md border border-border px-2 py-1 text-xs font-medium uppercase tracking-wide">
              {ga4Ready ? "Property linked" : statusLabel(google.status)}
            </p>
          </div>
          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">GA4 property</dt>
              <dd>{google.ga4PropertyId ?? "Not selected"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Measurement ID</dt>
              <dd>{google.ga4MeasurementId ?? "Not selected"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Last successful check</dt>
              <dd>{formatTime(google.lastSuccessAt)}</dd>
            </div>
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            <a
              className="inline-flex min-h-10 items-center rounded-md border border-border bg-background px-3 py-2 text-sm"
              href="/api/admin/integrations/google/connect"
            >
              {google.status === "CONNECTED" ? "Reconnect Google" : "Connect Google"}
            </a>
            <Link className="inline-flex min-h-10 items-center rounded-md px-3 py-2 text-sm underline" href="/admin/integrations/google">
              Open Google dashboard
            </Link>
          </div>
        </article>
        <ProviderCard
          title="Bing Webmaster"
          href="/admin/integrations/bing"
          connection={bing}
          connectHref="/api/admin/integrations/bing/connect"
          disconnectHref="/api/admin/integrations/bing/disconnect"
          detail="Crawl, query, and URL submission for https://zancta.tech"
        />
      </div>

      <section className="space-y-2 text-sm text-muted-foreground">
        <p>{INDEXING_API_NOTE}</p>
        <p>{BING_UNSUPPORTED.aiPerformance}</p>
        <p>{BING_UNSUPPORTED.indexNow}</p>
        <p>IndexNow is unchanged. This dashboard does not resubmit IndexNow URLs or rotate keys.</p>
      </section>
      <p className="text-sm">
        <Link className="underline" href="/admin/growth">
          Growth dashboard
        </Link>
      </p>
    </main>
  );
}
