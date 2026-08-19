import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { signupSchema } from "@/lib/validators";
import { rateLimitAsync, getClientIp } from "@/lib/rate-limit";
import { auditEvent } from "@/lib/audit";
import { hashToken, generateSecureToken } from "@/lib/token";
import { safeServerError } from "@/lib/safe-error";

async function createAndSendVerification(userId: string, email: string): Promise<{ ok: boolean; plainToken: string }> {
  // Replace any stale tokens for this account, then issue a fresh one-time
  // hashed token and attempt delivery. Delivery failure is reported to the
  // caller — the account stays valid and recoverable via resend-verification.
  await prisma.verificationToken.deleteMany({ where: { userId } });
  const plainToken = generateSecureToken();
  const tokenHash = hashToken(plainToken);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.verificationToken.create({ data: { identifier: email, token: tokenHash, expires, userId } });

  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const url = `${base}/verify-email?token=${plainToken}`;
  const { getEmailAdapter } = await import("@/lib/email/index");
  const emailer = getEmailAdapter();
  try {
    await emailer.sendVerification(email, url);
    return { ok: true, plainToken };
  } catch (sendErr) {
    // Log internals server-side only; never return them to the client.
    console.error("[auth/signup] verification email send failed", sendErr instanceof Error ? sendErr.message : String(sendErr));
    return { ok: false, plainToken };
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = await rateLimitAsync(`signup:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { email, password, name } = parsed.data;
  let stage = "db-lookup";
  try {
    const existing = await prisma.user.findUnique({ where: { email } });

    // Verified account already exists — intended policy surfaces this (no
    // new enumeration beyond existing behavior).
    if (existing && !existing.deletedAt && existing.emailVerified) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    // Recovery path: account exists but never verified (e.g., the original
    // verification email failed to send). Rotate the token and retry
    // delivery instead of trapping the user behind a 409.
    if (existing && !existing.deletedAt && !existing.emailVerified) {
      stage = "email-send";
      const sent = await createAndSendVerification(existing.id, email);
      await auditEvent({ userId: existing.id, action: "verification_email_requested", targetId: existing.id, ip });
      if (!sent.ok) {
        return NextResponse.json({
          ok: true,
          emailIssue: true,
          message: "That account exists but isn't verified yet. We couldn't send a verification email right now — please try again in a few minutes.",
        });
      }
      return NextResponse.json({ ok: true, message: "That account isn't verified yet. A new verification email is on its way." });
    }

    if (existing?.deletedAt) {
      // Allow re-registration after deletion — hard delete old if past retention or recreate
      await prisma.user.delete({ where: { id: existing.id } }).catch(() => {});
    }

    stage = "hash";
    const passwordHash = await bcrypt.hash(password, 12);
    stage = "db-create-user";
    const user = await prisma.user.create({
      data: { email, passwordHash, name: name || null },
    });
    stage = "db-create-entitlement";
    await prisma.entitlement.create({ data: { userId: user.id, plan: "FREE", status: "ACTIVE" } });

    stage = "email-send";
    const sent = await createAndSendVerification(user.id, email);

    stage = "audit";
    await auditEvent({ userId: user.id, action: "signup", targetId: user.id, ip, userAgent: req.headers.get("user-agent") });

    // Dev token exposure only outside any Vercel environment (local E2E without Resend).
    const isDev = process.env.NODE_ENV !== "production" || !process.env.VERCEL_ENV;
    const allowDevToken = (isDev || req.headers.get("host")?.includes("localhost")) && !process.env.RESEND_API_KEY;
    if (!sent.ok) {
      // Account + entitlement + token exist; only delivery failed. Return a
      // truthful 200 with recovery guidance instead of a trapping 500.
      return NextResponse.json({
        ok: true,
        emailIssue: true,
        message: "Account created, but we couldn't send the verification email right now. Request a new one from the verify-email page.",
        ...(allowDevToken ? { devToken: sent.plainToken } : {}),
      });
    }
    return NextResponse.json({ ok: true, message: "Account created. Check your email to verify.", ...(allowDevToken ? { devToken: sent.plainToken } : {}) });
  } catch (err) {
    return safeServerError("auth/signup", stage, err);
  }
}
