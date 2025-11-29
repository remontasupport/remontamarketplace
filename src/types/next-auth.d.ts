/**
 * NextAuth Type Extensions
 * Extends NextAuth default types to include our custom fields (role, requirements)
 */

import { UserRole } from "./auth";
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

export interface WorkerRequirement {
  id: string;
  name: string;
  category: string;
  description: string;
  hasExpiration: boolean;
  documentType: string; // REQUIRED, OPTIONAL, CONDITIONAL
  serviceCategory: string;
  subcategory?: string;
  conditionKey?: string | null;
  requiredIfTrue?: boolean | null;
}

export interface GroupedRequirements {
  baseCompliance: WorkerRequirement[];
  trainings: WorkerRequirement[];
  qualifications: WorkerRequirement[];
  insurance: WorkerRequirement[];
  transport: WorkerRequirement[];
  all: WorkerRequirement[];
}

declare module "next-auth" {
  /**
   * Extends the built-in session.user type
   */
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: UserRole;
      email: string;
      name?: string | null;
      image?: string | null;
    };
  }

  /**
   * Extends the built-in user type
   */
  interface User extends DefaultUser {
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  /**
   * Extends the built-in JWT type
   */
  interface JWT extends DefaultJWT {
    id: string;
    role: UserRole;
  }
}
