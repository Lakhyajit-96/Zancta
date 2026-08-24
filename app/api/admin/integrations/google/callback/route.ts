import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyOAuthState } from "@/lib/integrations/crypto";
import { operatorIntegrationsAllowed, requireAdminOperator } from "@/lib/integrations/gate";
import { discoverGa4Property } from "@/lib/integrations/google/ga4";
import { listGscSites, pickZanctaProperty } from "@/lib/integrations/google/gsc";
import { exchangeGoogleCode, googleUserEmail } from "@/lib/integrations/google/oauth";
import { upsertTokens } from "@/lib/integrations/store";

export async function GET(req: Request) {
  if (!operatorIntegrationsAllowed()) {
    return NextResponse.json({ state: "PREVIEW_ISOLATED" }, { status: 503 });
  }
  const admin = await requireAdminOperator();
  if (!admin.ok) return admin.response;
  const url = new URL(req.url);
  if (url.searchParams.get("error")) {
    return NextResponse.redirect(new URL("/admin/integrations?error=google-denied", req.url));
  }
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const payload = state ? verifyOAuthState(state) : null;
  const jar = await cookies();
  const nonce = jar.get("zancta_op_oauth")?.value;
  jar.delete("zancta_op_oauth");
  if (!code || !payload || !nonce) {
    return NextResponse.redirect(new URL("/admin/integrations?error=google-state", req.url));
  }
  let parsed: { uid?: string; provider?: string; n?: string };
  try {
    parsed = JSON.parse(payload) as { uid?: string; provider?: string; n?: string };
  } catch {
    return NextResponse.redirect(new URL("/admin/integrations?error=google-state", req.url));
  }
  if (parsed.uid !== admin.userId || parsed.provider !== "google" || parsed.n !== nonce) {
    return NextResponse.redirect(new URL("/admin/integrations?error=google-state", req.url));
  }
  const tokens = await exchangeGoogleCode(code);
  if (!tokens.ok) return NextResponse.redirect(new URL("/admin/integrations?error=google-token", req.url));
  const identity = await googleUserEmail(tokens.accessToken);
  const sites = await listGscSites(tokens.accessToken);
  const property = sites.data ? pickZanctaProperty(sites.data) : null;
  const ga4 = await discoverGa4Property(tokens.accessToken);
  await upsertTokens({
    provider: "google",
    userId: admin.userId,
    accountEmail: identity.email,
    accountSubject: identity.sub,
    scopes: tokens.scope,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresInSec: tokens.expiresIn,
    selectedProperty: property,
    ga4PropertyId: ga4.data?.propertyId ?? null,
    ga4MeasurementId: ga4.data?.measurementId ?? null,
  });
  return NextResponse.redirect(new URL("/admin/integrations/google?connected=1", req.url));
}
