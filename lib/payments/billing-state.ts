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
  // Period is open only while currentPeriodEnd is strictly in the future. Equal-to-now
  // is ended. Null currentPeriodEnd does not invent a period or a grace window.
  const periodOpen = input.currentPeriodEnd ? input.currentPeriodEnd.getTime() > now : false;
  const cancelAtPeriodEnd = !!input.cancelAtPeriodEnd || CANCELLED_STATUSES.has(status);

  if (LIVE_STATUSES.has(status)) {
    if (input.currentPeriodEnd && !periodOpen) {
      return {
        plan: "EXPIRED",
        status: "EXPIRED",
        cancelAtPeriodEnd,
        reason: `subscription_${status}_period_ended`,
      };
    }
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

export function parseProviderDate(value: unknown): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "number" && Number.isFinite(value)) {
    const ms = value < 1e12 ? value * 1000 : value;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function laterTimestamp(a?: Date | null, b?: Date | null): Date | null {
  if (!a && !b) return null;
  if (!a) return b ?? null;
  if (!b) return a;
  return a.getTime() >= b.getTime() ? a : b;
}

export function unixSeconds(d: Date): number {
  return Math.floor(d.getTime() / 1000);
}

/**
 * Dodo GET /subscriptions has created_at, cancelled_at, paused_at, previous_billing_date,
 * and next_billing_date — but no monotonic updated_at/version. created_at and
 * previous_billing_date are not update versions (they stay old for the life of a
 * period), and next_billing_date / current_period_end are usually in the future.
 * Only mutation timestamps that are not in the future may advance the watermark.
 */
export type ProviderMutationSource = {
  cancelledAt?: Date | null;
  pausedAt?: Date | null;
  currentPeriodEnd?: Date | null;
  status?: string | null;
};

export function providerMutationTime(remote: ProviderMutationSource, now: Date = new Date()): Date | null {
  const horizon = now.getTime() + 1000;
  const candidates: Date[] = [];
  for (const d of [remote.cancelledAt, remote.pausedAt]) {
    if (d instanceof Date && !Number.isNaN(d.getTime()) && d.getTime() <= horizon) candidates.push(d);
  }
  const status = (remote.status || "").toLowerCase();
  if (
    remote.currentPeriodEnd instanceof Date &&
    !Number.isNaN(remote.currentPeriodEnd.getTime()) &&
    remote.currentPeriodEnd.getTime() <= horizon &&
    (status === "expired" || CANCELLED_STATUSES.has(status))
  ) {
    candidates.push(remote.currentPeriodEnd);
  }
  if (!candidates.length) return null;
  return new Date(Math.max(...candidates.map((d) => d.getTime())));
}

export type ReconcileLocalSnapshot = {
  status: string;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
  providerUpdatedAt?: Date | null;
};

/**
 * Skip applying a GET snapshot when it is older than already-stored provider
 * event state. Unversioned GET may still repair local drift when it is not a
 * period/status rollback. Never uses local wall-clock as a version.
 */
export function shouldSkipReconcileApply(opts: {
  remote: {
    status: string;
    currentPeriodEnd?: Date | null;
    cancelAtPeriodEnd?: boolean;
    cancelledAt?: Date | null;
    pausedAt?: Date | null;
  };
  local: ReconcileLocalSnapshot | null;
  entitlementUpdatedAt?: Date | null;
  reconStartedAt?: Date | null;
  now?: Date;
}): boolean {
  const watermark = laterTimestamp(opts.local?.providerUpdatedAt ?? null, opts.entitlementUpdatedAt ?? null);
  if (opts.reconStartedAt && watermark && watermark.getTime() > opts.reconStartedAt.getTime()) {
    return true;
  }

  const mutation = providerMutationTime(opts.remote, opts.now);
  const remoteEnd = opts.remote.currentPeriodEnd?.getTime() ?? null;
  const localEnd = opts.local?.currentPeriodEnd?.getTime() ?? null;
  const newerPeriod = remoteEnd != null && localEnd != null && remoteEnd > localEnd + 1000;

  if (mutation && isStaleEvent({ incomingTimestamp: unixSeconds(mutation), existingTimestamp: watermark }) && !newerPeriod) {
    return true;
  }

  if (!opts.local) return false;

  if (remoteEnd != null && localEnd != null && remoteEnd + 1000 < localEnd) {
    return true;
  }

  const remoteLive = LIVE_STATUSES.has(opts.remote.status.toLowerCase());
  const localStatus = (opts.local.status || "").toLowerCase();
  const localTerminal =
    CANCELLED_STATUSES.has(localStatus) || localStatus === "expired" || !!opts.local.cancelAtPeriodEnd;
  const remotePeriodNotNewer = remoteEnd == null || localEnd == null || remoteEnd <= localEnd + 1000;
  const mutationIsFresh =
    !!mutation && !isStaleEvent({ incomingTimestamp: unixSeconds(mutation), existingTimestamp: watermark });
  if (
    remoteLive &&
    localTerminal &&
    remotePeriodNotNewer &&
    !opts.remote.cancelAtPeriodEnd &&
    !mutationIsFresh
  ) {
    return true;
  }

  return false;
}
