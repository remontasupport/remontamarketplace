"use client";

/**
 * Admin Dashboard Layout
 *
 * Wraps all admin pages (/admin/**)
 * Handles authentication at the layout level to protect all admin pages
 *
 * SECURITY: This layout ensures ALL admin pages require authentication
 * If user is not authenticated, they are automatically redirected to login
 */

import { useRequireAuth } from "@/hooks/useRequireAuth";
import Loader from "@/components/ui/Loader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // SECURITY: Require authentication for ALL admin pages
  // This protects all routes under /admin/**
  const { isLoading, isAuthenticated } = useRequireAuth({
    redirectTo: "/login",
    redirectOnUnauthenticated: true,
  });

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        width: '100%'
      }}>
        <Loader size="lg" />
      </div>
    );
  }

  // Don't render children if not authenticated (redirect is handled by hook)
  if (!isAuthenticated) {
    return null;
  }

  // User is authenticated - render the page
  return <>{children}</>;
}
