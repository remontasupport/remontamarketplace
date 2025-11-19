/**
 * NextAuth Middleware
 *
 * Protects routes and enforces role-based access control
 *
 * Protected routes:
 * - /dashboard/* - Requires authentication
 * - /dashboard/worker/* - Requires WORKER role
 * - /dashboard/client/* - Requires CLIENT role
 * - /dashboard/coordinator/* - Requires COORDINATOR role
 */

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { UserRole } from "./src/types/auth";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    console.log("🔒 Middleware - Path:", path);
    console.log("👤 User ID:", token?.id);
    console.log("👤 User Role:", token?.role);
    console.log("📧 User Email:", token?.email);

    // Additional security: Verify token has required fields
    if (!token || !token.id || !token.role || !token.email) {
      console.log("❌ Invalid token - missing required fields");
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Role-based access control for dashboard routes
    if (path.startsWith("/dashboard/worker") && token?.role !== UserRole.WORKER) {
      console.log("❌ Access denied: WORKER role required");
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (path.startsWith("/dashboard/client") && token?.role !== UserRole.CLIENT) {
      console.log("❌ Access denied: CLIENT role required");
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (
      path.startsWith("/dashboard/coordinator") &&
      token?.role !== UserRole.COORDINATOR
    ) {
      console.log("❌ Access denied: COORDINATOR role required");
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    console.log("✅ Access granted");
    return NextResponse.next();
  },
  {
    callbacks: {
      // This callback is called to check if the user is authorized
      // Return true to allow access, false to redirect to sign-in
      authorized: ({ token }) => {
        // User must be authenticated and have valid token structure
        const isValid = !!(token && token.id && token.email && token.role);
        if (!isValid) {
          console.log("❌ Unauthorized: Invalid or missing token");
        }
        return isValid;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

/**
 * Matcher configuration
 * Specifies which routes this middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - login, register (auth pages)
     */
    "/dashboard/:path*",
  ],
};
