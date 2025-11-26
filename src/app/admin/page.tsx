'use client'

import dynamic from 'next/dynamic'

// Dynamically import the admin dashboard with SSR disabled
// This prevents hydration mismatches and ensures client-only rendering
const AdminDashboardClient = dynamic(
  () => import('./AdminDashboardClient').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
              <p className="mt-2 text-sm text-gray-600">Loading admin dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    ),
  }
)

export default function AdminPage() {
  return <AdminDashboardClient />
}
