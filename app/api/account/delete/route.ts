import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { auditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as unknown as { id: string }).id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(req.headers);
  const rl = rateLimit(`delete:${userId}`, 3, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });

  const { confirm } = await req.json().catch(() => ({}));
  if (confirm !== "DELETE") return NextResponse.json({ error: "Confirmation required" }, { status: 400 });

  // Hard delete for privacy: remove user and cascade (sessions, accounts, entitlement, tokens)
  // Audit event is anonymized (userId set null via SetNull? but we keep targetId)
  await auditEvent({ userId, action: "account_deleted", targetId: userId, ip });

  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ ok: true });
}
