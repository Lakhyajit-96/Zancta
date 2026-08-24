import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { bingUserSites, pickBingSite } from "@/lib/integrations/bing/webmaster";
import { exchangeBingCode } from "@/lib/integrations/bing/oauth";
import { verifyOAuthState } from "@/lib/integrations/crypto";
import { operatorIntegrationsAllowed, requireAdminOperator } from "@/lib/integrations/gate";
import { upsertTokens } from "@/lib/integrations/store";

export async function GET(req: Request) {
  if (!operatorIntegrationsAllowed()) {
    return NextResponse.json({ state: "PREVIEW_ISOLATED" }, { status: 503 });
  }
  const admin = await requireAdminOperator();
  if (!admin.ok) return admin.response;
  const url = new URL(req.url);
  if (url.searchParams.get("error")) {
    return NextResponse.redirect(new URL("/admin/integrations?error=bing-denied", req.url));
  }
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const payload = state ? verifyOAuthState(state) : null;
  const jar = await cookies();
  const nonce = jar.get("zancta_op_oauth_bing")?.value;
  jar.delete("zancta_op_oauth_bing");
  if (!code || !payload || !nonce) {
    return NextResponse.redirect(new URL("/admin/integrations?error=bing-state", req.url));
  }
  let parsed: { uid?: string; provider?: string; n?: string };
  try {
    parsed = JSON.parse(payload) as { uid?: string; provider?: string; n?: string };
  } catch {
    return NextResponse.redirect(new URL("/admin/integrations?error=bing-state", req.url));
  }
  if (parsed.uid !== admin.userId || parsed.provider !== "bing" || parsed.n !== nonce) {
    return NextResponse.redirect(new URL("/admin/integrations?error=bing-state", req.url));
  }
  const tokens = await exchangeBingCode(code);
  if (!tokens.ok) return NextResponse.redirect(new URL("/admin/integrations?error=bing-token", req.url));
  const sites = await bingUserSites(tokens.accessToken);
  const siteUrl = sites.data ? pickBingSite(sites.data) : null;
  await upsertTokens({
    provider: "bing",
    userId: admin.userId,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresInSec: tokens.expiresIn,
    selectedProperty: siteUrl,
  });
  return NextResponse.redirect(new URL("/admin/integrations/bing?connected=1", req.url));
}
