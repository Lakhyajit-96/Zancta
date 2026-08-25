import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { forgotSchema } from "@/lib/validators";
import { rateLimitAsync, getClientIp } from "@/lib/rate-limit";
import { limitAuthEmailDelivery } from "@/lib/auth-email-rate-limit";
import { auditEvent } from "@/lib/audit";
import { hashToken, generateSecureToken } from "@/lib/token";
import { safeServerError } from "@/lib/safe-error";
import { getAppOrigin } from "@/lib/seo";
import { isLocalDevRequest } from "@/lib/dev-only";

const GENERIC_FORGOT = "If that email exists, a reset link has been sent.";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = forgotSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid email" }, { status: 400 });

  const ip = getClientIp(req.headers);
  const rl = await rateLimitAsync(`forgot:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });

  const { email } = parsed.data;
  const rlEmail = await limitAuthEmailDelivery("forgot-password", email);
  if (!rlEmail.ok) {
    return NextResponse.json({ ok: true, message: GENERIC_FORGOT });
  }
  let stage = "db-lookup";
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return generic success to avoid enumeration
    if (!user || user.deletedAt) {
      return NextResponse.json({ ok: true, message: GENERIC_FORGOT });
    }

    stage = "db-create-token";
    const plainToken = generateSecureToken();
    const tokenHash = hashToken(plainToken);
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      await tx.passwordResetToken.create({ data: { userId: user.id, token: tokenHash, expires } });
    });

    stage = "email-send";
    const url = `${getAppOrigin()}/reset-password?token=${plainToken}`;
    try {
      const { getEmailAdapter } = await import("@/lib/email/index");
      const emailer = getEmailAdapter();
      await emailer.sendPasswordReset(email, url);
    } catch (sendErr) {
      console.error("[auth/forgot-password] reset email send failed", sendErr instanceof Error ? sendErr.message : String(sendErr));
      return NextResponse.json({
        ok: true,
        message: "We couldn't send the email right now. Please try again in a few minutes.",
        ...(isLocalDevRequest(req) ? { devToken: plainToken } : {}),
      });
    }

    stage = "audit";
    await auditEvent({ userId: user.id, action: "password_reset_requested", targetId: user.id, ip });

    const allowDevToken = isLocalDevRequest(req);
    return NextResponse.json({
      ok: true,
      message: GENERIC_FORGOT,
      ...(allowDevToken ? { devToken: plainToken } : {}),
    });
  } catch (err) {
    return safeServerError("auth/forgot-password", stage, err);
  }
}
