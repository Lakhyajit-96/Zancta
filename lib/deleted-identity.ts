import { createHmac } from "crypto";
import prisma from "@/lib/db";

function pepper(): string {
  const s = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "test") return "test-oauth-intent-secret";
  throw new Error("AUTH_SECRET missing");
}

export function hashProviderIdentity(provider: string, providerAccountId: string): string {
  return createHmac("sha256", pepper()).update(`${provider}\0${providerAccountId}`, "utf8").digest("hex");
}

export async function recordDeletedProviderIdentities(
  accounts: Array<{ provider: string; providerAccountId: string }>
): Promise<void> {
  for (const account of accounts) {
    if (account.provider === "credentials") continue;
    const identityHash = hashProviderIdentity(account.provider, account.providerAccountId);
    await prisma.deletedProviderIdentity.upsert({
      where: { identityHash },
      create: { identityHash, provider: account.provider },
      update: { deletedAt: new Date(), provider: account.provider },
    });
  }
}

export async function consumeDeletedProviderIdentity(provider: string, providerAccountId: string): Promise<boolean> {
  const identityHash = hashProviderIdentity(provider, providerAccountId);
  const existing = await prisma.deletedProviderIdentity.findUnique({ where: { identityHash } });
  if (!existing) return false;
  await prisma.deletedProviderIdentity.delete({ where: { identityHash } });
  return true;
}

export async function hasDeletedProviderIdentity(provider: string, providerAccountId: string): Promise<boolean> {
  const identityHash = hashProviderIdentity(provider, providerAccountId);
  const existing = await prisma.deletedProviderIdentity.findUnique({ where: { identityHash } });
  return Boolean(existing);
}
