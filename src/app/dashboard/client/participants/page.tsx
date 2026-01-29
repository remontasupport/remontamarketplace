/**
 * Participants Management Page
 * Allows clients to add/edit participants they manage
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth.config";
import { UserRole } from "@/types/auth";
import { authPrisma } from "@/lib/auth-prisma";
import ClientDashboardLayout from "@/components/dashboard/client/ClientDashboardLayout";
import ParticipantsMasterDetail from "@/components/dashboard/client/ParticipantsMasterDetail";
import Link from "next/link";
import { Plus } from "lucide-react";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ParticipantsPage() {
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

  // Fetch participants connected to this client from the database
  const participantsData = await authPrisma.participant.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  // Transform database data to match ParticipantCard interface
  const participants = participantsData.map((p) => {
    // Calculate age from date of birth
    // p.dateOfBirth is already a Date object from Prisma
    const today = new Date();
    const birthDate = p.dateOfBirth instanceof Date ? p.dateOfBirth : new Date(p.dateOfBirth);
    let age: number | undefined = undefined;

    if (birthDate && !isNaN(birthDate.getTime())) {
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // Extract service names from servicesRequested JSON
    // Structure: { "category-id": { categoryName: string, subCategories: [{ id, name }] } }
    let services: string[] = [];
    if (p.servicesRequested && typeof p.servicesRequested === 'object') {
      const servicesObj = p.servicesRequested as Record<string, { categoryName?: string; subCategories?: { id: string; name: string }[] }>;
      services = Object.values(servicesObj).flatMap((category) => {
        const categoryServices: string[] = [];
        if (category.categoryName) {
          categoryServices.push(category.categoryName);
        }
        if (category.subCategories && Array.isArray(category.subCategories)) {
          category.subCategories.forEach((sub) => {
            if (sub.name) categoryServices.push(sub.name);
          });
        }
        return categoryServices;
      });
    }

    // Format start date
    const startDate = p.createdAt.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return {
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      preferredName: p.firstName,
      photo: null,
      gender: undefined,
      age,
      location: p.location || undefined,
      services: services.length > 0 ? services : undefined,
      startDate,
      hoursPerWeek: undefined,
      fundingType: p.fundingType || undefined,
      relationshipToClient: p.relationshipToClient || undefined,
      additionalInfo: p.additionalInfo || undefined,
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold font-poppins text-gray-900">
              Participants
            </h1>
            <p className="text-gray-600 font-poppins mt-1">
              Manage the participants you support
            </p>
          </div>
          <Link
            href="/dashboard/client/request-service"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium font-poppins hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Participant
          </Link>
        </div>

        {/* Master-Detail Layout */}
        <ParticipantsMasterDetail participants={participants} />
      </div>
    </ClientDashboardLayout>
  );
}
