/**
 * Growth dashboard data queries.
 *
 * All queries read from existing database tables (User, Entitlement,
 * AuditEvent, PaymentSubscription, Payment, PaymentCheckout).
 * Never returns file data, OCR text, or sensitive information.
 */

import prisma from "@/lib/db";

export interface GrowthSummary {
  users: { total: number; verified: number; last30d: number; last7d: number };
  entitlements: { free: number; premium: number; admin: number; expired: number; cancelled: number };
  subscriptions: { active: number; cancelled: number; monthly: number; annual: number };
  payments: { succeeded: number; failed: number; refunded: number; totalRevenuePaise: number };
  checkouts: { created: number; completed: number; abandoned: number };
  recentSignups: Array<{ id: string; email: string; createdAt: Date; verified: boolean }>;
  toolUsage: Array<{ tool: string; count: number }>;
  auditSummary: Array<{ action: string; count: number }>;
}

export async function getGrowthSummary(): Promise<GrowthSummary> {
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    verifiedUsers,
    users30d,
    users7d,
    entitlements,
    subscriptions,
    payments,
    checkouts,
    recentSignups,
    toolEvents,
    auditCounts,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, emailVerified: { not: null } } }),
    prisma.user.count({ where: { deletedAt: null, createdAt: { gte: d30 } } }),
    prisma.user.count({ where: { deletedAt: null, createdAt: { gte: d7 } } }),

    prisma.entitlement.groupBy({
      by: ["plan"],
      _count: { plan: true },
    }),

    Promise.all([
      prisma.paymentSubscription.count({ where: { status: "active" } }),
      prisma.paymentSubscription.count({ where: { status: "cancelled" } }),
      prisma.paymentSubscription.count({ where: { plan: "PREMIUM_MONTHLY", status: "active" } }),
      prisma.paymentSubscription.count({ where: { plan: "PREMIUM_ANNUAL", status: "active" } }),
    ]),

    Promise.all([
      prisma.payment.count({ where: { status: "succeeded" } }),
      prisma.payment.count({ where: { status: "failed" } }),
      prisma.payment.count({ where: { status: "refunded" } }),
      prisma.payment.aggregate({ where: { status: "succeeded" }, _sum: { amount: true } }),
    ]),

    prisma.paymentCheckout.groupBy({
      by: ["status"],
      _count: { status: true },
    }),

    prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true, email: true, createdAt: true, emailVerified: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),

    prisma.auditEvent.groupBy({
      by: ["action"],
      where: { action: { startsWith: "analytics.tool_used" } },
      _count: { action: true },
    }).catch(() => []),

    prisma.auditEvent.groupBy({
      by: ["action"],
      where: { createdAt: { gte: d30 } },
      _count: { action: true },
      orderBy: { _count: { action: "desc" } },
      take: 30,
    }),
  ]);

  const entMap: Record<string, number> = {};
  for (const e of entitlements) entMap[e.plan] = e._count.plan;

  const checkMap: Record<string, number> = {};
  for (const c of checkouts) checkMap[c.status] = c._count.status;

  const toolUsage: Array<{ tool: string; count: number }> = [];
  for (const te of toolEvents) {
    const meta = te.action.replace("analytics.tool_used", "").trim();
    toolUsage.push({ tool: meta || "unknown", count: te._count.action });
  }

  return {
    users: {
      total: totalUsers,
      verified: verifiedUsers,
      last30d: users30d,
      last7d: users7d,
    },
    entitlements: {
      free: entMap["FREE"] ?? 0,
      premium: entMap["PREMIUM"] ?? 0,
      admin: entMap["ADMIN"] ?? 0,
      expired: entMap["EXPIRED"] ?? 0,
      cancelled: entMap["CANCELLED"] ?? 0,
    },
    subscriptions: {
      active: subscriptions[0],
      cancelled: subscriptions[1],
      monthly: subscriptions[2],
      annual: subscriptions[3],
    },
    payments: {
      succeeded: payments[0],
      failed: payments[1],
      refunded: payments[2],
      totalRevenuePaise: payments[3]._sum.amount ?? 0,
    },
    checkouts: {
      created: checkMap["created"] ?? 0,
      completed: checkMap["completed"] ?? 0,
      abandoned: checkMap["abandoned"] ?? 0,
    },
    recentSignups: recentSignups.map((u) => ({
      id: u.id,
      email: u.email,
      createdAt: u.createdAt,
      verified: u.emailVerified !== null,
    })),
    toolUsage,
    auditSummary: auditCounts.map((a) => ({ action: a.action, count: a._count.action })),
  };
}

export interface FunnelData {
  totalUsers: number;
  verifiedUsers: number;
  checkoutsStarted: number;
  checkoutsCompleted: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  paymentsSucceeded: number;
  refunds: number;
}

export async function getFunnelData(): Promise<FunnelData> {
  const [
    totalUsers,
    verifiedUsers,
    checkoutsStarted,
    checkoutsCompleted,
    activeSubscriptions,
    cancelledSubscriptions,
    paymentsSucceeded,
    refunds,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, emailVerified: { not: null } } }),
    prisma.paymentCheckout.count(),
    prisma.paymentCheckout.count({ where: { status: "completed" } }),
    prisma.paymentSubscription.count({ where: { status: "active" } }),
    prisma.paymentSubscription.count({ where: { status: "cancelled" } }),
    prisma.payment.count({ where: { status: "succeeded" } }),
    prisma.payment.count({ where: { status: "refunded" } }),
  ]);

  return {
    totalUsers,
    verifiedUsers,
    checkoutsStarted,
    checkoutsCompleted,
    activeSubscriptions,
    cancelledSubscriptions,
    paymentsSucceeded,
    refunds,
  };
}
