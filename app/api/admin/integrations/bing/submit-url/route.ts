import { NextResponse } from "next/server";
import { auditEvent } from "@/lib/audit";
import { bingSubmitUrl } from "@/lib/integrations/bing/webmaster";
import { operatorIntegrationsAllowed, requireAdminOperator } from "@/lib/integrations/gate";
import { getPublicConnection } from "@/lib/integrations/store";
import { getValidAccessToken } from "@/lib/integrations/tokens";
import { getClientIp, rateLimitAsync } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!operatorIntegrationsAllowed()) {
    return NextResponse.json({ state: "PREVIEW_ISOLATED" }, { status: 503 });
  }
  const admin = await requireAdminOperator();
  if (!admin.ok) return admin.response;
  const limited = await rateLimitAsync(`bing-submit:${admin.userId}`, 10, 60 * 60 * 1000);
  if (!limited.ok) return NextResponse.json({ state: "RATE_LIMITED" }, { status: 429 });
  const body = (await req.json().catch(() => null)) as { url?: string; confirm?: boolean } | null;
  const target = body?.url?.trim() ?? "";
  if (!body?.confirm) {
    return NextResponse.json({ state: "DATA_UNAVAILABLE", message: "Confirmation is required." }, { status: 400 });
  }
  if (!target.startsWith("https://zancta.tech/") || target === "https://zancta.tech/sitemap.xml") {
    return NextResponse.json({
      state: "DATA_UNAVAILABLE",
      message: "Submit a specific https://zancta.tech URL. Do not submit the whole sitemap here.",
    }, { status: 400 });
  }
  const token = await getValidAccessToken("bing");
  if (token.state !== "DATA_AVAILABLE" || !token.data) return NextResponse.json(token, { status: 401 });
  const connection = await getPublicConnection("bing");
  if (!connection.selectedProperty) {
    return NextResponse.json({ state: "PROPERTY_NOT_FOUND", message: "Bing site is not selected." }, { status: 404 });
  }
  const result = await bingSubmitUrl(token.data, connection.selectedProperty, target);
  await auditEvent({
    userId: admin.userId,
    action: "operator_bing_submit_url",
    metadata: JSON.stringify({ url: target, state: result.state }),
    ip: getClientIp(req.headers),
  });
  return NextResponse.json(result);
}
