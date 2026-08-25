import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { rateLimitAsync, getClientIp } from "@/lib/rate-limit";
import { auditEvent } from "@/lib/audit";
import { hashToken, generateSecureToken } from "@/lib/token";

const ACCOUNT_DELETION_CODE_TTL_MS = 15 * 60 * 1000;

// Step-up for account deletion: emails a single-use confirmation code to the
// session owner's account email. Session-bound only — there is no way to
// target another account, so this endpoint has no enumeration surface.
export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as unknown as { id?: string } | undefined)?.id;
  if (!session?.user || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(req.headers);
  // Short-window cap plus a daily cap so a stolen session cannot spam the
  // account owner's inbox with deletion codes.
  const rlShort = await rateLimitAsync(`delete-code:${userId}`, 3, 15 * 60 * 1000);
  const rlDaily = await rateLimitAsync(`delete-code-day:${userId}`, 10, 24 * 60 * 60 * 1000);
  if (!rlShort.ok || !rlDaily.ok) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plainCode = generateSecureToken();
  const tokenHash = hashToken(plainCode);
  const expires = new Date(Date.now() + ACCOUNT_DELETION_CODE_TTL_MS);
  await prisma.$transaction(async (tx) => {
    // Row hygiene: drop spent/expired rows, then invalidate any remaining
    // unused code so at most one code is live per account.
    await tx.accountDeletionToken.deleteMany({
      where: { userId, OR: [{ usedAt: { not: null } }, { expires: { lt: new Date() } }] },
    });
    await tx.accountDeletionToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
    await tx.accountDeletionToken.create({ data: { userId, token: tokenHash, expires } });
  });

  try {
    const { getEmailAdapter } = await import("@/lib/email");
    await getEmailAdapter().sendAccountDeletionCode(user.email, plainCode);
  } catch (err) {
    console.error(
      "[account/delete/request-code] email send failed",
      err instanceof Error ? err.message : String(err)
    );
    // Roll back the unused hash so a failed send does not leave a live code
    // the owner never received. Plaintext was never returned to the client.
    await prisma.accountDeletionToken.deleteMany({ where: { userId, token: tokenHash } }).catch(() => {});
    return NextResponse.json(
      { error: "We couldn't send the confirmation email right now. Please try again in a few minutes." },
      { status: 502 }
    );
  }

  await auditEvent({ userId, action: "account_deletion_code_requested", targetId: userId, ip });

  return NextResponse.json({ ok: true, message: "A confirmation code has been sent to your account email." });
}
