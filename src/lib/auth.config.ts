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
          // Find user in database
          const user = await authPrisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() },
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

            throw new Error("Invalid credentials");
          }

          // Check account status
          if (user.status !== "ACTIVE") {
            throw new Error(`Account is ${user.status.toLowerCase()}`);
          }

          // Successful login - reset failed attempts and update last login
          await authPrisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              accountLockedUntil: null,
              lastLoginAt: new Date(),
              // lastLoginIp: You can add IP tracking here if needed
            },
          });

          // Log successful login (audit)
          await authPrisma.auditLog.create({
            data: {
              userId: user.id,
              action: "LOGIN_SUCCESS",
              // ipAddress: You can add IP tracking here
              // userAgent: You can add user agent here
            },
          });

          // Return user data for session
          return {
            id: user.id,
            email: user.email,
            role: user.role as UserRole,
            name: `${user.email.split("@")[0]}`,
          };
        } catch (error) {
          // Log failed login attempt (audit)
          if (credentials.email) {
            const user = await authPrisma.user.findUnique({
              where: { email: credentials.email.toLowerCase() },
            });

            if (user) {
              await authPrisma.auditLog.create({
                data: {
                  userId: user.id,
                  action: "LOGIN_FAILED",
                  // ipAddress: You can add IP tracking here
                  // userAgent: You can add user agent here
                },
              }).catch(() => {
                // Ignore audit log errors
                });
            }
          }

          // Re-throw the error
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
     * Adds role and id to the token
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
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
