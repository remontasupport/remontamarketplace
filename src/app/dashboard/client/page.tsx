/**
 * Client Dashboard - Server Component
 * Protected route - only accessible to users with CLIENT role
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth.config";
import { UserRole } from "@/types/auth";
import { authPrisma } from "@/lib/auth-prisma";
import ClientDashboardLayout from "@/components/dashboard/client/ClientDashboardLayout";
import WorkerSearchResults from "@/components/dashboard/client/WorkerSearchResults";

// Disable caching for this page - CRITICAL for security
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ClientDashboard() {
  // Server-side session validation
  const session = await getServerSession(authOptions);

  // Redirect to login if no session
  if (!session || !session.user) {
    redirect("/login");
  }

  // Redirect if wrong role (allow CLIENT and COORDINATOR)
  if (session.user.role !== UserRole.CLIENT && session.user.role !== UserRole.COORDINATOR) {
    redirect("/unauthorized");
  }

  // Fetch user's profile based on role
  let displayName = session.user.email?.split('@')[0] || 'User';

  if (session.user.role === UserRole.CLIENT) {
    const clientProfile = await authPrisma.clientProfile.findUnique({
      where: { userId: session.user.id },
      select: { firstName: true },
    });
    displayName = clientProfile?.firstName || displayName;
  } else if (session.user.role === UserRole.COORDINATOR) {
    const coordinatorProfile = await authPrisma.coordinatorProfile.findUnique({
      where: { userId: session.user.id },
      select: { firstName: true },
    });
    displayName = coordinatorProfile?.firstName || displayName;
  }

  return (
    <ClientDashboardLayout
      profileData={{
        firstName: displayName,
        photo: null,
      }}
    >
      {/* Main Content */}
      <div className="px-6 py-4 md:px-10 md:py-6 lg:px-12">
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-semibold font-poppins text-gray-900 mb-2">
            Find Your Support Worker
          </h1>
          <p className="text-gray-600 font-poppins">
            Search for qualified support workers in your area
          </p>
        </div>

        {/* Search Results with integrated search bar */}
        <WorkerSearchResults />
      </div>
    </ClientDashboardLayout>
  );
}
