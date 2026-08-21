-- Session revocation for JWT strategy: incrementing authVersion invalidates prior tokens.

ALTER TABLE "User" ADD COLUMN "authVersion" INTEGER NOT NULL DEFAULT 0;
