-- Operator Search Console / GA4 / Bing connections. Token columns hold ciphertext only.

CREATE TABLE "OperatorConnection" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AUTH_REQUIRED',
    "accountEmail" TEXT,
    "accountSubject" TEXT,
    "scopes" TEXT,
    "accessTokenEnc" TEXT,
    "refreshTokenEnc" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "selectedProperty" TEXT,
    "ga4PropertyId" TEXT,
    "ga4MeasurementId" TEXT,
    "lastSuccessAt" TIMESTAMP(3),
    "lastFailureAt" TIMESTAMP(3),
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "lastErrorCode" TEXT,
    "lastErrorSafe" TEXT,
    "lastLatencyMs" INTEGER,
    "connectedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatorConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OperatorConnection_provider_key" ON "OperatorConnection"("provider");

CREATE TABLE "OperatorSnapshot" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "dataset" TEXT NOT NULL,
    "rangeKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "state" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperatorSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperatorSnapshot_provider_dataset_rangeKey_idx" ON "OperatorSnapshot"("provider", "dataset", "rangeKey");
