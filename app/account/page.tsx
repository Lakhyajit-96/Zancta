import { auth, signOut } from "@/lib/auth";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import { getEntitlement } from "@/lib/entitlement";
import { refreshSubscriptionFromProvider } from "@/lib/payments/subscription-sync";
import DeleteForm from "./delete-form";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/account");
  const userId = (session.user as unknown as { id: string }).id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/signin");
  // Throttled provider reconciliation before rendering billing state, so a
  // provider-side cancellation without webhook still shows here. Best-effort.
  try {
    await refreshSubscriptionFromProvider(userId);
  } catch {}
  const ent = await getEntitlement(userId);

  return (
    <main className="mx-auto max-w-3xl px-5 py-14 md:px-8 md:py-20">
      <p className="eyebrow-path">/account</p>
      <h1 className="display-serif mt-4 text-3xl md:text-4xl">Account</h1>
      <p className="mt-3 text-sm text-muted-foreground">Your profile and plan. Tool files are never part of it.</p>
      <div className="card-surface mt-8 space-y-7 p-6 md:p-8">
        <div>
          <h2 className="eyebrow">Profile</h2>
          <p className="text-sm text-muted-foreground mt-2">Email: {user.email} {user.emailVerified ? "✓ verified" : "— not verified"}</p>
          {user.name && <p className="text-sm text-muted-foreground">Name: {user.name}</p>}
          <p className="text-xs text-muted-foreground mt-1">Created {user.createdAt.toLocaleDateString()}</p>
        </div>
        <div className="section-rule pt-7">
          <h2 className="eyebrow">Plan &amp; entitlement</h2>
          <p className="text-sm text-muted-foreground mt-2">Plan: <span className="font-medium text-foreground">{ent.plan}</span> — {ent.status}</p>
          <p className="text-xs text-muted-foreground mt-1">Tools remain local — account is for future premium only. No file bytes stored.</p>
          {ent.source && <p className="text-xs text-muted-foreground">Provider: {ent.source}{ent.providerSubscriptionId ? ` · ${ent.providerSubscriptionId.slice(0, 12)}…` : ""}</p>}
          {ent.currentPeriodEnd && <p className="text-xs text-muted-foreground">Period ends: {new Date(ent.currentPeriodEnd).toLocaleDateString()} {ent.cancelAtPeriodEnd ? "· cancels at period end" : ""}</p>}
          {ent.expiresAt && ent.status !== "ACTIVE" && <p className="text-xs text-muted-foreground">Expires: {new Date(ent.expiresAt).toLocaleDateString()}</p>}
          {ent.plan === "FREE" ? <p className="text-xs text-muted-foreground mt-2"><Link href="/pricing" className="text-accent underline underline-offset-4">View pricing</Link> — Premium checkout is not available yet.</p> : ent.plan === "PREMIUM" && ent.status === "ACTIVE" ? (
            ent.cancelAtPeriodEnd ? (
              <p className="text-xs text-warning mt-2">Premium is active until the end of the current period and will not renew. No further charges are scheduled.</p>
            ) : (
              <p className="text-xs text-success mt-2">✓ Premium active — manage billing through your provider (invoices, cancellation).</p>
            )
          ) : null}
        </div>
        <div className="section-rule pt-7">
          <h2 className="eyebrow">Privacy</h2>
          <p className="text-xs text-muted-foreground mt-2">Your files are processed locally. No PDF/image bytes stored on server.</p>
          <p className="text-xs text-muted-foreground">Analytics: coarse bucket only, no filename.</p>
        </div>
        <div className="section-rule pt-7">
          <h2 className="eyebrow text-error">Danger zone</h2>
          <p className="text-xs text-muted-foreground mt-2">Delete account and all associated data (sessions, entitlement). This cannot be undone.</p>
          <DeleteForm />
        </div>
        <div className="section-rule flex flex-wrap gap-3 pt-7">
          <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
            <button className="premium-button premium-button-secondary h-10 px-5">Sign out</button>
          </form>
          <Link href="/tools" className="premium-button premium-button-primary h-10 px-5">Back to tools <span aria-hidden>→</span></Link>
        </div>
      </div>
    </main>
  );
}
