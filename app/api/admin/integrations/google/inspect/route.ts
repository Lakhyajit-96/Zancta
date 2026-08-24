import { NextResponse } from "next/server";
import { auditEvent } from "@/lib/audit";
import { operatorIntegrationsAllowed, requireAdminOperator } from "@/lib/integrations/gate";
import { runUrlInspection } from "@/lib/integrations/google/dashboard";
import { getClientIp, rateLimitAsync } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!operatorIntegrationsAllowed()) {
    return NextResponse.json({ state: "PREVIEW_ISOLATED" }, { status: 503 });
  }
  const admin = await requireAdminOperator();
  if (!admin.ok) return admin.response;
  const limited = await rateLimitAsync(`gsc-inspect:${admin.userId}`, 20, 60 * 60 * 1000);
  if (!limited.ok) return NextResponse.json({ state: "RATE_LIMITED", message: "Inspection rate limit reached." }, { status: 429 });
  const body = (await req.json().catch(() => null)) as { url?: string } | null;
  const target = body?.url?.trim() ?? "";
  if (!target.startsWith("https://zancta.tech/")) {
    return NextResponse.json({ state: "DATA_UNAVAILABLE", message: "Only https://zancta.tech URLs can be inspected." }, { status: 400 });
  }
  const result = await runUrlInspection(target);
  await auditEvent({
    userId: admin.userId,
    action: "operator_gsc_inspect",
    metadata: JSON.stringify({ url: target, state: result.state }),
    ip: getClientIp(req.headers),
  });
  return NextResponse.json(result);
}
