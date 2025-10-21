/**
 * Authentication Helper Functions
 *
 * Provides utilities for:
 * - Getting current session
 * - Checking authentication status
 * - Role-based access control
 */

import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth.config";
import { UserRole } from "@/types/auth";
import type { Session } from "next-auth";

/**
 * Get the current session (server-side)
 * Use this in Server Components and API routes
 */
export async function getSession(): Promise<Session | null> {
  return await getServerSession(authOptions);
}

/**
 * Get the current authenticated user
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session?.user;
}

/**
 * Check if user has a specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === role;
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(roles: UserRole[]): Promise<boolean> {
  const user = await getCurrentUser();
  return user ? roles.includes(user.role) : false;
}

/**
 * Require authentication
 * Throws error if not authenticated (use in API routes)
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized - Authentication required");
  }
  return user;
}

/**
 * Require specific role
 * Throws error if user doesn't have the required role
 */
export async function requireRole(role: UserRole) {
  const user = await requireAuth();
  if (user.role !== role) {
    throw new Error(`Forbidden - ${role} role required`);
  }
  return user;
}

/**
 * Require any of the specified roles
 * Throws error if user doesn't have any of the required roles
 */
export async function requireAnyRole(roles: UserRole[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new Error(`Forbidden - One of [${roles.join(", ")}] roles required`);
  }
  return user;
}
