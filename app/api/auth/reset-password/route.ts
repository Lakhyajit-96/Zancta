import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { resetSchema } from "@/lib/validators";
import { rateLimitAsync, getClientIp } from "@/lib/rate-limit";
import { auditEvent } from "@/lib/audit";
import { hashToken } from "@/lib/token";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = await rateLimitAsync(`reset:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { token, password } = parsed.data;
  const tokenHash = hashToken(token);
  const prt = await prisma.passwordResetToken.findUnique({ where: { token: tokenHash } });
  if (!prt || prt.usedAt || prt.expires < new Date()) return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.passwordResetToken.updateMany({
        where: { token: prt.token, usedAt: null, expires: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (claimed.count !== 1) throw new Error("token-consumed");
      await tx.passwordResetToken.updateMany({
        where: { userId: prt.userId, usedAt: null },
        data: { usedAt: new Date() },
      });
      await tx.user.update({
        where: { id: prt.userId },
        data: { passwordHash, authVersion: { increment: 1 } },
      });
      await tx.session.deleteMany({ where: { userId: prt.userId } });
    });
  } catch {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  }

  await auditEvent({ userId: prt.userId, action: "password_reset_completed", targetId: prt.userId, ip });

  return NextResponse.json({ ok: true });
}
