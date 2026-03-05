/**
 * Archived Requests Page
 * Shows service requests that have been archived by the client
 */

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth.config'
import { UserRole } from '@/types/auth'
import { authPrisma, withRetry } from '@/lib/auth-prisma'
import ClientDashboardLayout from '@/components/dashboard/client/ClientDashboardLayout'
import ArchivedRequestsList from '@/components/dashboard/client/ArchivedRequestsList'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type RawArchivedRow = {
  id: string
  location: string
  createdAt: Date
  services: Record<string, { categoryName: string }> | null
  details: { description?: string } | null
  firstName: string
  lastName: string
}

export default async function ArchivedPage() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    redirect('/login')
  }

  if (session.user.role !== UserRole.CLIENT) {
    redirect('/unauthorized')
  }

  // Fetch client profile for sidebar
  let displayName = session.user.email?.split('@')[0] || 'User'
  const clientProfile = await withRetry(() => authPrisma.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: { firstName: true },
  }))
  displayName = clientProfile?.firstName || displayName

  // Use raw SQL to fetch ARCHIVED requests (Prisma client doesn't have the enum value)
  const rows = await withRetry(() => authPrisma.$queryRaw<RawArchivedRow[]>`
    SELECT
      sr.id,
      sr.location,
      sr."createdAt",
      sr.services,
      sr.details,
      p."firstName",
      p."lastName"
    FROM service_requests sr
    JOIN participants p ON p.id = sr."participantId"
    WHERE sr."requesterId" = ${session.user.id}
      AND sr.status = 'ARCHIVED'::"ServiceRequestStatus"
      AND (sr.details->>'_hidden' IS NULL OR sr.details->>'_hidden' != 'true')
    ORDER BY sr."updatedAt" DESC
  `)

  const toDisplayName = (name: string) => name.replace(/Support Worker/g, 'Support Work')

  const requests = rows.map((r) => {
    const serviceNames = Object.values(r.services ?? {}).map((s) => toDisplayName(s.categoryName)).filter(Boolean)
    return {
      id: r.id,
      participantName: `${r.firstName} ${r.lastName}`,
      location: r.location,
      primaryService: serviceNames.length > 0 ? serviceNames.join(', ') : 'Untitled Request',
      description: r.details?.description ?? null,
      createdAt: new Date(r.createdAt).toISOString(),
    }
  })

  return (
    <ClientDashboardLayout
      profileData={{ firstName: displayName, photo: null }}
    >
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-semibold font-poppins text-gray-900">
            Archived Requests
          </h1>
          <p className="text-gray-600 font-poppins mt-1">
            {requests.length} {requests.length === 1 ? 'request' : 'requests'} archived
          </p>
        </div>

        <ArchivedRequestsList initialRequests={requests} />
      </div>
    </ClientDashboardLayout>
  )
}
