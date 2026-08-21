import { LEGAL_PUBLIC } from "@/lib/legal-public";
import { getAppOrigin, PUBLIC_SITE_URL } from "@/lib/seo";

function originFromValue(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function allowedContactOrigins(): Set<string> {
  const candidates = [getAppOrigin(), LEGAL_PUBLIC.siteUrl, PUBLIC_SITE_URL, "https://www.zancta.tech"];
  const origins = new Set<string>();
  for (const candidate of candidates) {
    const origin = originFromValue(candidate);
    if (origin) origins.add(origin);
  }
  return origins;
}

export function isAllowedContactOrigin(headers: Headers): boolean {
  const allowed = allowedContactOrigins();
  const originHeader = headers.get("origin");
  if (originHeader) {
    const origin = originFromValue(originHeader);
    return Boolean(origin && allowed.has(origin));
  }
  const referer = headers.get("referer");
  if (referer) {
    const origin = originFromValue(referer);
    return Boolean(origin && allowed.has(origin));
  }
  return false;
}

export const CONTACT_MAX_BODY_BYTES = 20_000;
