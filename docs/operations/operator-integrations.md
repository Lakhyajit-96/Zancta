# Operator Search Console, GA4, and Bing Webmaster

ZANCTA does not clone Google or Bing UIs. The operator dashboard at `/admin/integrations` calls official APIs after the owner grants OAuth, then shows real payloads or explicit states (`AUTH_REQUIRED`, `NO_DATA`, `DATA_UNAVAILABLE`, `API_NOT_SUPPORTED`).

Website verification in Search Console / Bing Webmaster is not the same as granting this app API access. Connect from the dashboard after the Cloud / Bing client exists.

## Production vs Preview

Set every variable below on **Vercel Production only**. Do not add them to Preview. Preview `/api/admin/integrations/*` is blocked, including OAuth callbacks.

Do not paste client secrets or refresh tokens into chat.

## Google Cloud (Search Console + GA4)

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Select or create a project (this can be the same project as user sign-in; the operator client should still be a distinct Web client or at least a distinct redirect URI).
3. Enable APIs:
   - Search Console API
   - Google Analytics Admin API
   - Google Analytics Data API
4. Configure the OAuth consent screen (External or Internal). Add the operator Google account as a test user while the app is in Testing.
5. Create an OAuth client: Application type **Web application**.
6. Authorized redirect URI (production):
   - `https://zancta.tech/api/admin/integrations/google/callback`
7. Local optional: `http://localhost:3000/api/admin/integrations/google/callback`
8. Put the client ID/secret in Vercel **Production**:
   - `GOOGLE_OPERATOR_CLIENT_ID`
   - `GOOGLE_OPERATOR_CLIENT_SECRET`
9. Generate a 32-byte key (64 hex chars) and set `INTEGRATION_ENCRYPTION_KEY` on Production only.
10. Redeploy Production.
11. Sign in to ZANCTA as the ADMIN user.
12. Open `https://zancta.tech/admin/integrations`.
13. Click **Connect Google**.
14. Approve scopes:
    - `https://www.googleapis.com/auth/webmasters`
    - `https://www.googleapis.com/auth/analytics.readonly`
    - `openid` / `email` (account identity only)
15. Confirm the dashboard shows the Google account email and `sc-domain:zancta.tech` or `https://zancta.tech/`.
16. Open Search Console and GA4 sections. If Google returns rows, they appear. If Google returns an empty row set, the UI shows **NO DATA**, not `0`.

Scopes are write for Search Console only because sitemap submit is implemented. GA4 stays read-only. There is **no** Request indexing button; Google does not expose that for ordinary URLs.

## Bing Webmaster

1. Open [Bing Webmaster Tools](https://www.bing.com/webmasters) → Settings → API Access.
2. Create an OAuth client (do not use the retired SOAP/POX stack; this app calls JSON over HTTPS with OAuth).
3. Redirect URI:
   - `https://zancta.tech/api/admin/integrations/bing/callback`
4. Set on Vercel Production only:
   - `BING_WEBMASTER_CLIENT_ID`
   - `BING_WEBMASTER_CLIENT_SECRET`
5. Redeploy Production.
6. Click **Connect Bing** on `/admin/integrations`.
7. Approve `webmaster.manage`.
8. Confirm `https://zancta.tech` is selected.
9. URL submit is a confirmed, audited, rate-limited action for a single `https://zancta.tech/…` URL. It does not submit the whole sitemap and does not rotate IndexNow keys.

## After connect: live verification

The phase is not complete until these return real provider JSON (or a real `NO_DATA` / permission error):

- Search Analytics query for `zancta.tech`
- URL Inspection for `https://zancta.tech/`
- GA4 `runReport` for measurement ID `G-56KMDH7Z2X`
- Bing `GetUserSites` + at least one stats method

Until Connect succeeds, the dashboard must show `AUTH_REQUIRED` or `NOT_CONFIGURED`.

## Rollback

1. Disconnect from the dashboard (revokes Google token when possible and deletes ciphertext).
2. Remove the five Production env vars and redeploy.
3. Optional: `DELETE FROM "OperatorConnection"; DELETE FROM "OperatorSnapshot";`
