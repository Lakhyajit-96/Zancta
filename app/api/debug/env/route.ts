import { NextResponse } from "next/server";
import { assertProductionConfig } from "@/lib/production-config";

export async function GET() {
  // Only allow in production debug — no secrets exposed, just presence
  const { ok, missing, warnings } = assertProductionConfig();
  const presence = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    AUTH_TRUST_HOST: !!process.env.AUTH_TRUST_HOST,
    NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    AUTH_URL: !!process.env.AUTH_URL,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    EMAIL_FROM: !!process.env.EMAIL_FROM,
    DODO_API_KEY: !!process.env.DODO_API_KEY,
    DODO_WEBHOOK_SECRET: !!process.env.DODO_WEBHOOK_SECRET,
    DODO_PRODUCT_MONTHLY_ID: !!process.env.DODO_PRODUCT_MONTHLY_ID,
    DODO_PRODUCT_ANNUAL_ID: !!process.env.DODO_PRODUCT_ANNUAL_ID,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL: !!process.env.VERCEL,
  };
  return NextResponse.json({ ok, missing, warnings, presence });
}
