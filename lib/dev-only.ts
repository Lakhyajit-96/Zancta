function hostIsLocal(host?: string | null): boolean {
  if (!host) return false;
  const hostname = host.split(":")[0].toLowerCase();
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]" || hostname === "::1";
}

export function isDevOnlyRouteEnabled(host?: string | null): boolean {
  // Exact local hosts only — never a substring match such as "localhost.attacker.com".
  // Closed on every non-local host, including Railway/Fly when VERCEL_ENV is unset.
  return hostIsLocal(host);
}

/** Plain tokens in JSON for local E2E only. Never on Vercel public hosts. */
export function allowDevTokenExposure(host?: string | null): boolean {
  return isDevOnlyRouteEnabled(host);
}

function requestLooksLocal(req: { headers: Headers; nextUrl?: URL }): boolean {
  return hostIsLocal(req.headers.get("host")) || hostIsLocal(req.nextUrl?.hostname ?? null);
}

export function isLocalDevRequest(req: { headers: Headers; nextUrl?: URL }): boolean {
  return requestLooksLocal(req);
}
