import { getGrowthSummary, getFunnelData } from "@/lib/analytics/growth-data";
import { isLivePaymentsEnabled } from "@/lib/payments/live";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "(invalid)";
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export default async function GrowthDashboard() {
  const [summary, funnel] = await Promise.all([getGrowthSummary(), getFunnelData()]);
  const checkoutLive = isLivePaymentsEnabled();
  const noHistoricalBaseline = true;

  const revenueInr = summary.payments.totalRevenuePaise > 0
    ? `₹${(summary.payments.totalRevenuePaise / 100).toLocaleString("en-IN")}`
    : checkoutLive ? "₹0" : "n/a";

  const verificationRate = summary.users.total > 0
    ? `${((summary.users.verified / summary.users.total) * 100).toFixed(1)}%`
    : "—";

  const checkoutConversion = funnel.checkoutsStarted > 0
    ? `${((funnel.checkoutsCompleted / funnel.checkoutsStarted) * 100).toFixed(1)}%`
    : "—";

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-6 py-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Growth Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Admin-only. noindex. Live database rows, not Google Analytics traffic.
          {noHistoricalBaseline ? " No historical GA/search baseline is established." : ""}
          {" "}Period: all-time unless a window is labeled (7d / 30d).
        </p>
        {!checkoutLive && (
          <p className="mt-3 rounded-md border border-border bg-elevated px-3 py-2 text-sm text-muted-foreground">
            Premium checkout is not live. Checkout, subscription, and revenue zeros are expected and are not a traffic KPI.
          </p>
        )}
      </div>

      {/* Traffic / Users */}
      <Section title="Users">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total users" value={summary.users.total} />
          <Stat label="Email verified" value={summary.users.verified} sub={verificationRate} />
          <Stat label="Last 30 days" value={summary.users.last30d} />
          <Stat label="Last 7 days" value={summary.users.last7d} />
        </div>
      </Section>

      {/* Conversion Funnel */}
      <Section title="Conversion Funnel">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Users" value={funnel.totalUsers} />
          <Stat label="Verified" value={funnel.verifiedUsers} />
          <Stat label="Checkouts started" value={funnel.checkoutsStarted} />
          <Stat label="Checkouts completed" value={funnel.checkoutsCompleted} sub={checkoutConversion} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Active subscriptions" value={funnel.activeSubscriptions} />
          <Stat label="Cancelled" value={funnel.cancelledSubscriptions} />
          <Stat label="Payments succeeded" value={funnel.paymentsSucceeded} />
          <Stat label="Refunds" value={funnel.refunds} />
        </div>
      </Section>

      {/* Revenue */}
      <Section title="Revenue">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total revenue" value={revenueInr} sub={checkoutLive ? "All time, INR, succeeded payments" : "Checkout not live — not a KPI"} />
          <Stat label="Payments succeeded" value={summary.payments.succeeded} />
          <Stat label="Payments failed" value={summary.payments.failed} />
          <Stat label="Refunded" value={summary.payments.refunded} />
        </div>
      </Section>

      {/* Entitlements */}
      <Section title="Entitlements">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Free" value={summary.entitlements.free} />
          <Stat label="Premium" value={summary.entitlements.premium} />
          <Stat label="Admin" value={summary.entitlements.admin} />
          <Stat label="Expired" value={summary.entitlements.expired} />
          <Stat label="Cancelled" value={summary.entitlements.cancelled} />
        </div>
      </Section>

      {/* Subscriptions */}
      <Section title="Subscriptions">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Active" value={summary.subscriptions.active} />
          <Stat label="Cancelled" value={summary.subscriptions.cancelled} />
          <Stat label="Monthly" value={summary.subscriptions.monthly} />
          <Stat label="Annual" value={summary.subscriptions.annual} />
        </div>
      </Section>

      {/* Checkouts */}
      <Section title="Checkouts">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Created" value={summary.checkouts.created} />
          <Stat label="Completed" value={summary.checkouts.completed} />
          <Stat label="Abandoned" value={summary.checkouts.abandoned} />
        </div>
      </Section>

      {/* Client tool usage is GA4-only */}
      <Section title="Tool usage">
        <p className="text-sm text-muted-foreground">
          Completion, download, and tool_view rates live in consent-gated GA4, not in this database.
          The table below is server audit actions only. Empty means no matching AuditEvent rows — not “zero traffic.”
        </p>
        {summary.toolUsage.length === 0 ? (
          <p className="text-sm text-muted-foreground">No server-side tool_used audit events. Baseline not established.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 pr-4">Tool</th>
                  <th className="pb-2 text-right">Server events</th>
                </tr>
              </thead>
              <tbody>
                {summary.toolUsage.map((row) => (
                  <tr key={row.tool} className="border-b border-border/50">
                    <td className="py-2 pr-4 font-mono text-xs">{row.tool}</td>
                    <td className="py-2 text-right tabular-nums">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
      <Section title="Product Events (last 30 days)">
        {summary.auditSummary.length === 0 ? (
          <p className="text-sm text-muted-foreground">No audit events in the last 30 days. Baseline not yet established.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 pr-4">Action</th>
                  <th className="pb-2 text-right">Count</th>
                </tr>
              </thead>
              <tbody>
                {summary.auditSummary.map((a) => (
                  <tr key={a.action} className="border-b border-border/50">
                    <td className="py-2 pr-4 font-mono text-xs">{a.action}</td>
                    <td className="py-2 text-right tabular-nums">{a.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Recent Signups */}
      <Section title="Recent Signups">
        {summary.recentSignups.length === 0 ? (
          <p className="text-sm text-muted-foreground">No signups yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 pr-4">Mailbox (masked)</th>
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2">Verified</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentSignups.map((u) => (
                  <tr key={u.id} className="border-b border-border/50">
                    <td className="py-2 pr-4 font-mono text-xs">{maskEmail(u.email)}</td>
                    <td className="py-2 pr-4 text-xs text-muted-foreground">{u.createdAt.toISOString().slice(0, 10)}</td>
                    <td className="py-2 text-xs">{u.verified ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <p className="text-xs text-muted-foreground">
        This dashboard reads live database state. GA4 page views and consent-gated client events are only available
        in the Google Analytics dashboard. Tool usage data shown here comes from server-side audit events.
        Historical baselines have not been established — values shown are all-time or windowed as labeled.
      </p>
    </main>
  );
}
