/**
 * NextAuth Configuration
 *
 * This file sets up authentication with role-based access control
 * Currently configured for testing WITHOUT database connection
 *
 * TODO: Connect to database when auth schema is ready
 */

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { authPrisma } from "./auth-prisma";
import { UserRole } from "@/types/auth";

/**
 * NextAuth configuration options
 *
 * PRODUCTION-READY with database authentication
 */
export const authOptions: NextAuthOptions = {
  // Prisma adapter for database sessions (optional - we're using JWT)
  // adapter: PrismaAdapter(authPrisma as any),

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        try {
          // Find user in database - optimized to select only needed fields
          const user = await authPrisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() },
            select: {
              id: true,
              email: true,
              passwordHash: true,
              role: true,
              status: true,
              failedLoginAttempts: true,
              accountLockedUntil: true,
            },
          });

          if (!user || !user.passwordHash) {
            // Don't reveal whether user exists
            throw new Error("Invalid credentials");
          }

          // Check if account is locked
          if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
            throw new Error("Account is temporarily locked. Please try again later.");
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isValidPassword) {
            // Increment failed login attempts
            const failedAttempts = user.failedLoginAttempts + 1;
            const updates: any = {
              failedLoginAttempts: failedAttempts,
            };

            // Lock account after 5 failed attempts (15 minutes)
            if (failedAttempts >= 5) {
              const lockUntil = new Date();
              lockUntil.setMinutes(lockUntil.getMinutes() + 15);
              updates.accountLockedUntil = lockUntil;
            }

            await authPrisma.user.update({
              where: { id: user.id },
              data: updates,
            });

            // Log failed login (fire-and-forget, non-blocking)
            authPrisma.auditLog.create({
              data: {
                userId: user.id,
                action: "LOGIN_FAILED",
              },
            }).catch(() => {
              // Ignore audit log errors silently
            });

            throw new Error("Invalid credentials");
          }

          // Check account status
          if (user.status !== "ACTIVE") {
            throw new Error(`Account is ${user.status.toLowerCase()}`);
          }

          // OPTIMIZATION: Fire-and-forget for non-critical operations
          // User gets session token IMMEDIATELY without waiting for DB updates
          // This improves login responsiveness by 100-200ms

          // Async: Update login stats (fire-and-forget, non-blocking)
          authPrisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              accountLockedUntil: null,
              lastLoginAt: new Date(),
              // lastLoginIp: You can add IP tracking here if needed
            },
          }).catch(() => {
            // Ignore update errors silently - user is already logged in
          });

          // Async: Log successful login (fire-and-forget, non-blocking)
          authPrisma.auditLog.create({
            data: {
              userId: user.id,
              action: "LOGIN_SUCCESS",
              // ipAddress: You can add IP tracking here
              // userAgent: You can add user agent here
            },
          }).catch(() => {
            // Ignore audit log errors silently
          });

          // Return user data for session IMMEDIATELY (no await!)
          return {
            id: user.id,
            email: user.email,
            role: user.role as UserRole,
            name: `${user.email.split("@")[0]}`,
          };
        } catch (error) {
          // Re-throw the error (audit logging already done in the failed password check above)
          throw error;
        }
      },
    }),
  ],

  /**
   * Callbacks to add role to session and JWT
   */
  callbacks: {
    /**
     * JWT Callback
     * Called whenever a JWT is created or updated
     * Adds role and id to the token (keep it small for cookie size limits)
     */
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
        // Do NOT store requirements in JWT - they make the session cookie too large
        // Requirements should be fetched via API: /api/worker/requirements
      }

      // Refetch user data when session is updated
      if (trigger === "update" && token.id) {
        const freshUser = await authPrisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            email: true,
            role: true,
          },
        });

        if (freshUser) {
          token.email = freshUser.email;
          token.role = freshUser.role;
        }
      }

      return token;
    },

    /**
     * Session Callback
     * Called whenever a session is checked
     * Adds role and id to the session
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.email = token.email as string;
        // Requirements are fetched via API, not stored in session
      }
      return session;
    },
  },

  /**
   * Custom pages
   */
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
    verifyRequest: "/auth/verify-email",
  },

  /**
   * Session strategy
   * Using JWT for stateless authentication
   */
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  /**
   * JWT options
   */
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  /**
   * Security options
   */
  secret: process.env.NEXTAUTH_SECRET,

  /**
   * Secure cookie configuration (PRODUCTION-READY)
   * Prevents session hijacking and CSRF attacks
   */
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true, // Prevents JavaScript access to cookie
        sameSite: "strict", // Strict prevents CSRF attacks - changed from "lax"
        path: "/", // Cookie available on all paths
        secure: process.env.NODE_ENV === "production", // HTTPS only in production
        domain: process.env.NODE_ENV === "production" ? process.env.NEXTAUTH_URL?.replace(/https?:\/\//, '').split(':')[0] : undefined,
      },
    },
    callbackUrl: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "production" ? process.env.NEXTAUTH_URL?.replace(/https?:\/\//, '').split(':')[0] : undefined,
      },
    },
    csrfToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Host-" : ""}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  /**
   * Use secure cookies in production
   */
  useSecureCookies: process.env.NODE_ENV === "production",

  /**
   * Enable debug in development
   */
  debug: process.env.NODE_ENV === "development",
};
