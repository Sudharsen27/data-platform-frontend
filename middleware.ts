import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_PRESENCE_COOKIE } from "@/lib/authConstants";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/quarantine",
  "/catalog",
  "/lineage",
  "/jobs",
  "/flow",
  "/stewardship",
  "/rules",
  "/pipeline",
  "/users",
  "/audit",
];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.get(SESSION_PRESENCE_COOKIE)?.value === "1";
  if (!hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/quarantine/:path*",
    "/catalog",
    "/catalog/:path*",
    "/lineage",
    "/lineage/:path*",
    "/jobs",
    "/jobs/:path*",
    "/flow",
    "/flow/:path*",
    "/stewardship",
    "/stewardship/:path*",
    "/rules/:path*",
    "/pipeline/:path*",
    "/users/:path*",
    "/audit/:path*",
  ],
};
