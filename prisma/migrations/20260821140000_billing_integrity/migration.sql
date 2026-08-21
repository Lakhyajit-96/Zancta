-- Billing integrity: durable webhook processing, checkout persistence, stale-event guards.

CREATE TABLE "PaymentCheckout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerCheckoutId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'created',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaymentCheckout_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentCheckout_providerCheckoutId_key" ON "PaymentCheckout"("providerCheckoutId");
CREATE INDEX "PaymentCheckout_userId_idx" ON "PaymentCheckout"("userId");
CREATE INDEX "PaymentCheckout_status_idx" ON "PaymentCheckout"("status");

ALTER TABLE "PaymentCheckout"
    ADD CONSTRAINT "PaymentCheckout_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Entitlement" ADD COLUMN "providerUpdatedAt" TIMESTAMP(3);
ALTER TABLE "Entitlement" ADD COLUMN "lastWebhookId" TEXT;

ALTER TABLE "PaymentSubscription" ADD COLUMN "providerUpdatedAt" TIMESTAMP(3);
ALTER TABLE "PaymentSubscription" ADD COLUMN "lastWebhookId" TEXT;

ALTER TABLE "WebhookEvent" ADD COLUMN "eventTimestamp" INTEGER;
ALTER TABLE "WebhookEvent" ADD COLUMN "attemptCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "WebhookEvent" ADD COLUMN "lastError" TEXT;
ALTER TABLE "WebhookEvent" ADD COLUMN "processingStartedAt" TIMESTAMP(3);

ALTER TABLE "WebhookEvent" ALTER COLUMN "status" SET DEFAULT 'received';
ALTER TABLE "WebhookEvent" ALTER COLUMN "processedAt" DROP DEFAULT;

CREATE INDEX "WebhookEvent_status_idx" ON "WebhookEvent"("status");
