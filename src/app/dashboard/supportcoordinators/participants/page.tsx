/**
 * Participants Management Page for Support Coordinators
 * Allows support coordinators to add/edit participants they manage
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth.config";
import { UserRole } from "@/types/auth";
import { authPrisma } from "@/lib/auth-prisma";
import ClientDashboardLayout from "@/components/dashboard/client/ClientDashboardLayout";
import ParticipantsMasterDetail from "@/components/dashboard/client/ParticipantsMasterDetail";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SupportCoordinatorsParticipantsPage() {
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

  // Fetch participants connected to this coordinator from the database
  // Include the serviceRequest to get services and location
  const participantsData = await authPrisma.participant.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      serviceRequest: true,
    },
  });

  // Transform database data to match ParticipantCard interface
  const participants = participantsData.map((p) => {
    // Calculate age from date of birth
    const today = new Date();
    let age: number | undefined = undefined;

    if (p.dateOfBirth) {
      const birthDate = p.dateOfBirth instanceof Date ? p.dateOfBirth : new Date(p.dateOfBirth);
      if (!isNaN(birthDate.getTime())) {
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }
    }

    // Extract service names from serviceRequest.services JSON
    // Structure: { "category-id": { categoryName: string, subCategories: [{ id, name }] } }
    let services: string[] = [];
    const servicesData = p.serviceRequest?.services;
    if (servicesData && typeof servicesData === 'object') {
      const servicesObj = servicesData as Record<string, { categoryName?: string; subCategories?: { id: string; name: string }[] }>;
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

    // Get location from serviceRequest
    const location = p.serviceRequest?.location || undefined;

    // Format start date
    const startDate = p.createdAt.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    // Format dateOfBirth for edit form
    const dateOfBirthString = p.dateOfBirth
      ? p.dateOfBirth.toISOString().split("T")[0]
      : null;

    return {
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      preferredName: p.firstName,
      photo: null,
      gender: p.gender || undefined,
      age,
      location,
      services: services.length > 0 ? services : undefined,
      startDate,
      fundingType: p.fundingType || undefined,
      relationshipToClient: p.relationshipToClient || undefined,
      conditions: p.conditions.length > 0 ? p.conditions : undefined,
      additionalInfo: p.additionalInfo || undefined,
      // Raw data for edit form
      firstName: p.firstName,
      lastName: p.lastName,
      dateOfBirth: dateOfBirthString,
    };
  });

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
          <h1 className="text-2xl md:text-3xl font-semibold font-poppins text-gray-900">
            Participants
          </h1>
          <p className="text-gray-600 font-poppins mt-1">
            Manage the participants you support
          </p>
        </div>

        {/* Master-Detail Layout */}
        <ParticipantsMasterDetail
          participants={participants}
          showRelationship={false}
          basePath="/dashboard/supportcoordinators"
        />
      </div>
    </ClientDashboardLayout>
  );
}
