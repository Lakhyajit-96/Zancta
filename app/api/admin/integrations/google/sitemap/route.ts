import { NextResponse } from "next/server";
import { auditEvent } from "@/lib/audit";
import { operatorIntegrationsAllowed, requireAdminOperator } from "@/lib/integrations/gate";
import { submitGscSitemap } from "@/lib/integrations/google/gsc";
import { getPublicConnection } from "@/lib/integrations/store";
import { getValidAccessToken } from "@/lib/integrations/tokens";
import { getClientIp, rateLimitAsync } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!operatorIntegrationsAllowed()) {
    return NextResponse.json({ state: "PREVIEW_ISOLATED" }, { status: 503 });
  }
  const admin = await requireAdminOperator();
  if (!admin.ok) return admin.response;
  const limited = await rateLimitAsync(`gsc-sitemap:${admin.userId}`, 5, 60 * 60 * 1000);
  if (!limited.ok) return NextResponse.json({ state: "RATE_LIMITED" }, { status: 429 });
  const body = (await req.json().catch(() => null)) as { feedpath?: string; confirm?: boolean } | null;
  const feedpath = body?.feedpath?.trim() ?? "https://zancta.tech/sitemap.xml";
  if (!body?.confirm) {
    return NextResponse.json({ state: "DATA_UNAVAILABLE", message: "Confirmation is required." }, { status: 400 });
  }
  if (feedpath !== "https://zancta.tech/sitemap.xml") {
    return NextResponse.json({ state: "DATA_UNAVAILABLE", message: "Only the canonical sitemap URL can be submitted." }, { status: 400 });
  }
  const token = await getValidAccessToken("google");
  if (token.state !== "DATA_AVAILABLE" || !token.data) return NextResponse.json(token, { status: 401 });
  const connection = await getPublicConnection("google");
  if (!connection.selectedProperty) {
    return NextResponse.json({ state: "PROPERTY_NOT_FOUND", message: "Search Console property is not selected." }, { status: 404 });
  }
  const result = await submitGscSitemap(token.data, connection.selectedProperty, feedpath);
  await auditEvent({
    userId: admin.userId,
    action: "operator_gsc_sitemap_submit",
    metadata: JSON.stringify({ feedpath, state: result.state }),
    ip: getClientIp(req.headers),
  });
  return NextResponse.json(result);
}
