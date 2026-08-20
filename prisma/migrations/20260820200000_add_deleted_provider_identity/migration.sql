-- CreateTable
CREATE TABLE "DeletedProviderIdentity" (
    "id" TEXT NOT NULL,
    "identityHash" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeletedProviderIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeletedProviderIdentity_identityHash_key" ON "DeletedProviderIdentity"("identityHash");

-- CreateIndex
CREATE INDEX "DeletedProviderIdentity_provider_idx" ON "DeletedProviderIdentity"("provider");
