import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { forgotSchema } from "@/lib/validators";
import { rateLimitAsync, getClientIp } from "@/lib/rate-limit";
import { auditEvent } from "@/lib/audit";
import { hashToken, generateSecureToken } from "@/lib/token";
import { safeServerError } from "@/lib/safe-error";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = await rateLimitAsync(`forgot:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = forgotSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid email" }, { status: 400 });

  const { email } = parsed.data;
  let stage = "db-lookup";
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return generic success to avoid enumeration
    if (!user || user.deletedAt) {
      return NextResponse.json({ ok: true, message: "If that email exists, a reset link has been sent." });
    }

    stage = "db-create-token";
    const plainToken = generateSecureToken();
    const tokenHash = hashToken(plainToken);
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.passwordResetToken.create({ data: { userId: user.id, token: tokenHash, expires } });

    stage = "email-send";
    const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const url = `${base}/reset-password?token=${plainToken}`;
    const { getEmailAdapter } = await import("@/lib/email/index");
    const emailer = getEmailAdapter();
    await emailer.sendPasswordReset(email, url);

    stage = "audit";
    await auditEvent({ userId: user.id, action: "password_reset_requested", targetId: user.id, ip });

    return NextResponse.json({ ok: true, message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    return safeServerError("auth/forgot-password", stage, err);
  }
}
