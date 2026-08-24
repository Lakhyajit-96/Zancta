import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { signOAuthState } from "@/lib/integrations/crypto";
import { operatorIntegrationsAllowed, requireAdminOperator } from "@/lib/integrations/gate";
import { googleAuthorizeUrl, googleOperatorClient } from "@/lib/integrations/google/oauth";
import { googleConfigured } from "@/lib/integrations/store";
import { getClientIp, rateLimitAsync } from "@/lib/rate-limit";

export async function GET(req: Request) {
  if (!operatorIntegrationsAllowed()) {
    return NextResponse.json({ state: "PREVIEW_ISOLATED" }, { status: 503 });
  }
  const admin = await requireAdminOperator();
  if (!admin.ok) return admin.response;
  if (!googleConfigured() || !googleOperatorClient().id) {
    return NextResponse.redirect(new URL("/admin/integrations?error=google-not-configured", req.url));
  }
  const limited = await rateLimitAsync(`op-oauth:${getClientIp(req.headers)}`, 10, 15 * 60 * 1000);
  if (!limited.ok) return NextResponse.json({ state: "RATE_LIMITED" }, { status: 429 });
  const nonce = crypto.randomUUID();
  const state = signOAuthState(JSON.stringify({ uid: admin.userId, provider: "google", n: nonce, exp: Date.now() + 600_000 }));
  const url = googleAuthorizeUrl(state);
  if (!url) return NextResponse.redirect(new URL("/admin/integrations?error=google-not-configured", req.url));
  (await cookies()).set("zancta_op_oauth", nonce, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 600 });
  return NextResponse.redirect(url);
}
