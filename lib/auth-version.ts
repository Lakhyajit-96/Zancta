import prisma from "@/lib/db";

export async function bumpAuthVersion(userId: string): Promise<number> {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { authVersion: { increment: 1 } },
    select: { authVersion: true },
  });
  return updated.authVersion;
}

export function tokenMatchesAuthVersion(
  tokenVersion: unknown,
  liveVersion: number | null | undefined
): boolean {
  const token = typeof tokenVersion === "number" && Number.isFinite(tokenVersion) ? tokenVersion : 0;
  const live = typeof liveVersion === "number" && Number.isFinite(liveVersion) ? liveVersion : 0;
  return token === live;
}
