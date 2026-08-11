import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { forgotSchema } from "@/lib/validators";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { auditEvent } from "@/lib/audit";
import { hashToken, generateSecureToken } from "@/lib/token";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = rateLimit(`forgot:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = forgotSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid email" }, { status: 400 });

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return generic success to avoid enumeration
  if (!user || user.deletedAt) {
    return NextResponse.json({ ok: true, message: "If that email exists, a reset link has been sent." });
  }

  const plainToken = generateSecureToken();
  const tokenHash = hashToken(plainToken);
  const expires = new Date(Date.now() + 60 * 60 * 1000);
  await prisma.passwordResetToken.create({ data: { userId: user.id, token: tokenHash, expires } });
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const url = `${base}/reset-password?token=${plainToken}`;
  const { getEmailAdapter } = await import("@/lib/email/index");
  const emailer = getEmailAdapter();
  await emailer.sendPasswordReset(email, url);
  await auditEvent({ userId: user.id, action: "password_reset_requested", targetId: user.id, ip });

  return NextResponse.json({ ok: true, message: "If that email exists, a reset link has been sent." });
}
