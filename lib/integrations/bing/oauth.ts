import { operatorCallbackUrl } from "../gate";

const AUTHORIZE = "https://www.bing.com/webmasters/oauth/authorize";
const TOKEN = "https://www.bing.com/webmasters/oauth/token";

export const BING_SCOPE = "webmaster.manage";

export function bingClient() {
  const id = process.env.BING_WEBMASTER_CLIENT_ID?.trim() || null;
  const secret = process.env.BING_WEBMASTER_CLIENT_SECRET?.trim() || null;
  return { id, secret };
}

export function bingAuthorizeUrl(state: string): string | null {
  const { id } = bingClient();
  if (!id) return null;
  const params = new URLSearchParams({
    response_type: "code",
    client_id: id,
    redirect_uri: operatorCallbackUrl("bing"),
    scope: BING_SCOPE,
    state,
  });
  return `${AUTHORIZE}?${params.toString()}`;
}

async function bingTokenRequest(body: URLSearchParams) {
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
    error?: string;
  };
  if (!res.ok || !json.access_token) return { ok: false as const, error: "Bing did not return an access token." };
  return {
    ok: true as const,
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    expiresIn: json.expires_in ?? 3600,
  };
}

export async function exchangeBingCode(code: string) {
  const { id, secret } = bingClient();
  if (!id || !secret) return { ok: false as const, error: "Bing Webmaster OAuth client is not configured." };
  return bingTokenRequest(
    new URLSearchParams({
      client_id: id,
      client_secret: secret,
      code,
      grant_type: "authorization_code",
      redirect_uri: operatorCallbackUrl("bing"),
    }),
  );
}

export async function refreshBingToken(refreshToken: string) {
  const { id, secret } = bingClient();
  if (!id || !secret) return { ok: false as const, error: "Bing Webmaster OAuth client is not configured." };
  return bingTokenRequest(
    new URLSearchParams({
      client_id: id,
      client_secret: secret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  );
}
