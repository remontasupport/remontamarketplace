// Who may open a page (the middleware's rules, src/middleware.ts). Pure, so it is tested without Next.
// 2026-11-20: the middleware sat at apps/app/middleware.ts, which Next ignores when the pages are in src/app; it never ran
// in production after the monorepo move (U6). The layouts' sign-in check (useRequireAuth) kept the pages behind a login.
import { UserRole } from "@/types/auth";

/** What the middleware reads from the session token. */
export interface AccessToken {
  id?: unknown;
  role?: unknown;
  email?: unknown;
  /** Set by the jwt callback once a password change signs this session out (U5d). */
  revoked?: unknown;
}

export type Access = { kind: "allow" } | { kind: "login" } | { kind: "unauthorized" };

/** Each area's role. `/dashboard` alone and `/dashboard/<other>` need a sign-in only. */
const AREA_ROLES: readonly { prefix: string; role: UserRole }[] = [
  { prefix: "/dashboard/worker", role: UserRole.WORKER },
  { prefix: "/dashboard/client", role: UserRole.CLIENT },
  // The coordinators' pages are /dashboard/supportcoordinators (getRedirectPathForRole); the old rule named
  // /dashboard/coordinator, a path that does not exist, so it never matched.
  { prefix: "/dashboard/supportcoordinators", role: UserRole.COORDINATOR },
  { prefix: "/apply", role: UserRole.WORKER },
  { prefix: "/admin", role: UserRole.ADMIN },
];

const within = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`);

export function accessFor(path: string, token: AccessToken | null): Access {
  if (!token || !token.id || !token.role || !token.email || token.revoked) return { kind: "login" };
  const area = AREA_ROLES.find((a) => within(path, a.prefix));
  if (area && token.role !== area.role) return { kind: "unauthorized" };
  return { kind: "allow" };
}

/** The session cookie as lib/auth.config.ts names it (a production build sets the __Secure- one, previews included). */
export const sessionCookieName = (production: boolean) => `${production ? "__Secure-" : ""}next-auth.session-token`;
