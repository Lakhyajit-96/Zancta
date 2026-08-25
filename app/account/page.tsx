import { auth, signOut } from "@/lib/auth";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import { getEntitlement } from "@/lib/entitlement";
import { refreshSubscriptionFromProvider } from "@/lib/payments/subscription-sync";
import DeleteForm from "./delete-form";
import { CancelPremiumForm } from "./cancel-premium-form";
import Link from "next/link";
import { isLivePaymentsEnabled } from "@/lib/payments/live";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();
  const userId = (session?.user as unknown as { id?: string } | undefined)?.id;
  if (!session?.user || !userId) redirect("/signin?callbackUrl=/account");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt) redirect("/signin");
  try {
    await refreshSubscriptionFromProvider(userId);
  } catch {}
  const ent = await getEntitlement(userId);
  const planLabel = ent.plan === "PREMIUM" ? "Premium" : "Free";

  return (
    <main className="mx-auto max-w-3xl px-5 py-14 md:px-8 md:py-20">
      <p className="eyebrow-path">/account</p>
      <h1 className="display-serif mt-4 text-3xl md:text-4xl">Account</h1>
      <p className="mt-3 text-sm text-muted-foreground">Your profile and plan. Tool files are never part of it.</p>

      <div className="mt-8 space-y-5">
        <section className="card-surface p-6 md:p-8" aria-labelledby="account-profile">
          <h2 id="account-profile" className="eyebrow">Profile</h2>
          <p className="mt-3 text-sm text-muted-foreground">Email: {user.email} {user.emailVerified ? "✓ verified" : "— not verified"}</p>
          {!user.emailVerified && (
            <p className="mt-2 text-xs text-warning">
              Verify your email before paid checkout. <Link href="/verify-email" className="underline underline-offset-4">Request a verification email</Link>
            </p>
          )}
          {user.name && <p className="text-sm text-muted-foreground">Name: {user.name}</p>}
          <p className="mt-1 text-xs text-muted-foreground">Created {user.createdAt.toLocaleDateString()}</p>
          <form className="mt-6" action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
            <button className="premium-button premium-button-secondary h-10 px-5">Sign out</button>
          </form>
        </section>

        <section className="card-surface p-6 md:p-8" aria-labelledby="account-plan">
          <h2 id="account-plan" className="eyebrow">Plan / Subscription</h2>
          <p className="mt-3 text-sm text-muted-foreground">Plan: <span className="font-medium text-foreground">{ent.plan === "ADMIN" ? "Admin" : planLabel}</span> — {ent.status}</p>
          {ent.plan === "ADMIN" ? (
            <div className="mt-4 space-y-3">
              <Link href="/admin" className="premium-button premium-button-primary inline-flex h-10 px-5 text-sm">
                Open Admin Dashboard
              </Link>
              <p className="text-xs text-muted-foreground">
                Operator pages:{" "}
                <Link href="/admin/integrations" className="text-accent underline underline-offset-4">Integrations</Link>
                {" · "}
                <Link href="/admin/growth" className="text-accent underline underline-offset-4">Growth</Link>
              </p>
            </div>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground">Core local tools stay on Free with the same file and page limits. Premium adds Local OCR Power — extra OCR languages and scanned PDF OCR up to 20 pages. Ads are not live; Premium reserves an ad-free experience if they are introduced. No file bytes are stored.</p>
          {ent.integrityIssue === "missing_provider_subscription" && (
            <p className="mt-2 text-xs text-warning">A Premium record exists without a provider-backed subscription, so paid access is not active. Subscribe from pricing if you want Premium.</p>
          )}
          {ent.currentPeriodEnd && <p className="mt-1 text-xs text-muted-foreground">Period ends: {new Date(ent.currentPeriodEnd).toLocaleDateString()} {ent.cancelAtPeriodEnd ? "· cancels at period end" : ""}</p>}
          {ent.expiresAt && ent.status !== "ACTIVE" && <p className="mt-1 text-xs text-muted-foreground">Expires: {new Date(ent.expiresAt).toLocaleDateString()}</p>}
          {ent.plan === "FREE" ? (
            <p className="mt-3 text-xs text-muted-foreground">
              <Link href="/pricing" className="text-accent underline underline-offset-4">View pricing</Link>
              {isLivePaymentsEnabled() ? " — Checkout can process a payment. Billing questions: billing@zancta.tech. See " : " — Premium checkout is not available yet. See "}
              <Link href="/refund-and-cancellation" className="text-accent underline underline-offset-4">refunds and cancellation</Link>.
            </p>
          ) : ent.plan === "PREMIUM" && ent.status === "ACTIVE" && ent.providerBacked ? (
            ent.cancelAtPeriodEnd ? (
              <p className="mt-3 text-xs text-warning">Premium is active until the end of the current period and will not renew. No further charges are scheduled.</p>
            ) : (
              <>
                <p className="mt-3 text-xs text-success">Premium active — billing is managed through Dodo Payments. Cancel at period end below.</p>
                <CancelPremiumForm />
              </>
            )
          ) : null}
        </section>

        <section className="card-surface p-6 md:p-8" aria-labelledby="account-privacy">
          <h2 id="account-privacy" className="eyebrow">Privacy / Preferences</h2>
          <p className="mt-3 text-xs text-muted-foreground">Your files are processed locally. No PDF/image bytes stored on server.</p>
          <p className="text-xs text-muted-foreground">Optional analytics only after consent; never filenames or file contents.</p>
        </section>

        <section className="card-surface border-error/30 p-6 md:p-8" aria-labelledby="account-danger">
          <h2 id="account-danger" className="eyebrow text-error">Danger zone</h2>
          <p className="mt-3 text-xs text-muted-foreground">Delete account and all associated application data (sessions, entitlement, local billing rows). Dodo retains customer, payment, subscription and checkout records as Merchant of Record; those cannot be deleted here. This cannot be undone.</p>
          <DeleteForm />
        </section>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/tools" className="premium-button premium-button-primary h-10 px-5">Back to tools <span aria-hidden>→</span></Link>
        </div>
      </div>
    </main>
  );
}
