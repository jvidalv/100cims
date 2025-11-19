import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const userAgent = req.headers.get("user-agent") || "";
  const isAndroid = /Android/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod|Macintosh/i.test(userAgent);

  const response = NextResponse.next();
  response.headers.set(
    "X-Device-Type",
    isAndroid ? "android" : isIOS ? "ios" : "other",
  );

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
