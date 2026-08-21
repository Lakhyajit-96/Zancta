import { NextRequest, NextResponse } from "next/server";
import { indexNowKeyFileResponse } from "@/lib/indexnow";

export default function proxy(req: NextRequest) {
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
  matcher: "/:file.txt",
};
