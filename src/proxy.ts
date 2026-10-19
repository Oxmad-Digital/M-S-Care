import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublicPage = pathname === "/admin/login" || pathname.startsWith("/admin/invitation/");

  if (pathname.startsWith("/admin") && !isPublicPage && !req.auth) {
    const loginUrl = new URL("/admin/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/admin/:path*"],
};
