import { NextRequest, NextResponse } from "next/server";
import { indexNowKeyFileResponse } from "@/lib/indexnow";
import { requireProductionConfig } from "@/lib/production-config";
import {
  isPreviewBlockedRequest,
  PREVIEW_ISOLATED_CODE,
  PREVIEW_ISOLATED_MESSAGE,
} from "@/lib/preview-isolation";
import {
  buildApiCsp,
  buildHtmlCsp,
  generateCspNonce,
  HTML_NONCE_CACHE_CONTROL,
  isHtmlDocumentPath,
  isRootTxtPath,
} from "@/lib/http/csp";

function applyApiAndIndexNowGuards(req: NextRequest): NextResponse | null {
  const misconfigured = requireProductionConfig();
  if (misconfigured) return misconfigured;

  if (isPreviewBlockedRequest(req.method, req.nextUrl.pathname)) {
    return NextResponse.json(
      { error: PREVIEW_ISOLATED_MESSAGE, code: PREVIEW_ISOLATED_CODE },
      { status: 503 },
    );
  }

  const file = indexNowKeyFileResponse(req.nextUrl.pathname);
  if (!file) return null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    return new NextResponse("Method Not Allowed", { status: 405, headers: { allow: "GET, HEAD" } });
  }
  return new NextResponse(req.method === "HEAD" ? null : file.body, {
    status: 200,
    headers: file.headers,
  });
}

export default function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isApi = pathname.startsWith("/api/");
  const isTxt = isRootTxtPath(pathname);

  // Production-config and Preview isolation stay on /api and IndexNow key files only.
  if (isApi || isTxt) {
    const guarded = applyApiAndIndexNowGuards(req);
    if (guarded) return guarded;
    if (isApi) {
      const res = NextResponse.next();
      res.headers.set("Content-Security-Policy", buildApiCsp());
      return res;
    }
    return NextResponse.next();
  }

  if (!isHtmlDocumentPath(pathname)) {
    return NextResponse.next();
  }

  const nonce = generateCspNonce();
  const csp = buildHtmlCsp(nonce);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const res = NextResponse.next({
    request: { headers: requestHeaders },
  });
  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("Cache-Control", HTML_NONCE_CACHE_CONTROL);
  return res;
}

export const config = {
  matcher: [
    "/:file.txt",
    "/api/:path*",
    {
      source: "/((?!_next/static|_next/image|favicon.ico|icons/|assets/|ocr/).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
