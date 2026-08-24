import { fail, ok, type ApiResult } from "./types";
import {
  bingConfigured,
  getConnection,
  googleConfigured,
  readAccessToken,
  readRefreshToken,
  recordFailure,
  upsertTokens,
} from "./store";
import { refreshGoogleToken } from "./google/oauth";
import { refreshBingToken } from "./bing/oauth";
import type { ProviderId } from "./types";

export async function getValidAccessToken(provider: ProviderId): Promise<ApiResult<string>> {
  if (provider === "google" && !googleConfigured()) {
    return fail("NOT_CONFIGURED", "Google operator OAuth is not configured in Production env.");
  }
  if (provider === "bing" && !bingConfigured()) {
    return fail("NOT_CONFIGURED", "Bing Webmaster OAuth is not configured in Production env.");
  }

  const row = await getConnection(provider);
  if (!row?.accessTokenEnc && !row?.refreshTokenEnc) {
    return fail("AUTH_REQUIRED", "Connect this provider from the operator dashboard.");
  }

  const stillValid = row.tokenExpiresAt && row.tokenExpiresAt.getTime() - 30_000 > Date.now();
  if (stillValid) {
    try {
      const token = await readAccessToken(provider);
      if (token) return ok(token);
    } catch {
      return fail("DATA_UNAVAILABLE", "Stored access token could not be decrypted.");
    }
  }

  try {
    const refresh = await readRefreshToken(provider);
    if (!refresh) {
      await recordFailure(provider, "TOKEN_EXPIRED", "Reconnect required. No refresh token is stored.", "TOKEN_EXPIRED");
      return fail("TOKEN_EXPIRED", "Authorization expired. Reconnect the operator account.");
    }
    if (provider === "google") {
      const renewed = await refreshGoogleToken(refresh);
      if (!renewed.ok) {
        await recordFailure(provider, "TOKEN_EXPIRED", "Token refresh failed. Reconnect the operator account.", "TOKEN_EXPIRED");
        return fail("TOKEN_EXPIRED", "Authorization expired. Reconnect the operator account.");
      }
      await upsertTokens({
        provider,
        userId: row.connectedByUserId || "system",
        accessToken: renewed.accessToken,
        refreshToken: refresh,
        expiresInSec: renewed.expiresIn,
        scopes: renewed.scope ?? row.scopes,
      });
      return ok(renewed.accessToken);
    }
    const renewed = await refreshBingToken(refresh);
    if (!renewed.ok) {
      await recordFailure(provider, "TOKEN_EXPIRED", "Token refresh failed. Reconnect the operator account.", "TOKEN_EXPIRED");
      return fail("TOKEN_EXPIRED", "Authorization expired. Reconnect the operator account.");
    }
    await upsertTokens({
      provider,
      userId: row.connectedByUserId || "system",
      accessToken: renewed.accessToken,
      refreshToken: renewed.refreshToken || refresh,
      expiresInSec: renewed.expiresIn,
      scopes: row.scopes,
    });
    return ok(renewed.accessToken);
  } catch {
    return fail("DATA_UNAVAILABLE", "Token refresh failed.");
  }
}
