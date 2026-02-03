/**
 * Manage Request Page for Support Coordinators
 * Displays service requests with participant, workers, and status
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth.config";
import { UserRole } from "@/types/auth";
import { authPrisma } from "@/lib/auth-prisma";
import ClientDashboardLayout from "@/components/dashboard/client/ClientDashboardLayout";
import ManageRequestTable from "@/components/dashboard/client/ManageRequestTable";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SupportCoordinatorsManageRequestPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.COORDINATOR) {
    redirect("/unauthorized");
  }

  // Fetch coordinator's profile for sidebar display
  let displayName = session.user.email?.split('@')[0] || 'User';

  const coordinatorProfile = await authPrisma.coordinatorProfile.findUnique({
    where: { userId: session.user.id },
    select: { firstName: true },
  });
  displayName = coordinatorProfile?.firstName || displayName;

  // Fetch service requests for this coordinator with participant data
  const serviceRequests = await authPrisma.serviceRequest.findMany({
    where: { requesterId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      participant: true,
    },
  });

  // Transform data for the table
  const requests = serviceRequests.map((sr) => ({
    id: sr.id,
    participantName: `${sr.participant.firstName} ${sr.participant.lastName}`,
    location: sr.location,
    assignedWorker: sr.assignedWorker as { name?: string; count?: number } | null,
    status: sr.status,
  }));

  return (
    <ClientDashboardLayout
      profileData={{
        firstName: displayName,
        photo: null,
      }}
      basePath="/dashboard/supportcoordinators"
      roleLabel="Support Coordinator"
    >
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-semibold font-poppins text-gray-900">
            Manage Request
          </h1>
          <p className="text-gray-600 font-poppins mt-1">
            View and manage your service requests
          </p>
        </div>

        {/* Request Table */}
        <ManageRequestTable requests={requests} />
      </div>
    </ClientDashboardLayout>
  );
}
