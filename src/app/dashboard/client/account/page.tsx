/**
 * Account Settings Page
 * Manage account settings
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth.config";
import { UserRole } from "@/types/auth";
import { authPrisma } from "@/lib/auth-prisma";
import ClientDashboardLayout from "@/components/dashboard/client/ClientDashboardLayout";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.CLIENT && session.user.role !== UserRole.COORDINATOR) {
    redirect("/unauthorized");
  }

  // Fetch user's profile based on role for sidebar display
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
      <div className="p-6">
        <h1 className="text-2xl font-semibold font-poppins text-gray-900 mb-4">
          Account Settings
        </h1>
        <p className="text-gray-600 font-poppins">
          Manage your account settings here. This feature is coming soon.
        </p>
      </div>
    </ClientDashboardLayout>
  );
}
