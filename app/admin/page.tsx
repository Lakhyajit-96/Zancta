import Link from "next/link";
import { auth } from "@/lib/auth";
import { getPublicConnection } from "@/lib/integrations/store";
import type { PublicConnection } from "@/lib/integrations/types";

export const dynamic = "force-dynamic";

function statusCopy(connection: PublicConnection, ready: boolean): { label: string; note: string } {
  if (!connection.configured) {
    return {
      label: "Not connected",
      note: "Data unavailable until Production operator OAuth is configured and connected.",
    };
  }
  if (connection.status === "CONNECTED" && ready) {
    return { label: "Connected", note: "Operator OAuth is linked. Open the dashboard for provider payloads." };
  }
  if (connection.status === "CONNECTED" && !ready) {
    return {
      label: "Connection required",
      note: "Google is linked, but this property is not selected yet. Data unavailable until the integration is connected.",
    };
  }
  if (connection.status === "AUTH_REQUIRED") {
    return {
      label: "Connection required",
      note: "Data unavailable until the integration is connected.",
    };
  }
  return {
    label: "Not connected",
    note: "Data unavailable until the integration is connected.",
  };
}

function StatusCard({
  title,
  href,
  connection,
  ready,
  detail,
}: {
  title: string;
  href: string;
  connection: PublicConnection;
  ready: boolean;
  detail: string;
}) {
  const status = statusCopy(connection, ready);
  return (
    <article className="card-surface flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        <p className="rounded-md border border-border px-2 py-1 text-[0.65rem] font-medium uppercase tracking-wide">
          {status.label}
        </p>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
      <p className="mt-3 text-sm text-muted-foreground">{status.note}</p>
      <Link href={href} className="mt-4 text-sm text-accent underline underline-offset-4">
        Open {title}
      </Link>
    </article>
  );
}

export default async function AdminDashboardPage() {
  const session = await auth();
  const [google, bing] = await Promise.all([getPublicConnection("google"), getPublicConnection("bing")]);
  const gscReady = Boolean(google.selectedProperty);
  const ga4Ready = Boolean(google.ga4PropertyId);
  const bingReady = bing.status === "CONNECTED";
  const email = session?.user?.email || "Unknown";

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-5 py-12 md:px-8">
      <div>
        <p className="eyebrow-path">/admin</p>
        <p className="eyebrow mt-4">ZANCTA ADMIN</p>
        <h1 className="display-serif mt-3 text-4xl md:text-5xl">Operator Dashboard</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Production operator control center. Public tools stay on the homepage. This area is ADMIN-only.
        </p>
      </div>

      <section className="card-surface p-6 md:p-8" aria-labelledby="admin-product">
        <h2 id="admin-product" className="eyebrow">Product</h2>
        <p className="mt-3 text-sm">ZANCTA production operator status</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Live traffic numbers are not shown here. Connect Search Console, GA4, and Bing from Integrations, then read
          provider payloads on those dashboards.
        </p>
      </section>

      <section aria-labelledby="admin-analytics">
        <h2 id="admin-analytics" className="eyebrow">Analytics</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <StatusCard
            title="Google Analytics 4"
            href="/admin/integrations/google"
            connection={google}
            ready={ga4Ready}
            detail="Same Google operator OAuth client as Search Console."
          />
          <StatusCard
            title="Google Search Console"
            href="/admin/integrations/google"
            connection={google}
            ready={gscReady}
            detail="Search appearance and indexing for zancta.tech."
          />
          <StatusCard
            title="Bing Webmaster"
            href="/admin/integrations/bing"
            connection={bing}
            ready={bingReady}
            detail="Crawl, query, and URL submission for https://zancta.tech."
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2" aria-labelledby="admin-shortcuts">
        <h2 id="admin-shortcuts" className="sr-only">Operator shortcuts</h2>
        <article className="card-surface p-6">
          <h3 className="eyebrow">Growth</h3>
          <p className="mt-3 text-lg font-semibold">Growth Dashboard</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Internal product funnel and entitlement counts from the ZANCTA database — not invented GA4 traffic.
          </p>
          <Link href="/admin/growth" className="premium-button premium-button-secondary mt-5 inline-flex h-10 px-5 text-sm">
            Open Growth Dashboard
          </Link>
        </article>
        <article className="card-surface p-6">
          <h3 className="eyebrow">Integrations</h3>
          <p className="mt-3 text-lg font-semibold">Operator integrations</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect or disconnect Google Search Console, GA4, and Bing Webmaster. Tokens stay on the server.
          </p>
          <Link href="/admin/integrations" className="premium-button premium-button-secondary mt-5 inline-flex h-10 px-5 text-sm">
            Open Integrations
          </Link>
        </article>
      </section>

      <section className="card-surface p-6 md:p-8" aria-labelledby="admin-account">
        <h2 id="admin-account" className="eyebrow">Account</h2>
        <p className="mt-3 text-sm">Operator identity: {email}</p>
        <p className="mt-1 text-sm">Entitlement: Admin — ACTIVE</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Authorization is the Production Entitlement.plan value. Google login alone does not grant ADMIN.
        </p>
        <Link href="/account" className="mt-4 inline-block text-sm text-accent underline underline-offset-4">
          Open account
        </Link>
      </section>
    </main>
  );
}
