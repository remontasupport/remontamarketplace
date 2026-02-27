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

  // Use raw SQL to avoid Prisma enum error when service request status is ARCHIVED
  type RawParticipantRow = {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date | null;
    gender: string | null;
    fundingType: string | null;
    relationshipToClient: string | null;
    conditions: string[];
    additionalInfo: string | null;
    createdAt: Date;
    srServices: Record<string, unknown> | null;
    srLocation: string | null;
  };

  const participantsData = await authPrisma.$queryRaw<RawParticipantRow[]>`
    SELECT * FROM (
      SELECT DISTINCT ON (p.id)
        p.id,
        p."firstName",
        p."lastName",
        p."dateOfBirth",
        p.gender,
        p."fundingType",
        p."relationshipToClient",
        p.conditions,
        p."additionalInfo",
        p."createdAt",
        sr.services  AS "srServices",
        sr.location  AS "srLocation"
      FROM participants p
      LEFT JOIN service_requests sr ON sr."participantId" = p.id
      WHERE p."userId" = ${session.user.id}
      ORDER BY p.id, sr."createdAt" DESC NULLS LAST
    ) sub
    ORDER BY sub."createdAt" DESC
  `;

  // Transform database data to match ParticipantCard interface
  const participants = participantsData.map((p) => {
    // Calculate age from date of birth
    const today = new Date();
    let age: number | undefined = undefined;

    const dobForAge = p.dateOfBirth instanceof Date ? p.dateOfBirth : (p.dateOfBirth ? new Date(p.dateOfBirth) : null);
    if (dobForAge && !isNaN(dobForAge.getTime())) {
      age = today.getFullYear() - dobForAge.getFullYear();
      const monthDiff = today.getMonth() - dobForAge.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobForAge.getDate())) {
        age--;
      }
    }

    // Extract service names from srServices JSON
    // Structure: { "category-id": { categoryName: string, subCategories: [{ id, name }] } }
    let services: string[] = [];
    const servicesData = p.srServices;
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

    // Get location from service request
    const location = p.srLocation || undefined;

    // Format start date (raw SQL may return string or Date)
    const createdAtDate = p.createdAt instanceof Date ? p.createdAt : new Date(p.createdAt);
    const startDate = createdAtDate.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    // Format dateOfBirth for edit form
    const dobDate = p.dateOfBirth instanceof Date ? p.dateOfBirth : (p.dateOfBirth ? new Date(p.dateOfBirth) : null);
    const dateOfBirthString = dobDate && !isNaN(dobDate.getTime())
      ? dobDate.toISOString().split("T")[0]
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
        <ParticipantsMasterDetail
          participants={participants}
          showRelationship={false}
          title="Clients"
          subtitle="Manage the participants you support"
        />
      </div>
    </ClientDashboardLayout>
  );
}
