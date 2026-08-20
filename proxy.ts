import { NextRequest, NextResponse } from "next/server";
import { getIndexNowKey } from "@/lib/indexnow";

export default function proxy(req: NextRequest) {
  const key = getIndexNowKey();
  if (!key) return NextResponse.next();
  if (req.nextUrl.pathname !== `/${key}.txt`) return NextResponse.next();
  return new NextResponse(key, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=300",
      "x-robots-tag": "noindex",
    },
  });
}

export const config = {
  matcher: "/:file.txt",
};
