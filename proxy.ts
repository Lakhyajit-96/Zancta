import { NextRequest, NextResponse } from "next/server";
import { indexNowKeyFileResponse } from "@/lib/indexnow";
import {
  isPreviewBlockedRequest,
  PREVIEW_ISOLATED_CODE,
  PREVIEW_ISOLATED_MESSAGE,
} from "@/lib/preview-isolation";

export default function proxy(req: NextRequest) {
  if (isPreviewBlockedRequest(req.method, req.nextUrl.pathname)) {
    return NextResponse.json(
      { error: PREVIEW_ISOLATED_MESSAGE, code: PREVIEW_ISOLATED_CODE },
      { status: 503 }
    );
  }

  const file = indexNowKeyFileResponse(req.nextUrl.pathname);
  if (!file) return NextResponse.next();
  if (req.method !== "GET" && req.method !== "HEAD") {
    return new NextResponse("Method Not Allowed", { status: 405, headers: { allow: "GET, HEAD" } });
  }
  return new NextResponse(req.method === "HEAD" ? null : file.body, {
    status: 200,
    headers: file.headers,
  });
}

export const config = {
  matcher: ["/:file.txt", "/api/:path*"],
};
