import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// Dev-only: list verification tokens for E2E (disabled in production, allowed for localhost E2E)
export async function GET(req: NextRequest) {
  const isProd = process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production";
  if (isProd && !req.headers.get("host")?.includes("localhost")) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const email = req.nextUrl.searchParams.get("email");
  const tokens = await prisma.verificationToken.findMany({
    where: email ? { identifier: email } : undefined,
    orderBy: { expires: "desc" },
    take: 5,
  });
  return NextResponse.json({ tokens });
}
