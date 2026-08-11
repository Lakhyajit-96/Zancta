import prisma from "@/lib/db";

export async function auditEvent(opts: {
  userId?: string | null;
  action: string;
  targetId?: string | null;
  metadata?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}) {
  try {
    await prisma.auditEvent.create({ data: opts });
  } catch {
    // audit must not break main flow
  }
}
