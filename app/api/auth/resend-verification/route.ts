import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { rateLimitAsync, getClientIp } from "@/lib/rate-limit";
import { auditEvent } from "@/lib/audit";
import { hashToken, generateSecureToken } from "@/lib/token";

const GENERIC_SENT = "If that email is registered and not verified yet, a new verification email is on its way.";

// POST /api/auth/resend-verification { email }
// Public recovery flow for unverified accounts. Enumeration-safe: unknown,
// deleted, and already-verified emails all receive the same generic 200 and
// no token is created for them. Rate-limited per IP and per email address.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rlIp = await rateLimitAsync(`resend-verify:${ip}`, 5, 15 * 60 * 1000);
  if (!rlIp.ok) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  // Per-email cooldown so a targeted address can't be flooded with resends.
  const rlEmail = await rateLimitAsync(`resend-verify-email:${email}`, 3, 60 * 60 * 1000);
  if (!rlEmail.ok) {
    return NextResponse.json({ ok: true, cooldown: true, message: "Please wait a while before requesting another verification email." });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // No account, deleted, or already verified — same generic response, no
  // token work, no existence leak.
  if (!user || user.deletedAt || user.emailVerified) {
    return NextResponse.json({ ok: true, message: GENERIC_SENT });
  }

  // Rotate: drop any stale tokens, store only the SHA-256 hash, 24h expiry.
  await prisma.verificationToken.deleteMany({ where: { userId: user.id } });
  const plainToken = generateSecureToken();
  const tokenHash = hashToken(plainToken);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.verificationToken.create({ data: { identifier: email, token: tokenHash, expires, userId: user.id } });

  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const url = `${base}/verify-email?token=${plainToken}`;
  try {
    const { getEmailAdapter } = await import("@/lib/email/index");
    const emailer = getEmailAdapter();
    await emailer.sendVerification(email, url);
  } catch (sendErr) {
    // Delivery failed: the fresh token is stored, so a retry works as soon as
    // delivery recovers. Truthful generic message; no internals exposed.
    console.error("[auth/resend-verification] send failed", sendErr instanceof Error ? sendErr.message : String(sendErr));
    return NextResponse.json({ ok: true, emailIssue: true, message: "We couldn't send the email right now. Please try again in a few minutes." });
  }

  await auditEvent({ userId: user.id, action: "verification_email_requested", targetId: user.id, ip });

  return NextResponse.json({ ok: true, message: GENERIC_SENT });
}
