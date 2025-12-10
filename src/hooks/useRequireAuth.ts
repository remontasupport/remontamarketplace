/**
 * useRequireAuth Hook
 *
 * Reusable authentication hook for client-side pages
 * Automatically redirects unauthenticated users to login
 *
 * Usage:
 * ```tsx
 * function MyProtectedPage() {
 *   const { session, isLoading, isAuthenticated } = useRequireAuth();
 *
 *   if (isLoading) return <LoadingSpinner />;
 *   if (!isAuthenticated) return null;
 *
 *   return <div>Protected Content</div>;
 * }
 * ```
 */

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface UseRequireAuthOptions {
  redirectTo?: string;
  redirectOnUnauthenticated?: boolean;
}

export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const {
    redirectTo = "/login",
    redirectOnUnauthenticated = true,
  } = options;

  const { data: session, status } = useSession();
  const router = useRouter();

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  const isUnauthenticated = status === "unauthenticated";

  // SECURITY: Redirect to login if not authenticated
  useEffect(() => {
    if (redirectOnUnauthenticated && isUnauthenticated) {
      router.push(redirectTo);
    }
  }, [isUnauthenticated, redirectOnUnauthenticated, redirectTo, router]);

  return {
    session,
    status,
    isLoading,
    isAuthenticated,
    isUnauthenticated,
    user: session?.user ?? null,
  };
}
