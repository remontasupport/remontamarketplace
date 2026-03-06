/**
 * Manage Request Page
 * Displays service requests with participant, workers, and status
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth.config";
import { UserRole } from "@/types/auth";
import { authPrisma, withRetry } from "@/lib/auth-prisma";
import ClientDashboardLayout from "@/components/dashboard/client/ClientDashboardLayout";
import ManageRequestTable from "@/components/dashboard/client/ManageRequestTable";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ManageRequestPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.CLIENT) {
    redirect("/unauthorized");
  }

  const [clientProfile, serviceRequests] = await Promise.all([
    withRetry(() => authPrisma.clientProfile.findUnique({
      where: { userId: session.user.id },
      select: { firstName: true },
    })),
    withRetry(() => authPrisma.serviceRequest.findMany({
      where: { requesterId: session.user.id, status: { in: ['PENDING', 'MATCHED', 'ACTIVE', 'COMPLETED', 'CANCELLED'] } },
      orderBy: { createdAt: 'desc' },
      include: { participant: true },
    })),
  ]);

  const displayName = clientProfile?.firstName || session.user.email?.split('@')[0] || 'User';

  // Transform data for the table — pass raw user IDs, modal fetches via API
  const requests = serviceRequests.map((sr) => {
    const workerIds = sr.assignedWorker as string[] | null;
    const assignedWorkerIds = Array.isArray(workerIds) ? [...new Set(workerIds)] : [];

    const services = sr.services as Record<string, { categoryName: string }> | null;
    const primaryService = services ? Object.values(services)[0]?.categoryName : undefined;

    return {
      id: sr.id,
      participantId: sr.participantId,
      participantName: `${sr.participant.firstName} ${sr.participant.lastName}`,
      primaryService,
      location: sr.location,
      assignedWorkerIds,
      selectedWorkers: sr.selectedWorkers ?? [],
      status: sr.status,
      zohoRecordId: sr.zohoRecordId ?? null,
    };
  });

  return (
    <ClientDashboardLayout
      profileData={{
        firstName: displayName,
        photo: null,
      }}
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
        <ManageRequestTable requests={requests} basePath="/dashboard/client" showRequestType={true} />
      </div>
    </ClientDashboardLayout>
  );
}
