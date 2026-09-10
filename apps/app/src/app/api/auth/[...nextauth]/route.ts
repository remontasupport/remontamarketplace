/**
 * NextAuth API Route Handler
 *
 * This handles all authentication routes:
 * - /api/auth/signin
 * - /api/auth/signout
 * - /api/auth/session
 * - /api/auth/csrf
 * etc.
 */

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth.config";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
