import { auth, signOut } from "@/lib/auth";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import { getEntitlement } from "@/lib/entitlement";
import DeleteForm from "./delete-form";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/account");
  const userId = (session.user as unknown as { id: string }).id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/signin");
  const ent = await getEntitlement(userId);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
      <div className="mt-6 space-y-6 rounded-xl border bg-surface p-6">
        <div>
          <h2 className="text-sm font-medium">Profile</h2>
          <p className="text-sm text-muted-foreground mt-1">Email: {user.email} {user.emailVerified ? "✓ verified" : "— not verified"}</p>
          {user.name && <p className="text-sm text-muted-foreground">Name: {user.name}</p>}
          <p className="text-xs text-muted-foreground mt-1">Created {user.createdAt.toLocaleDateString()}</p>
        </div>
        <div className="border-t pt-6">
          <h2 className="text-sm font-medium">Plan / Entitlement</h2>
          <p className="text-sm text-muted-foreground mt-1">Plan: <span className="font-medium text-foreground">{ent.plan}</span> — {ent.status}</p>
          <p className="text-xs text-muted-foreground mt-1">Tools remain local — account is for future premium only. No file bytes stored.</p>
          {ent.source && <p className="text-xs text-muted-foreground">Provider: {ent.source}{ent.providerSubscriptionId ? ` · ${ent.providerSubscriptionId.slice(0, 12)}…` : ""}</p>}
          {ent.currentPeriodEnd && <p className="text-xs text-muted-foreground">Period ends: {new Date(ent.currentPeriodEnd).toLocaleDateString()} {ent.cancelAtPeriodEnd ? "· cancels at period end" : ""}</p>}
          {ent.expiresAt && ent.status !== "ACTIVE" && <p className="text-xs text-muted-foreground">Expires: {new Date(ent.expiresAt).toLocaleDateString()}</p>}
          {ent.plan === "FREE" ? <p className="text-xs text-muted-foreground mt-2"><Link href="/pricing" className="underline">View pricing</Link> — Premium ₹199/mo or ₹999/yr · $5/mo or $39/yr.</p> : ent.plan === "PREMIUM" && ent.status === "ACTIVE" ? <p className="text-xs text-success mt-2">✓ Premium active — no ads, higher limits. Manage billing via Dodo (invoices, cancel).</p> : null}
        </div>
        <div className="border-t pt-6">
          <h2 className="text-sm font-medium">Privacy</h2>
          <p className="text-xs text-muted-foreground mt-1">Your files are processed locally. No PDF/image bytes stored on server.</p>
          <p className="text-xs text-muted-foreground">Analytics: coarse bucket only, no filename.</p>
        </div>
        <div className="border-t pt-6">
          <h2 className="text-sm font-medium text-error">Danger zone</h2>
          <p className="text-xs text-muted-foreground mt-1">Delete account and all associated data (sessions, entitlement). This cannot be undone.</p>
          <DeleteForm />
        </div>
        <div className="border-t pt-6 flex gap-2">
          <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
            <button className="h-9 px-4 rounded-md border bg-surface text-sm">Sign out</button>
          </form>
          <Link href="/tools" className="h-9 px-4 inline-flex items-center rounded-md bg-accent text-accent-foreground text-sm">Back to tools</Link>
        </div>
      </div>
    </main>
  );
}
