import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { isVercelPreview } from "@/lib/preview-isolation";
import { getAppOrigin } from "@/lib/seo";
import { fail, type ApiResult } from "./types";

export function operatorIntegrationsAllowed(): boolean {
  if (isVercelPreview()) return false;
  return true;
}

export function previewIsolatedResult<T>(): ApiResult<T> {
  return fail("PREVIEW_ISOLATED", "Preview deployments cannot use Production Google or Bing credentials.");
}

export async function requireAdminOperator(): Promise<
  { ok: true; userId: string } | { ok: false; response: NextResponse }
> {
  if (!operatorIntegrationsAllowed()) {
    return {
      ok: false,
      response: NextResponse.json(
        { state: "PREVIEW_ISOLATED", error: "Preview cannot connect operator search or analytics APIs." },
        { status: 503 },
      ),
    };
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, response: NextResponse.redirect(new URL("/signin", getAppOrigin())) };
  }

  const entitlement = await prisma.entitlement.findUnique({
    where: { userId },
    select: { plan: true },
  });
  if (entitlement?.plan !== "ADMIN") {
    return { ok: false, response: NextResponse.redirect(new URL("/account", getAppOrigin())) };
  }

  return { ok: true, userId };
}

export function operatorCallbackUrl(provider: "google" | "bing"): string {
  return `${getAppOrigin()}/api/admin/integrations/${provider}/callback`;
}
