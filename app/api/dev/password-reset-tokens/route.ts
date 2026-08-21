import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { isLocalDevRequest } from "@/lib/dev-only";

export async function GET(req: NextRequest) {
  if (!isLocalDevRequest(req)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const email = req.nextUrl.searchParams.get("email");
  const tokens = await prisma.passwordResetToken.findMany({
    where: email ? { user: { email } } : undefined,
    orderBy: { expires: "desc" },
    take: 5,
  });
  return NextResponse.json({ tokens });
}
