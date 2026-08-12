import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { signupSchema } from "@/lib/validators";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { auditEvent } from "@/lib/audit";
import { hashToken, generateSecureToken } from "@/lib/token";
import { safeServerError } from "@/lib/safe-error";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = rateLimit(`signup:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { email, password, name } = parsed.data;
  let stage = "db-lookup";
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && !existing.deletedAt) return NextResponse.json({ error: "Email already registered" }, { status: 409 });
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

    stage = "db-create-token";
    const plainToken = generateSecureToken();
    const tokenHash = hashToken(plainToken);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.verificationToken.create({ data: { identifier: email, token: tokenHash, expires, userId: user.id } });

    stage = "email-send";
    const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const url = `${base}/verify-email?token=${plainToken}`;
    const { getEmailAdapter } = await import("@/lib/email/index");
    const emailer = getEmailAdapter();
    await emailer.sendVerification(email, url);

    stage = "audit";
    await auditEvent({ userId: user.id, action: "signup", targetId: user.id, ip, userAgent: req.headers.get("user-agent") });

    const isDev = process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV !== "production";
    const allowDevToken = (isDev || req.headers.get("host")?.includes("localhost")) && !process.env.RESEND_API_KEY;
    return NextResponse.json({ ok: true, message: "Account created. Check your email to verify.", ...(allowDevToken ? { devToken: plainToken } : {}) });
  } catch (err) {
    return safeServerError("auth/signup", stage, err);
  }
}
