/**
 * Impersonation Helper Functions
 *
 * Client-side utilities for admin user impersonation
 */

import { signIn } from 'next-auth/react'

export interface ImpersonateUserParams {
  userEmail: string
  reason?: string
}

export interface ImpersonationResponse {
  success: boolean
  data?: {
    targetUser: {
      id: string
      email: string
      role: string
    }
    impersonatedBy: string
    impersonationToken: string
  }
  error?: string
}

/**
 * Start impersonating a user
 *
 * @param userEmail - Email of the user to impersonate
 * @param reason - Optional reason for impersonation (for audit trail)
 * @returns Promise with the result
 *
 * Usage:
 * ```tsx
 * const result = await startImpersonation({
 *   userEmail: 'user@example.com',
 *   reason: 'Customer support - debugging issue #123'
 * })
 *
 * if (result.success) {
 *   // Impersonation started, now sign in as that user
 *   await signIn('credentials', {
 *     email: result.data.targetUser.email,
 *     impersonatedBy: result.data.impersonatedBy,
 *     redirect: true,
 *     callbackUrl: getRoleBasedDashboard(result.data.targetUser.role)
 *   })
 * }
 * ```
 */
export async function startImpersonation(
  params: ImpersonateUserParams
): Promise<ImpersonationResponse> {
  try {
    const response = await fetch('/api/admin/impersonate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to start impersonation',
      }
    }

    return result
  } catch (error: any) {
   
    return {
      success: false,
      error: error.message || 'Network error',
    }
  }
}

/**
 * End current impersonation session
 *
 * @returns Promise with the result
 *
 * Usage:
 * ```tsx
 * const result = await endImpersonation()
 *
 * if (result.success) {
 *   // Redirect back to admin dashboard
 *   window.location.href = '/admin'
 * }
 * ```
 */
export async function endImpersonation(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/admin/impersonate', {
      method: 'DELETE',
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to end impersonation',
      }
    }

    return result
  } catch (error: any) {
    
    return {
      success: false,
      error: error.message || 'Network error',
    }
  }
}

/**
 * Get the appropriate dashboard URL based on user role
 */
export function getRoleBasedDashboard(role: string): string {
  const dashboards: Record<string, string> = {
    ADMIN: '/admin',
    WORKER: '/dashboard/worker',
    CLIENT: '/dashboard/client',
    COORDINATOR: '/dashboard/coordinator',
  }

  return dashboards[role] || '/dashboard'
}

/**
 * Check if currently in impersonation mode
 *
 * @param session - The NextAuth session object
 * @returns true if currently impersonating a user
 */
export function isImpersonating(session: any): boolean {
  return !!session?.user?.impersonatedBy
}

/**
 * Get impersonation info from session
 *
 * @param session - The NextAuth session object
 * @returns Impersonation info or null
 */
export function getImpersonationInfo(session: any): { impersonatedBy: string } | null {
  if (!session?.user?.impersonatedBy) {
    return null
  }

  return {
    impersonatedBy: session.user.impersonatedBy,
  }
}
