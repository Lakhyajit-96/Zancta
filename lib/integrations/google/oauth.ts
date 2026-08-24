import { operatorCallbackUrl } from "../gate";

const AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN = "https://oauth2.googleapis.com/token";
const REVOKE = "https://oauth2.googleapis.com/revoke";
const USERINFO = "https://openidconnect.googleapis.com/v1/userinfo";

export const GOOGLE_OPERATOR_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/webmasters",
  "https://www.googleapis.com/auth/analytics.readonly",
].join(" ");

export function googleOperatorClient() {
  const id = process.env.GOOGLE_OPERATOR_CLIENT_ID?.trim() || process.env.GOOGLE_CLIENT_ID?.trim();
  const secret = process.env.GOOGLE_OPERATOR_CLIENT_SECRET?.trim() || process.env.GOOGLE_CLIENT_SECRET?.trim();
  return { id: id || null, secret: secret || null };
}

export function googleAuthorizeUrl(state: string): string | null {
  const { id } = googleOperatorClient();
  if (!id) return null;
  const params = new URLSearchParams({
    client_id: id,
    redirect_uri: operatorCallbackUrl("google"),
    response_type: "code",
    scope: GOOGLE_OPERATOR_SCOPES,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "false",
    state,
  });
  return `${AUTH}?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string) {
  const { id, secret } = googleOperatorClient();
  if (!id || !secret) return { ok: false as const, error: "Google operator OAuth client is not configured." };
  const body = new URLSearchParams({
    code,
    client_id: id,
    client_secret: secret,
    redirect_uri: operatorCallbackUrl("google"),
    grant_type: "authorization_code",
  });
  const res = await fetch(TOKEN, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const json = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    error?: string;
  };
  if (!res.ok || !json.access_token) {
    return { ok: false as const, error: "Google did not return an access token." };
  }
  return {
    ok: true as const,
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    expiresIn: json.expires_in ?? 3600,
    scope: json.scope ?? GOOGLE_OPERATOR_SCOPES,
  };
}

export async function refreshGoogleToken(refreshToken: string) {
  const { id, secret } = googleOperatorClient();
  if (!id || !secret) return { ok: false as const, error: "Google operator OAuth client is not configured." };
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: id,
    client_secret: secret,
    grant_type: "refresh_token",
  });
  const res = await fetch(TOKEN, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const json = (await res.json()) as { access_token?: string; expires_in?: number; scope?: string };
  if (!res.ok || !json.access_token) return { ok: false as const, error: "Google token refresh failed." };
  return { ok: true as const, accessToken: json.access_token, expiresIn: json.expires_in ?? 3600, scope: json.scope };
}

export async function googleUserEmail(accessToken: string): Promise<{ email: string | null; sub: string | null }> {
  const res = await fetch(USERINFO, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
  if (!res.ok) return { email: null, sub: null };
  const json = (await res.json()) as { email?: string; sub?: string };
  return { email: json.email ?? null, sub: json.sub ?? null };
}

export async function revokeGoogleToken(token: string) {
  await fetch(`${REVOKE}?token=${encodeURIComponent(token)}`, { method: "POST", cache: "no-store" }).catch(() => {});
}
