'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import Loader from '@/components/ui/Loader'

// Dynamically import components to avoid SSR issues
const ContractorsPage = dynamic(
  () => import('../AdminDashboardClient'),
  {
    ssr: false,
    loading: () => <PageLoader />
  }
)

const ReportsPage = dynamic(
  () => import('./ReportsContent'),
  {
    ssr: false,
    loading: () => <PageLoader />
  }
)

const CheckCompliancePage = dynamic(
  () => import('./CheckComplianceContent'),
  {
    ssr: false,
    loading: () => <PageLoader />
  }
)

function PageLoader() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader size="lg" />
    </div>
  )
}

function ManageContent() {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || 'contractors'

  const renderContent = () => {
    switch (tab) {
      case 'contractors':
        return <ContractorsPage />
      case 'clients':
        return <ClientsPlaceholder />
      case 'support-coordinators':
        return <SupportCoordinatorsPlaceholder />
      case 'check-compliance':
        return <CheckCompliancePage />
      case 'reports':
        return <ReportsPage />
      default:
        return <ContractorsPage />
    }
  }

  return renderContent()
}

// Placeholder components for pages not yet implemented
function ClientsPlaceholder() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="mt-2 text-sm text-gray-600">Manage client profiles</p>
        </div>
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">Clients management coming soon...</p>
        </div>
      </div>
    </div>
  )
}

function SupportCoordinatorsPlaceholder() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Support Coordinators</h1>
          <p className="mt-2 text-sm text-gray-600">Manage support coordinator profiles</p>
        </div>
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">Support coordinators management coming soon...</p>
        </div>
      </div>
    </div>
  )
}

export default function ManagePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ManageContent />
    </Suspense>
  )
}
