/**
 * NextAuth Type Extensions
 * Extends NextAuth default types to include our custom fields (role)
 */

import { UserRole } from "./auth";
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

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
