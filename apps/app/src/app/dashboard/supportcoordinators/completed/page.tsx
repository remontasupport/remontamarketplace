/**
 * Completed Jobs Page for Support Coordinators
 * Shows service requests that have been completed
 */

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth.config'
import { UserRole } from '@/types/auth'
import { authPrisma, withRetry } from '@/lib/auth-prisma'
import ClientDashboardLayout from '@/components/dashboard/client/ClientDashboardLayout'
import CompletedJobsList from '@/components/dashboard/client/CompletedJobsList'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type RawCompletedRow = {
  id: string
  location: string
  createdAt: Date
  details: { title?: string; description?: string } | null
  firstName: string
  lastName: string
}

export default async function CoordinatorCompletedPage() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    redirect('/login')
  }

  if (session.user.role !== UserRole.COORDINATOR) {
    redirect('/unauthorized')
  }

  // Fetch coordinator profile for sidebar
  let displayName = session.user.email?.split('@')[0] || 'User'
  const coordinatorProfile = await withRetry(() => authPrisma.coordinatorProfile.findUnique({
    where: { userId: session.user.id },
    select: { firstName: true },
  }))
  displayName = coordinatorProfile?.firstName || displayName

  // Use raw SQL to fetch COMPLETED requests
  const rows = await withRetry(() => authPrisma.$queryRaw<RawCompletedRow[]>`
    SELECT
      sr.id,
      sr.location,
      sr."createdAt",
      sr.details,
      p."firstName",
      p."lastName"
    FROM service_requests sr
    JOIN participants p ON p.id = sr."participantId"
    WHERE sr."requesterId" = ${session.user.id}
      AND sr.status = 'COMPLETED'::"ServiceRequestStatus"
      AND (sr.details->>'_hidden' IS NULL OR sr.details->>'_hidden' != 'true')
    ORDER BY sr."updatedAt" DESC
  `)

  const requests = rows.map((r) => ({
    id: r.id,
    participantName: `${r.firstName} ${r.lastName}`,
    location: r.location,
    title: (r.details as { title?: string } | null)?.title || 'Untitled Request',
    description: (r.details as { description?: string } | null)?.description || null,
    createdAt: new Date(r.createdAt).toISOString(),
  }))

  return (
    <ClientDashboardLayout
      profileData={{ firstName: displayName, photo: null }}
      basePath="/dashboard/supportcoordinators"
      roleLabel="Support Coordinator"
    >
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-semibold font-poppins text-gray-900">
            Completed Jobs
          </h1>
          <p className="text-gray-600 font-poppins mt-1">
            {requests.length} completed {requests.length === 1 ? 'job' : 'jobs'}
          </p>
        </div>

        <CompletedJobsList requests={requests} />
      </div>
    </ClientDashboardLayout>
  )
}
