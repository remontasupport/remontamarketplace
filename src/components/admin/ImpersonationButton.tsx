'use client'

/**
 * Impersonation Button Component
 *
 * Allows admins to impersonate users with a single click
 * Shows confirmation dialog and handles the impersonation flow
 */

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { startImpersonation, getRoleBasedDashboard } from '@/lib/impersonation'

interface ImpersonationButtonProps {
  userEmail: string
  userId?: string
  userName?: string
  userRole?: string
  className?: string
  children?: React.ReactNode
}

export function ImpersonationButton({
  userEmail,
  userId,
  userName,
  userRole,
  className = '',
  children,
}: ImpersonationButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImpersonate = async () => {
    // Confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to impersonate ${userName || userEmail}?\n\n` +
        'This action will be logged in the audit trail.'
    )

    if (!confirmed) return

    setLoading(true)
    setError(null)

    try {
      // Get optional reason from user
      const reason = window.prompt(
        'Optional: Enter a reason for this impersonation (for audit trail):',
        'Customer support'
      )

      // Start impersonation
      const result = await startImpersonation({
        userEmail,
        reason: reason || undefined,
      })

      if (!result.success) {
        setError(result.error || 'Failed to start impersonation')
        setLoading(false)
        return
      }

      // Impersonation successful, now sign in as that user using the token
      const targetRole = result.data?.targetUser.role || userRole
      const dashboardUrl = getRoleBasedDashboard(targetRole || '')

      console.log('Impersonation:', {
        targetRole,
        dashboardUrl,
        targetUser: result.data?.targetUser,
      })

      // Sign in using the impersonation token and redirect to their dashboard
      await signIn('credentials', {
        email: result.data?.targetUser.email,
        impersonationToken: result.data?.impersonationToken,
        callbackUrl: dashboardUrl,
      })
    } catch (err: any) {
      console.error('Impersonation error:', err)
      setError(err.message || 'An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleImpersonate}
        disabled={loading}
        className={
          className ||
          'px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
        }
      >
        {loading ? 'Starting...' : children || 'Impersonate'}
      </button>

      {error && (
        <div className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </div>
      )}
    </>
  )
}

/**
 * Impersonation Banner Component
 *
 * Shows a banner at the top of the page when in impersonation mode
 * Includes an "Exit Impersonation" button
 */

interface ImpersonationBannerProps {
  onExit?: () => void
}

export function ImpersonationBanner({ onExit }: ImpersonationBannerProps) {
  const [loading, setLoading] = useState(false)

  const handleExit = async () => {
    setLoading(true)

    try {
      // Clear impersonation from sessionStorage
      sessionStorage.removeItem('impersonation')

      // Call the optional onExit callback
      if (onExit) {
        onExit()
      }

      // Redirect back to admin dashboard
      window.location.href = '/admin'
    } catch (error) {
      console.error('Exit impersonation error:', error)
      setLoading(false)
    }
  }

  return (
    <div className="bg-yellow-500 text-white px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <svg
          className="w-5 h-5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
        <span className="font-semibold">Impersonation Mode Active</span>
        <span className="text-sm opacity-90">
          You are viewing this account as an admin
        </span>
      </div>

      <button
        onClick={handleExit}
        disabled={loading}
        className="px-4 py-1 bg-white text-yellow-700 rounded font-medium hover:bg-yellow-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Exiting...' : 'Exit Impersonation'}
      </button>
    </div>
  )
}
