/**
 * Authentication Types
 * Defines user roles and auth-related types for the application
 */

/**
 * User role enumeration
 * Defines the three types of users in the system
 */
export enum UserRole {
  WORKER = "WORKER",
  CLIENT = "CLIENT",
  COORDINATOR = "COORDINATOR",
  ADMIN = "ADMIN",
}

/**
 * User type for authentication
 * This will be stored in the database User table
 */
export type User = {
  id: string;
  email: string;
  role: UserRole;
  emailVerified?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * Session user type
 * This is what gets returned in the session
 */
export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  name?: string | null;
  image?: string | null;
};

/**
 * Login credentials type
 */
export type LoginCredentials = {
  email: string;
  password: string;
};

/**
 * Registration data base type
 */
export type RegistrationDataBase = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  mobile: string;
};

/**
 * Worker registration data type
 */
export type WorkerRegistrationData = RegistrationDataBase & {
  role: UserRole.WORKER;
  location: string;
};

/**
 * Client registration data type (to be implemented)
 */
export type ClientRegistrationData = RegistrationDataBase & {
  role: UserRole.CLIENT;
  // Add client-specific fields here when implementing
};

/**
 * Coordinator registration data type (to be implemented)
 */
export type CoordinatorRegistrationData = RegistrationDataBase & {
  role: UserRole.COORDINATOR;
  // Add coordinator-specific fields here when implementing
};

/**
 * Helper type to get dashboard path based on role
 */
export type DashboardPath = {
  [UserRole.WORKER]: "/dashboard/worker";
  [UserRole.CLIENT]: "/dashboard/client";
  [UserRole.COORDINATOR]: "/dashboard/coordinator";
  [UserRole.ADMIN]: "/admin";
};

/**
 * Role-based redirect configuration
 */
export const ROLE_REDIRECTS: DashboardPath = {
  [UserRole.WORKER]: "/dashboard/worker",
  [UserRole.CLIENT]: "/dashboard/client",
  [UserRole.COORDINATOR]: "/dashboard/coordinator",
  [UserRole.ADMIN]: "/admin",
};

/**
 * Helper function to get redirect path based on role
 */
export function getRedirectPathForRole(role: UserRole): string {
  return ROLE_REDIRECTS[role] || "/dashboard";
}

/**
 * Type guard to check if a string is a valid UserRole
 */
export function isValidUserRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}
