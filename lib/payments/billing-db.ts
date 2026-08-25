import prisma from "@/lib/db";

/**
 * Prisma client or interactive-transaction client used for billing writes.
 * Callers must not pass this into a scope that performs network I/O.
 */
export type BillingDb = Pick<
  typeof prisma,
  | "entitlement"
  | "payment"
  | "paymentSubscription"
  | "paymentCustomer"
  | "paymentCheckout"
  | "webhookEvent"
>;
