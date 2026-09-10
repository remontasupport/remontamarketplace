/**
 * Auth Middleware
 *
 * Protects routes and enforces role-based access control.
 *
 * Protected routes:
 * - /dashboard/* - Requires authentication
 * - /dashboard/worker/* - Requires WORKER role
 * - /dashboard/client/* - Requires CLIENT role
 * - /dashboard/coordinator/* - Requires COORDINATOR role
 * - /apply/* - Requires WORKER role
 * - /admin/* - Requires ADMIN role
 */

import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { UserRole } from "./src/types/auth";

export default async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const path = req.nextUrl.pathname;

  // Must be authenticated with a valid token structure
  if (!token || !token.id || !token.role || !token.email) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", path + req.nextUrl.search);
    const applyParam = req.nextUrl.searchParams.get("apply");
    if (applyParam) loginUrl.searchParams.set("apply", applyParam);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access control for dashboard routes
  if (path.startsWith("/dashboard/worker") && token.role !== UserRole.WORKER) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  if (path.startsWith("/dashboard/client") && token.role !== UserRole.CLIENT) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  if (
    path.startsWith("/dashboard/coordinator") &&
    token.role !== UserRole.COORDINATOR
  ) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  if (path.startsWith("/apply") && token.role !== UserRole.WORKER) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // Admin route protection
  if (path.startsWith("/admin") && token.role !== UserRole.ADMIN) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
}

/**
 * Matcher configuration
 * Specifies which routes this middleware should run on
 */
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/apply/:path*",
  ],
};
