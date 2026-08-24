import { NextResponse } from "next/server";
import { operatorIntegrationsAllowed, requireAdminOperator } from "@/lib/integrations/gate";
import { disconnect } from "@/lib/integrations/store";
import { getAppOrigin } from "@/lib/seo";

export async function POST() {
  if (!operatorIntegrationsAllowed()) {
    return NextResponse.json({ state: "PREVIEW_ISOLATED" }, { status: 503 });
  }
  const admin = await requireAdminOperator();
  if (!admin.ok) return admin.response;
  await disconnect("bing", admin.userId);
  return NextResponse.redirect(new URL("/admin/integrations", getAppOrigin()));
}
