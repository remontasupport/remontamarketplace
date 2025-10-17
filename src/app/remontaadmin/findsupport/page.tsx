import { Metadata } from 'next'
import SearchSupport from '@/app/landing/SearchSupport'

export const metadata: Metadata = {
  title: 'Find Support - Admin | Remonta Services',
  description: 'Search and manage NDIS disability workers - Admin access only',
}

export default function FindSupportAdminPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SearchSupport />
    </div>
  )
}
