/**
 * Favorites Page
 * View saved/favorite support workers
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth.config";
import { UserRole } from "@/types/auth";
import { authPrisma } from "@/lib/auth-prisma";
import ClientDashboardLayout from "@/components/dashboard/client/ClientDashboardLayout";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function FavoritesPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.CLIENT && session.user.role !== UserRole.COORDINATOR) {
    redirect("/unauthorized");
  }

  const participant = await authPrisma.participant.findFirst({
    where: { userId: session.user.id },
    select: {
      firstName: true,
      isSelfManaged: true,
    },
  });

  const displayName = participant?.isSelfManaged
    ? participant.firstName
    : participant?.firstName || session.user.email?.split('@')[0] || 'User';

  return (
    <ClientDashboardLayout
      profileData={{
        firstName: displayName,
        photo: null,
      }}
    >
      <div className="p-6">
        <h1 className="text-2xl font-semibold font-poppins text-gray-900 mb-4">
          Favorites
        </h1>
        <p className="text-gray-600 font-poppins">
          Your saved support workers will appear here. This feature is coming soon.
        </p>
      </div>
    </ClientDashboardLayout>
  );
}
