import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { rateLimitAsync, getClientIp } from "@/lib/rate-limit";
import { auditEvent } from "@/lib/audit";
import { hashToken } from "@/lib/token";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = await rateLimitAsync(`verify:${ip}`, 10, 15 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });

  const { token } = await req.json().catch(() => ({}));
  if (!token || typeof token !== "string") return NextResponse.json({ error: "Invalid token" }, { status: 400 });

  const tokenHash = hashToken(token);
  const vt = await prisma.verificationToken.findUnique({ where: { token: tokenHash } });
  if (!vt) return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  if (vt.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token: tokenHash } }).catch(() => {});
    return NextResponse.json({ error: "Token expired" }, { status: 400 });
  }

  const user = vt.userId ? await prisma.user.findUnique({ where: { id: vt.userId } }) : await prisma.user.findUnique({ where: { email: vt.identifier } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Atomic: transaction ensures only one redemption succeeds
  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
      await tx.verificationToken.delete({ where: { token: tokenHash } });
    });
  } catch {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  }

  await auditEvent({ userId: user.id, action: "email_verified", targetId: user.id, ip });

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
  const tokenHash = hashToken(token);
  const vt = await prisma.verificationToken.findUnique({ where: { token: tokenHash } });
  if (!vt) return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  if (vt.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token: tokenHash } }).catch(() => {});
    return NextResponse.json({ error: "Token expired" }, { status: 400 });
  }
  const user = vt.userId ? await prisma.user.findUnique({ where: { id: vt.userId } }) : await prisma.user.findUnique({ where: { email: vt.identifier } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
      await tx.verificationToken.delete({ where: { token: tokenHash } });
    });
  } catch {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  }
  await auditEvent({ userId: user.id, action: "email_verified", targetId: user.id, ip: getClientIp(req.headers) });
  return NextResponse.json({ ok: true });
}
