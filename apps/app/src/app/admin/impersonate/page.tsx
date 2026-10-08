'use client'

/**
 * Admin Impersonation Page
 *
 * Allows admins to search for and impersonate users for customer support.
 * The user list is read from apps/api (`adminApi.listUsers`, U2 admin-search PR 3):
 * a search of at least two characters, optionally narrowed by role.
 */

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { UserListResponse } from '@remonta/api-contract'
import { ImpersonationButton } from '@/components/admin/ImpersonationButton'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { adminApi, type ApiOutcome } from '@/lib/api/admin'

type User = UserListResponse['users'][number]
type RoleFilter = 'all' | 'WORKER' | 'CLIENT' | 'COORDINATOR' | 'ADMIN'

export default function ImpersonatePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounce search - use useEffect instead of useState
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim())
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const canSearch = debouncedQuery.length >= 2

  const { data: outcome, isLoading } = useQuery<ApiOutcome<UserListResponse>>({
    queryKey: ['admin-users', debouncedQuery, roleFilter],
    queryFn: () => adminApi.listUsers({ search: debouncedQuery, ...(roleFilter === 'all' ? {} : { role: roleFilter }) }),
    enabled: canSearch,
    staleTime: 60000,
  })

  useEffect(() => {
    if (outcome?.kind === 'unauthenticated') {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`)
    }
  }, [outcome, router])

  const users: User[] | undefined = outcome?.kind === 'ok' ? outcome.body.users : undefined
  const problem = outcome && outcome.kind !== 'ok' && outcome.kind !== 'unauthenticated' ? outcome : null

  // Redirect non-admins
  if (session && session.user.role !== 'ADMIN') {
    router.push('/dashboard')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Impersonation</h1>
              <p className="mt-2 text-sm text-gray-600">
                Access user accounts for customer support and debugging
              </p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Users
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  maxLength={100}
                  placeholder="Search by name or email (min 2 characters)..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <svg
                  className="absolute right-3 top-2.5 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="WORKER">Workers</option>
                <option value="CLIENT">Clients</option>
                <option value="COORDINATOR">Coordinators</option>
                <option value="ADMIN">Admins</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <svg
              className="w-5 h-5 text-yellow-600 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Security Notice</h3>
              <div className="mt-1 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>All impersonation events are logged in the audit trail</li>
                  <li>You will see exactly what the user sees</li>
                  <li>Use this feature responsibly for support purposes only</li>
                  <li>Click "Exit Impersonation" when done to return to admin</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow">
          {/* Loading State */}
          {isLoading && canSearch && (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
              <p className="mt-2 text-sm text-gray-600">Searching users...</p>
            </div>
          )}

          {/* No Query */}
          {!canSearch && (
            <div className="p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Search for users</h3>
              <p className="mt-1 text-sm text-gray-500">
                Enter a name or email (min 2 characters); the role filter narrows the matches
              </p>
            </div>
          )}

          {/* A problem other than a sign-in */}
          {problem && (
            <div className="p-6 text-center text-sm text-red-700 bg-red-50 rounded-t-lg">
              {problem.kind === 'forbidden'
                ? 'Your account cannot use the user list (impersonation or a role change).'
                : problem.kind === 'rateLimited'
                  ? `Too many searches; try again in ${problem.retryAfterSeconds} seconds.`
                  : problem.kind === 'unavailable'
                    ? 'The user list is temporarily unavailable; please try again in a moment.'
                    : `The user list could not be loaded${problem.requestId ? ` (request ${problem.requestId})` : ''}.`}
            </div>
          )}

          {/* No Results */}
          {!isLoading && canSearch && users && users.length === 0 && (
            <div className="p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search query or filters
              </p>
            </div>
          )}

          {/* Results Table */}
          {!isLoading && users && users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.email}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.mobile && (
                            <div className="text-sm text-gray-500">{user.mobile}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'WORKER' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'CLIENT' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                          user.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                          user.status === 'LOCKED' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.status === 'ACTIVE' ? (
                          <ImpersonationButton
                            userEmail={user.email}
                            userName={user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                            userRole={user.role}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Impersonate
                          </ImpersonationButton>
                        ) : (
                          <span className="text-sm text-gray-400">
                            Cannot impersonate {user.status.toLowerCase()} user
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results Count */}
        {users && users.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            Found {users.length} user{users.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}
