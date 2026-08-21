/**
 * Derive paid access from local subscription snapshots.
 * Entitlement is never granted from client state, cookies, or unsigned payloads.
 */

export type DerivedBilling = {
  plan: "PREMIUM" | "EXPIRED" | "FREE";
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  cancelAtPeriodEnd: boolean;
  reason: string;
};

const LIVE_STATUSES = new Set(["active", "on_hold"]);
const CANCELLED_STATUSES = new Set(["cancelled", "canceled"]);

export function isProviderBackedPremium(input: {
  providerSubscriptionId?: string | null;
  status?: string | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
  now?: Date;
}): boolean {
  if (!input.providerSubscriptionId) return false;
  const derived = deriveFromSubscription({
    status: input.status || "pending",
    currentPeriodEnd: input.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: !!input.cancelAtPeriodEnd,
    now: input.now,
  });
  return derived.plan === "PREMIUM" && derived.status === "ACTIVE";
}

export function deriveFromSubscription(input: {
  status: string;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
  now?: Date;
}): DerivedBilling {
  const now = (input.now ?? new Date()).getTime();
  const status = (input.status || "").toLowerCase();
  const periodOpen = input.currentPeriodEnd ? input.currentPeriodEnd.getTime() > now : false;
  const cancelAtPeriodEnd = !!input.cancelAtPeriodEnd || CANCELLED_STATUSES.has(status);

  if (LIVE_STATUSES.has(status)) {
    return { plan: "PREMIUM", status: "ACTIVE", cancelAtPeriodEnd, reason: `subscription_${status}` };
  }

  if (CANCELLED_STATUSES.has(status) && periodOpen) {
    return {
      plan: "PREMIUM",
      status: "ACTIVE",
      cancelAtPeriodEnd: true,
      reason: "cancelled_access_until_period_end",
    };
  }

  if (CANCELLED_STATUSES.has(status) || status === "expired") {
    return {
      plan: "EXPIRED",
      status: status === "expired" ? "EXPIRED" : "EXPIRED",
      cancelAtPeriodEnd: true,
      reason: status === "expired" ? "subscription_expired" : "subscription_cancelled_period_ended",
    };
  }

  if (status === "failed" && periodOpen) {
    return {
      plan: "PREMIUM",
      status: "ACTIVE",
      cancelAtPeriodEnd,
      reason: "failed_within_paid_period",
    };
  }

  return { plan: "FREE", status: "ACTIVE", cancelAtPeriodEnd: false, reason: `subscription_${status || "unknown"}` };
}

export function isStaleEvent(opts: {
  incomingTimestamp?: number | null;
  existingTimestamp?: Date | null;
}): boolean {
  if (opts.incomingTimestamp == null || !opts.existingTimestamp) return false;
  const existingSec = Math.floor(opts.existingTimestamp.getTime() / 1000);
  return opts.incomingTimestamp + 1 < existingSec;
}
