/**
 * Auth middleware: sign-in for every page it matches, and each area's role (src/lib/routeAccess.ts).
 *
 * - /dashboard/worker/*, /apply/*            WORKER
 * - /dashboard/client/*                      CLIENT
 * - /dashboard/supportcoordinators/*         COORDINATOR
 * - /admin/*                                 ADMIN
 *
 * Signed out (or a session a password change revoked): /login?callbackUrl=<the page>, so a link in an email opens its
 * page after sign-in. Another role: /unauthorized. Lives in src/ because the pages are in src/app (Next loads the
 * middleware from beside the app directory; at apps/app/ it never ran, 2026-11-20).
 */
import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { accessFor, sessionCookieName, type AccessToken } from "./lib/routeAccess";

export default async function middleware(req: NextRequest) {
  const production = process.env.NODE_ENV === "production";
  // The cookie name the app sets, not next-auth's guess from NEXTAUTH_URL: a mismatch reads no token and loops /login.
  const token = (await getToken({ req, secret: process.env.NEXTAUTH_SECRET, cookieName: sessionCookieName(production), secureCookie: production })) as AccessToken | null;
  const path = req.nextUrl.pathname;
  const access = accessFor(path, token);

  if (access.kind === "login") {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", path + req.nextUrl.search);
    const applyParam = req.nextUrl.searchParams.get("apply");
    if (applyParam) loginUrl.searchParams.set("apply", applyParam);
    return NextResponse.redirect(loginUrl);
  }
  if (access.kind === "unauthorized") return NextResponse.redirect(new URL("/unauthorized", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/apply/:path*"],
};
