/**
 * Find Worker Page - Worker search with search bar
 * Protected route - only accessible to users with CLIENT role
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth.config";
import { UserRole } from "@/types/auth";
import { authPrisma } from "@/lib/auth-prisma";
import ClientDashboardLayout from "@/components/dashboard/client/ClientDashboardLayout";
import WorkerSearchResults from "@/components/dashboard/client/WorkerSearchResults";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function FindWorkerPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.CLIENT) {
    redirect("/unauthorized");
  }

  let displayName = session.user.email?.split('@')[0] || 'User';

  const clientProfile = await authPrisma.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: { firstName: true },
  });
  displayName = clientProfile?.firstName || displayName;

  return (
    <ClientDashboardLayout
      profileData={{
        firstName: displayName,
        photo: null,
      }}
    >
      <div className="px-6 py-4 md:px-10 md:py-6 lg:px-12">
        <div className="mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-semibold font-poppins text-gray-900 mb-2">
            Find Your Support Worker
          </h1>
          <p className="text-gray-600 font-poppins">
            Search for qualified support workers in your area
          </p>
        </div>
        <WorkerSearchResults />
      </div>
    </ClientDashboardLayout>
  );
}
