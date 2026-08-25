-- Account deletion step-up token: single-use, short-lived, sha256 hash at rest.
-- Separate table from PasswordResetToken/VerificationToken so tokens can never
-- be consumed cross-purpose.

CREATE TABLE "AccountDeletionToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountDeletionToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AccountDeletionToken_token_key" ON "AccountDeletionToken"("token");

CREATE INDEX "AccountDeletionToken_token_idx" ON "AccountDeletionToken"("token");

CREATE INDEX "AccountDeletionToken_userId_idx" ON "AccountDeletionToken"("userId");

CREATE INDEX "AccountDeletionToken_expires_idx" ON "AccountDeletionToken"("expires");

ALTER TABLE "AccountDeletionToken" ADD CONSTRAINT "AccountDeletionToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
